/**
 * Retraction Checker
 * Uses Crossref and PubMed APIs to check for retracted papers
 * This is authoritative data - no fuzzy matching needed
 */

export interface RetractionStatus {
  isRetracted: boolean;
  retractionSource: string[];
  retractionDate?: string;
  retractionReason?: string;
  retractionNotice?: string;
  noticeLink?: string;
  detailedExplanation?: string;
}

/**
 * Check Crossref API for retraction status
 * Crossref marks retracted papers in their metadata
 */
export async function checkCrossrefRetraction(doi: string): Promise<RetractionStatus> {
  const result: RetractionStatus = {
    isRetracted: false,
    retractionSource: []
  };

  try {
    const cleanDOI = doi.replace('https://doi.org/', '').replace('http://dx.doi.org/', '');
    const url = `https://api.crossref.org/works/${encodeURIComponent(cleanDOI)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PredCheck/1.0 (mailto:nayanlc19@gmail.com)'
      }
    });

    if (!response.ok) {
      return result;
    }

    const data = await response.json();
    const work = data.message;

    // Check for retraction update-to relationship
    if (work.relation && work.relation['is-retracted-by']) {
      result.isRetracted = true;
      result.retractionSource.push('crossref');

      const retractionRefs = work.relation['is-retracted-by'];
      if (retractionRefs && retractionRefs.length > 0) {
        const retractionDOI = retractionRefs[0].id;
        result.retractionNotice = `DOI: ${retractionDOI}`;
        result.noticeLink = `https://doi.org/${retractionDOI}`;
        result.retractionReason = 'This paper has been officially retracted according to Crossref metadata.';
        result.detailedExplanation = `This paper was found to be retracted in Crossref. A formal retraction notice has been published and is linked to this paper in the scholarly record.`;
      }
    }

    // Check update field for retraction notices
    if (work.update && work.update.length > 0) {
      for (const update of work.update) {
        if (update.type === 'retraction' || update.label?.toLowerCase().includes('retract')) {
          result.isRetracted = true;
          if (!result.retractionSource.includes('crossref')) {
            result.retractionSource.push('crossref');
          }
          result.retractionDate = update.updated?.['date-time'];

          if (!result.retractionReason) {
            result.retractionReason = update.label || 'Retraction notice recorded in Crossref metadata.';
          }
          if (!result.detailedExplanation) {
            result.detailedExplanation = `This paper was retracted according to Crossref records${result.retractionDate ? ` on ${new Date(result.retractionDate).toLocaleDateString()}` : ''}.`;
          }
        }
      }
    }

    // Check content-updated field
    if (work['content-updated'] && work['content-updated'].length > 0) {
      const contentUpdate = work['content-updated'][0];
      if (contentUpdate.label?.toLowerCase().includes('retract')) {
        result.isRetracted = true;
        if (!result.retractionSource.includes('crossref')) {
          result.retractionSource.push('crossref');
        }

        if (!result.retractionReason) {
          result.retractionReason = contentUpdate.label || 'Retraction recorded in Crossref content update.';
        }
      }
    }

  } catch (error: any) {
    console.error(`Crossref retraction check error for ${doi}:`, error.message);
  }

  return result;
}

/**
 * Check PubMed API for retraction status
 * PubMed has comprehensive retraction data
 */
