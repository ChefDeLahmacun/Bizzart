import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
// import { sendOrderConfirmation } from '@/lib/email';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { items, totalAmount, addressId } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Check stock availability for all items
      const stockChecks = await Promise.all(
        items.map(async (item: any) => {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { id: true, name: true, stock: true, price: true },
          });

          if (!product) {
            throw new Error(`Product ${item.productId} not found`);
          }

          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
          }

          return { product, item };
        })
      );

      // Create order
      const order = await tx.order.create({
        data: {
          userId: user.id,
          addressId: addressId,
          totalAmount: totalAmount,
          status: 'PENDING',
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
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

      // Update stock for all products
      await Promise.all(
        stockChecks.map(async ({ product, item }) => {
          await tx.product.update({
            where: { id: product.id },
            data: { stock: product.stock - item.quantity },
          });
        })
      );

      return order;
    });

    // Send order confirmation email (temporarily disabled)
    // try {
    //   await sendOrderConfirmation(result, user, result.items);
    //   console.log(`Order confirmation email sent for order ${result.id}`);
    // } catch (emailError) {
    //   console.error('Failed to send order confirmation email:', emailError);
    //   // Don't fail the checkout if email fails
    // }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process checkout' },
      { status: 400 }
    );
  }
} 