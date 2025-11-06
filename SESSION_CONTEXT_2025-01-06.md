# PaperCredCheck - Session Context
**Date:** January 6, 2025
**Time:** 03:55 UTC

## Project Overview
**Name:** PaperCredCheck (formerly PredCheck)
**Purpose:** Academic paper credibility verification system that checks for predatory journals and retracted papers
**Location:** `D:\Claude\Projects\PredCheck`

## Technology Stack
- **Frontend:** Next.js 14 (React, TypeScript, Tailwind CSS)
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **AI:** Llama 3.3 70B via Groq API
- **APIs:** OpenAlex, Crossref, PubMed
- **Deployment:** Local (port 3004)

## Core Features Implemented

### 1. Input DOI Validation
- Checks if input paper is from known predatory publishers
- Currently detects DOI prefix `10.4236/` (SCIRP - Scientific Research Publishing)
- Shows prominent red warning banner if predatory publisher detected
- **File:** `lib/analyzer.ts` (lines 42-59)

### 2. Reference Fetching
- Uses OpenAlex API to fetch all references from a paper
- Handles batch fetching (50 works per request)
- **File:** `lib/openalex.ts`

### 3. Retraction Checking (PRIORITY FIRST)
- **Crossref API:** Checks `is-retracted-by` relationship, update field, content-updated field
- **PubMed API:** Searches by DOI, checks for "Retracted Publication" marker, RetractionIn/RetractionOf comments
- **Smart Logic:** If retracted → skip expensive predatory checking (saves Groq API calls)
- Returns: isRetracted, retractionSource[], retractionReason, retractionNotice
- **File:** `lib/retraction-checker.ts`

### 4. Predatory Journal Detection
- **Only runs if paper is NOT retracted** (resource optimization)
- Hybrid approach: Fuzzy pre-filtering + Groq AI verification (95%+ confidence)
- Data sources:
  - Beall's List publishers (500 entries)
  - Stop Predatory Journals publishers (500 entries)
  - Predatory journals by name (817 entries)
  - Hijacked journals (114 entries)
  - Scopus discontinued (ISSN exact match)
- Scoring system: 0-100 points
  - Beall's List: 40 points
  - Stop Predatory Journals: 35 points
  - Hijacked journal: 20 points
  - Scopus discontinued: 15 points
- **File:** `lib/scorer.ts`

### 5. Risk Level Classification
- Very High Risk: 80-100 (red)
- High Risk: 60-79 (orange)
- Moderate Risk: 40-59 (yellow)
- Low Risk: 20-39 (lime)
- Minimal Risk: 0-19 (green)
- Special: RETRACTED (purple, score 100)

### 6. Results Display
- Summary cards: Total References, High Risk, Retracted, Safe %, Need Review
- Risk distribution chart
- **Expandable rows** showing detailed reasoning:
  - Retraction info (source, reason, notice)
  - Evidence sources (which databases matched)
  - Detailed analysis from AI
  - Score breakdown
  - For minimal risk: "No matches found in predatory databases"
- **File:** `app/results/[id]/page.tsx` (lines 216-337)

### 7. Data Persistence
- Supabase tables:
  - `Analysis`: analysisId, inputDoi, totalReferences, highRiskCount, retractedCount, createdAt
  - `Reference`: Links to Analysis, stores DOI, title, journal, year, authors, predatoryScore, scoreBreakdown, evidenceSources, matchConfidence, isRetracted, retractionSource

## Database Schema (Supabase)

```sql
-- Main tables
Analysis (
  id UUID PRIMARY KEY,
  inputDoi TEXT,
  totalReferences INTEGER,
  highRiskCount INTEGER,
  retractedCount INTEGER,
  createdAt TIMESTAMP
)

Reference (
  id UUID PRIMARY KEY,
  analysisId UUID REFERENCES Analysis(id),
  doi TEXT,
  title TEXT,
  journal TEXT,
  issn TEXT,
  year INTEGER,
  authors TEXT,
  predatoryScore INTEGER,
  scoreBreakdown JSONB,
  evidenceSources TEXT[],
  matchConfidence INTEGER,
  isRetracted BOOLEAN,
  retractionSource TEXT[]
)

-- Predatory data tables
PredatoryPublisher (
  id, name, source ['bealls', 'stop-predatory-journals']
)

PredatoryJournal (
  id, title, issn, publisher
)

HijackedJournal (
  id, legitimateTitle, fakeWebsite, legitimateIssn
)

ScopusDiscontinued (
  id, title, issn, discontinuedReason, discontinuedYear
)
```

