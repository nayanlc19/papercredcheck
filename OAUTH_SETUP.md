# Google OAuth Setup for PaperCredCheck

## 1. Create Google OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure OAuth consent screen if prompted:
   - User Type: **External**
   - App name: **PaperCredCheck**
   - User support email: Your email
   - Developer contact: Your email
   - Add logo if desired
   - Scopes: Add `email` and `profile` (these are default)

## 2. Configure OAuth Client

**Application type:** Web application
**Name:** PaperCredCheck Production

### Authorized JavaScript origins:
```
http://localhost:3003
https://papercredcheck.onrender.com
```

### Authorized redirect URIs:
```
http://localhost:3003/auth/callback
https://papercredcheck.onrender.com/auth/callback
```

## 3. Get Credentials

After creating the OAuth client, you'll receive:
- **Client ID**: `your-client-id.apps.googleusercontent.com`
- **Client Secret**: `your-client-secret`

## 4. Configure Supabase Auth

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `jwidbwhgbhdxbxfbfqbi`
3. Go to **Authentication** > **Providers**
4. Enable **Google** provider
5. Add your Google OAuth credentials:
   - **Client ID** (from step 3)
   - **Client Secret** (from step 3)
6. Set **Redirect URL** to:
   ```
   https://jwidbwhgbhdxbxfbfqbi.supabase.co/auth/v1/callback
   ```

## 5. Run SQL Migration

Run the SQL commands in Supabase Dashboard > SQL Editor:

```sql
-- Copy the SQL from scripts/create-auth-tables.ts output
-- This creates: search_logs, legal_acceptances, paper_cache tables
```

Or run:
```bash
npx tsx scripts/create-auth-tables.ts
```

Then copy and run the SQL in Supabase Dashboard.

## 6. Deploy to Render

When deploying to Render:

1. **Service Name:** papercredcheck
2. **Render URL:** `https://papercredcheck.onrender.com`

3. **Environment Variables:**
   ```
   DATABASE_URL=postgresql://postgres.jwidbwhgbhdxbxfbfqbi:...
   DIRECT_URL=postgresql://postgres.jwidbwhgbhdxbxfbfqbi:...
   NEXT_PUBLIC_SUPABASE_URL=https://jwidbwhgbhdxbxfbfqbi.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUz...
   OPENALEX_EMAIL=nayanlc19@gmail.com
   GROQ_API_KEY=gsk_Ci1R0M5RLu...
   ```

4. **Update Google OAuth** with production URL:
   - Add `https://papercredcheck.onrender.com` to Authorized JavaScript origins
   - Add `https://papercredcheck.onrender.com/auth/callback` to Authorized redirect URIs

## 7. Test Authentication Flow

### Local Testing (http://localhost:3003):
1. Click "Sign in with Google"
2. Google OAuth popup opens
3. Select Google account
4. Redirects to `/auth/callback`
5. Session established
6. Redirects to homepage
7. Legal acceptance modal appears
8. Accept terms
9. Can now use the app

### Production Testing (https://papercredcheck.onrender.com):
Same flow as local, but with production URLs.

## OAuth Callback Flow

```
User clicks "Sign in"
  ↓
Supabase initiates OAuth with Google
  ↓
Google authentication popup
  ↓
User authorizes
  ↓
Google redirects to: https://jwidbwhgbhdxbxfbfqbi.supabase.co/auth/v1/callback
  ↓
Supabase processes OAuth
  ↓
Supabase redirects to: https://papercredcheck.onrender.com/auth/callback
  ↓
Next.js exchanges code for session
  ↓
User logged in, redirected to homepage
```

## Troubleshooting

### "redirect_uri_mismatch" error:
- Ensure `https://papercredcheck.onrender.com/auth/callback` is added to Google OAuth settings
- Check that URL matches exactly (no trailing slash)
- Wait 5 minutes after updating Google OAuth settings

### Session not persisting:
- Clear cookies and try again
- Check Supabase auth logs
- Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set

### Legal acceptance not working:
- Verify SQL tables were created
- Check browser console for errors
- Run SQL migration again if needed

## Security Notes

- Never commit `.env` file
- Keep Google Client Secret secure
- Use Row Level Security (RLS) policies in Supabase
- All user data is protected by RLS policies
