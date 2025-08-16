import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6');

    // For now, return recently created products
    // TODO: Implement actual recently viewed tracking with user sessions
    const recentlyViewed = await prisma.product.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        images: {
          orderBy: { order: 'asc' },
          take: 1
        }
      }
    });

    return NextResponse.json(recentlyViewed);
  } catch (error) {
    console.error('Recently viewed error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recently viewed products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { productId, userId } = await request.json();

    // TODO: Implement actual recently viewed tracking
    // This would store the product view in a separate table with timestamps
    // For now, just return success

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track view error:', error);
    return NextResponse.json(
      { error: 'Failed to track product view' },
      { status: 500 }
    );
  }
}
