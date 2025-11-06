/**
 * Predatory Journal Scoring System with Hybrid Matching
 *
 * Uses fast fuzzy pre-filtering + Groq AI verification (95%+ confidence)
 * Calculates probability scores (0-100%) for predatory journals
 *
 * Scoring weights:
 * - Beall's List match: 40 points
 * - Stop Predatory Journals match: 35 points
 * - Hijacked journal: 20 points
 * - Scopus discontinued: 15 points
 */

import { supabase } from './supabase';
import { matchJournalNames } from './groq-matcher';

export interface ScoringResult {
  predatoryScore: number; // 0-100
  scoreBreakdown: {
    bealls?: number;
    stopPredatory?: number;
    hijacked?: number;
    scopusDiscontinued?: number;
  };
  evidenceSources: string[];
  matchConfidence: number; // 0-100
  details: string[];
}

/**
 * Fast fuzzy pre-filter to narrow down candidates
 * Returns top 3 most similar names for AI verification
 */
function preFilterCandidates(
  searchName: string,
  candidates: Array<{ name: string; [key: string]: any }>,
  topN: number = 3
): Array<{ item: any; similarity: number }> {
  const normalized = searchName.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  
  const scored = candidates.map(item => {
    const candidateName = item.name.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    
    // Quick similarity checks
    let similarity = 0;
    
    // Exact match
    if (normalized === candidateName) similarity = 100;
    // Substring match
    else if (normalized.includes(candidateName) || candidateName.includes(normalized)) {
      similarity = 80;
    }
    // Word overlap
    else {
      const words1 = new Set(normalized.split(/\s+/));
      const words2 = new Set(candidateName.split(/\s+/));
      const intersection = new Set([...words1].filter(w => words2.has(w)));
      const union = new Set([...words1, ...words2]);
      similarity = (intersection.size / union.size) * 70;
    }
    
    return { item, similarity };
  });
  
  return scored
    .filter(s => s.similarity > 50) // Only keep reasonable matches
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN);
}

/**
 * Check journal against all predatory data sources
 * Uses hybrid approach: fuzzy pre-filter + AI verification
 */
