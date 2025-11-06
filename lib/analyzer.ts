/**
 * Main Analysis Engine
 * Combines OpenAlex + Groq AI Scoring
 */

import { supabase } from './supabase';
import { getReferencesForDOI, OpenAlexReference } from './openalex';
import { scoreJournal, ScoringResult, getRiskLevel } from './scorer';
import { checkRetraction, RetractionStatus } from './retraction-checker';

export interface AnalysisResult {
  analysisId: string;
  inputDoi: string;
  inputTitle: string;
  inputJournalWarning?: string; // Warning if input paper is from predatory source
  totalReferences: number;
  highRiskCount: number;
  retractedCount: number;
  scoredReferences: Array<{
    reference: OpenAlexReference;
    score: ScoringResult;
    riskLevel: ReturnType<typeof getRiskLevel>;
    retraction?: RetractionStatus;
  }>;
  summary: {
    veryHighRisk: number;
    highRisk: number;
    moderateRisk: number;
    lowRisk: number;
    minimalRisk: number;
  };
  createdAt: Date;
}

/**
 * Analyze a paper by DOI
 * Fetches references and scores each one
 */
export async function analyzePaper(doi: string): Promise<AnalysisResult | null> {
  try {
    console.log(`\n🔬 Starting analysis for DOI: ${doi}`);
    console.log('=' .repeat(80));

    // 1. Fetch the input paper's metadata to check its journal
    const { fetchWorkByDOI } = await import('./openalex');
    const inputWork = await fetchWorkByDOI(doi);

    let inputJournalScore = null;
    let inputJournalWarning = false;

    if (inputWork) {
      // Get journal/publisher info from the input paper
      const journal = inputWork.title || 'Unknown'; // This gets the paper title, we need venue

      // For now, check DOI prefix for known predatory publishers
      if (doi.startsWith('10.4236/')) {
        console.log('\n⚠️  WARNING: Input paper is from Scientific Research Publishing (SCIRP)');
        console.log('   This publisher is on Beall\'s List of predatory publishers');
        inputJournalWarning = true;
      }
    }

    // 2. Fetch references from OpenAlex
    const references = await getReferencesForDOI(doi);

    if (references.length === 0) {
      console.error('❌ No references found');
      return null;
    }

    console.log(`\n📊 Scoring ${references.length} references...`);
    console.log('   Using parallel processing (10 concurrent checks)');

    // 2. Score each reference WITH PARALLEL PROCESSING
    const scoredReferences = [];
    let highRiskCount = 0;
    let retractedCount = 0;

    const summary = {
      veryHighRisk: 0,
      highRisk: 0,
      moderateRisk: 0,
      lowRisk: 0,
      minimalRisk: 0
    };

    // Process references in parallel batches of 10
    const BATCH_SIZE = 10;

    for (let batchStart = 0; batchStart < references.length; batchStart += BATCH_SIZE) {
      const batch = references.slice(batchStart, batchStart + BATCH_SIZE);
      const batchNum = Math.floor(batchStart / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(references.length / BATCH_SIZE);

      console.log(`\n📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} references)`);

      // Process entire batch in parallel
      const batchResults = await Promise.all(
        batch.map(async (ref, idx) => {
          const refNum = batchStart + idx + 1;
          console.log(`   [${refNum}/${references.length}] ${ref.title?.substring(0, 50)}...`);

          // Check for retraction FIRST (authoritative + free)
          let retraction: RetractionStatus | undefined;
          let score: ScoringResult;
          let riskLevel: ReturnType<typeof getRiskLevel>;

          if (ref.doi) {
            retraction = await checkRetraction(ref.doi);

            if (retraction.isRetracted) {
              // SKIP predatory checking - retraction is the critical info
              console.log(`      🚨 RETRACTED - skipping predatory check`);

              score = {
                predatoryScore: 100, // Retracted = automatic high risk
                scoreBreakdown: {},
                evidenceSources: retraction.retractionSource.map(s => `retraction-${s}`),
                matchConfidence: 100,
                details: [
                  `🚨 RETRACTED via ${retraction.retractionSource.join(', ').toUpperCase()}`,
                  retraction.retractionReason || 'No reason provided',
                  retraction.retractionNotice ? `Notice: ${retraction.retractionNotice}` : ''
                ].filter(Boolean)
              };

              riskLevel = {
                level: 'very-high',
                label: 'RETRACTED',
                color: '#DC2626',
                description: 'This paper has been officially retracted.'
              };
            } else {
              // Not retracted - do normal predatory checking
              score = await scoreJournal(
                ref.hostVenue?.displayName || 'Unknown',
                ref.hostVenue?.issn?.[0] || null,
                ref.hostVenue?.publisher || null
              );
              riskLevel = getRiskLevel(score.predatoryScore);
            }
          } else {
            // No DOI - can't check retraction, do predatory checking
            score = await scoreJournal(
              ref.hostVenue?.displayName || 'Unknown',
              ref.hostVenue?.issn?.[0] || null,
              ref.hostVenue?.publisher || null
            );
            riskLevel = getRiskLevel(score.predatoryScore);
          }

          return {
            reference: ref,
            score,
            riskLevel,
            retraction
          };
        })
      );

      // Add batch results and update counters
      for (const result of batchResults) {
        scoredReferences.push(result);

        // Track high risk
        if (result.score.predatoryScore >= 60) {
          highRiskCount++;
        }

        // Track retracted
        if (result.retraction?.isRetracted) {
          retractedCount++;
        }

        // Update summary
        if (result.riskLevel.level === 'very-high') summary.veryHighRisk++;
        else if (result.riskLevel.level === 'high') summary.highRisk++;
        else if (result.riskLevel.level === 'moderate') summary.moderateRisk++;
        else if (result.riskLevel.level === 'low') summary.lowRisk++;
        else summary.minimalRisk++;
      }

      // Small delay between batches to avoid overwhelming APIs
      if (batchStart + BATCH_SIZE < references.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // 3. Create analysis record in database
    const { data: analysis, error } = await supabase
      .from('Analysis')
      .insert({
        inputDoi: doi,
        totalReferences: references.length,
        highRiskCount: highRiskCount,
        retractedCount: retractedCount
      })
      .select()
      .single();
    
    if (error || !analysis) {
      console.error('Database error:', error?.message);
      return null;
    }
    
    // 4. Store scored references
    for (const scored of scoredReferences) {
      await supabase.from('Reference').insert({
        analysisId: analysis.id,
        doi: scored.reference.doi,
        title: scored.reference.title || 'Unknown',
        journal: scored.reference.hostVenue?.displayName || 'Unknown',
        issn: scored.reference.hostVenue?.issn?.[0],
        year: scored.reference.publicationYear,
        authors: scored.reference.authorships?.map(a => a.author.displayName).join(', '),
        predatoryScore: scored.score.predatoryScore,
        scoreBreakdown: scored.score.scoreBreakdown,
        evidenceSources: scored.score.evidenceSources,
        matchConfidence: scored.score.matchConfidence,
        isRetracted: false,
        retractionSource: []
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ ANALYSIS COMPLETE');
    console.log('='.repeat(80));
    console.log(`Total References: ${references.length}`);
    console.log(`High Risk: ${highRiskCount} (${Math.round(highRiskCount/references.length*100)}%)`);
    console.log(`Retracted: ${retractedCount}`);
    console.log('\nRisk Distribution:');
    console.log(`  🔴 Very High: ${summary.veryHighRisk}`);
    console.log(`  🟠 High: ${summary.highRisk}`);
    console.log(`  🟡 Moderate: ${summary.moderateRisk}`);
    console.log(`  🟢 Low: ${summary.lowRisk}`);
    console.log(`  ⚪ Minimal: ${summary.minimalRisk}`);
    
    const result: AnalysisResult = {
      analysisId: analysis.id,
      inputDoi: doi,
      inputTitle: scoredReferences[0]?.reference.title || doi,
      totalReferences: references.length,
      highRiskCount,
      retractedCount,
      scoredReferences,
      summary,
      createdAt: new Date(analysis.createdAt)
    };

    // Add warning if input journal is predatory
    if (inputJournalWarning) {
      result.inputJournalWarning = 'WARNING: This paper is published in Scientific Research Publishing (SCIRP), which appears on Beall\'s List of predatory publishers.';
    }

    return result;
    
  } catch (error: any) {
    console.error('Analysis error:', error.message);
    return null;
  }
}

/**
 * Get analysis by ID from database
 */
export async function getAnalysis(analysisId: string): Promise<AnalysisResult | null> {
  try {
    console.log('[getAnalysis] Fetching analysis:', analysisId);
    const { data: analysis, error } = await supabase
      .from('Analysis')
      .select('*, references:Reference(*)')
      .eq('id', analysisId)
      .single();

    if (error) {
      console.error('[getAnalysis] Supabase error:', error);
      return null;
    }

    if (!analysis) {
      console.log('[getAnalysis] No analysis found');
      return null;
    }

    console.log('[getAnalysis] Found analysis with', analysis.references?.length || 0, 'references');
    
    // Reconstruct result format
    const scoredReferences = analysis.references.map((ref: any) => ({
      reference: {
        doi: ref.doi,
        title: ref.title,
        publicationYear: ref.year,
        hostVenue: {
          displayName: ref.journal,
          issn: ref.issn ? [ref.issn] : [],
          publisher: null
        },
        authorships: ref.authors ? ref.authors.split(', ').map((name: string) => ({
          author: { displayName: name }
        })) : []
      },
      score: {
        predatoryScore: ref.predatoryScore,
        scoreBreakdown: ref.scoreBreakdown,
        evidenceSources: ref.evidenceSources,
        matchConfidence: ref.matchConfidence,
        details: []
      },
      riskLevel: getRiskLevel(ref.predatoryScore)
    }));
    
    const summary = {
      veryHighRisk: scoredReferences.filter((r: any) => r.riskLevel.level === 'very-high').length,
      highRisk: scoredReferences.filter((r: any) => r.riskLevel.level === 'high').length,
      moderateRisk: scoredReferences.filter((r: any) => r.riskLevel.level === 'moderate').length,
      lowRisk: scoredReferences.filter((r: any) => r.riskLevel.level === 'low').length,
      minimalRisk: scoredReferences.filter((r: any) => r.riskLevel.level === 'minimal').length
    };
    
    const result: AnalysisResult = {
      analysisId: analysis.id,
      inputDoi: analysis.inputDoi,
      inputTitle: scoredReferences[0]?.reference.title || analysis.inputDoi,
      totalReferences: analysis.totalReferences,
      highRiskCount: analysis.highRiskCount,
      retractedCount: analysis.retractedCount,
      scoredReferences,
      summary,
      createdAt: new Date(analysis.createdAt)
    };

    // Check if input DOI is from known predatory publisher
    if (analysis.inputDoi.startsWith('10.4236/')) {
      result.inputJournalWarning = 'WARNING: This paper is published in Scientific Research Publishing (SCIRP), which appears on Beall\'s List of predatory publishers.';
    }

    return result;
    
  } catch (error: any) {
    console.error('Get analysis error:', error.message);
    return null;
  }
}
