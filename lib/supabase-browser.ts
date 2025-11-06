import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Only initialize if environment variables are present (not during build)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function createClient() {
  // During build time, these may not be available - that's OK
  if (!supabaseUrl || !supabaseAnonKey) {
    // In production, this should never happen on the client side
    if (typeof window !== 'undefined') {
      console.error('Supabase env vars missing:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseAnonKey 
      });
    }
    // Return a stub during build that will be replaced at runtime
    return createSupabaseClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key'
    );
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
