/**
 * Utility script to generate reference codes for existing products that don't have them
 * This can be run once after adding the reference column to the database
 * 
 * IMPORTANT: This project uses SUPABASE, NOT PRISMA!
 */

import { createClient } from '@supabase/supabase-js';
import { generateProductReference } from './reference-generator';

// Initialize Supabase client lazily to avoid build-time errors
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function generateMissingReferences() {
  try {
    console.log('Starting to generate missing references...');
    
    const supabase = getSupabaseClient();

    // Get all products without references using Supabase
    const { data: productsWithoutReferences, error: fetchError } = await supabase
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
      console.log('All products already have references!');
      return;
    }

    // Get all existing references to avoid duplicates
    const { data: existingProducts, error: refError } = await supabase
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

    // Update products in batches using Supabase
    const batchSize = 10;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      for (const update of batch) {
        const { error: updateError } = await supabase
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
    const { data: sampleProducts, error: sampleError } = await supabase
      .from('Product')
      .select(`
        name,
        reference,
        category:Category(name)
      `)
      .in('id', updates.slice(0, 5).map(u => u.id))
      .not('reference', 'is', null);

    if (!sampleError && sampleProducts) {
      console.log('\nSample generated references:');
      sampleProducts.forEach(product => {
        console.log(`- ${product.name} (${product.category.name}): ${product.reference}`);
      });
    }

  } catch (error) {
    console.error('Error generating missing references:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  generateMissingReferences()
    .then(() => {
      console.log('Reference generation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Reference generation failed:', error);
      process.exit(1);
    });
}
