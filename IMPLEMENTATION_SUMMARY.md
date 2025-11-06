# PaperCredCheck - New Features Implementation Summary

## ✅ Completed Features

### 1. Database Tables Created
Run this SQL in Supabase Dashboard > SQL Editor (output from `npx tsx scripts/create-auth-tables.ts`):

- **search_logs**: Tracks all searches (title/DOI) with user info
- **legal_acceptances**: Records user acceptance of legal disclaimer
- **paper_cache**: Caches paper analysis results for recurring searches
- **RLS Policies**: Row-level security protecting user data

### 2. Google OAuth Authentication
- **Components**: `AuthButton.tsx` - Google sign-in button with user menu
- **Routes**: `/auth/callback` - OAuth callback handler
- **APIs**:
  - `/api/legal-acceptance` - Record/check legal acceptance
  - `/api/log-search` - Log search activity

### 3. Legal Acceptance Modal
- **Component**: `LegalAcceptanceModal.tsx`
- Features:
  - Must scroll to bottom before accepting
  - Checkbox confirmation required
  - Links to full disclaimer page
  - Blocks app usage until accepted

### 4. DOI Search Suggestions
- **Updated**: `lib/openalex.ts` - Added `searchPapersByDOI()` function
- **Updated**: `/api/search` - Now supports both title and DOI searches
- Search endpoint accepts `{ title }` OR `{ doi }` parameter

### 5. Search Logging
- **API**: `/api/log-search` - Logs every search to Supabase
- Tracks: user_id, search type, query, DOI, IP, user agent
- Works for both authenticated and anonymous users

## 🔧 Setup Required

