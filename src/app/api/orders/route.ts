import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: orders, error } = await supabase
      .from('Order')
      .select(`
        *,
        User(*),
        Address(*)
      `)
      .order('createdAt', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { userId, totalAmount, status, addressId } = body;
    
    if (!addressId) {
      return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
    }
    
    const { v4: uuidv4 } = await import('uuid');
    const orderId = uuidv4();
    const now = new Date().toISOString();
    
    const { data: order, error } = await supabase
      .from('Order')
      .insert({
        id: orderId,
        userId,
        addressId,
        totalAmount,
        status,
        createdAt: now,
        updatedAt: now,
      })
      .select(`
        *,
        User(*),
        Address(*)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
} 