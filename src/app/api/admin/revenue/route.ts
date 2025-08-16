import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

// Get revenue statistics
export async function GET() {
  try {
    console.log('Revenue GET endpoint called');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session);
    
    if (!session || session.user?.role !== 'ADMIN') {
      console.log('Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authorized, proceeding with query');

    // First, let's test if we can connect to the database
    try {
      // Simple test query
      const testQuery = await prisma.$queryRaw`SELECT 1 as test`;
      console.log('Database connection test successful:', testQuery);
    } catch (dbError) {
      console.error('Database connection test failed:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Get all orders
    let orders = [];
    try {
      orders = await prisma.order.findMany({
        select: {
          total: true,
          status: true,
          createdAt: true,
        },
      });
      console.log('Orders fetched successfully:', orders.length);
    } catch (ordersError) {
      console.error('Failed to fetch orders:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Calculate total revenue
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    console.log('Total revenue calculated:', totalRevenue);
    
    // Test AdminSettings table
    let resetSetting = null;
    try {
      resetSetting = await prisma.adminSettings.findUnique({
        where: { key: 'revenue_last_reset' }
      });
      console.log('Reset setting query successful:', resetSetting);
    } catch (adminError) {
      console.error('Failed to query AdminSettings:', adminError);
      // Continue without reset setting for now
    }
    
    const lastResetDate = resetSetting?.value || null;
    console.log('Last reset date:', lastResetDate);
    
    // Calculate revenue since last reset
    let revenueSinceReset = totalRevenue;
    if (lastResetDate) {
      const resetDate = new Date(lastResetDate);
      revenueSinceReset = orders
        .filter(order => new Date(order.createdAt) > resetDate)
        .reduce((sum, order) => sum + (order.total || 0), 0);
    }

    const responseData = {
      totalRevenue,
      revenueSinceReset,
      lastResetDate,
      orderCount: orders.length,
      completedOrders: orders.filter(o => o.status === 'COMPLETED').length,
    };

    console.log('Revenue response data:', responseData);
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
    console.log('Revenue POST endpoint called');
    
    const session = await getServerSession(authOptions);
    console.log('Session for POST:', session);
    
    if (!session || session.user?.role !== 'ADMIN') {
      console.log('Unauthorized POST attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();
    console.log('Reset action requested:', action);
    
    if (action !== 'reset') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get current date in Turkish timezone (UTC+3)
    const now = new Date();
    const turkishTime = new Date(now.getTime() + (3 * 60 * 60 * 1000)); // UTC+3
    const currentDate = turkishTime.toISOString();
    
    console.log('Turkish time calculated:', turkishTime);
    console.log('Current date ISO:', currentDate);
    
    // Format for Turkish display
    const turkishDateString = turkishTime.toLocaleString('tr-TR', {
      timeZone: 'Europe/Istanbul',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    console.log('Turkish date string:', turkishDateString);
    
    // Test AdminSettings table before upsert
    try {
      console.log('Testing AdminSettings table access...');
      const testQuery = await prisma.adminSettings.findFirst();
      console.log('AdminSettings test query successful:', testQuery);
    } catch (testError) {
      console.error('AdminSettings test query failed:', testError);
      return NextResponse.json({ error: 'AdminSettings table access failed' }, { status: 500 });
    }
    
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
      console.log('Database upsert successful:', upsertResult);
    } catch (upsertError) {
      console.error('Database upsert failed:', upsertError);
      return NextResponse.json({ error: 'Failed to save reset date' }, { status: 500 });
    }
    
    const responseData = {
      success: true,
      message: `Revenue reset successfully at ${turkishDateString}`,
      lastResetDate: currentDate,
      turkishDate: turkishDateString,
    };
    
    console.log('Response data:', responseData);
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Revenue reset error:', error);
    return NextResponse.json({ 
      error: 'Failed to reset revenue',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
