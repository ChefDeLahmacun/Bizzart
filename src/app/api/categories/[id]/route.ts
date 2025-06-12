import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { fileUploadService } from '@/lib/upload';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const featured = formData.get('featured') === 'true';
    const order = parseInt(formData.get('order') as string) || 0;
    const thumbnailFile = formData.get('thumbnail') as File | null;
    const removeThumbnail = formData.get('removeThumbnail') === 'true';

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check if name is already taken by another category
    const nameConflict = await prisma.category.findFirst({
      where: {
        name,
        id: { not: id }
      }
    });

    if (nameConflict) {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 400 });
    }

    let thumbnailUrl = existingCategory.thumbnail;
    
    if (removeThumbnail) {
      thumbnailUrl = null;
    } else if (thumbnailFile && thumbnailFile.size > 0) {
      const uploadResult = await fileUploadService.uploadFile(thumbnailFile, 'categories');
      if (!uploadResult.success) {
        return NextResponse.json({ error: `Failed to upload thumbnail: ${uploadResult.error}` }, { status: 400 });
      }
      thumbnailUrl = uploadResult.url;
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name,
        thumbnail: thumbnailUrl,
        featured,
        order
      }
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Failed to update category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Check if category has products
    const categoryWithProducts = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    if (!categoryWithProducts) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (categoryWithProducts._count.products > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete category with existing products' 
      }, { status: 400 });
    }

    await prisma.category.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
} 