## Key Files

### Core Logic
- `lib/analyzer.ts` - Main analysis orchestrator (analyzePaper, getAnalysis)
- `lib/retraction-checker.ts` - Crossref + PubMed retraction checking
- `lib/scorer.ts` - Predatory journal scoring with Groq AI
- `lib/openalex.ts` - OpenAlex API client
- `lib/groq-matcher.ts` - Groq AI name matching (llama-3.3-70b-versatile)
- `lib/supabase.ts` - Centralized Supabase client

### UI Components
- `app/page.tsx` - Homepage with DOI input
- `app/results/[id]/page.tsx` - Results display with expandable rows
- `app/api/analyze/route.ts` - Analysis API endpoint
- `app/api/analysis/[id]/route.ts` - Fetch analysis by ID

### Configuration
- `package.json` - Project metadata (name: "papercredcheck")
- `.env` - Environment variables (GROQ_API_KEY, SUPABASE credentials)

## Smart Optimizations Implemented

1. **Check retractions BEFORE predatory checks** - saves Groq API costs
2. **Fuzzy pre-filtering** - reduces AI calls from thousands to 3-5 per reference
3. **95%+ confidence threshold** - only marks as predatory with high certainty
4. **Batch API calls** - OpenAlex fetches 50 works at once
5. **Rate limiting** - 200ms delay between requests

## Current Issues / Known Limitations

1. **Input validation only checks one DOI prefix** (10.4236/) - needs expansion
2. **No paper title search** - only accepts DOI
3. **Brief retraction messages** - not detailed enough
4. **Predatory risk explanations are short** - need more context
5. **No confirmation step** - analysis starts immediately

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[key]
GROQ_API_KEY=[key]
OPENALEX_EMAIL=nayanlc19@gmail.com
```

## Performance Metrics

- Average analysis time: 1-5 minutes (depends on reference count)
- Groq API calls: 1 per non-retracted reference (after pre-filtering)
- Retraction checks: Free (Crossref + PubMed APIs)
- Cost per analysis: ~$0.01-0.05 (Groq only)

## Recent Changes (This Session)

1. ✅ Added retraction checking with Crossref + PubMed
2. ✅ Implemented smart logic: retraction check → skip predatory if retracted
3. ✅ Added expandable rows showing detailed reasoning
4. ✅ Updated branding: PredCheck → PaperCredCheck
5. ✅ Updated descriptions to include all data sources
6. ✅ Added "Retracted" summary card
7. ✅ Input DOI validation for predatory publishers

## Next Steps Requested by User

1. **Allow paper title search** - not just DOI
   - Search OpenAlex by title
   - Show confirmation page with paper details (title, authors, DOI)
   - User confirms before running analysis

2. **Much more detailed explanations**
   - For retractions:
     - "This paper was found to be retracted in [PubMed/Crossref]"
     - "Reason for retraction: [full reason]"
     - "Retraction notice: [link]"
   - For predatory risks:
     - "This journal is found in [ABC source]"
     - "Why risk is: [detailed explanation]"
     - More context from AI matching

## Testing Examples

**Predatory paper (SCIRP):** 10.4236/aad.2025.143006
- Shows input warning banner
- All 24 references were clean (Lancet, Nature, Wiley, etc.)

**Retracted paper:** 10.1126/science.1097243
- Detected via PubMed
- Skipped predatory checking
- Marked as RETRACTED with 100 score

**Clean paper:** 10.1038/s41586-020-2649-2
- Should show minimal risk for all references

## Deployment Notes

- Currently running on localhost:3004
- Not yet deployed to production
- Need to set up hosting (Vercel/Netlify recommended)
- Need domain name
- Need to configure environment variables on host

## Code Quality Notes

- TypeScript strict mode enabled
- Tailwind CSS for styling
- Proper error handling in API routes
- Rate limiting to avoid API abuse
- Modular architecture (separate files for concerns)

---
**End of Context - Ready for Title Search + Detailed Explanations Implementation**
