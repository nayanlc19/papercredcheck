import { NextRequest, NextResponse } from 'next/server';
import { searchPapersByTitle, searchPapersByDOI, PaperSearchResult } from '@/lib/openalex';

/**
 * Search for papers by title or DOI using OpenAlex
 * POST /api/search
 * Body: { title?: string, doi?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { title, doi } = await request.json();

    // Validate input - must provide either title or DOI
    if (!title && !doi) {
      return NextResponse.json(
        { error: 'Please provide either a title or DOI to search' },
        { status: 400 }
      );
    }

    let results: PaperSearchResult[] = [];
    let searchType = '';

    // Search by DOI if provided
    if (doi && typeof doi === 'string' && doi.trim().length > 0) {
      searchType = 'doi';
      results = await searchPapersByDOI(doi.trim());
    }
    // Otherwise search by title
    else if (title && typeof title === 'string' && title.trim().length >= 3) {
      searchType = 'title';
      results = await searchPapersByTitle(title.trim());
    }
    // Title too short
    else if (title && title.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please provide a title with at least 3 characters' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      searchType,
      count: results.length,
      results
    });

  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search papers: ' + error.message },
      { status: 500 }
    );
  }
}