export async function scoreJournal(
  journalName: string,
  issn?: string | null,
  publisher?: string | null
): Promise<ScoringResult> {
  const result: ScoringResult = {
    predatoryScore: 0,
    scoreBreakdown: {},
    evidenceSources: [],
    matchConfidence: 0,
    details: []
  };
  
  let totalConfidence = 0;
  let matchCount = 0;
  
  console.log(`\n🔍 Scoring: ${journalName}`);
  if (publisher) console.log(`   Publisher: ${publisher}`);
  
  // 1. Check Beall's List publishers (hybrid matching)
  if (publisher) {
    const { data: beallsPublishers } = await supabase
      .from('PredatoryPublisher')
      .select('*')
      .eq('source', 'bealls');
    
    if (beallsPublishers && beallsPublishers.length > 0) {
      // Pre-filter to top 3 candidates
      const candidates = preFilterCandidates(publisher, beallsPublishers, 3);
      console.log(`   Pre-filtered ${beallsPublishers.length} Beall's publishers to ${candidates.length} candidates`);
      
      // AI verify only top candidates
      for (const { item: pub, similarity } of candidates) {
        const match = await matchJournalNames(publisher, pub.name);
        if (match.isMatch) {
          result.scoreBreakdown.bealls = 40;
          result.predatoryScore += 40;
          result.evidenceSources.push('bealls');
          result.details.push(`🚨 PUBLISHER FOUND IN BEALL'S LIST`);
          result.details.push(`   Matched Publisher: "${pub.name}"`);
          result.details.push(`   AI Confidence: ${match.confidence}%`);
          result.details.push(`   \nWHY THIS IS CONCERNING:`);
          result.details.push(`   Beall's List is a curated database of predatory publishers and journals maintained by library science professionals. Publishers on this list have been identified as engaging in questionable practices such as:`);
          result.details.push(`   • Lack of proper peer review processes`);
          result.details.push(`   • Deceptive claims about journal metrics or indexing`);
          result.details.push(`   • Aggressive email solicitation for submissions`);
          result.details.push(`   • Charging high fees with minimal editorial oversight`);
          result.details.push(`   • Publishing low-quality or scientifically questionable content`);
          result.details.push(`   \nAI Matching Reasoning: ${match.reasoning}`);
          totalConfidence += match.confidence;
          matchCount++;
          break;
        }
      }
    }
  }

  // 2. Check Stop Predatory Journals publishers (hybrid matching)
  if (publisher && !result.scoreBreakdown.bealls) {
    const { data: stopPredPublishers } = await supabase
      .from('PredatoryPublisher')
      .select('*')
      .eq('source', 'stop-predatory-journals');
    
    if (stopPredPublishers && stopPredPublishers.length > 0) {
      const candidates = preFilterCandidates(publisher, stopPredPublishers, 3);
      console.log(`   Pre-filtered ${stopPredPublishers.length} Stop Predatory publishers to ${candidates.length} candidates`);
      
      for (const { item: pub } of candidates) {
        const match = await matchJournalNames(publisher, pub.name);
        if (match.isMatch) {
          result.scoreBreakdown.stopPredatory = 35;
          result.predatoryScore += 35;
          result.evidenceSources.push('stop-predatory-journals');
          result.details.push(`⚠️ PUBLISHER FOUND IN STOP PREDATORY JOURNALS DATABASE`);
          result.details.push(`   Matched Publisher: "${pub.name}"`);
          result.details.push(`   AI Confidence: ${match.confidence}%`);
          result.details.push(`   \nWHY THIS IS CONCERNING:`);
          result.details.push(`   The "Stop Predatory Journals" database is an independent watchdog resource that tracks publishers with predatory characteristics. Publishers in this database have been flagged for:`);
          result.details.push(`   • Inadequate or non-existent peer review`);
          result.details.push(`   • Misleading claims about impact factors or indexing status`);
          result.details.push(`   • Lack of transparency in editorial boards and processes`);
          result.details.push(`   • Exploitative business models focused on author fees`);
          result.details.push(`   • Poor quality control and rapid acceptance rates`);
          result.details.push(`   \nAI Matching Reasoning: ${match.reasoning}`);
          totalConfidence += match.confidence;
          matchCount++;
          break;
        }
      }
    }
  }
  
  // 3. Check predatory journals by name (hybrid matching)
  const { data: predatoryJournals } = await supabase
    .from('PredatoryJournal')
    .select('*');
  
  if (predatoryJournals && predatoryJournals.length > 0) {
    const candidates = preFilterCandidates(journalName, predatoryJournals.map((j: any) => ({ name: j.title, ...j })), 3);
    console.log(`   Pre-filtered ${predatoryJournals.length} predatory journals to ${candidates.length} candidates`);
    
    for (const { item: journal } of candidates) {
      const match = await matchJournalNames(journalName, journal.title);
      if (match.isMatch) {
        if (!result.scoreBreakdown.stopPredatory) {
          result.scoreBreakdown.stopPredatory = 35;
          result.predatoryScore += 35;
        }
        if (!result.evidenceSources.includes('stop-predatory-journals')) {
          result.evidenceSources.push('stop-predatory-journals');
        }
        result.details.push(`⚠️ JOURNAL NAME FOUND IN PREDATORY JOURNAL DATABASE`);
        result.details.push(`   Matched Journal: "${journal.title}"`);
        result.details.push(`   AI Confidence: ${match.confidence}%`);
        result.details.push(`   \nWHY THIS IS CONCERNING:`);
        result.details.push(`   This specific journal name appears in a curated list of predatory journals. Journals in this database have been flagged for:`);
        result.details.push(`   • Operating with substandard peer review processes`);
        result.details.push(`   • Making false or misleading claims about their reputation`);
        result.details.push(`   • Prioritizing profit over scientific quality`);
        result.details.push(`   • Lack of proper editorial oversight`);
        result.details.push(`   • Accepting most submissions regardless of scientific merit`);
        result.details.push(`   \nPublishing in such journals may harm your academic reputation and the credibility of your research.`);
        result.details.push(`   \nAI Matching Reasoning: ${match.reasoning}`);
        totalConfidence += match.confidence;
        matchCount++;
        break;
      }
    }
  }
  
  // 4. Check hijacked journals (hybrid matching)
  const { data: hijackedJournals } = await supabase
    .from('HijackedJournal')
    .select('*');
  
  if (hijackedJournals && hijackedJournals.length > 0) {
    const candidates = preFilterCandidates(journalName, hijackedJournals.map((j: any) => ({ name: j.legitimateTitle, ...j })), 3);
    console.log(`   Pre-filtered ${hijackedJournals.length} hijacked journals to ${candidates.length} candidates`);
    
    for (const { item: journal } of candidates) {
      const match = await matchJournalNames(journalName, journal.legitimateTitle);
      if (match.isMatch) {
        result.scoreBreakdown.hijacked = 20;
        result.predatoryScore += 20;
        result.evidenceSources.push('hijacked');
        result.details.push(`🚨 WARNING: POTENTIAL HIJACKED JOURNAL DETECTED`);
        result.details.push(`   Legitimate Journal Name: "${journal.legitimateTitle}"`);
        result.details.push(`   Fake Website: ${journal.fakeWebsite}`);
        result.details.push(`   Legitimate ISSN: ${journal.legitimateIssn || 'Unknown'}`);
        result.details.push(`   AI Confidence: ${match.confidence}%`);
        result.details.push(`   \nWHY THIS IS EXTREMELY CONCERNING:`);
        result.details.push(`   Journal hijacking is a serious form of academic fraud where criminals create fake websites that impersonate legitimate, respected journals. These hijacked sites:`);
        result.details.push(`   • Clone the appearance and branding of real journals`);
        result.details.push(`   • Use similar or identical journal names and ISSNs`);
        result.details.push(`   • Collect submission fees from unsuspecting researchers`);
        result.details.push(`   • Provide fake acceptance letters and publication confirmations`);
        result.details.push(`   • Never actually publish your work in the legitimate journal`);
        result.details.push(`   • May publish your work on a fraudulent site, harming your reputation`);
        result.details.push(`   \n⚠️ CRITICAL: Always verify you are submitting to the official journal website. Check the legitimate publisher's site directly.`);
        result.details.push(`   \nAI Matching Reasoning: ${match.reasoning}`);
        totalConfidence += match.confidence;
        matchCount++;
        break;
      }
    }
  }
  
  // 5. Check Scopus discontinued (exact ISSN match - no AI needed)
  if (issn) {
    const { data: scopusDiscontinued } = await supabase
      .from('ScopusDiscontinued')
      .select('*')
      .eq('issn', issn)
      .single();
    
    if (scopusDiscontinued) {
      result.scoreBreakdown.scopusDiscontinued = 15;
      result.predatoryScore += 15;
      result.evidenceSources.push('scopus-discontinued');
      result.details.push(`⚠️ JOURNAL DISCONTINUED BY SCOPUS`);
      result.details.push(`   ISSN Match: ${issn} (Exact Match - 100% Confidence)`);
      result.details.push(`   Discontinued Year: ${scopusDiscontinued.discontinuedYear || 'Unknown'}`);
      result.details.push(`   Official Reason: ${scopusDiscontinued.discontinuedReason}`);
      result.details.push(`   \nWHY THIS IS CONCERNING:`);
      result.details.push(`   Scopus is one of the world's largest abstract and citation databases of peer-reviewed literature. When Scopus discontinues coverage of a journal, it typically indicates:`);
      result.details.push(`   • Publication concerns (irregularities, delays, or cessation)`);
      result.details.push(`   • Quality issues that no longer meet Scopus standards`);
      result.details.push(`   • Ethical concerns or policy violations`);
      result.details.push(`   • Changes in editorial practices or ownership`);
      result.details.push(`   • Loss of peer review integrity`);
      result.details.push(`   \nWhile not all discontinued journals are predatory, this is a significant red flag that warrants careful investigation before submission or citation.`);
      totalConfidence += 100;
      matchCount++;
    }
  }
  
  result.matchConfidence = matchCount > 0 ? Math.round(totalConfidence / matchCount) : 0;
  result.predatoryScore = Math.min(100, result.predatoryScore);
  
  console.log(`   Final Score: ${result.predatoryScore}/100 (${result.matchConfidence}% confidence)`);
  
  return result;
}

