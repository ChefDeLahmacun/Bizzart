import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-iyz-signature');
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha1', process.env.IYZICO_WEBHOOK_SECRET || '')
      .update(body)
      .digest('base64');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);
    const { eventType, paymentId, conversationId, status } = data;

    console.log('Iyzico webhook received:', { eventType, paymentId, conversationId, status });

    // Handle different event types
    switch (eventType) {
      case 'PAYMENT.SUCCESS':
        if (status === 'SUCCESS') {
          // Update order status to processing
          await prisma.order.update({
            where: { id: conversationId },
            data: { status: 'PROCESSING' }
          });
        }
        break;

      case 'PAYMENT.FAILURE':
        // Update order status to cancelled
        await prisma.order.update({
          where: { id: conversationId },
          data: { status: 'CANCELLED' }
        });
        break;

      case 'REFUND.SUCCESS':
        // Handle refund success if needed
        console.log('Refund successful for payment:', paymentId);
        break;

      default:
        console.log('Unhandled event type:', eventType);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
