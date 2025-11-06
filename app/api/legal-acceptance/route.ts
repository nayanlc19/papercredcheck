import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Record legal acceptance
 * POST /api/legal-acceptance
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get user session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Must be authenticated to accept legal terms' },
        { status: 401 }
      );
    }

    // Get IP and user agent
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Record acceptance (upsert to handle multiple acceptances)
    const { error: insertError } = await supabase
      .from('legal_acceptances')
      .upsert(
        {
          user_id: session.user.id,
          user_email: session.user.email,
          session_id: session.user.id,
          ip_address: ip,
          user_agent: userAgent,
          disclaimer_version: '1.0',
        },
        {
          onConflict: 'user_id,disclaimer_version',
        }
      );

    if (insertError) {
      console.error('Error recording legal acceptance:', insertError);
      return NextResponse.json(
        { error: 'Failed to record acceptance: ' + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Legal acceptance error:', error);
    return NextResponse.json(
      { error: 'Failed to record acceptance: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * Check if user has accepted legal terms
 * GET /api/legal-acceptance
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get user session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ accepted: false, authenticated: false });
    }

    // Check if user has accepted
    const { data, error } = await supabase
      .from('legal_acceptances')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('disclaimer_version', '1.0')
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error
      console.error('Error checking legal acceptance:', error);
    }

    return NextResponse.json({
      accepted: !!data,
      authenticated: true,
      acceptance_date: data?.accepted_at || null,
    });
  } catch (error: any) {
    console.error('Legal acceptance check error:', error);
    return NextResponse.json({ accepted: false, authenticated: false });
  }
}
