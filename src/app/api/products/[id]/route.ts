import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MediaType } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        images: true,
        category: true,
      },
    });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const stock = parseInt(formData.get('stock') as string, 10);
    const categoryId = formData.get('categoryId') as string;
    const mediaFiles = formData.getAll('images') as File[]; // 'images' is the field name used in the form
    const removeMediaIds = formData.getAll('removeMediaIds[]') as string[];
    const mediaOrderRaw = formData.getAll('mediaOrder[]') as string[];
    const mediaOrder = mediaOrderRaw.map((item) => JSON.parse(item)); // [{id, order}]

    // Handle size specifications (optional)
    const height = formData.get('height') ? parseFloat(formData.get('height') as string) : null;
    const width = formData.get('width') ? parseFloat(formData.get('width') as string) : null;
    const depth = formData.get('depth') ? parseFloat(formData.get('depth') as string) : null;
    const diameter = formData.get('diameter') ? parseFloat(formData.get('diameter') as string) : null;
    const weight = formData.get('weight') ? parseFloat(formData.get('weight') as string) : null;

    // Remove deleted media
    if (removeMediaIds && removeMediaIds.length > 0) {
      console.log('Removing media IDs:', removeMediaIds);
      const deleteResult = await prisma.image.deleteMany({
        where: {
          id: { in: removeMediaIds },
          productId: params.id,
        },
      });
      console.log('Delete result:', deleteResult);
    }

    // Handle new media uploads (append to existing)
    let newMediaIds: string[] = [];
    if (mediaFiles && mediaFiles.length > 0) {
      const processedMedia = await Promise.all(
        mediaFiles.map(async (media) => {
          const buffer = Buffer.from(await media.arrayBuffer());
          const base64 = buffer.toString('base64');
          const type = media.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
          return {
            url: `data:${media.type};base64,${base64}` as string,
            type,
          };
        })
      );
      const created = await prisma.image.createMany({
        data: processedMedia.map((media) => ({
          url: media.url,
          productId: params.id,
          type: media.type === 'VIDEO' ? MediaType.VIDEO : MediaType.IMAGE,
        })),
      });
      // Fetch the new images to get their IDs (since createMany doesn't return them)
      const allImages = await prisma.image.findMany({
        where: { productId: params.id },
        orderBy: { createdAt: 'asc' },
      });
      newMediaIds = allImages.slice(-mediaFiles.length).map((img) => img.id);
    }

    // Update order for all media
    for (const { id, order } of mediaOrder) {
      await prisma.image.update({
        where: { id },
        data: { order: Number(order) },
      });
    }

    // Update the product
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name,
        description,
        price,
        stock,
        categoryId,
        // Size specifications
        height,
        width,
        depth,
        diameter,
        weight,
      },
      include: {
        images: true,
        category: true,
      },
    });
    return NextResponse.json(product);
  } catch (error) {
    console.error('Failed to update product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await prisma.image.deleteMany({ where: { productId: params.id } });
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
} 