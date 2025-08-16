import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
// import { sendOrderStatusUpdate } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reason, refundAmount, refundMethod } = await request.json();
    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Get order with all details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
        address: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Order is already cancelled' }, { status: 400 });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date(),
        },
        include: {
          user: true,
          items: {
            include: {
              product: true,
            },
          },
          address: true,
        },
      });

      // Restore stock for all products
      await Promise.all(
        order.items.map(async (item) => {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        })
      );

      // Create refund record
      const refund = await tx.refund.create({
        data: {
          orderId: orderId,
          amount: refundAmount || order.totalAmount,
          reason: reason || 'Order cancelled by admin',
          method: refundMethod || 'AUTOMATIC',
          status: 'PROCESSED',
          processedBy: session.user.id,
        },
      });

      return { updatedOrder, refund };
    });

    // Send cancellation notification email (temporarily disabled)
    // try {
    //   await sendOrderStatusUpdate(result.updatedOrder, result.updatedOrder.user, 'CANCELLED');
    //   console.log(`Cancellation email sent for order ${orderId}`);
    // } catch (emailError) {
    //   console.error('Failed to send cancellation email:', emailError);
    // }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      order: result.updatedOrder,
      refund: result.refund,
    });
  } catch (error) {
    console.error('Order cancellation error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
