import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        images: true,
        category: true,
      },
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { name, description, price, stock, categoryId, images } = body;
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        categoryId,
        images: {
          create: images.map((url: string) => ({ url })),
        },
      },
      include: {
        images: true,
        category: true,
      },
    });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
} 