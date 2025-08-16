import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

// Get revenue statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all orders
    let orders = [];
    try {
      orders = await prisma.order.findMany({
        select: {
          totalAmount: true,
          status: true,
          createdAt: true,
        },
      });
    } catch (ordersError) {
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Calculate total revenue
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Get AdminSettings
    let resetSetting = null;
    try {
      resetSetting = await prisma.adminSettings.findUnique({
        where: { key: 'revenue_last_reset' }
      });
    } catch (adminError) {
      // Continue without reset setting for now
    }
    
    const lastResetDate = resetSetting?.value || null;
    
    // Calculate revenue since last reset
    let revenueSinceReset = totalRevenue;
    if (lastResetDate) {
      const resetDate = new Date(lastResetDate);
      revenueSinceReset = orders
        .filter(order => new Date(order.createdAt) > resetDate)
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    }

    const responseData = {
      totalRevenue,
      revenueSinceReset,
      lastResetDate,
      orderCount: orders.length,
      completedOrders: orders.filter(o => o.status === 'COMPLETED').length,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Revenue fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch revenue data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Reset revenue (mark as reset)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();
    
    if (action !== 'reset') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get current date in Turkish timezone using proper timezone conversion
    const now = new Date();
    
    // Convert to Turkish timezone for display
    const turkishDateString = now.toLocaleString('tr-TR', {
      timeZone: 'Europe/Istanbul',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Store the current UTC time (this is what we want to store in database)
    const currentDate = now.toISOString();
    
    // Store or update the reset date in database
    let upsertResult;
    try {
      upsertResult = await prisma.adminSettings.upsert({
        where: { key: 'revenue_last_reset' },
        update: { 
          value: currentDate,
          updatedBy: session.user?.id || 'unknown'
        },
        create: {
          key: 'revenue_last_reset',
          value: currentDate,
          updatedBy: session.user?.id || 'unknown'
        }
      });
    } catch (upsertError) {
      return NextResponse.json({ error: 'Failed to save reset date' }, { status: 500 });
    }
    
    const responseData = {
      success: true,
      message: `Revenue reset successfully at ${turkishDateString}`,
      lastResetDate: currentDate,
      turkishDate: turkishDateString,
    };
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Revenue reset error:', error);
    return NextResponse.json({ 
      error: 'Failed to reset revenue',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
