# 🚀 Deploy PaperCredCheck to Render

## Step 1: Create Web Service

1. Go to: **https://dashboard.render.com/select-repo?type=web**
2. Connect your GitHub repository: `nayanlc19/papercredcheck`
3. Click "Connect"

## Step 2: Configure Service

### Basic Settings:
- **Name**: `papercredcheck`
- **Region**: `Oregon (US West)` or closest to you
- **Branch**: `master`
- **Root Directory**: (leave blank)
- **Runtime**: `Node`

### Build & Deploy Commands:
- **Build Command**:
  ```bash
  npm install && npm run build
  ```
- **Start Command**:
  ```bash
  npm start
  ```

## Step 3: Environment Variables

Add these environment variables in Render:

```env
# Database (Get password from Supabase Dashboard)
DATABASE_URL=postgresql://postgres.jwidbwhgbhdxbxfbfqbi:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

DIRECT_URL=postgresql://postgres.jwidbwhgbhdxbxfbfqbi:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://jwidbwhgbhdxbxfbfqbi.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3aWRid2hnYmhkeGJ4ZmJmcWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjEwMzYsImV4cCI6MjA3NzkzNzAzNn0.yKabsHA9M5LC3uwG09kuWcHMlBVSrnUqZsZFUlpFGUo

# APIs
OPENALEX_EMAIL=nayanlc19@gmail.com

GROQ_API_KEY=[YOUR_GROQ_API_KEY]

PUBPEER_API_KEY=

NCBI_API_KEY=
```

## Step 4: Instance Settings

- **Instance Type**: `Free` (or `Starter` for better performance)
- **Auto-Deploy**: `Yes` (deploy on every push to master)

## Step 5: Deploy!

Click **"Create Web Service"** and wait for deployment (5-10 minutes).

## Step 6: Update OAuth Redirect URIs

Once deployed, you'll get a URL like: `https://papercredcheck.onrender.com`

### Update Google OAuth Console:
1. Go to: https://console.cloud.google.com/apis/credentials?project=papercredcheck
2. Click on your OAuth 2.0 Client ID
3. Add to **Authorized redirect URIs**:
   ```
   https://papercredcheck.onrender.com/auth/callback
   ```
4. Add to **Authorized JavaScript origins**:
   ```
   https://papercredcheck.onrender.com
   ```
5. Save changes

## Step 7: Verify Deployment

1. Visit: `https://papercredcheck.onrender.com`
2. Test Google sign-in
3. Accept legal disclaimer
4. Try example DOI: `10.1016/j.pmatsci.2004.04.001`

## Troubleshooting

### Build fails:
- Check that all environment variables are set
- Review build logs in Render dashboard

### OAuth errors:
- Verify redirect URIs in Google Console match Render URL exactly
- Check Supabase Auth settings

### App not loading:
- Check deployment logs
- Verify DATABASE_URL has correct password
- Ensure all environment variables are present

## Next Steps

✅ Code pushed to GitHub
✅ Ready to deploy on Render
⏳ Complete Supabase setup (run SQL and configure OAuth)
⏳ Deploy to Render
⏳ Update OAuth redirect URIs
⏳ Test production deployment

---

**Repository**: https://github.com/nayanlc19/papercredcheck
**Production URL** (after deployment): https://papercredcheck.onrender.com
