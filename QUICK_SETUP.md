# ⚡ Quick Setup - 3 Simple Steps

## ✅ **What's Already Done**

- ✅ Google OAuth configured with correct URLs
- ✅ All code written and ready
- ✅ Database migration SQL prepared
- ✅ Environment variables ready
- ✅ Dev server running on port 3004

---

## 📋 **3 Steps to Complete (5 minutes)**

### **Step 1: Create Database Tables** (2 min)

1. Open: https://jwidbwhgbhdxbxfbfqbi.supabase.co/project/_/sql
2. Open file: `D:\Claude\Projects\PredCheck\setup-database.sql`
3. Copy all SQL from the file
4. Paste into Supabase SQL Editor
5. Click **"RUN"** button

**What this creates:**
- `search_logs` table
- `legal_acceptances` table
- `paper_cache` table
- Security policies

---

### **Step 2: Add Google OAuth to Supabase** (2 min)

1. Open: https://supabase.com/dashboard/project/jwidbwhgbhdxbxfbfqbi/auth/providers
2. Click on **"Google"**
3. Toggle **"Enable Sign in with Google"** to ON
4. Enter these credentials:

**Client ID:**
```
[YOUR_GOOGLE_OAUTH_CLIENT_ID]
```

**Client Secret:**
```
[YOUR_GOOGLE_OAUTH_CLIENT_SECRET]
```

5. Click **"Save"**

---

### **Step 3: Test Locally** (1 min)

Dev server is already running on: http://localhost:3004

**Test:**
1. Open http://localhost:3004
2. Click "Sign in with Google" (if you add AuthButton to page)
3. Try searching: "Recent materials"
4. Try DOI: `10.1016/j.pmatsci.2004.04.001`

---

## 🚀 **Optional: Deploy to Render**

**When ready to deploy:**

1. Go to: https://dashboard.render.com/
2. New → Web Service
3. Connect GitHub repo
4. **Build:** `npm install && npm run build`
5. **Start:** `npm start`
6. Add environment variables from `.env` file

**Production URL:** https://papercredcheck.onrender.com

---

## 📊 **Monitor Usage**

After setup, view search logs:
- Go to: https://supabase.com/dashboard/project/jwidbwhgbhdxbxfbfqbi/editor
- Open `search_logs` table
- See all user searches with timestamps!

---

## ✅ **Quick Checklist**

- [ ] Step 1: SQL tables created ✓
- [ ] Step 2: Google OAuth configured ✓
- [ ] Step 3: Tested locally ✓
- [ ] (Optional) Deployed to Render

---

## 🎯 **Google OAuth Credentials (Ready)**

**Client ID:**
```
[YOUR_GOOGLE_OAUTH_CLIENT_ID]
```

**Client Secret:**
```
[YOUR_GOOGLE_OAUTH_CLIENT_SECRET]
```

**Redirect URIs (Already configured):**
- ✅ `http://localhost:3003/auth/callback`
- ✅ `https://papercredcheck.onrender.com/auth/callback`

---

## 📝 **Files Reference**

| File | Purpose |
|------|---------|
| `setup-database.sql` | SQL to create all tables |
| `SETUP_COMPLETE.md` | Detailed setup guide |
| `OAUTH_SETUP.md` | OAuth configuration details |
| `IMPLEMENTATION_SUMMARY.md` | Code integration examples |

---

**That's it! Just run the SQL and configure OAuth, and you're done!** 🎉
