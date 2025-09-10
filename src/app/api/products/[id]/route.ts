import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { v4 as uuidv4 } from 'uuid';
import { cloudinaryUploadService } from '@/lib/upload-cloudinary';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const { data: product, error } = await supabaseAdmin
      .from('Product')
      .select(`
        *,
        images:Image(*),
        category:Category(*)
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      throw new Error(`Failed to fetch product: ${error.message}`);
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
    
    // Handle colors (multiple selection)
    const colors = formData.getAll('colors') as string[];

    // Handle size specifications (optional)
    const height = formData.get('height') ? parseFloat(formData.get('height') as string) : null;
    const width = formData.get('width') ? parseFloat(formData.get('width') as string) : null;
    const depth = formData.get('depth') ? parseFloat(formData.get('depth') as string) : null;
    const diameter = formData.get('diameter') ? parseFloat(formData.get('diameter') as string) : null;
    const weight = formData.get('weight') ? parseFloat(formData.get('weight') as string) : null;

    // Remove deleted media
    if (removeMediaIds && removeMediaIds.length > 0) {
      // Remove media from database
      const { error: deleteError } = await supabaseAdmin
        .from('Image')
        .delete()
        .in('id', removeMediaIds);

      if (deleteError) {
        console.error('Failed to delete media:', deleteError);
      }
    }

    // Handle new media uploads (append to existing) in parallel
    let newMediaIds: string[] = [];
    if (mediaFiles && mediaFiles.length > 0) {
      const uploadPromises = mediaFiles.map(async (file, index) => {
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
          console.error(`Error uploading ${file.name}:`, error);
          return null;
        }
      });

      const uploadResults = (await Promise.all(uploadPromises)).filter(Boolean);

      // Create all media records in a single batch operation
      if (uploadResults.length > 0) {
        const imageRecords = uploadResults.map(media => ({
          id: uuidv4(),
          url: media.url,
          productId: params.id,
          type: media.type,
          order: media.order,
        }));

        const { error: imageError } = await supabaseAdmin
          .from('Image')
          .insert(imageRecords);

        if (imageError) {
          console.error('Failed to create image records:', imageError);
        }
      }

      // Fetch the new images to get their IDs
      const { data: allImages, error: fetchError } = await supabaseAdmin
        .from('Image')
        .select('id')
        .eq('productId', params.id)
        .order('createdAt', { ascending: true });

      if (!fetchError && allImages) {
        newMediaIds = allImages.slice(-mediaFiles.length).map((img) => img.id);
      }
    }

    // Update order for all media
    for (const { id, order } of mediaOrder) {
      const { error: updateError } = await supabaseAdmin
        .from('Image')
        .update({ order: Number(order) })
        .eq('id', id);

      if (updateError) {
        console.error(`Failed to update image order for ${id}:`, updateError);
      }
    }

    // Update the product
    const { data: product, error: productError } = await supabaseAdmin
      .from('Product')
      .update({
        name,
        description,
        price,
        stock,
        categoryId,
        // Colors
        colors: colors.length > 0 ? colors : [],
        // Size specifications
        height,
        width,
        depth,
        diameter,
        weight,
      })
      .eq('id', params.id)
      .select(`
        *,
        images:Image(*),
        category:Category(*)
      `)
      .single();

    if (productError) {
      throw new Error(`Failed to update product: ${productError.message}`);
    }

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

    // Delete associated images first
    const { error: imageDeleteError } = await supabaseAdmin
      .from('Image')
      .delete()
      .eq('productId', params.id);

    if (imageDeleteError) {
      console.error('Failed to delete images:', imageDeleteError);
    }

    // Delete the product
    const { error: productDeleteError } = await supabaseAdmin
      .from('Product')
      .delete()
      .eq('id', params.id);

    if (productDeleteError) {
      throw new Error(`Failed to delete product: ${productDeleteError.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
} 