import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { fileUploadService } from '@/lib/upload';
import { MediaType } from '@prisma/client';

export async function GET() {
  try {
    console.log('Fetching products...');
    const products = await prisma.product.findMany({
      include: {
        images: true,
        category: true,
      },
    });
    
    console.log('Found', products.length, 'products');
    products.forEach((product, index) => {
      console.log(`Product ${index + 1}:`, product.name, 'with', product.images?.length || 0, 'images');
      if (product.images && product.images.length > 0) {
        product.images.forEach((img, imgIndex) => {
          console.log(`  Image ${imgIndex + 1}:`, img.url, img.type);
        });
      }
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

    console.log('Creating product with:', { name, description, price, stock, categoryId, imagesCount: images.length });

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
        // Size specifications
        height,
        width,
        depth,
        diameter,
        weight,
      },
    });

    console.log('Product created with ID:', product.id);

    // Handle media uploads
    if (images.length > 0) {
      console.log('Processing', images.length, 'media files...');
      
      const uploadResults = [];
      for (let index = 0; index < images.length; index++) {
        const file = images[index];
        try {
          console.log(`Uploading file ${index + 1}/${images.length}:`, file.name, file.type, file.size);
          const result = await fileUploadService.uploadFile(file, 'products');
          
          if (!result.success) {
            console.error(`File upload failed for ${file.name}:`, result.error);
            throw new Error(`Failed to upload ${file.name}: ${result.error}`);
          }
          
          console.log(`File ${file.name} uploaded successfully:`, result.url);
          
          uploadResults.push({
            url: result.url,
            type: file.type.startsWith('video/') ? MediaType.VIDEO : MediaType.IMAGE,
            order: index,
          });
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          throw error;
        }
      }

      console.log('All files uploaded, creating database records...');
      console.log('Upload results:', uploadResults);

      // Create media records one by one for better error handling
      const createdImages = [];
      for (const media of uploadResults) {
        try {
          console.log('Creating database record for:', media.url, media.type, media.order);
          const imageRecord = await prisma.image.create({
            data: {
              url: media.url,
              productId: product.id,
              type: media.type,
              order: media.order,
            },
          });
          createdImages.push(imageRecord);
          console.log('Created image record:', imageRecord.id, imageRecord.url);
        } catch (error) {
          console.error('Failed to create image record:', error);
          throw new Error(`Failed to create database record for ${media.url}: ${error}`);
        }
      }

      console.log('Created', createdImages.length, 'media records in database');
    }

    // Fetch the complete product with images for response
    const completeProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        images: true,
        category: true,
      },
    });

    console.log('Final product with images:', completeProduct?.images?.length || 0, 'images');

    return NextResponse.json({ success: true, product: completeProduct });
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create product' }, { status: 500 });
  }
} 