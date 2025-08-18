import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Iyzipay from 'iyzipay';
import { isTestingMode, shouldSimulatePayments } from '@/lib/config';

// Only initialize Iyzipay if environment variables are available
let iyzipay: Iyzipay | null = null;

if (process.env.IYZIPAY_API_KEY && process.env.IYZIPAY_SECRET_KEY) {
  iyzipay = new Iyzipay({
    apiKey: process.env.IYZIPAY_API_KEY,
    secretKey: process.env.IYZIPAY_SECRET_KEY,
    uri: process.env.IYZIPAY_URI || 'https://sandbox-api.iyzipay.com'
  });
}

export async function POST(request: NextRequest) {
  try {
    // Check if Iyzipay is properly configured
    if (!iyzipay) {
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, cardHolderName, cardNumber, expireMonth, expireYear, cvc, billingAddress, items } = body;

    // Validate required fields
    if (!orderId || !cardHolderName || !cardNumber || !expireMonth || !expireYear || !cvc) {
      return NextResponse.json(
        { error: 'Missing required payment information' },
        { status: 400 }
      );
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

    // Create payment request
    const paymentRequest = {
      locale: 'tr',
      conversationId: `order_${Date.now()}`,
              price: order.totalAmount.toString(),
        paidPrice: order.totalAmount.toString(),
      currency: 'TRY',
      installment: '1',
      basketId: `basket_${Date.now()}`,
      paymentChannel: 'WEB',
      paymentGroup: 'PRODUCT',
      paymentCard: {
        cardHolderName,
        cardNumber: cardNumber.replace(/\s/g, ''),
        expireMonth,
        expireYear,
        cvc,
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
        registrationAddress: billingAddress?.line1 || 'Unknown',
        ip: '85.34.78.112',
        city: billingAddress?.city || 'Unknown',
        country: billingAddress?.country || 'Turkey',
        zipCode: billingAddress?.postalCode || '34732'
      },
      shippingAddress: {
        contactName: order.user.name || 'Unknown',
        city: billingAddress?.city || 'Unknown',
        country: billingAddress?.country || 'Turkey',
        address: billingAddress?.line1 || 'Unknown',
        zipCode: billingAddress?.postalCode || '34732'
      },
      billingAddress: {
        contactName: order.user.name || 'Unknown',
        city: billingAddress?.city || 'Unknown',
        country: billingAddress?.country || 'Turkey',
        address: billingAddress?.line1 || 'Unknown',
        zipCode: billingAddress?.postalCode || '34732'
      },
      basketItems: order.items.map((item, index) => ({
        id: item.product.id,
        name: item.product.name,
        category1: 'General',
        itemType: 'PHYSICAL',
        price: (item.price * item.quantity).toString()
      }))
    };

    return new Promise((resolve) => {
      iyzipay.payment.create(paymentRequest, (err: any, result: any) => {
        if (err) {
          console.error('Iyzipay payment error:', err);
          resolve(NextResponse.json(
            { error: 'Payment processing failed' },
            { status: 500 }
          ));
          return;
        }

        if (result.status === 'success') {
          // Payment successful - update order status
          prisma.order.update({
            where: { id: orderId },
            data: { status: 'PROCESSING' }
          }).then(() => {
            resolve(NextResponse.json({
              success: true,
              message: 'Payment successful',
              paymentId: result.paymentId,
              status: result.status,
              testing: false
            }));
          }).catch((dbError) => {
            console.error('Database update error:', dbError);
            resolve(NextResponse.json({
              success: true,
              message: 'Payment successful but order update failed',
              paymentId: result.paymentId,
              status: result.status,
              testing: false
            }));
          });
        } else {
          // Payment failed
          resolve(NextResponse.json(
            { error: result.errorMessage || 'Payment failed' },
            { status: 400 }
          ));
        }
      });
    });

  } catch (error) {
    console.error('Payment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
