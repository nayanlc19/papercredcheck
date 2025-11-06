# Groq AI Integration for PredCheck

**Implementation Date:** 2025-11-05
**Status:** ✅ Complete and Tested

## Overview

PredCheck uses **Groq's llama-3.3-70b-versatile** model for intelligent journal name matching with 95%+ confidence threshold, replacing traditional fuzzy string matching (Levenshtein distance).

## Why Groq AI?

**Problem with Fuzzy Matching:**
- False positives: "Academic Journals" matched "Academy Journals" at 80%
- Missed variations: "International J." vs "Int'l Journal" scored low
- No semantic understanding of abbreviations
- Arbitrary thresholds (70%, 80%, 90%?)

**Groq AI Solution:**
- ✅ Understands common academic abbreviations
- ✅ Recognizes word order variations
- ✅ Handles "The", "Journal of", "International" prefixes intelligently
- ✅ Provides reasoning for each match
- ✅ 95%+ confidence threshold for matches

## Architecture: Hybrid Matching

**Two-Stage Process:**

### Stage 1: Fast Pre-filtering (Fuzzy)
```
1,484 database records
       ↓
Fuzzy word-overlap filter (>50% similarity)
       ↓
Top 3 candidates per search
```

### Stage 2: AI Verification (Groq)
```
3 candidates
       ↓
Groq AI evaluation (llama-3.3-70b-versatile)
       ↓
95%+ confidence = MATCH
```

## Performance Metrics

**Without Pre-filtering:**
- Database records: 1,484
- AI calls per journal: 1,484
- Estimated time: ~5 minutes per journal
- **Status:** Too slow ❌

**With Pre-filtering:**
- Pre-filter reduces to: 0-3 candidates
- AI calls per journal: 0-9 (avg ~5)
- Estimated time: 5-10 seconds per journal
- **Status:** Production ready ✅

## Implementation

### 1. Groq Client Setup

**File:** `lib/groq-matcher.ts`

```typescript
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!
});

export async function matchJournalNames(
  name1: string,
  name2: string,
  threshold: number = 95
): Promise<MatchResult>
```

**Model:** `llama-3.3-70b-versatile`
**Temperature:** 0.1 (low for consistency)
**Response Format:** JSON
**Max Tokens:** 200

### 2. Pre-filtering Algorithm

**File:** `lib/scorer.ts`

```typescript
function preFilterCandidates(
  searchName: string,
  candidates: Array<{ name: string; [key: string]: any }>,
  topN: number = 3
): Array<{ item: any; similarity: number }>
```

**Scoring:**
- Exact match: 100
- Substring match: 80
- Word overlap (Jaccard): 0-70
- Threshold: >50 to pass filter

### 3. Scoring Integration

**Process per journal:**
1. Query database for all publishers (500 records)
2. Pre-filter to top 3 candidates
3. AI verify each candidate
4. First match at 95%+ confidence wins
5. Add score + evidence to result

## Test Results

**Test Suite:** `scripts/test-scorer.ts`

| Journal | Publisher | Score | Confidence | Status |
|---------|-----------|-------|------------|--------|
| Academic Journals | Academic Journals | 35/100 | 100% | ✅ Detected |
| International J. of Advanced Research | International Research Journals | 0/100 | 0% | ✅ Clean |
| Nature | Springer Nature | 0/100 | 0% | ✅ Clean |
| Science | AAAS | 0/100 | 0% | ✅ Clean |
| Advances in Science | Advancements in Science | 35/100 | 100% | ✅ Detected |

**Pre-filtering Efficiency:**
```
Academic Journals:
  500 publishers → 3 candidates (99.4% reduction)
  817 journals → 0 candidates (100% reduction)
  114 hijacked → 0 candidates (100% reduction)
  Total AI calls: 3

Nature:
  500 publishers → 0 candidates
  817 journals → 1 candidate
  114 hijacked → 1 candidate
  Total AI calls: 2
```

## API Configuration

### Environment Variables

```bash
# .env
GROQ_API_KEY="[YOUR_GROQ_API_KEY]"
```

### API Key Storage

**Location:** `D:\Claude\apikeys.md`

```markdown
## Groq

**Date Added:** 2025-11-05
**Purpose:** AI-powered journal name matching
**Status:** Active

### Credentials

- **API Key:** `[YOUR_GROQ_API_KEY]`

### Usage Notes

- Model: llama-3.3-70b-versatile
- Free tier: 30 requests/minute
- Projects: PredCheck
```

