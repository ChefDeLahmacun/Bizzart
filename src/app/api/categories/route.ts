import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { fileUploadService } from '@/lib/upload';

export async function GET() {
  try {
    // Get categories with simple ordering for now
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('Category')
      .select('*')
      .order('name', { ascending: true });

    if (categoriesError) {
      throw new Error(`Failed to fetch categories: ${categoriesError.message}`);
    }
    
    // Add product counts manually
    const categoriesWithCount = await Promise.all(
      (categories || []).map(async (category) => {
        const { count: productCount, error: countError } = await supabaseAdmin
          .from('Product')
          .select('*', { count: 'exact', head: true })
          .eq('categoryId', category.id);

        if (countError) {
          console.error(`Failed to count products for category ${category.id}:`, countError);
        }

        return {
          ...category,
          _count: { products: productCount || 0 }
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
    const { data: existingCategory, error: checkError } = await supabaseAdmin
      .from('Category')
      .select('id')
      .eq('name', name)
      .single();

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

    const { data: category, error: createError } = await supabaseAdmin
      .from('Category')
      .insert({
        name,
        thumbnail: thumbnailUrl,
        featured,
        order
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create category: ${createError.message}`);
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Failed to create category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
} 