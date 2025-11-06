/**
 * OpenAlex API Client
 * Free API for fetching paper metadata and references
 * No API key required, just polite email
 */

export interface OpenAlexReference {
  doi?: string;
  title?: string;
  publicationYear?: number;
  hostVenue?: {
    displayName?: string;
    issn?: string[];
    publisher?: string;
  };
  authorships?: Array<{
    author: {
      displayName: string;
    };
  }>;
}

export interface OpenAlexWork {
  id: string;
  doi: string;
  title: string;
  publicationYear: number;
  referencedWorks: string[]; // OpenAlex IDs
  citationsCount: number;
}

const OPENALEX_API = 'https://api.openalex.org';
const EMAIL = process.env.OPENALEX_EMAIL || 'nayanlc19@gmail.com';

export interface PaperSearchResult {
  id: string;
  doi: string;
  title: string;
  publicationYear: number;
  authors: string[];
  journal: string;
  citationCount: number;
}

/**
 * Fetch work details from OpenAlex by DOI
 */
export async function fetchWorkByDOI(doi: string): Promise<OpenAlexWork | null> {
  try {
    // Clean DOI
    const cleanDOI = doi.replace('https://doi.org/', '').replace('http://dx.doi.org/', '');
    const url = `${OPENALEX_API}/works/https://doi.org/${cleanDOI}?mailto=${EMAIL}`;
    
    console.log(`\n📥 Fetching from OpenAlex: ${cleanDOI}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`OpenAlex error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    return {
      id: data.id,
      doi: data.doi,
      title: data.title,
      publicationYear: data.publication_year,
      referencedWorks: data.referenced_works || [],
      citationsCount: data.cited_by_count || 0
    };
  } catch (error: any) {
    console.error('OpenAlex fetch error:', error.message);
    return null;
  }
}

/**
 * Fetch multiple works details in batch
 * OpenAlex allows batch queries with | separator
 */
export async function fetchWorksBatch(openAlexIds: string[]): Promise<OpenAlexReference[]> {
  try {
    if (openAlexIds.length === 0) return [];
    
    // OpenAlex batch endpoint (max 50 per request)
    const batchSize = 50;
    const allReferences: OpenAlexReference[] = [];
    
    for (let i = 0; i < openAlexIds.length; i += batchSize) {
      const batch = openAlexIds.slice(i, i + batchSize);
      const filter = batch.join('|');
      const url = `${OPENALEX_API}/works?filter=openalex_id:${filter}&per-page=50&mailto=${EMAIL}`;
      
      console.log(`   Fetching batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(openAlexIds.length / batchSize)} (${batch.length} works)`);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.log(`   Error: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      const works = data.results || [];
      
      for (const work of works) {
        allReferences.push({
          doi: work.doi?.replace('https://doi.org/', ''),
          title: work.title,
          publicationYear: work.publication_year,
          hostVenue: {
            displayName: work.primary_location?.source?.display_name,
            issn: work.primary_location?.source?.issn || [],
            publisher: work.primary_location?.source?.host_organization_name
          },
          authorships: work.authorships?.map((a: any) => ({
            author: { displayName: a.author.display_name }
          }))
        });
      }
      
      // Rate limiting: be polite to OpenAlex
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`   ✅ Fetched ${allReferences.length} references`);
    return allReferences;
    
  } catch (error: any) {
    console.error('OpenAlex batch fetch error:', error.message);
    return [];
  }
}

/**
 * Get all references for a DOI
 */
export async function getReferencesForDOI(doi: string): Promise<OpenAlexReference[]> {
  const work = await fetchWorkByDOI(doi);
  if (!work) return [];

  console.log(`   Found ${work.referencedWorks.length} references`);

  // Extract OpenAlex IDs from URLs
  const ids = work.referencedWorks.map(url => url.split('/').pop()!);

  return fetchWorksBatch(ids);
}

/**
 * Search for papers by title
 * Returns top 10 matches
 */
export async function searchPapersByTitle(title: string): Promise<PaperSearchResult[]> {
  try {
    console.log(`\n🔍 Searching OpenAlex for: "${title}"`);

    const url = `${OPENALEX_API}/works?search=${encodeURIComponent(title)}&per-page=10&mailto=${EMAIL}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`OpenAlex search error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const works = data.results || [];

    const results: PaperSearchResult[] = works.map((work: any) => ({
      id: work.id,
      doi: work.doi?.replace('https://doi.org/', '') || '',
      title: work.title || 'Unknown title',
      publicationYear: work.publication_year || 0,
      authors: work.authorships?.slice(0, 5).map((a: any) => a.author.display_name) || [],
      journal: work.primary_location?.source?.display_name || 'Unknown journal',
      citationCount: work.cited_by_count || 0
    }));

    console.log(`   Found ${results.length} results`);
    return results;

  } catch (error: any) {
    console.error('OpenAlex search error:', error.message);
    return [];
  }
}

/**
 * Search for papers by partial DOI
 * Returns matching papers based on DOI pattern
 */
export async function searchPapersByDOI(doiQuery: string): Promise<PaperSearchResult[]> {
  try {
    // Clean the DOI query
    const cleanQuery = doiQuery.replace('https://doi.org/', '').replace('http://dx.doi.org/', '').trim();

    console.log(`\n🔍 Searching OpenAlex for DOI: "${cleanQuery}"`);

    // Search using DOI filter with partial matching
    const url = `${OPENALEX_API}/works?filter=doi:${encodeURIComponent(cleanQuery)}&per-page=10&mailto=${EMAIL}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`OpenAlex DOI search error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const works = data.results || [];

    const results: PaperSearchResult[] = works.map((work: any) => ({
      id: work.id,
      doi: work.doi?.replace('https://doi.org/', '') || '',
      title: work.title || 'Unknown title',
      publicationYear: work.publication_year || 0,
      authors: work.authorships?.slice(0, 5).map((a: any) => a.author.display_name) || [],
      journal: work.primary_location?.source?.display_name || 'Unknown journal',
      citationCount: work.cited_by_count || 0
    }));

    console.log(`   Found ${results.length} DOI matches`);
    return results;

  } catch (error: any) {
    console.error('OpenAlex DOI search error:', error.message);
    return [];
  }
}
