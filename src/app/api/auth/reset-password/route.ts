import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const { token, newPassword } = await request.json();
  if (!token || !newPassword) {
    return NextResponse.json({ message: 'Token and new password are required' }, { status: 400 });
  }
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  });
  if (!user) {
    return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 });
  }
  const hashed = await bcrypt.hash(newPassword, 12);
  const updateData: any = {
    password: hashed,
    resetToken: null,
    resetTokenExpiry: null,
  };
  await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });
  return NextResponse.json({ message: 'Password reset successful' });
} 