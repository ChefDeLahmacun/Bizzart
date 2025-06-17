import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const { language } = await request.json();
  if (!language) {
    return NextResponse.json({ message: 'Language is required' }, { status: 400 });
  }
  await prisma.user.update({
    where: { email: session.user.email },
    data: { language },
  });
  return NextResponse.json({ message: 'Language updated' });
} 