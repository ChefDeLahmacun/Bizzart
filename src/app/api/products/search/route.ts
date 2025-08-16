import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const colors = searchParams.get('colors') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const minHeight = searchParams.get('minHeight') || '';
    const maxHeight = searchParams.get('maxHeight') || '';
    const minWidth = searchParams.get('minWidth') || '';
    const maxWidth = searchParams.get('maxWidth') || '';
    const minWeight = searchParams.get('minWeight') || '';
    const maxWeight = searchParams.get('maxWeight') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build filter conditions
    const where: any = {
      AND: []
    };

    // Text search
    if (query) {
      where.AND.push({
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { name: { contains: query, mode: 'insensitive' } } }
        ]
      });
    }

    // Category filter
    if (category && category !== 'All') {
      where.AND.push({
        category: { name: category }
      });
    }

    // Color filter
    if (colors) {
      const colorArray = colors.split(',').map(c => c.trim()).filter(c => c);
      if (colorArray.length > 0) {
        where.AND.push({
          colors: {
            hasSome: colorArray
          }
        });
      }
    }

    // Price range
    if (minPrice || maxPrice) {
      const priceFilter: any = {};
      if (minPrice) priceFilter.gte = parseFloat(minPrice);
      if (maxPrice) priceFilter.lte = parseFloat(maxPrice);
      where.AND.push({ price: priceFilter });
    }

    // Height range
    if (minHeight || maxHeight) {
      const heightFilter: any = {};
      if (minHeight) heightFilter.gte = parseFloat(minHeight);
      if (maxHeight) heightFilter.lte = parseFloat(maxHeight);
      where.AND.push({ height: heightFilter });
    }

    // Width range
    if (minWidth || maxWidth) {
      const widthFilter: any = {};
      if (minWidth) widthFilter.gte = parseFloat(minWidth);
      if (maxWidth) widthFilter.lte = parseFloat(maxWidth);
      where.AND.push({ width: widthFilter });
    }

    // Weight range
    if (minWeight || maxWeight) {
      const weightFilter: any = {};
      if (minWeight) weightFilter.gte = parseFloat(minWeight);
      if (maxWeight) weightFilter.lte = parseFloat(maxWeight);
      where.AND.push({ weight: weightFilter });
    }

    // If no filters, return all products
    if (where.AND.length === 0) {
      where.AND = [{}];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        images: {
          orderBy: { order: 'asc' }
        }
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}
