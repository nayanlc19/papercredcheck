# 🚀 PaperCredCheck - Complete Setup Guide

## ✅ Google OAuth Credentials (READY TO USE)

**Client ID:**
```
[YOUR_GOOGLE_OAUTH_CLIENT_ID]
```

**Client Secret:**
```
[YOUR_GOOGLE_OAUTH_CLIENT_SECRET]
```

**Already Configured URLs:**
- ✅ Redirect URIs: `http://localhost:3003/auth/callback`, `https://papercredcheck.onrender.com/auth/callback`
- ✅ JavaScript Origins: `http://localhost:3003`, `https://papercredcheck.onrender.com`

---

## 📋 Step 1: Create Database Tables in Supabase

### Option A: Via Supabase Dashboard (Recommended)

1. Go to: https://jwidbwhgbhdxbxfbfqbi.supabase.co/project/_/sql
2. Copy the contents of `setup-database.sql` file
3. Paste into SQL Editor
4. Click "Run" button

### Option B: Using Command Line

```bash
# View the SQL
cat D:\Claude\Projects\PredCheck\setup-database.sql

# Then copy and paste into Supabase Dashboard
```

**Tables Created:**
- `search_logs` - Tracks all user searches
- `legal_acceptances` - Records disclaimer acceptance
- `paper_cache` - Caches analysis results

---

## 🔐 Step 2: Configure Google OAuth in Supabase

1. Go to: https://supabase.com/dashboard/project/jwidbwhgbhdxbxfbfqbi/auth/providers
2. Click on "Google" provider
3. Toggle "Enable Sign in with Google" to ON
4. Enter the credentials:

**Google OAuth Client ID:**
```
[YOUR_GOOGLE_OAUTH_CLIENT_ID]
```

**Google OAuth Client Secret:**
```
[YOUR_GOOGLE_OAUTH_CLIENT_SECRET]
```

5. **Authorized Redirect URI** (pre-filled by Supabase):
```
https://jwidbwhgbhdxbxfbfqbi.supabase.co/auth/v1/callback
```

6. Click "Save"

**Note:** Google OAuth is already configured with the correct redirect URIs on Google's side!

---

## 🚀 Step 3: Deploy to Render

### Create Web Service

1. Go to: https://dashboard.render.com/
2. Click "New +" → "Web Service"
3. Connect your GitHub repository (if not already connected)
4. Or use "Deploy from repo" with GitHub URL

### Service Configuration

**Service Name:** `papercredcheck`

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Environment Variables:**

```env
DATABASE_URL=postgresql://postgres.jwidbwhgbhdxbxfbfqbi:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

DIRECT_URL=postgresql://postgres.jwidbwhgbhdxbxfbfqbi:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres

NEXT_PUBLIC_SUPABASE_URL=https://jwidbwhgbhdxbxfbfqbi.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3aWRid2hnYmhkeGJ4ZmJmcWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjEwMzYsImV4cCI6MjA3NzkzNzAzNn0.yKabsHA9M5LC3uwG09kuWcHMlBVSrnUqZsZFUlpFGUo

OPENALEX_EMAIL=nayanlc19@gmail.com

GROQ_API_KEY=[YOUR_GROQ_API_KEY]

PUBPEER_API_KEY=

NCBI_API_KEY=
```

**Instance Type:** Free or Starter (based on your needs)

**Auto-Deploy:** Yes (deploy on every push to main branch)

---

## 🔍 Step 4: Verify Deployment

### After Render deploys (usually 5-10 minutes):

1. **Check Deployment:**
   - URL: `https://papercredcheck.onrender.com`
   - Health Check: `https://papercredcheck.onrender.com/disclaimer`

2. **Test Google OAuth:**
   - Go to homepage
   - Click "Sign in with Google"
   - Should redirect to Google login
   - After login, redirect back to site
   - Legal modal should appear

3. **Test Search:**
   - Search by Title: "Recent advances in materials"
   - Search by DOI: `10.1016/j.pmatsci.2004.04.001`
   - Check that searches are logged in Supabase

