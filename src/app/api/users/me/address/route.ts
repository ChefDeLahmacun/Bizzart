import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: List all addresses for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: addresses, error } = await supabase
      .from('Address')
      .select('*')
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch addresses: ${error.message}`);
    }

    return NextResponse.json(addresses || []);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

// POST: Add a new address for the current user
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.line1 || !body.city || !body.postalCode || !body.country || !body.phone) {
      return NextResponse.json({ 
        error: 'Missing required fields: line1, city, postalCode, country, and phone are required' 
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { data: address, error } = await supabase
      .from('Address')
      .insert({
        id: uuidv4(),
        userId: session.user.id,
        line1: body.line1,
        line2: body.line2 || null,
        city: body.city,
        state: body.state || null,
        postalCode: body.postalCode,
        country: body.country,
        phone: body.phone,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create address: ${error.message}`);
    }
    
    return NextResponse.json(address);
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json({ 
      error: 'Failed to add address', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// PUT: Update an existing address
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { addressId, ...addressData } = body;
    
    if (!addressId) {
      return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
    }
    
    // Validate required fields
    if (!addressData.line1 || !addressData.city || !addressData.postalCode || !addressData.country || !addressData.phone) {
      return NextResponse.json({ 
        error: 'Missing required fields: line1, city, postalCode, country, and phone are required' 
      }, { status: 400 });
    }

    const { data: address, error } = await supabase
      .from('Address')
      .update({
        line1: addressData.line1,
        line2: addressData.line2 || null,
        city: addressData.city,
        state: addressData.state || null,
        postalCode: addressData.postalCode,
        country: addressData.country,
        phone: addressData.phone,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', addressId)
      .eq('userId', session.user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update address: ${error.message}`);
    }
    
    return NextResponse.json(address);
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json({ 
      error: 'Failed to update address', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// DELETE: Delete an address
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { addressId } = body;
    
    if (!addressId) {
      return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('Address')
      .delete()
      .eq('id', addressId)
      .eq('userId', session.user.id);

    if (error) {
      throw new Error(`Failed to delete address: ${error.message}`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ 
      error: 'Failed to delete address', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
