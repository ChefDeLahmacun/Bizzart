import { createClient } from '@supabase/supabase-js';

// Direct initialization with error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create dummy client for fallback
const dummyClient = {
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: null, error: new Error('Supabase not configured') }),
    update: () => ({ data: null, error: new Error('Supabase not configured') }),
    delete: () => ({ data: null, error: new Error('Supabase not configured') })
  })
};

// Initialize clients
let supabaseClient: any;
let supabaseAdminClient: any;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  supabaseClient = dummyClient;
  supabaseAdminClient = dummyClient;
} else {
  try {
    // Create Supabase clients
    supabaseClient = createClient(supabaseUrl, supabaseKey);
    supabaseAdminClient = supabaseServiceKey 
      ? createClient(supabaseUrl, supabaseServiceKey)
      : supabaseClient;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    supabaseClient = dummyClient;
    supabaseAdminClient = dummyClient;
  }
}

export const supabase = supabaseClient;
export const supabaseAdmin = supabaseAdminClient;

