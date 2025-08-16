import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Iyzipay from 'iyzipay';
import { isTestingMode, shouldSimulatePayments } from '@/lib/config';

// Initialize Iyzico
const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY!,
  secretKey: process.env.IYZICO_SECRET_KEY!,
  uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com'
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, cardHolderName, cardNumber, expireMonth, expireYear, cvc } = body;

    if (!orderId || !cardHolderName || !cardNumber || !expireMonth || !expireYear || !cvc) {
      return NextResponse.json({ 
        error: 'Missing required fields: orderId, cardHolderName, cardNumber, expireMonth, expireYear, cvc' 
      }, { status: 400 });
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        address: true,
        user: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if we should simulate payments (testing mode)
    if (isTestingMode() && shouldSimulatePayments()) {
      // Simulate successful payment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update order status to processing
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PROCESSING' }
      });

      return NextResponse.json({
        success: true,
        message: 'Payment successful (Testing Mode)',
        paymentId: `test_${Date.now()}`,
        status: 'SUCCESS',
        testing: true
      });
    }

    // Real payment processing (production mode)

    // Create Iyzico payment request
    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: orderId,
      price: order.total.toString(),
      paidPrice: order.total.toString(),
      currency: Iyzipay.CURRENCY.TRY,
      installment: '1',
      basketId: orderId,
      paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      paymentCard: {
        cardHolderName: cardHolderName,
        cardNumber: cardNumber,
        expireMonth: expireMonth,
        expireYear: expireYear,
        cvc: cvc,
        registerCard: '0'
      },
      buyer: {
        id: order.userId,
        name: order.user.name || 'Unknown',
        surname: 'User',
        gsmNumber: order.address?.phone || '+905350000000',
        email: order.user.email || 'user@example.com',
        identityNumber: '74300864791',
        lastLoginDate: new Date().toISOString(),
        registrationDate: new Date().toISOString(),
        registrationAddress: order.address?.line1 || 'Unknown',
        ip: '85.34.78.112',
        city: order.address?.city || 'Unknown',
        country: order.address?.country || 'Turkey',
        zipCode: order.address?.postalCode || '34732'
      },
      shippingAddress: {
        contactName: order.user.name || 'Unknown',
        city: order.address?.city || 'Unknown',
        country: order.address?.country || 'Turkey',
        address: order.address?.line1 || 'Unknown',
        zipCode: order.address?.postalCode || '34732'
      },
      billingAddress: {
        contactName: order.user.name || 'Unknown',
        city: order.address?.city || 'Unknown',
        country: order.address?.country || 'Turkey',
        address: order.address?.line1 || 'Unknown',
        zipCode: order.address?.postalCode || '34732'
      },
      basketItems: order.items.map((item, index) => ({
        id: item.product.id,
        name: item.product.name,
        category1: 'General',
        itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
        price: (item.price * item.quantity).toString()
      }))
    };

    // Process payment with Iyzico
    return new Promise((resolve) => {
      iyzipay.payment.create(request, async (err: any, result: any) => {
        if (err) {
          console.error('Iyzico payment error:', err);
          resolve(NextResponse.json({ 
            error: 'Payment failed', 
            details: err.errorMessage || 'Unknown error' 
          }, { status: 500 }));
          return;
        }

        if (result.status === 'success') {
          // Payment successful - update order status
          try {
            await prisma.order.update({
              where: { id: orderId },
              data: { status: 'PROCESSING' }
            });

            resolve(NextResponse.json({
              success: true,
              message: 'Payment successful',
              paymentId: result.paymentId,
              status: result.status,
              testing: false
            }));
          } catch (dbError) {
            console.error('Database update error:', dbError);
            resolve(NextResponse.json({
              success: true,
              message: 'Payment successful but order update failed',
              paymentId: result.paymentId,
              status: result.status,
              testing: false
            }));
          }
        } else {
          // Payment failed
          resolve(NextResponse.json({
            error: 'Payment failed',
            details: result.errorMessage || 'Payment was not successful',
            status: result.status
          }, { status: 400 }));
        }
      });
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
