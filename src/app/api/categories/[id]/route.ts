import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, context: { params: { id: string } }) {
  const { params } = await context;
  try {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
    });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: { id: string } }) {
  const { params } = await context;
  try {
    const body = await request.json();
    const { name } = body;
    const category = await prisma.category.update({
      where: { id: params.id },
      data: { name },
    });
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  const { params } = await context;
  try {
    await prisma.category.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
} 