import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { quantity } = body;
    const cartItem = await prisma.cartItem.update({
      where: { id: params.id },
      data: { quantity },
    });
    return NextResponse.json(cartItem);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.cartItem.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: 'Cart item deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete cart item' }, { status: 500 });
  }
} 