---

## 🧪 Local Testing (Before Deployment)

### Start Dev Server:
```bash
cd D:\Claude\Projects\PredCheck
npm run dev
```

**Server should be running on:** http://localhost:3003 (or 3004 if 3003 is busy)

### Test Locally:
1. Open http://localhost:3003
2. Test Google OAuth sign-in
3. Accept legal disclaimer
4. Test both title and DOI search
5. Verify search logging in Supabase Dashboard

---

## 📊 Monitor Search Logs

### View search logs in Supabase:

1. Go to: https://supabase.com/dashboard/project/jwidbwhgbhdxbxfbfqbi/editor
2. Select `search_logs` table
3. View all user searches with:
   - Search type (title/DOI)
   - Search query
   - User email (if authenticated)
   - Timestamp
   - IP address

### View legal acceptances:

1. Select `legal_acceptances` table
2. See who has accepted the disclaimer
3. Track acceptance timestamps

---

## 🎯 OAuth Flow Diagram

```
User clicks "Sign in with Google"
        ↓
Google OAuth popup opens
        ↓
User authorizes with Google account
        ↓
Google redirects to: https://jwidbwhgbhdxbxfbfqbi.supabase.co/auth/v1/callback
        ↓
Supabase processes OAuth
        ↓
Supabase redirects to: https://papercredcheck.onrender.com/auth/callback
        ↓
Next.js exchanges code for session
        ↓
User logged in ✅
        ↓
Legal acceptance modal appears (if not yet accepted)
        ↓
User accepts terms
        ↓
Can now search and use all features!
```

---

## 🔧 Troubleshooting

### Issue: "redirect_uri_mismatch" error
**Solution:** Verify these URLs are added in Google OAuth:
- `http://localhost:3003/auth/callback`
- `https://papercredcheck.onrender.com/auth/callback`
- `https://jwidbwhgbhdxbxfbfqbi.supabase.co/auth/v1/callback`

### Issue: Session not persisting
**Solution:**
- Clear browser cookies
- Check that NEXT_PUBLIC_SUPABASE_URL is set
- Verify NEXT_PUBLIC_SUPABASE_ANON_KEY is correct

### Issue: Legal modal not appearing
**Solution:**
- Check browser console for errors
- Verify SQL tables were created
- Confirm `/api/legal-acceptance` endpoint works

### Issue: Search not being logged
**Solution:**
- Check Supabase table permissions (RLS policies)
- Verify user is authenticated
- Check `/api/log-search` endpoint in Network tab

---

## ✅ Checklist

Before going live:

- [ ] SQL tables created in Supabase ✅
- [ ] Google OAuth configured in Supabase ✅
- [ ] Environment variables set in Render
- [ ] Deployed to Render successfully
- [ ] Tested Google sign-in (local)
- [ ] Tested Google sign-in (production)
- [ ] Verified search logging works
- [ ] Tested DOI search: `10.1016/j.pmatsci.2004.04.001`
- [ ] Tested title search
- [ ] Legal disclaimer modal working
- [ ] All searches being logged to Supabase

---

## 📚 Additional Resources

- **Supabase Dashboard:** https://supabase.com/dashboard/project/jwidbwhgbhdxbxfbfqbi
- **Google OAuth Console:** https://console.cloud.google.com/apis/credentials?project=papercredcheck
- **Render Dashboard:** https://dashboard.render.com/
- **OpenAlex API Docs:** https://docs.openalex.org/

---

## 🎉 You're All Set!

Your PaperCredCheck app is now fully configured with:
- ✅ Google OAuth authentication
- ✅ Legal disclaimer system
- ✅ DOI & title search capabilities
- ✅ Complete search logging
- ✅ Result caching infrastructure
- ✅ Ready for deployment to Render

**Production URL:** https://papercredcheck.onrender.com

---

**Last Updated:** January 2025
**Version:** 1.0
