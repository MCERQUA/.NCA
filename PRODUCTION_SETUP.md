# Production Setup Guide - NCA

This guide will help you set up the National Contractor Association website for production use with a real database.

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- A PostgreSQL database (we recommend Neon, Supabase, or Railway)
- Google Maps API key

## Step 1: Database Setup

### Option A: Neon (Recommended - Free Tier Available)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string (it looks like: `postgresql://user:password@host/database`)
4. Save this for the next step

### Option B: Supabase (Free Tier Available)

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Go to Project Settings → Database
4. Copy the "Connection string" under "Connection pooling" (use "Transaction" mode)
5. Save this for the next step

### Option C: Railway (Paid after trial)

1. Go to [railway.app](https://railway.app)
2. Create a new PostgreSQL database
3. Copy the connection string from the "Connect" tab

## Step 2: Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable these APIs:
   - Maps JavaScript API
   - Geocoding API
4. Create an API key:
   - Go to "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the API key
5. **Important**: Restrict your API key:
   - Click on the API key you just created
   - Under "Application restrictions":
     - For development: Choose "None"
     - For production: Choose "HTTP referrers" and add your domain
   - Under "API restrictions": Select "Restrict key" and enable:
     - Maps JavaScript API
     - Geocoding API

## Step 3: Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your values:
   ```env
   # REQUIRED: Your database connection string from Step 1
   DATABASE_URL="postgresql://user:password@host:5432/database"

   # REQUIRED: Your Google Maps API key from Step 2
   PUBLIC_GOOGLE_MAPS_API_KEY="your-api-key-here"

   # OPTIONAL: Only needed later for authentication
   STACK_PROJECT_ID=""
   STACK_PUBLISHABLE_CLIENT_KEY=""
   STACK_SECRET_SERVER_KEY=""
   ```

## Step 4: Install Dependencies

```bash
pnpm install
```

## Step 5: Set Up Database Schema

Run the database migrations to create all necessary tables:

```bash
cd apps/web
pnpm db:push
```

This will create the following tables:
- `users` - User accounts (for future auth)
- `contractors` - Contractor profiles
- `reviews` - Customer reviews
- `review_photos` - Review images
- `portfolio_items` - Contractor portfolio
- `leads` - Customer inquiries
- `categories` - Service categories

## Step 6: Verify Setup

Start the development server:

```bash
pnpm dev
```

The app should start at `http://localhost:4321`

### Test the Flow:

1. **Visit homepage** - Should load without errors (empty map is OK if no contractors yet)
2. **Go to /signup** - Fill out the contractor signup form
3. **Submit form** - Should see success message
4. **Check /directory** - Should see your contractor listed
5. **Check homepage** - Should see contractor on the map (if address was provided)

## Step 7: Deploy to Netlify

### A. Connect GitHub

1. Push your code to GitHub (if not already):
   ```bash
   git add .
   git commit -m "Production ready with database integration"
   git push origin main
   ```

### B. Deploy to Netlify

1. Go to [netlify.com](https://netlify.com) and log in
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select your repository
4. Netlify will auto-detect settings from `netlify.toml`
5. **Add environment variables**:
   - Go to "Site configuration" → "Environment variables"
   - Add:
     - `DATABASE_URL` = (your database connection string)
     - `PUBLIC_GOOGLE_MAPS_API_KEY` = (your Google Maps API key)
6. Click "Deploy site"

### C. Update API Key Restrictions

After deployment:
1. Go back to Google Cloud Console
2. Edit your API key restrictions
3. Add your Netlify domain (e.g., `your-site.netlify.app`)

## Step 8: Custom Domain (Optional)

1. In Netlify → "Domain management"
2. Click "Add custom domain"
3. Follow DNS configuration instructions
4. HTTPS is automatic via Let's Encrypt

## Troubleshooting

### Database Connection Errors

- **Error**: "DATABASE_URL environment variable is not set"
  - **Fix**: Make sure you copied `.env.example` to `.env` and added your database URL

- **Error**: "unable to connect to database"
  - **Fix**: Check your DATABASE_URL is correct and the database is accessible

### Map Not Loading

- **Error**: Maps show "Map loading..." forever
  - **Fix**: Check that PUBLIC_GOOGLE_MAPS_API_KEY is set and valid
  - **Fix**: Make sure you enabled "Maps JavaScript API" in Google Cloud Console

### Geocoding Not Working

- **Error**: Contractors appear in directory but not on map
  - **Fix**: Make sure you enabled "Geocoding API" in Google Cloud Console
  - **Fix**: Check that addresses are complete (city and state are required)

### Build Failures

- **Error**: TypeScript errors during build
  - **Fix**: Run `pnpm typecheck` locally to see errors
  - **Fix**: Make sure all imports are correct

## Production Checklist

Before going live, make sure:

- [ ] Database is set up and migrations are run
- [ ] Environment variables are set in Netlify
- [ ] Google Maps API key is restricted to your domain
- [ ] Site loads without errors
- [ ] Contractor signup form works
- [ ] Contractors appear on the map
- [ ] Directory search/filter works
- [ ] Mobile responsive design works

## Next Steps (Optional)

After basic setup is working:

1. **Add Authentication**: Integrate Stack Auth for contractor logins
2. **Add Approval Workflow**: Require admin approval before contractors go live
3. **Add Reviews**: Enable customer reviews for contractors
4. **Add Portfolio**: Let contractors upload project photos
5. **Add Payments**: Integrate Stripe for premium memberships
6. **Add Email**: Set up Postmark for lead notifications

## Support

If you run into issues:
1. Check the browser console for errors
2. Check Netlify deploy logs
3. Verify all environment variables are set correctly
4. Make sure database is accessible from Netlify

## Database Schema Reference

The database includes these main tables:

**contractors**:
- Basic info (name, business name, description)
- Location (address, city, state, coordinates)
- Contact (phone, email, website)
- Verification (license, insurance, verified status)
- Stats (rating, review count, years in business)

**reviews**:
- Rating, title, content
- Project details
- Contractor response
- Verification status

**portfolio_items**:
- Project photos for contractors
- Title, description, category

**leads**:
- Customer inquiries
- Project details
- Contact information

All tables include proper indexes for performance and timestamps for tracking.