## Rate Limits

**Groq Free Tier:**
- 30 requests per minute
- 14,400 requests per day
- Model: llama-3.3-70b-versatile

**PredCheck Usage:**
- Average: 5 AI calls per journal
- With rate limit: ~6 journals/minute
- Daily capacity: ~2,880 journals

**Rate Limiting Strategy:**
- 200ms delay between batch operations
- Pre-filtering reduces API calls by 99%+
- Sequential processing (no parallel calls)

## Error Handling

```typescript
try {
  const match = await matchJournalNames(name1, name2);
  if (match.isMatch) {
    // Handle match
  }
} catch (error) {
  console.error('Groq matching error:', error.message);
  return {
    isMatch: false,
    confidence: 0,
    reasoning: `Error: ${error.message}`
  };
}
```

**Fallback Behavior:**
- API errors return 0% confidence (no match)
- Scoring continues with other sources
- Errors logged but don't block execution

## AI Prompt Engineering

**System Prompt:**
```
You are a precise academic journal name matching expert. 
Always respond with valid JSON.
```

**User Prompt:**
```
You are an expert in academic journal name matching. 
Compare these two journal/publisher names and determine 
if they refer to the same entity.

Name 1: "{name1}"
Name 2: "{name2}"

Consider:
- Common abbreviations and variations
- Word order differences
- "The", "Journal of", "International" prefixes
- Spelling variations
- Punctuation differences

Respond in JSON format:
{
  "isMatch": true/false,
  "confidence": 0-100,
  "reasoning": "Brief explanation"
}

Be strict: Only return confidence 95+ if you're 
very certain they're the same entity.
```

## Response Format

**Example Response:**
```json
{
  "isMatch": true,
  "confidence": 100,
  "reasoning": "Exact string match with no variations or differences"
}
```

**Fields:**
- `isMatch`: Boolean (true if confidence >= 95)
- `confidence`: Number 0-100
- `reasoning`: String explanation

## Advantages Over Fuzzy Matching

| Aspect | Fuzzy (Levenshtein) | Groq AI |
|--------|---------------------|---------|
| Abbreviations | ❌ Fails | ✅ Understands |
| Word order | ❌ Sensitive | ✅ Flexible |
| Semantic meaning | ❌ None | ✅ Context-aware |
| Confidence | ❌ Arbitrary | ✅ AI-evaluated |
| Reasoning | ❌ None | ✅ Explainable |
| Speed | ✅ Instant | ⚠️ 1-2s per call |

**Solution:** Hybrid approach gets best of both worlds!

## Future Optimizations

1. **Caching:** Store AI match results in database
2. **Batch Processing:** Group multiple comparisons per API call
3. **Progressive Loading:** Check exact matches first, then fuzzy, then AI
4. **Vector Embeddings:** Pre-compute embeddings for instant similarity
5. **Model Fine-tuning:** Train on academic journal names specifically

## Cost Analysis

**Groq Pricing (Free Tier):**
- ✅ Free: 30 requests/min, unlimited
- ✅ No credit card required
- ✅ No expiration

**Estimated Usage:**
- Average paper: 30 references
- AI calls per reference: 5
- Total API calls: 150 per paper
- Time per paper: ~25 minutes (rate limited)

**Production Scaling:**
- Consider Groq Pro for higher rate limits
- Implement caching to reduce repeat queries
- Pre-compute common journal matches

## Dependencies

```json
{
  "groq-sdk": "^0.3.0",
  "dotenv": "^16.0.0"
}
```

## Files Modified

- ✅ `lib/groq-matcher.ts` - AI matching logic
- ✅ `lib/scorer.ts` - Hybrid scoring system
- ✅ `.env` - Groq API key
- ✅ `package.json` - groq-sdk dependency
- ✅ `apikeys.md` - Key storage and documentation

## Testing

**Run tests:**
```bash
npx tsx scripts/test-scorer.ts
```

**Test coverage:**
- ✅ Predatory publisher detection
- ✅ Predatory journal detection
- ✅ Legitimate journal clearance
- ✅ Pre-filtering efficiency
- ✅ AI confidence thresholds

## Conclusion

Groq AI integration provides:
- ✅ **95%+ confidence** matches
- ✅ **Explainable reasoning** for each decision
- ✅ **Fast performance** with pre-filtering
- ✅ **Semantic understanding** of journal names
- ✅ **Production ready** with error handling

The hybrid approach (fuzzy pre-filter + AI verification) achieves both **speed** and **accuracy**.
