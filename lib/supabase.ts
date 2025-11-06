/**
 * Supabase Client Configuration
 * Works on both server and client side
 */

import { createClient } from '@supabase/supabase-js';

// Only initialize if environment variables are present (not during build)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client only if we have valid credentials
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any; // Fallback for build time
