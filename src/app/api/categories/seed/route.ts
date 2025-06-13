import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const defaultCategories = [
  { name: 'Bowls' },
  { name: 'Vases' },
  { name: 'Plates' },
  { name: 'Mugs' },
  { name: 'Sculptures' },
  { name: 'Jewelry' },
];

export async function POST() {
  try {
    // Create categories if they don't exist
    const createdCategories = await Promise.all(
      defaultCategories.map(async (category) => {
        return prisma.category.upsert({
          where: { name: category.name },
          update: {},
          create: category,
        });
      })
    );

    return NextResponse.json(createdCategories);
  } catch (error) {
    console.error('Failed to seed categories:', error);
    return NextResponse.json(
      { error: 'Failed to seed categories' },
      { status: 500 }
    );
  }
} 