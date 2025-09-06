import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * Safely get the user ID from the session
 * This function handles cases where session.user.id might not be available
 */
export async function getUserIdFromSession(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return null;
    }

    // First try to get ID from session
    if (session.user.id) {
      return session.user.id;
    }

    // If not available, fetch from database using email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    return user?.id || null;
  } catch (error) {
    console.error('Error getting user ID from session:', error);
    return null;
  }
}

/**
 * Get user with role check
 */
export async function getAuthenticatedUser(requiredRole?: 'ADMIN' | 'USER') {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true,
        language: true 
      }
    });

    if (!user) {
      return null;
    }

    if (requiredRole && user.role !== requiredRole) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}
