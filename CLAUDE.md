# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
2. **Static-First**: Project is configured for static output (`output: 'static'` in astro.config.mjs)
3. **SEO-Optimized**: BaseLayout.astro provides structured metadata, JSON-LD for all pages
4. **Database**: Drizzle ORM with comprehensive schema supporting users, contractors, reviews, leads, portfolio, categories

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

Copy `.env.example` to `.env` and configure:
- **DATABASE_URL**: PostgreSQL connection (required for database features)
- **STACK_PROJECT_ID, STACK_PUBLISHABLE_CLIENT_KEY, STACK_SECRET_SERVER_KEY**: Stack Auth
- **PUBLIC_GOOGLE_MAPS_API_KEY**: Google Maps integration
- **PUBLIC_MAPBOX_ACCESS_TOKEN**: Mapbox integration
- **PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY**: Payment processing
- **PUBLIC_SITE_URL**: Site URL for SEO and redirects

Variables prefixed with `PUBLIC_` are exposed to client-side code.

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
- Environment variables must be set in Netlify dashboard

## Current Status

**Production Ready** ✅:
- Full database integration with Drizzle ORM
- Complete contractor signup flow (`/signup`)
- Real-time directory with search/filter (`/directory`)
- Interactive maps with real contractor data
- Automatic geocoding of addresses
- Homepage with dynamic contractor listings
- API routes for contractor CRUD operations
- All fake/mock data removed
- Production deployment ready

**Functional Flow**:
1. Contractor visits `/signup` and fills out complete profile form
2. Form submits to `/api/contractors` (POST)
3. API geocodes address using Google Maps Geocoding API
4. Contractor saved to database with coordinates
5. Contractor immediately appears in `/directory` and on homepage map
6. No authentication or approval required (auto-approve for now)

**Future Enhancements** (see PROJECT_STATUS.md):
- Authentication integration (Stack Auth) for contractor dashboards
- Admin approval workflow before contractors go live
- Review system for customer feedback
- Portfolio/photo uploads with S3/R2
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
- `national_contractor_association_rebuild_prd_astro_react.md`: Original PRD specifications
