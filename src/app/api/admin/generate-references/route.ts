import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateProductReference } from '@/lib/reference-generator';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting to generate missing references...');

    // Get all products without references
    const { data: productsWithoutReferences, error: fetchError } = await supabaseAdmin
      .from('Product')
      .select(`
        id,
        name,
        category:Category(name)
      `)
      .is('reference', null);

    if (fetchError) {
      throw new Error(`Failed to fetch products: ${fetchError.message}`);
    }

    console.log(`Found ${productsWithoutReferences?.length || 0} products without references`);

    if (!productsWithoutReferences || productsWithoutReferences.length === 0) {
      return NextResponse.json({ 
        message: 'All products already have references!',
        generated: 0 
      });
    }

    // Get all existing references to avoid duplicates
    const { data: existingProducts, error: refError } = await supabaseAdmin
      .from('Product')
      .select('reference')
      .not('reference', 'is', null);

    if (refError) {
      throw new Error(`Failed to fetch existing references: ${refError.message}`);
    }

    const existingReferences = existingProducts?.map(p => p.reference).filter(Boolean) as string[] || [];
    console.log(`Found ${existingReferences.length} existing references`);

    // Generate references for products without them
    const updates = [];
    for (const product of productsWithoutReferences) {
      const reference = generateProductReference(product.category.name, existingReferences);
      existingReferences.push(reference); // Add to list to avoid duplicates in this batch
      
      updates.push({
        id: product.id,
        reference: reference
      });
    }

    // Update products in batches
    const batchSize = 10;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      for (const update of batch) {
        const { error: updateError } = await supabaseAdmin
          .from('Product')
          .update({ reference: update.reference })
          .eq('id', update.id);

        if (updateError) {
          console.error(`Failed to update product ${update.id}:`, updateError);
        }
      }
      
      console.log(`Updated batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(updates.length / batchSize)}`);
    }

    console.log(`Successfully generated references for ${updates.length} products!`);
    
    // Show some examples
    const { data: sampleProducts, error: sampleError } = await supabaseAdmin
      .from('Product')
      .select(`
        name,
        reference,
        category:Category(name)
      `)
      .in('id', updates.slice(0, 5).map(u => u.id))
      .not('reference', 'is', null);

    return NextResponse.json({
      message: `Successfully generated references for ${updates.length} products!`,
      generated: updates.length,
      examples: sampleProducts?.map(p => ({
        name: p.name,
        reference: p.reference,
        category: p.category.name
      })) || []
    });

  } catch (error) {
    console.error('Error generating missing references:', error);
    return NextResponse.json(
      { error: 'Failed to generate references', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
