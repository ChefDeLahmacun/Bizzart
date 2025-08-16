import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
    const [totalOrders, totalCustomers, totalProducts] = await Promise.all([
      prisma.order.count(),
      prisma.user.count(),
      prisma.product.count()
    ]);

    // Get total revenue
    const totalRevenue = await prisma.order.aggregate({
      _sum: {
        totalAmount: true
      }
    });

    // Get monthly revenue data
    const monthlyRevenue = await prisma.order.groupBy({
      by: ['createdAt'],
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      },
      where: {
        createdAt: {
          gte: startDate
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Get top categories
    const topCategories = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        price: true
      },
      _count: {
        id: true
      },
      where: {
        order: {
          createdAt: {
            gte: startDate
          }
        }
      },
      orderBy: {
        _sum: {
          price: 'desc'
        }
      },
      take: 5
    });

    // Get category names for top categories
    const categoryData = await Promise.all(
      topCategories.map(async (category) => {
        const product = await prisma.product.findUnique({
          where: { id: category.productId },
          select: { categoryId: true }
        });
        
        if (product?.categoryId) {
          const categoryName = await prisma.category.findUnique({
            where: { id: product.categoryId },
            select: { name: true }
          });
          return {
            name: categoryName?.name || 'Unknown',
            revenue: category._sum.price || 0,
            orders: category._count.id
          };
        }
        return {
          name: 'Unknown',
          revenue: category._sum.price || 0,
          orders: category._count.id
        };
      })
    );

    // Get customer growth
    const customerGrowth = await prisma.user.groupBy({
      by: ['createdAt'],
      _count: {
        id: true
      },
      where: {
        createdAt: {
          gte: startDate
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Get order status breakdown
    const orderStatusBreakdown = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    // Calculate percentages
    const totalOrderCount = orderStatusBreakdown.reduce((sum, status) => sum + status._count.id, 0);
    const statusBreakdown = orderStatusBreakdown.map(status => ({
      status: status.status,
      count: status._count.id,
      percentage: Math.round((status._count.id / totalOrderCount) * 100)
    }));

    // Get top products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        price: true
      },
      _count: {
        id: true
      },
      where: {
        order: {
          createdAt: {
            gte: startDate
          }
        }
      },
      orderBy: {
        _sum: {
          price: 'desc'
        }
      },
      take: 10
    });

    // Get product details for top products
    const productData = await Promise.all(
      topProducts.map(async (product) => {
        const productDetails = await prisma.product.findUnique({
          where: { id: product.productId },
          select: { name: true, stock: true }
        });
        
        return {
          name: productDetails?.name || 'Unknown',
          revenue: product._sum.price || 0,
          orders: product._count.id,
          stock: productDetails?.stock || 0
        };
      })
    );

    // Format monthly revenue data
    const formattedMonthlyRevenue = monthlyRevenue.map(item => ({
      month: item.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: item._sum.totalAmount || 0,
      orders: item._count.id
    }));

    // Format customer growth data
    const formattedCustomerGrowth = customerGrowth.map(item => ({
      month: item.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      newCustomers: item._count.id,
      totalCustomers: totalCustomers // This would need to be calculated per month in a real app
    }));

    const analyticsData = {
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalOrders,
      totalCustomers,
      totalProducts,
      monthlyRevenue: formattedMonthlyRevenue,
      topCategories: categoryData,
      customerGrowth: formattedCustomerGrowth,
      orderStatusBreakdown: statusBreakdown,
      topProducts: productData
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
