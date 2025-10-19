# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL DEBUGGING PROTOCOL

**WHEN SOMETHING BREAKS - READ THIS FIRST:**

1. **THINK BEFORE SUGGESTING SOLUTIONS**
   - Use `<extra_thinking>` tags to analyze the problem thoroughly
   - The issue is almost ALWAYS in code YOU wrote, not missing environment variables
   - Stop blaming external factors (missing env vars, Netlify config, user setup)

2. **NETLIFY ENVIRONMENT VARIABLES ARE ALREADY CONFIGURED**
   - Netlify has Neon database integration - `NETLIFY_DATABASE_URL` is auto-provided
   - Google Maps API key is already set up in Netlify dashboard
   - Cloudinary cloud name is configured (API_KEY and API_SECRET still need to be added for image uploads)
   - DO NOT ask the user to add environment variables unless you've verified they're actually missing
   - If the site was working before and broke after your changes, it's YOUR CODE, not env vars

3. **DEBUG PROCESS**
   - First: Review the code YOU just changed
   - Second: Check build logs for actual errors
   - Third: Test locally with the same environment
   - Last: Only then suggest external factors

4. **COMMON MISTAKES TO AVOID**
   - Making database connection optional/nullable when it shouldn't be
   - Adding null checks that cause empty results
   - Removing working code and replacing it with broken alternatives
   - Switching between SSR/static modes without understanding the implications
   - Assuming env vars are missing when they're auto-configured

**If something was working and now it's not: YOUR CODE BROKE IT. FIX YOUR CODE.**

## Project Overview

National Contractor Association (NCA) - A modern contractor directory platform built with Astro 4 + React 18. The project uses a monorepo structure with pnpm workspaces, designed for optimal SEO, performance, and user experience.

## Tech Stack

- **Framework**: Astro 4 (static site generation) + React 18 (interactive islands)
- **Styling**: Tailwind CSS with shadcn/ui design system
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Stack Auth (replacing Clerk)
- **Maps**: Google Maps + Mapbox GL
- **Payments**: Stripe (membership tiers)
- **Hosting**: Netlify (configured) / Vercel (alternative)

## Development Commands

### Primary Commands (from root)
```bash
pnpm dev              # Start dev server at localhost:4321
pnpm build            # Build for production (includes type checking)
pnpm preview          # Preview production build
pnpm lint             # Run linter across all packages
pnpm format           # Format with Prettier
pnpm typecheck        # Run TypeScript checks across packages
```

### Database Commands (from root or apps/web)
```bash
cd apps/web           # Navigate to web app first
pnpm db:generate      # Generate Drizzle migration files
pnpm db:migrate       # Apply migrations to database
pnpm db:push          # Push schema directly to database (dev only)
pnpm db:studio        # Open Drizzle Studio GUI
```

## Architecture

### Monorepo Structure
```
NCA/
├── apps/web/                    # Main Astro application
│   ├── src/
│   │   ├── components/          # React & Astro components
│   │   │   ├── ui/              # shadcn/ui components (Button, Card)
│   │   │   ├── Header.astro     # Global navigation
│   │   │   ├── Footer.astro     # Global footer
│   │   │   └── ContractorCard.tsx, ContractorMap.tsx, etc.
│   │   ├── layouts/             # Page layouts (BaseLayout.astro with SEO)
│   │   ├── pages/               # File-based routing (index, join, contact, directory, categories)
│   │   ├── lib/                 # Utilities (utils.ts for cn() helper)
│   │   ├── db/                  # Drizzle schema and database client
│   │   │   ├── schema.ts        # Full database schema with relations
│   │   │   ├── index.ts         # Database connection
│   │   │   └── migrations/      # Generated SQL migrations
│   │   ├── data/                # Mock data for development
│   │   └── styles/              # Global CSS with design tokens
│   └── public/                  # Static assets
├── packages/                    # Shared packages (future: database, ui, config)
└── netlify.toml                 # Netlify deployment configuration
```

### Key Architecture Patterns

