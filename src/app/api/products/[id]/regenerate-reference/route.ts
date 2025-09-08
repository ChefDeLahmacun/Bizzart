import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateProductReference } from '@/lib/reference-generator';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current product with category
    const { data: product, error: productError } = await supabaseAdmin
      .from('Product')
      .select(`
        *,
        category:Category(*)
      `)
      .eq('id', params.id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get existing references to ensure uniqueness
    const { data: existingProducts, error: refError } = await supabaseAdmin
      .from('Product')
      .select('reference')
      .not('reference', 'is', null)
      .neq('id', params.id);

    if (refError) {
      throw new Error(`Failed to fetch existing references: ${refError.message}`);
    }

    const existingReferences = existingProducts?.map(p => p.reference).filter(Boolean) as string[] || [];

    // Generate new unique reference code
    const newReference = generateProductReference(product.category.name, existingReferences);

    // Update the product with new reference
    const { data: updatedProduct, error: updateError } = await supabaseAdmin
      .from('Product')
      .update({ reference: newReference })
      .eq('id', params.id)
      .select(`
        *,
        images:Image(*),
        category:Category(*)
      `)
      .single();

    if (updateError) {
      throw new Error(`Failed to update product: ${updateError.message}`);
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Failed to regenerate reference:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate reference' },
      { status: 500 }
    );
  }
}
