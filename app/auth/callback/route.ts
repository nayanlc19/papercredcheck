import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  }

  // URL to redirect to after sign in process completes
  // Use production URL in production, otherwise use request origin
  const redirectUrl = process.env.NODE_ENV === 'production' 
    ? 'https://papercredcheck.onrender.com'
    : requestUrl.origin;
  
  return NextResponse.redirect(redirectUrl);
}