/**
 * Get risk level description based on score
 */
export function getRiskLevel(score: number): {
  level: 'minimal' | 'low' | 'moderate' | 'high' | 'very-high';
  label: string;
  color: string;
  description: string;
} {
  if (score >= 80) {
    return {
      level: 'very-high',
      label: 'Very High Risk',
      color: '#DC2626',
      description: 'Multiple sources indicate this is likely a predatory journal. Avoid publishing here.'
    };
  } else if (score >= 60) {
    return {
      level: 'high',
      label: 'High Risk',
      color: '#EA580C',
      description: 'Strong evidence suggests predatory practices. Exercise extreme caution.'
    };
  } else if (score >= 40) {
    return {
      level: 'moderate',
      label: 'Moderate Risk',
      color: '#F59E0B',
      description: 'Some concerning indicators found. Research thoroughly before submission.'
    };
  } else if (score >= 20) {
    return {
      level: 'low',
      label: 'Low Risk',
      color: '#84CC16',
      description: 'Minor concerns. Verify journal credibility independently.'
    };
  } else {
    return {
      level: 'minimal',
      label: 'Minimal Risk',
      color: '#22C55E',
      description: 'No major red flags detected in our databases.'
    };
  }
}

/**
 * Batch score multiple journals (sequential to avoid rate limits)
 */
export async function scoreJournals(
  journals: Array<{
    name: string;
    issn?: string | null;
    publisher?: string | null;
  }>
): Promise<ScoringResult[]> {
  const results: ScoringResult[] = [];
  
  for (const journal of journals) {
    const score = await scoreJournal(journal.name, journal.issn, journal.publisher);
    results.push(score);
    
    // Rate limiting: small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return results;
}
