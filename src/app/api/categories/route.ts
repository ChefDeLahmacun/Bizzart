import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { fileUploadService } from '@/lib/upload';

export async function GET() {
  try {
    // Get categories with simple ordering for now
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    // Add product counts manually
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await prisma.product.count({
          where: { categoryId: category.id }
        });
        return {
          ...category,
          _count: { products: productCount }
        };
      })
    );
    
    return NextResponse.json(categoriesWithCount);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const featured = formData.get('featured') === 'true';
    const order = parseInt(formData.get('order') as string) || 0;
    const thumbnailFile = formData.get('thumbnail') as File | null;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if category already exists
    const existingCategory = await prisma.category.findUnique({
      where: { name }
    });

    if (existingCategory) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 400 });
    }

    let thumbnailUrl = null;
    if (thumbnailFile && thumbnailFile.size > 0) {
      const uploadResult = await fileUploadService.uploadFile(thumbnailFile, 'categories');
      if (!uploadResult.success) {
        return NextResponse.json({ error: `Failed to upload thumbnail: ${uploadResult.error}` }, { status: 400 });
      }
      thumbnailUrl = uploadResult.url;
    }

    const category = await prisma.category.create({
      data: {
        name,
        thumbnail: thumbnailUrl,
        featured,
        order
      }
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Failed to create category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
} 