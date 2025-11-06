# PaperCredCheck - Deployment Guide

## Prerequisites

1. **Supabase Project**
   - Create a free Supabase project at https://supabase.com
   - Run the database schema from `/database/schema.sql`
   - Populate predatory data using `/scripts/populate-supabase.js`

2. **Groq API Key**
   - Sign up at https://console.groq.com
   - Generate an API key (free tier available)

## Deploy on Render

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/papercredcheck.git
git push -u origin main
```

### Step 2: Create New Web Service on Render

1. Go to https://render.com
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure the service:

**Basic Settings:**
- **Name**: `papercredcheck` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`

**Build & Deploy:**
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Instance Type**: Free (or paid for better performance)

### Step 3: Environment Variables

Add these in Render dashboard under **Environment** tab:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
GROQ_API_KEY=your-groq-api-key-here
OPENALEX_EMAIL=your-email@example.com
```

### Step 4: Deploy

Click **Create Web Service**. Render will:
1. Clone your repository
2. Install dependencies
3. Build the Next.js app
4. Start the production server

Your app will be live at: `https://papercredcheck.onrender.com`

## Performance Notes

### Analysis Speed

- **10 concurrent API calls** process references in parallel
- **50 references**: ~30-60 seconds
- **100 references**: ~1-2 minutes

### Free Tier Limitations

**Render Free Tier:**
- Service spins down after 15 mins of inactivity
- First request after spin-down takes ~30-60 seconds
- Upgrade to paid tier ($7/month) for always-on

**Groq Free Tier:**
- 30 requests/minute
- 14,400 requests/day
- Sufficient for moderate usage

## Troubleshooting

### Build Fails

Check build logs for missing dependencies:
```bash
npm install
npm run build
```

### Runtime Errors

Check Render logs:
- Environment variables are set correctly
- Supabase connection works
- Groq API key is valid

### Slow Analysis

- Parallel processing implemented (10 concurrent)
- Main bottleneck: External API rate limits
- Can't be significantly improved without paid API tiers

## Cost Estimates

**Free Tier:**
- Render: Free (with spin-down)
- Supabase: Free (500MB database, 2GB bandwidth)
- Groq: Free (30 req/min)
- **Total: $0/month**

**Always-On:**
- Render Starter: $7/month
- Supabase: Free tier sufficient
- Groq: Free tier sufficient
- **Total: $7/month**

## Monitoring

Monitor your app at:
- Render Dashboard: https://dashboard.render.com
- Supabase Dashboard: https://app.supabase.com
- Groq Console: https://console.groq.com

## Support

For issues, check:
1. Render logs for deployment errors
2. Browser console for client errors
3. Supabase logs for database issues
