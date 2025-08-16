import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { fileUploadService } from '@/lib/upload';
import { MediaType } from '@prisma/client';

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
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
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
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const stock = parseInt(formData.get('stock') as string, 10);
    const categoryId = formData.get('categoryId') as string;
    const images = formData.getAll('images') as File[];
    
    // Handle colors (multiple selection)
    const colors = formData.getAll('colors') as string[];



    // Handle size specifications (optional)
    const height = formData.get('height') ? parseFloat(formData.get('height') as string) : null;
    const width = formData.get('width') ? parseFloat(formData.get('width') as string) : null;
    const depth = formData.get('depth') ? parseFloat(formData.get('depth') as string) : null;
    const diameter = formData.get('diameter') ? parseFloat(formData.get('diameter') as string) : null;
    const weight = formData.get('weight') ? parseFloat(formData.get('weight') as string) : null;

    if (!name || !description || isNaN(price) || isNaN(stock) || !categoryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create the product first
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        categoryId,
        userId: session.user.id,
        // Colors
        colors: colors.length > 0 ? colors : [],
        // Size specifications
        height,
        width,
        depth,
        diameter,
        weight,
      },
    });

    // Handle media uploads
    if (images.length > 0) {
      const uploadResults = [];
      for (let index = 0; index < images.length; index++) {
        const file = images[index];
        try {
          const result = await fileUploadService.uploadFile(file, 'products');
          
          if (!result.success) {
            throw new Error(`Failed to upload ${file.name}: ${result.error}`);
          }
          
          uploadResults.push({
            url: result.url,
            type: file.type.startsWith('video/') ? MediaType.VIDEO : MediaType.IMAGE,
            order: index,
          });
        } catch (error) {
          throw error;
        }
      }

      // Create media records one by one for better error handling
      const createdImages = [];
      for (const media of uploadResults) {
        try {
          const imageRecord = await prisma.image.create({
            data: {
              url: media.url,
              productId: product.id,
              type: media.type,
              order: media.order,
            },
          });
          createdImages.push(imageRecord);
        } catch (error) {
          throw new Error(`Failed to create database record for ${media.url}: ${error}`);
        }
      }
    }

    // Fetch the complete product with images for response
    const completeProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        images: true,
        category: true,
      },
    });



    return NextResponse.json({ success: true, product: completeProduct });
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create product' }, { status: 500 });
  }
} 