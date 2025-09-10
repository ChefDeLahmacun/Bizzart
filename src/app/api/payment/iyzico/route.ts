import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import Iyzipay from 'iyzipay';
import { isTestingMode, shouldSimulatePayments } from '@/lib/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    // Check if we should simulate payments (testing mode)
    if (isTestingMode() && shouldSimulatePayments()) {
      // Simulate successful payment without requiring Iyzico credentials
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update order status to PROCESSING
      try {
        await supabase
          .from('Order')
          .update({ 
            status: 'PROCESSING',
            updatedAt: new Date().toISOString()
          })
          .eq('id', orderId);
        
        // Send payment confirmation email
        try {
          const { sendOrderStatusUpdate } = await import('@/lib/email');
          await sendOrderStatusUpdate(order, order.User, 'PROCESSING');
          console.log(`Payment confirmation email sent for order ${orderId} (Testing Mode)`);
        } catch (emailError) {
          console.error('Failed to send payment confirmation email:', emailError);
          // Don't fail the payment if email fails
        }
      } catch (dbError) {
        console.error('Failed to update order status:', dbError);
      }
      
      return NextResponse.json({
        success: true,
        message: 'Payment successful (Testing Mode)',
        paymentId: `test_${Date.now()}`,
        status: 'SUCCESS',
        testing: true
      });
    }

    // Check if Iyzipay is properly configured for production
    if (!iyzipay) {
      return NextResponse.json(
        { error: 'Payment gateway not configured. Please enable testing mode or configure Iyzico credentials.' },
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
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select(`
        *,
        Address(*),
        User(*)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
        name: order.User?.name || 'Unknown',
        surname: 'User',
        gsmNumber: order.Address?.phone || '+905350000000',
        email: order.User?.email || 'user@example.com',
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
        contactName: order.User?.name || 'Unknown',
        city: order.Address?.city || 'Unknown',
        country: order.Address?.country || 'Turkey',
        address: order.Address?.line1 || 'Unknown',
        zipCode: order.Address?.postalCode || '34732'
      },
      billingAddress: {
        contactName: order.User?.name || 'Unknown',
        city: order.Address?.city || 'Unknown',
        country: order.Address?.country || 'Turkey',
        address: order.Address?.line1 || 'Unknown',
        zipCode: order.Address?.postalCode || '34732'
      },
      basketItems: [
        {
          id: 'order_item',
          name: `Order #${orderId}`,
          category1: 'General',
          itemType: 'PHYSICAL',
          price: order.totalAmount.toString()
        }
      ]
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
          supabase
            .from('Order')
            .update({ 
              status: 'PROCESSING',
              updatedAt: new Date().toISOString()
            })
            .eq('id', orderId)
            .then(async ({ error: dbError }) => {
              if (dbError) {
                console.error('Database update error:', dbError);
                resolve(NextResponse.json({
                  success: true,
                  message: 'Payment successful but order update failed',
                  paymentId: result.paymentId,
                  status: result.status,
                  testing: false
                }));
              } else {
                // Send payment confirmation email
                try {
                  const { sendOrderStatusUpdate } = await import('@/lib/email');
                  await sendOrderStatusUpdate(order, order.User, 'PROCESSING');
                  console.log(`Payment confirmation email sent for order ${orderId}`);
                } catch (emailError) {
                  console.error('Failed to send payment confirmation email:', emailError);
                  // Don't fail the payment if email fails
                }
                
                resolve(NextResponse.json({
                  success: true,
                  message: 'Payment successful',
                  paymentId: result.paymentId,
                  status: result.status,
                  testing: false
                }));
              }
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
