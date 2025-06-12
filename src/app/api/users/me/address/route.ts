import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET: List all addresses for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(addresses);
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

    const address = await prisma.address.create({
      data: {
        userId: session.user.id,
        line1: body.line1,
        line2: body.line2 || null,
        city: body.city,
        state: body.state || null,
        postalCode: body.postalCode,
        country: body.country,
        phone: body.phone,
      },
    });
    
    return NextResponse.json(address);
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json({ 
      error: 'Failed to add address', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
