import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { cloudinaryUploadService } from '@/lib/upload-cloudinary';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { generateProductReference } from '@/lib/reference-generator';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const { data: products, error } = await supabaseAdmin
      .from('Product')
      .select(`
        *,
        images:Image(*),
        category:Category(*)
      `)
      .order('createdAt', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
    
    return NextResponse.json(products || []);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser('ADMIN');
  if (!user) {
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

    // Get category name for reference generation
    const { data: category, error: categoryError } = await supabaseAdmin
      .from('Category')
      .select('name')
      .eq('id', categoryId)
      .single();

    if (categoryError || !category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 400 });
    }

    // Get existing references to ensure uniqueness
    const { data: productsWithReferences, error: refError } = await supabaseAdmin
      .from('Product')
      .select('reference')
      .not('reference', 'is', null);

    const existingReferences = productsWithReferences?.map(p => p.reference).filter(Boolean) as string[] || [];

    // Generate unique reference code
    const reference = generateProductReference(category.name, existingReferences);

    // Create the product with reference
    const now = new Date().toISOString();
    const { data: product, error: productError } = await supabaseAdmin
      .from('Product')
      .insert({
        id: uuidv4(),
        name,
        reference: reference,
        description,
        price,
        stock,
        categoryId,
        userId: user.id,
        // Colors
        colors: colors.length > 0 ? colors : [],
        // Size specifications
        height,
        width,
        depth,
        diameter,
        weight,
        // Timestamps
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (productError) {
      throw new Error(`Failed to create product: ${productError.message}`);
    }

    // Handle media uploads in parallel
    if (images.length > 0) {
      const uploadPromises = images.map(async (file, index) => {
        try {
          const result = await cloudinaryUploadService.uploadFile(file, 'products');
          
          if (!result.success) {
            throw new Error(`Failed to upload ${file.name}: ${result.error}`);
          }
          
          return {
            url: result.url,
            type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
            order: index,
          };
        } catch (error) {
          throw error;
        }
      });

      const uploadResults = await Promise.all(uploadPromises);

      // Create all media records in a single batch operation
      const imageRecords = uploadResults.map(media => ({
        id: uuidv4(),
        url: media.url,
        productId: product.id,
        type: media.type,
        order: media.order,
      }));

      const { error: imageError } = await supabaseAdmin
        .from('Image')
        .insert(imageRecords);

      if (imageError) {
        throw new Error(`Failed to create image records: ${imageError.message}`);
      }
    }

    // Fetch the complete product with images for response
    const { data: completeProduct, error: fetchError } = await supabaseAdmin
      .from('Product')
      .select(`
        *,
        images:Image(*),
        category:Category(*)
      `)
      .eq('id', product.id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch product with images: ${fetchError.message}`);
    }

    return NextResponse.json({ success: true, product: completeProduct });
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create product' }, { status: 500 });
  }
} 