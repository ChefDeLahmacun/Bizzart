import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
// import { sendOrderConfirmation } from '@/lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { items, totalAmount, addressId } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Check stock availability for all items
    const stockChecks = await Promise.all(
      items.map(async (item: any) => {
        const { data: product, error } = await supabase
          .from('Product')
          .select('id, name, stock, price')
          .eq('id', item.productId)
          .single();

        if (error || !product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
        }

        return { product, item };
      })
    );

    // Create order
    const orderId = uuidv4();
    const now = new Date().toISOString();
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .insert({
        id: orderId,
        userId: session.user.id,
        addressId: addressId,
        totalAmount: totalAmount,
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (orderError) {
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    // Update stock for all products
    await Promise.all(
      stockChecks.map(async ({ product, item }) => {
        const { error } = await supabase
          .from('Product')
          .update({ stock: product.stock - item.quantity })
          .eq('id', product.id);

        if (error) {
          throw new Error(`Failed to update stock for product ${product.id}: ${error.message}`);
        }
      })
    );

    // Get user data for email
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('id', session.user.id)
      .single();

    // Send order confirmation email
    if (user && !userError) {
      try {
        // Enhance items with product images for email
        const enhancedItems = await Promise.all(
          items.map(async (item: any) => {
            const { data: product } = await supabase
              .from('Product')
              .select(`
                name,
                images:Image(
                  url,
                  order
                )
              `)
              .eq('id', item.productId)
              .single();
            
            // Get the first image URL, handling both array and object formats
            let imageUrl = null;
            if (product?.images) {
              if (Array.isArray(product.images)) {
                // Sort by order and get the first image
                const sortedImages = product.images.sort((a, b) => (a.order || 0) - (b.order || 0));
                imageUrl = sortedImages[0]?.url || null;
              } else if (product.images.url) {
                imageUrl = product.images.url;
              }
            }
            
            const enhancedItem = {
              ...item,
              name: product?.name || 'Unknown Product',
              image: imageUrl
            };
            
            console.log('Enhanced item for email:', {
              productId: item.productId,
              productName: enhancedItem.name,
              imageUrl: enhancedItem.image,
              originalImages: product?.images
            });
            
            return enhancedItem;
          })
        );

        const { sendOrderConfirmation } = await import('@/lib/email');
        await sendOrderConfirmation(order, user, enhancedItems);
        console.log(`Order confirmation email sent for order ${order.id}`);
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
        // Don't fail the checkout if email fails
      }
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process checkout' },
      { status: 400 }
    );
  }
} 