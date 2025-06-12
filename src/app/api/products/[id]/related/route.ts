import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: productId } = await params;

    // First, get the current product to find its category
    const currentProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true }
    });

    if (!currentProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Find related products from the same category, excluding the current product
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: currentProduct.categoryId,
        id: { not: productId }, // Exclude current product
        stock: { gt: 0 } // Only products in stock
      },
      include: {
        images: {
          take: 1, // Only get the first image for preview
          orderBy: { order: 'asc' }
        },
        category: true
      },
      take: 5, // Limit to 5 related products
      orderBy: { createdAt: 'desc' } // Most recent first
    });

    return NextResponse.json(relatedProducts);
  } catch (error) {
    console.error('Failed to fetch related products:', error);
    return NextResponse.json({ error: 'Failed to fetch related products' }, { status: 500 });
  }
}
