import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const featuredCategories = await prisma.category.findMany({
      where: {
        featured: true
      },
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: [
        { order: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json(featuredCategories);
  } catch (error) {
    console.error('Failed to fetch featured categories:', error);
    return NextResponse.json({ error: 'Failed to fetch featured categories' }, { status: 500 });
  }
}
