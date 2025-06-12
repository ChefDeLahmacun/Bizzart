import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const { currentPassword, newPassword } = await request.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || !user.password) {
    return NextResponse.json({ message: 'No password set for this account' }, { status: 400 });
  }
  const isCorrect = await bcrypt.compare(currentPassword, user.password);
  if (!isCorrect) {
    return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 });
  }
  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { email: session.user.email }, data: { password: hashed } });
  return NextResponse.json({ message: 'Password updated successfully' });
} 