export async function checkPubMedRetraction(doi: string): Promise<RetractionStatus> {
  const result: RetractionStatus = {
    isRetracted: false,
    retractionSource: []
  };

  try {
    // Step 1: Search PubMed for the DOI
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(doi)}[doi]&retmode=json`;

    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      return result;
    }

    const searchData = await searchResponse.json();
    const pmids = searchData.esearchresult?.idlist || [];

    if (pmids.length === 0) {
      // Not in PubMed - not an error, just not indexed
      return result;
    }

    const pmid = pmids[0];

    // Step 2: Fetch full record
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml`;

    const fetchResponse = await fetch(fetchUrl);
    if (!fetchResponse.ok) {
      return result;
    }

    const xmlText = await fetchResponse.text();

    // Check for retraction indicators in XML
    if (xmlText.includes('PublicationTypeList')) {
      // Look for "Retracted Publication" or "Retraction of Publication"
      if (xmlText.includes('Retracted Publication')) {
        result.isRetracted = true;
        result.retractionSource.push('pubmed');
        result.retractionReason = 'This paper is marked as "Retracted Publication" in the PubMed database.';
        result.detailedExplanation = `This paper was found to be retracted in PubMed (PMID: ${pmid}). PubMed is the U.S. National Library of Medicine's database and marks papers that have been officially withdrawn from the scientific literature.`;
        result.noticeLink = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
      }
    }

    // Check for retraction comments
    if (xmlText.includes('CommentsCorrectionsList')) {
      if (xmlText.includes('RetractionIn') || xmlText.includes('RetractionOf')) {
        result.isRetracted = true;
        if (!result.retractionSource.includes('pubmed')) {
          result.retractionSource.push('pubmed');
        }

        // Try to extract retraction notice PMID
        const retractionMatch = xmlText.match(/<CommentsCorrections.*?RefType="RetractionIn".*?<PMID.*?>(\d+)<\/PMID>/);
        if (retractionMatch) {
          const retractionPMID = retractionMatch[1];
          result.retractionNotice = `PMID: ${retractionPMID}`;
          result.noticeLink = `https://pubmed.ncbi.nlm.nih.gov/${retractionPMID}/`;

          if (!result.retractionReason) {
            result.retractionReason = `A formal retraction notice has been published in PubMed (PMID: ${retractionPMID}).`;
          }

          if (!result.detailedExplanation) {
            result.detailedExplanation = `This paper was found to be retracted in PubMed. A retraction notice has been published and can be viewed at the provided link. Retractions indicate serious concerns about the validity or integrity of the published work.`;
          }
        } else if (!result.retractionReason) {
          result.retractionReason = 'Retraction comment found in PubMed record.';
          result.detailedExplanation = `This paper has retraction information in its PubMed record (PMID: ${pmid}), indicating it has been officially withdrawn from the scientific literature.`;
          result.noticeLink = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
        }
      }
    }

  } catch (error: any) {
    console.error(`PubMed retraction check error for ${doi}:`, error.message);
  }

  return result;
}

/**
 * Comprehensive retraction check using both APIs
 */
export async function checkRetraction(doi: string): Promise<RetractionStatus> {
  if (!doi) {
    return {
      isRetracted: false,
      retractionSource: []
    };
  }

  console.log(`   🔍 Checking retraction status: ${doi}`);

  // Check both APIs in parallel
  const [crossrefResult, pubmedResult] = await Promise.all([
    checkCrossrefRetraction(doi),
    checkPubMedRetraction(doi)
  ]);

  // Combine results - prefer more detailed information
  const combined: RetractionStatus = {
    isRetracted: crossrefResult.isRetracted || pubmedResult.isRetracted,
    retractionSource: [
      ...crossrefResult.retractionSource,
      ...pubmedResult.retractionSource
    ],
    retractionDate: crossrefResult.retractionDate || pubmedResult.retractionDate,
    retractionReason: crossrefResult.retractionReason || pubmedResult.retractionReason,
    retractionNotice: crossrefResult.retractionNotice || pubmedResult.retractionNotice,
    noticeLink: crossrefResult.noticeLink || pubmedResult.noticeLink,
    detailedExplanation: crossrefResult.detailedExplanation || pubmedResult.detailedExplanation
  };

  // If both sources found it, create a combined explanation
  if (crossrefResult.isRetracted && pubmedResult.isRetracted) {
    combined.detailedExplanation = `This paper was found to be retracted in both Crossref and PubMed databases. ${crossrefResult.detailedExplanation || ''} ${pubmedResult.detailedExplanation || ''}`.trim();
  }

  if (combined.isRetracted) {
    console.log(`   ⚠️  RETRACTED via ${combined.retractionSource.join(', ')}`);
  }

  return combined;
}