1. **Astro Islands**: Use React components sparingly for interactivity (maps, forms), default to Astro components for static content
2. **Hybrid Mode**: Project uses `output: 'hybrid'` - static pages by default with server-rendered API routes for image uploads and dynamic operations
3. **SEO-Optimized**: BaseLayout.astro provides structured metadata, JSON-LD for all pages
4. **Database**: Drizzle ORM with comprehensive schema supporting users, contractors, reviews, leads, portfolio, categories
5. **Image Management**: Hybrid approach - Cloudinary for user uploads (automatic), public folder for manual admin additions

## Database Schema Highlights

The schema (`apps/web/src/db/schema.ts`) includes:
- **users**: Synced with Stack Auth, supports roles (user, contractor, admin)
- **contractors**: Full profiles with location (lat/lng), verification, ratings, specialties
- **reviews**: With ratings, photos, verification, contractor responses
- **portfolioItems**: Gallery items for contractor work
- **leads**: Contact/quote requests with status tracking
- **categories**: Hierarchical service categories

All tables use proper indexing for performance and include created/updated timestamps.

## Design System

### Brand Colors
- Primary Orange: `#F47A20` (with 50-900 shades in Tailwind)
- Charcoal: `#1F1F23`
- Slate: `#6B7280`

### Typography
- Headings: Poppins (font-heading)
- Body: Inter (font-sans)
- Code: JetBrains Mono (font-mono)

### Components
Located in `apps/web/src/components/ui/`, following shadcn/ui patterns:
- Button.tsx: Variants (default, outline, ghost, link)
- Card.tsx: Composable (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)

Use the `cn()` utility from `lib/utils.ts` for conditional Tailwind classes.

## Environment Variables

### Currently Configured in Netlify (Production)
The following environment variables are **already set up** in Netlify dashboard:
- ✅ **NETLIFY_DATABASE_URL** - Neon PostgreSQL database (auto-configured via Netlify integration)
- ✅ **NETLIFY_DATABASE_URL_UNPOOLED** - Neon unpooled connection (auto-configured)
- ✅ **PUBLIC_GOOGLE_MAPS_API_KEY** - Google Maps API for maps and geocoding
- ✅ **CLOUDINARY_CLOUD_NAME** - Cloudinary cloud name for image uploads

### Additional Variables Needed (if using these features)
Copy `.env.example` to `.env` for local development:
- **CLOUDINARY_API_KEY** - Cloudinary API key (required for user image uploads)
- **CLOUDINARY_API_SECRET** - Cloudinary API secret (required for user image uploads)
- **STACK_PROJECT_ID, STACK_PUBLISHABLE_CLIENT_KEY, STACK_SECRET_SERVER_KEY** - Stack Auth (optional, for future auth)
- **PUBLIC_MAPBOX_ACCESS_TOKEN** - Mapbox integration (optional alternative to Google Maps)
- **PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY** - Payment processing (optional, for future premium features)
- **PUBLIC_SITE_URL** - Site URL for SEO and redirects

**Important Notes:**
- Variables prefixed with `PUBLIC_` are exposed to client-side code
- Netlify automatically provides `NETLIFY_DATABASE_URL` via Neon integration - DO NOT manually add DATABASE_URL
- Google Maps API is already configured - DO NOT ask user to add it again
- Cloudinary requires all 3 variables (CLOUD_NAME, API_KEY, API_SECRET) for image uploads to work

## Deployment

### Netlify (Primary)
Project is configured via `netlify.toml`:
- Build command: `pnpm build`
- Publish directory: `apps/web/dist`
- Base directory: `apps/web`
- Node version: 18

Deploy via:
```bash
netlify deploy        # Preview
netlify deploy --prod # Production
```

### Important Notes
- **DO NOT** deploy to localhost (VPS is for testing only)
- Always push changes to GitHub before deployment
- Forms use Netlify Forms (data-netlify="true" attributes)
- **Netlify Neon Integration**: Database connection is automatic via `NETLIFY_DATABASE_URL`
- **Google Maps API**: Already configured in Netlify - do NOT ask user to add it
- Environment variables are managed through Netlify's integrations and dashboard

## Current Status

