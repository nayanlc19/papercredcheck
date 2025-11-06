import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

// Singleton instance to prevent multiple clients
let clientInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null;

export function createClient() {
  // Return existing instance if available
  if (clientInstance) {
    return clientInstance;
  }

  // Create new instance using auth-helpers (handles cookies properly)
  clientInstance = createClientComponentClient<Database>();
  
  return clientInstance;
}
