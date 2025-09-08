import { createClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return { supabaseUrl, supabaseKey, supabaseServiceKey };
}

// Client-side Supabase client
export function getSupabaseClient() {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();
  return createClient(supabaseUrl, supabaseKey);
}

// Server-side Supabase client for API routes
export function getSupabaseAdmin() {
  const { supabaseUrl, supabaseServiceKey } = getSupabaseConfig();
  
  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Legacy exports for backward compatibility (lazy initialization)
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    return getSupabaseClient()[prop];
  }
});

export const supabaseAdmin = new Proxy({} as any, {
  get(target, prop) {
    return getSupabaseAdmin()[prop];
  }
});