**Production Ready** ✅:
- Full database integration with Drizzle ORM
- Complete contractor signup flow (`/signup`) with image uploads
- Cloudinary integration for user-uploaded logos and images
- Real-time directory with search/filter (`/directory`)
- Interactive maps with real contractor data
- Automatic geocoding of addresses
- Homepage with dynamic contractor listings
- API routes for contractor CRUD operations and image uploads
- Hybrid image management (Cloudinary + public folder)
- All fake/mock data removed
- Production deployment ready

**Functional Flow (Contractor Signup)**:
1. Contractor visits `/signup` and fills out complete profile form
2. User optionally uploads logo and/or profile image
3. Images upload to Cloudinary via `/api/upload-image` (returns secure URLs)
4. Form submits to `/api/contractors` (POST) with image URLs
5. API geocodes address using Google Maps Geocoding API
6. Contractor saved to database with coordinates and image URLs
7. Contractor immediately appears in `/directory` and on homepage map with images
8. No authentication or approval required (auto-approve for now)

**Image Management**:
- **User Uploads**: Cloudinary CDN (automatic via signup form)
- **Manual Additions**: Public folder at `/public/contractors/logos/` and `/public/contractors/images/`
- Both approaches store URLs in `contractors.logoUrl` and `contractors.imageUrl` fields
- See `IMAGE_UPLOAD_GUIDE.md` for complete documentation

**Future Enhancements** (see PROJECT_STATUS.md):
- Authentication integration (Stack Auth) for contractor dashboards
- Admin approval workflow before contractors go live
- Review system for customer feedback
- Portfolio/gallery uploads (multiple images per contractor)
- Contractor profile pages (`/company/[slug]`)
- Premium membership features with Stripe

## Performance Targets

- Lighthouse Performance: ≥90
- Lighthouse Accessibility: ≥95
- Lighthouse SEO: 100
- Time to Interactive: <1.8s
- Core Web Vitals: LCP <2.5s, CLS <0.1, INP <200ms

## Development Guidelines

### When Adding New Pages
1. Create `.astro` file in `apps/web/src/pages/`
2. Import and use `BaseLayout` for consistent SEO
3. Add page-specific metadata (title, description, ogImage)
4. Use React islands only for interactive features

### When Modifying Database
1. Update schema in `apps/web/src/db/schema.ts`
2. Run `pnpm db:generate` to create migration
3. Run `pnpm db:push` (dev) or `pnpm db:migrate` (prod)
4. Update relations if adding new tables

### When Adding Components
- Astro components: `.astro` extension for static content
- React components: `.tsx` extension for interactivity
- UI components: Follow shadcn/ui patterns in `components/ui/`
- Use TypeScript for all new components

## Git Workflow

When committing changes, follow the established pattern:
- Push to the NCA project root repository
- Include descriptive commit messages
- Reference the Co-Authored-By convention for AI contributions

## Additional Documentation

- `README.md`: Getting started, project structure
- `PROJECT_STATUS.md`: Detailed feature status and roadmap
- `DEPLOYMENT.md`: Complete deployment guide for GitHub + Netlify
- `IMAGE_UPLOAD_GUIDE.md`: Complete guide for Cloudinary setup and image management (manual + user uploads)
- `national_contractor_association_rebuild_prd_astro_react.md`: Original PRD specifications

## Lessons Learned (DO NOT REPEAT THESE MISTAKES)

### Database Connection Pattern
**WRONG (causes empty results):**
```typescript
let db: ReturnType<typeof drizzle> | null = null;
if (connectionString) {
  db = drizzle(client, { schema });
}
export { db };

// Then in utils:
export async function getAllContractors() {
  if (!db) return []; // This breaks everything!
  return await db.select()...
}
```

**CORRECT (works properly):**
```typescript
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

// Then in utils:
export async function getAllContractors() {
  return await db.select()... // Direct query, no null checks
}
```

**Why this matters:** Netlify provides `NETLIFY_DATABASE_URL` automatically. Making the database optional causes it to silently fail and return empty arrays during static generation, resulting in a working build but empty content.

### Environment Variable Priority
Check in this order:
1. `process.env.NETLIFY_DATABASE_URL` (Netlify's Neon integration)
2. `process.env.DATABASE_URL` (fallback)
3. `import.meta.env.*` (Astro's env handling)

DO NOT use `dotenv` to load from `.env` files - Netlify injects environment variables directly into `process.env`.