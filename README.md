# PredCheck

Analyze research paper citations for predatory journals and retracted publications.

## Features

### PRIMARY: Predatory Journal Detection (Probability Score 0-100%)
- ✅ **Beall's List** - Classic predatory publisher/journal list (30 points)
- ✅ **Stop Predatory Journals** - GitHub community list (30 points)
- ✅ **Hijacked Journals** - Journals with stolen/fake names (25 points)
- ✅ **Scopus Discontinued** - Journals removed for concerns (15 points)

### SECONDARY: Retraction Alerts
- 🔔 **Crossref Retraction Watch** - 43,000+ retractions
- 🔔 **PubMed E-utilities** - MEDLINE retraction status
- 🔔 **PubPeer** - Post-publication peer review

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Database:** Supabase (PostgreSQL)
- **ORM:** Prisma (Schema-First approach)
- **Styling:** Tailwind CSS
- **Data Sources:** FREE APIs + cached datasets

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free tier)

### Installation

1. Clone and install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

3. Initialize database:
```bash
npx prisma generate
npx prisma db push
```

4. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
predcheck/
├── app/                  # Next.js App Router
│   ├── page.tsx         # Home (DOI input)
│   ├── check/[doi]/     # Results page
│   └── api/             # API routes
├── lib/                 # Core logic
│   ├── types.ts         # Generated from Prisma
│   ├── scorer.ts        # Probability scoring
│   └── sources/         # Data source integrations
├── prisma/
│   └── schema.prisma    # ⭐ SINGLE SOURCE OF TRUTH
├── data/                # Cached datasets
└── scripts/             # Data refresh scripts
```

## Database Schema

See `prisma/schema.prisma` for the complete schema.

**Key Models:**
- `Analysis` - One per DOI input (tracks session)
- `Reference` - Each cited paper with scores
- `DataSourceCache` - Tracks data freshness

## Scoring System

**Predatory Score Formula:**
```
Score = (bealls_weight * 30 + 
         stop_predatory_weight * 30 + 
         hijacked_weight * 25 + 
         scopus_weight * 15) / 100
```

**Risk Levels:**
- 🔴 90-100%: VERY HIGH RISK
- 🔴 70-89%: HIGH RISK
- 🟠 50-69%: MODERATE RISK
- 🟡 30-49%: LOW RISK
- 🟢 0-29%: MINIMAL RISK

## Data Sources

All sources are FREE and regularly updated:

1. **Stop Predatory Journals** (GitHub CSVs)
   - Direct download, most reliable
   - 2,000+ entries

2. **Beall's List** (Web scraping)
   - 3,000+ entries
   - Partial updates after 2016

3. **Scopus Discontinued** (Excel download)
   - 1,000+ journals
   - Monthly updates from Elsevier

4. **Crossref Retraction Watch** (API)
   - 43,000+ retractions
   - Real-time updates

## Development

### Phase 1: Setup ✅
- [x] Supabase project created
- [x] Architecture stored in Memory MCP
- [x] Data sources mapped
- [x] Next.js + Prisma bootstrapped

### Phase 2: Data Collection (In Progress)
- [ ] Download Stop Predatory CSVs via GitHub MCP
- [ ] Scrape Beall's List
- [ ] Download Scopus discontinued
- [ ] Set up caching layer

### Phase 3: Scoring System
- [ ] Implement scoring algorithm
- [ ] Fuzzy matching for journal names
- [ ] Test with sample journals

### Phase 4: Retraction Detection
- [ ] Crossref Retraction Watch integration
- [ ] PubMed E-utilities integration
- [ ] PubPeer API integration

### Phase 5: UI & Testing
- [ ] Results table with scores
- [ ] Score breakdown visualization
- [ ] CSV export
- [ ] Test with sample DOIs

## API Endpoints

### POST /api/analyze
Analyze a DOI's references
```json
{
  "doi": "10.1038/s41586-020-2649-2"
}
```

### GET /api/refresh-data
Update cached predatory lists

## Cost

- **Supabase:** $10/month (database hosting)
- **APIs:** All FREE (OpenAlex, Crossref, PubMed)
- **Total:** ~$10/month

## Contributing

This project uses:
- Schema-first development (Prisma)
- MCP servers (Supabase, GitHub, Memory, PubMed)
- Task agents for complex operations

## License

MIT

## Acknowledgments

- **OpenAlex** - FREE citation API
- **Crossref** - Retraction Watch data
- **Stop Predatory Journals** - Community-maintained lists
- **Beall's List** - Original predatory journal list