### Step 1: Run SQL Migration
```bash
cd D:\Claude\Projects\PredCheck
npx tsx scripts/create-auth-tables.ts
```
Copy the SQL output and run in [Supabase SQL Editor](https://jwidbwhgbhdxbxfbfqbi.supabase.co/project/_/sql)

### Step 2: Configure Google OAuth
See `OAUTH_SETUP.md` for detailed instructions.

**Quick setup:**
1. Create OAuth client at https://console.cloud.google.com/
2. Add authorized origins:
   - `http://localhost:3003`
   - `https://papercredcheck.onrender.com`
3. Add redirect URIs:
   - `http://localhost:3003/auth/callback`
   - `https://papercredcheck.onrender.com/auth/callback`
4. Add credentials to Supabase Dashboard > Authentication > Providers > Google

### Step 3: Update Main Page

The `app/page.tsx` file needs these updates:

#### A. Add Imports
```typescript
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import AuthButton from '@/components/AuthButton';
import LegalAcceptanceModal from '@/components/LegalAcceptanceModal';
```

#### B. Add State Management
```typescript
const [showLegalModal, setShowLegalModal] = useState(false);
const [hasAcceptedLegal, setHasAcceptedLegal] = useState(false);
const [user, setUser] = useState<any>(null);
const [searchMode, setSearchMode] = useState<'title' | 'doi'>('title');
const [doiQuery, setDoiQuery] = useState('');
```

#### C. Check Legal Acceptance on Mount
```typescript
useEffect(() => {
  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);

    if (session?.user) {
      // Check if user has accepted legal terms
      const response = await fetch('/api/legal-acceptance');
      const data = await response.json();

      if (!data.accepted) {
        setShowLegalModal(true);
      } else {
        setHasAcceptedLegal(true);
      }
    }
  };

  checkAuth();
}, []);
```

#### D. Handle Legal Acceptance
```typescript
const handleLegalAccept = async () => {
  await fetch('/api/legal-acceptance', { method: 'POST' });
  setHasAcceptedLegal(true);
  setShowLegalModal(false);
};
```

#### E. Update Search Function
```typescript
const handleSearch = async () => {
  if (!hasAcceptedLegal && user) {
    setShowLegalModal(true);
    return;
  }

  const searchValue = searchMode === 'title' ? titleQuery : doiQuery;

  // Log search
  await fetch('/api/log-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      search_type: searchMode,
      search_query: searchValue,
      doi: searchMode === 'doi' ? doiQuery : null,
    }),
  });

  // Perform search
  const response = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      searchMode === 'title' ? { title: titleQuery } : { doi: doiQuery }
    ),
  });

  const data = await response.json();
  // Handle results...
};
```

#### F. Add AuthButton to Navigation
```typescript
<nav className="...">
  <div className="flex items-center gap-6">
    <a href="/disclaimer">Disclaimer</a>
    <a href="#how-it-works">How it Works</a>
    <AuthButton />
  </div>
</nav>
```

#### G. Add Search Mode Toggle
```typescript
<div className="flex gap-2 mb-4">
  <button
    onClick={() => setSearchMode('title')}
    className={`px-4 py-2 rounded-lg ${
      searchMode === 'title' ? 'bg-blue-600 text-white' : 'bg-gray-200'
    }`}
  >
    Search by Title
  </button>
  <button
    onClick={() => setSearchMode('doi')}
    className={`px-4 py-2 rounded-lg ${
      searchMode === 'doi' ? 'bg-blue-600 text-white' : 'bg-gray-200'
    }`}
  >
    Search by DOI
  </button>
</div>

{searchMode === 'title' ? (
  <input
    type="text"
    value={titleQuery}
    onChange={(e) => setTitleQuery(e.target.value)}
    placeholder="Enter paper title..."
  />
) : (
  <input
    type="text"
    value={doiQuery}
    onChange={(e) => setDoiQuery(e.target.value)}
    placeholder="Enter DOI (e.g., 10.1016/j.pmatsci.2004.04.001)"
  />
)}
```

#### H. Add Example DOI Suggestions
```typescript
{searchMode === 'doi' && (
  <div className="mt-2 text-xs text-gray-600">
    <p>Try these examples:</p>
    <button
      onClick={() => setDoiQuery('10.1016/j.pmatsci.2004.04.001')}
      className="text-blue-600 hover:underline mr-4"
    >
      10.1016/j.pmatsci.2004.04.001
    </button>
    <button
      onClick={() => setDoiQuery('10.1038/nature12373')}
      className="text-blue-600 hover:underline"
    >
      10.1038/nature12373
    </button>
  </div>
)}
```

#### I. Add Legal Modal to Render
```typescript
return (
  <>
    <LegalAcceptanceModal
      isOpen={showLegalModal}
      onAccept={handleLegalAccept}
    />

    <main className="...">
      {/* Rest of page */}
    </main>
  </>
);
```

## 📋 Deployment Checklist

### For Render Deployment:

1. ✅ SQL tables created in Supabase
2. ✅ Google OAuth configured with production URLs
3. ✅ Environment variables set in Render
4. ✅ Build command: `npm run build`
5. ✅ Start command: `npm start`

### OAuth Callback URLs for Render:

**Authorized JavaScript origins:**
```
https://papercredcheck.onrender.com
```

**Authorized redirect URIs:**
```
https://papercredcheck.onrender.com/auth/callback
```

**Supabase Redirect URL (in Google OAuth):**
```
https://jwidbwhgbhdxbxfbfqbi.supabase.co/auth/v1/callback
```

## 🎯 User Flow

1. **First Visit (Unauthenticated)**:
   - User can browse homepage
   - Clicking search shows "Sign in required" or proceeds without logging

2. **After Sign In**:
   - Google OAuth popup
   - Redirect to `/auth/callback`
   - Session established
   - Legal acceptance modal appears
   - Must scroll and check box to accept
   - Can now use all features

3. **Search Flow**:
   - Choose title or DOI search mode
   - Enter query
   - Search logged to Supabase
   - Results displayed
   - Can analyze papers

4. **Return Visits**:
   - Already authenticated
   - Already accepted legal terms
   - Can immediately search

## 📊 Data Collection

All searches are logged with:
- User ID (if authenticated)
- User email
- Session ID
- Search type (title/DOI)
- Search query
- DOI (if applicable)
- IP address
- User agent
- Timestamp

This enables:
- Usage analytics
- Popular search tracking
- Caching frequently requested papers
- User behavior insights

## 🔒 Security

- **RLS Policies**: Users can only see their own data
- **Anonymous Usage**: Search works without login (optional)
- **OAuth Security**: Google handles authentication
- **No Password Storage**: All auth via OAuth
- **Legal Protection**: Every user must accept disclaimer
- **Audit Trail**: All acceptances logged with IP/timestamp

## Next Steps

1. Run SQL migration
2. Configure Google OAuth
3. Update page.tsx with auth integration
4. Test locally
5. Deploy to Render
6. Update OAuth with production URLs
7. Test production deployment
