import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    return NextResponse.json(cart);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { userId, productId, quantity } = body;
    const cart = await prisma.cart.upsert({
      where: { userId },
      update: {
        items: {
          upsert: {
            where: {
              cartId_productId: {
                cartId: userId,
                productId,
              },
            },
            create: {
              productId,
              quantity,
            },
            update: {
              quantity,
            },
          },
        },
      },
      create: {
        userId,
        items: {
          create: {
            productId,
            quantity,
          },
        },
      },
      include: {
        items: true,
      },
    });
    return NextResponse.json(cart);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
  }
} 