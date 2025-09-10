import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseAdmin } from '@/lib/supabase';

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
    const { data: user } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('email', session.user.email)
      .single();

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

    const { data: user, error } = await supabaseAdmin
      .from('User')
      .select('id, email, name, role, language')
      .eq('email', session.user.email)
      .single();

    if (error || !user) {
      console.error('User not found:', error);
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
