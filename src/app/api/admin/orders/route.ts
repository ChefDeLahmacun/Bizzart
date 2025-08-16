import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
// import { sendOrderStatusUpdate, sendOrderCompleted } from '@/lib/email';

// Get all orders with enhanced details
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
        address: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// Update order status (complete order)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, status } = await request.json();
    
    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status,
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

    // Send email notification based on status (temporarily disabled)
    // try {
    //   if (status === 'COMPLETED') {
    //     await sendOrderCompleted(updatedOrder, updatedOrder.user);
    //   } else {
    //     await sendOrderStatusUpdate(updatedOrder, updatedOrder.user, status);
    //   }
    //   console.log(`Email notification sent for order ${orderId} status: ${status}`);
    // } catch (emailError) {
    //   console.error('Failed to send email notification:', emailError);
    //   // Don't fail the order update if email fails
    // }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
