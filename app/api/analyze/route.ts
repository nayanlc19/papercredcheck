import { NextRequest, NextResponse } from 'next/server';
import { analyzePaper } from '@/lib/analyzer';

export async function POST(request: NextRequest) {
  try {
    const { doi } = await request.json();

    if (!doi) {
      return NextResponse.json(
        { error: 'DOI is required' },
        { status: 400 }
      );
    }

    console.log(`API: Starting analysis for ${doi}`);
    const result = await analyzePaper(doi);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to analyze paper. DOI may not exist or has no references.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      analysisId: result.analysisId,
      totalReferences: result.totalReferences,
      highRiskCount: result.highRiskCount
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
