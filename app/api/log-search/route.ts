import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Log search activity to Supabase
 * POST /api/log-search
 * Body: {
 *   search_type: 'doi' | 'title',
 *   search_query: string,
 *   doi?: string,
 *   paper_title?: string,
 *   analysis_id?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get user session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const body = await request.json();
    const { search_type, search_query, doi, paper_title, analysis_id } = body;

    // Validate required fields
    if (!search_type || !search_query) {
      return NextResponse.json(
        { error: 'search_type and search_query are required' },
        { status: 400 }
      );
    }

    if (!['doi', 'title'].includes(search_type)) {
      return NextResponse.json(
        { error: 'search_type must be either "doi" or "title"' },
        { status: 400 }
      );
    }

    // Generate session ID from IP or create random one
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const sessionId = session?.user?.id || `anon_${ip.replace(/\./g, '_')}`;

    // Insert search log
    const { error: insertError } = await supabase.from('search_logs').insert({
      user_id: session?.user?.id || null,
      user_email: session?.user?.email || null,
      session_id: sessionId,
      search_type,
      search_query,
      doi: doi || null,
      paper_title: paper_title || null,
      analysis_id: analysis_id || null,
      ip_address: ip,
      user_agent: userAgent,
    });

    if (insertError) {
      console.error('Error logging search:', insertError);
      // Don't fail the request if logging fails
      return NextResponse.json(
        { success: true, logged: false, error: insertError.message },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true, logged: true });
  } catch (error: any) {
    console.error('Search logging error:', error);
    return NextResponse.json(
      { success: true, logged: false, error: error.message },
      { status: 200 }
    );
  }
}
