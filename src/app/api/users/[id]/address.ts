import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

// GET: List all addresses for a user
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: params.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(addresses);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

// POST: Add a new address for a user
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.id !== params.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.line1 || !body.city || !body.postalCode || !body.country || !body.phone) {
      return NextResponse.json({ 
        error: 'Missing required fields: line1, city, postalCode, country, and phone are required' 
      }, { status: 400 });
    }
    
    const address = await prisma.address.create({
      data: {
        userId: params.id,
        line1: body.line1,
        line2: body.line2,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
        country: body.country,
        phone: body.phone,
      },
    });
    return NextResponse.json(address);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add address' }, { status: 500 });
  }
}

// PUT: Update an address (addressId required in body)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.id !== params.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.line1 || !body.city || !body.postalCode || !body.country || !body.phone) {
      return NextResponse.json({ 
        error: 'Missing required fields: line1, city, postalCode, country, and phone are required' 
      }, { status: 400 });
    }
    
    const address = await prisma.address.update({
      where: { id: body.addressId, userId: params.id },
      data: {
        line1: body.line1,
        line2: body.line2,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
        country: body.country,
        phone: body.phone,
      },
    });
    return NextResponse.json(address);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

// DELETE: Remove an address (addressId required in body)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.id !== params.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    await prisma.address.delete({
      where: { id: body.addressId, userId: params.id },
    });
    return NextResponse.json({ message: 'Address deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
} 