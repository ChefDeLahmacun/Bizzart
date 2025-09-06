import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface GuestCheckoutData {
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  guestInfo: {
    email: string;
    name: string;
    phone: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postalCode: string;
      country: string;
    };
  };
}

export async function POST(request: Request) {
  try {
    const body: GuestCheckoutData = await request.json();
    const { items, totalAmount, guestInfo } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (!guestInfo.email || !guestInfo.name || !guestInfo.phone) {
      return NextResponse.json({ error: 'Guest information is required' }, { status: 400 });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Check stock availability for all items
      const stockChecks = await Promise.all(
        items.map(async (item) => {
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

      // Create guest order
      const order = await tx.order.create({
        data: {
          userId: null, // No user for guest orders
          addressId: null, // No address ID for guest orders
          totalAmount: totalAmount,
          status: 'PENDING',
          isGuestOrder: true,
          guestEmail: guestInfo.email,
          guestName: guestInfo.name,
          guestPhone: guestInfo.phone,
          guestAddress: guestInfo.address, // Store as JSON
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
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

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Guest checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process guest checkout' },
      { status: 400 }
    );
  }
}
