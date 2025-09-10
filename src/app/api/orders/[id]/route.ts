import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // First, get the order
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      console.error('Order fetch error:', orderError);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Then get the user
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('id', order.userId)
      .single();

    // Then get the address if addressId exists
    let address = null;
    if (order.addressId) {
      const { data: addressData, error: addressError } = await supabase
        .from('Address')
        .select('*')
        .eq('id', order.addressId)
        .single();
      
      if (!addressError && addressData) {
        address = addressData;
      }
    }

    const orderWithRelations = {
      ...order,
      User: user,
      Address: address
    };

    console.log('Order data:', {
      id: order.id,
      hasAddress: !!address,
      addressData: address,
      addressId: order.addressId
    });

    return NextResponse.json(orderWithRelations);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;
    
    const { data: order, error } = await supabase
      .from('Order')
      .update({ 
        status,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const { error } = await supabase
      .from('Order')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
} 