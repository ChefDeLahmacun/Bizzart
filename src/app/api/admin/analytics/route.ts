import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get total counts
    const [ordersCount, usersCount, productsCount] = await Promise.all([
      supabaseAdmin.from('Order').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('User').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('Product').select('id', { count: 'exact', head: true })
    ]);

    const totalOrders = ordersCount.count || 0;
    const totalCustomers = usersCount.count || 0;
    const totalProducts = productsCount.count || 0;

    // Get total revenue
    const { data: revenueData, error: revenueError } = await supabaseAdmin
      .from('Order')
      .select('totalAmount');

    const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.totalAmount || 0), 0) || 0;

    // Get monthly revenue data
    const { data: monthlyRevenueData, error: monthlyError } = await supabaseAdmin
      .from('Order')
      .select('createdAt, totalAmount')
      .gte('createdAt', startDate.toISOString())
      .order('createdAt', { ascending: true });

    // Group by date and calculate totals
    const monthlyRevenueMap = new Map();
    monthlyRevenueData?.forEach(order => {
      const date = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!monthlyRevenueMap.has(date)) {
        monthlyRevenueMap.set(date, { revenue: 0, orders: 0 });
      }
      const existing = monthlyRevenueMap.get(date);
      existing.revenue += order.totalAmount || 0;
      existing.orders += 1;
    });

    const formattedMonthlyRevenue = Array.from(monthlyRevenueMap.entries()).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      orders: data.orders
    }));

    // Get top categories (simplified - get top products and their categories)
    const { data: topProductsData, error: topProductsError } = await supabaseAdmin
      .from('OrderItem')
      .select(`
        price,
        product:Product(
          id,
          name,
          category:Category(name)
        )
      `)
      .gte('createdAt', startDate.toISOString());

    // Group by category
    const categoryMap = new Map();
    topProductsData?.forEach(item => {
      const categoryName = item.product?.category?.name || 'Unknown';
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, { revenue: 0, orders: 0 });
      }
      const existing = categoryMap.get(categoryName);
      existing.revenue += item.price || 0;
      existing.orders += 1;
    });

    const topCategories = Array.from(categoryMap.entries())
      .map(([name, data]) => ({ name, revenue: data.revenue, orders: data.orders }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Get customer growth
    const { data: customerGrowthData, error: customerGrowthError } = await supabaseAdmin
      .from('User')
      .select('createdAt')
      .gte('createdAt', startDate.toISOString())
      .order('createdAt', { ascending: true });

    // Group by date
    const customerGrowthMap = new Map();
    customerGrowthData?.forEach(user => {
      const date = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!customerGrowthMap.has(date)) {
        customerGrowthMap.set(date, 0);
      }
      customerGrowthMap.set(date, customerGrowthMap.get(date) + 1);
    });

    const formattedCustomerGrowth = Array.from(customerGrowthMap.entries()).map(([month, newCustomers]) => ({
      month,
      newCustomers,
      totalCustomers: totalCustomers // Simplified - in real app would calculate cumulative
    }));

    // Get order status breakdown
    const { data: orderStatusData, error: orderStatusError } = await supabaseAdmin
      .from('Order')
      .select('status');

    const statusMap = new Map();
    orderStatusData?.forEach(order => {
      const status = order.status || 'UNKNOWN';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    const totalOrderCount = Array.from(statusMap.values()).reduce((sum, count) => sum + count, 0);
    const statusBreakdown = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / totalOrderCount) * 100)
    }));

    // Get top products
    const productMap = new Map();
    topProductsData?.forEach(item => {
      const productName = item.product?.name || 'Unknown';
      if (!productMap.has(productName)) {
        productMap.set(productName, { revenue: 0, orders: 0, stock: item.product?.stock || 0 });
      }
      const existing = productMap.get(productName);
      existing.revenue += item.price || 0;
      existing.orders += 1;
    });

    const topProducts = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, revenue: data.revenue, orders: data.orders, stock: data.stock }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const analyticsData = {
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      monthlyRevenue: formattedMonthlyRevenue,
      topCategories,
      customerGrowth: formattedCustomerGrowth,
      orderStatusBreakdown: statusBreakdown,
      topProducts
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}