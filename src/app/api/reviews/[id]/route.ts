import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const review = await prisma.review.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        product: true,
      },
    });
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    return NextResponse.json(review);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch review' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { rating, comment } = body;
    const review = await prisma.review.update({
      where: { id: params.id },
      data: { rating, comment },
    });
    return NextResponse.json(review);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.review.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
} 