import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Only initialize if environment variables are present (not during build)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function createClient() {
  // Return client only if we have valid credentials
  if (supabaseUrl && supabaseAnonKey) {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey);
  }

  // Fallback for build time - return a mock client
  return null as any;
}
