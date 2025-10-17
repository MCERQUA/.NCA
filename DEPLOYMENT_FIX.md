# Quick Deployment Fix

## Problem
The app is currently configured for static builds which won't work with database queries at build time.

## Solution 1: Use Server-Side Rendering (SSR) - Recommended

1. Upgrade Astro to v5:
```bash
cd apps/web
pnpm add astro@latest @astrojs/netlify@latest
```

2. The config is already set to `output: 'server'` in `astro.config.mjs`

3. Deploy to Netlify with environment variables:
   - `DATABASE_URL` - Your Neon database connection string
   - `PUBLIC_GOOGLE_MAPS_API_KEY` - Your Google Maps API key

## Solution 2: Hybrid (Static + Dynamic) - Current Setup

Keep current Astro version but use hybrid rendering:

1. Edit `apps/web/astro.config.mjs`:
```javascript
export default defineConfig({
  output: 'hybrid', // instead of 'server'
  adapter: netlify(),
  // ... rest of config
});
```

2. Mark dynamic pages as server-rendered by adding this to the frontmatter:
```astro
---
export const prerender = false; // Add this to index.astro, directory.astro
---
```

## Solution 3: Static Build Without Database (Quick Test)

If you just want to test deployment without database:

1. Edit `apps/web/astro.config.mjs`:
```javascript
export default defineConfig({
  output: 'static', // Change back to static
  // Remove adapter line
});
```

2. Comment out database calls in `index.astro` and `directory.astro`:
```astro
---
//const contractors = await getAllContractors();
const contractors = []; // Empty until you switch to SSR
---
```

## Current Issue

You're seeing contractors on the deployed site because:
1. The old static build is still deployed
2. That version had mock data
3. The new code hasn't been deployed yet

## Fix Right Now

1. Remove Netlify adapter (it's incompatible):
```bash
cd apps/web
pnpm remove @astrojs/netlify
```

2. Revert to static for now:
```bash
# Edit astro.config.mjs - remove adapter line and change output to 'static'
```

3. Build will work but won't have database data

Then when ready for production, upgrade to Astro 5 and use SSR.
