import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
    });
    if (!contact) {
      return NextResponse.json({ error: 'Contact message not found' }, { status: 404 });
    }
    return NextResponse.json(contact);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contact message' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.contact.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: 'Contact message deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete contact message' }, { status: 500 });
  }
} 