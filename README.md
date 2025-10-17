# National Contractor Association (NCA)

Modern contractor directory platform built with Astro + React, designed for optimal SEO, performance, and user experience.

## Tech Stack

- **Framework**: Astro 4 + React 18
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL + Prisma ORM
- **Search**: Typesense/Meilisearch
- **Maps**: Mapbox GL
- **Auth**: Clerk
- **Payments**: Stripe
- **Storage**: S3-compatible (AWS S3 / Cloudflare R2)
- **Hosting**: Vercel (preferred) or Netlify

## Project Structure

```
NCA/
├── apps/
│   └── web/                 # Main Astro application
│       ├── src/
│       │   ├── components/  # React & Astro components
│       │   ├── layouts/     # Page layouts
│       │   ├── pages/       # File-based routing
│       │   ├── lib/         # Utilities
│       │   └── styles/      # Global styles
│       └── public/          # Static assets
├── packages/
│   ├── database/            # Prisma schema & client
│   ├── ui/                  # Shared UI components
│   └── config/              # Shared configurations
└── package.json             # Root package.json
```

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- PostgreSQL database (Neon, Supabase, Railway, etc.)
- Google Maps API key

### Quick Start

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `PUBLIC_GOOGLE_MAPS_API_KEY` - Your Google Maps API key

3. **Set up the database:**
   ```bash
   cd apps/web
   pnpm db:push
   ```

4. **Start the development server:**
   ```bash
   cd ../..  # Back to root
   pnpm dev
   ```

The application will be available at `http://localhost:4321`

### Complete Production Setup

See [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) for detailed instructions on:
- Setting up a production database
- Configuring Google Maps API
- Deploying to Netlify
- Adding a custom domain

## Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run linter
- `pnpm format` - Format code with Prettier
- `pnpm typecheck` - Run TypeScript type checking

### Database Commands

```bash
cd packages/database

# Generate Prisma Client
pnpm db:generate

# Push schema changes to database
pnpm db:push

# Create and run migrations
pnpm db:migrate

# Open Prisma Studio
pnpm db:studio
```

## Key Features

- **Contractor Directory**: Search and filter contractors by trade, location, certifications
- **Company Profiles**: SEO-optimized pages with structured data, reviews, portfolios
- **Interactive Map**: Mapbox integration with clustering and geo-search
- **Membership System**: Free, Pro, and Verified tiers with Stripe subscriptions
- **Verification Workflow**: Admin review of licenses and credentials
- **Lead Management**: Quote request forms with CRM integration
- **Resources/CMS**: Editorial content for SEO and user education
- **Admin Dashboard**: User, company, and content moderation

## SEO Features

- Static site generation (SSG) with ISR
- JSON-LD structured data (LocalBusiness, Service, Review schemas)
- Dynamic meta tags and Open Graph images
- Optimized Core Web Vitals (LCP <2.5s, CLS <0.1, INP <200ms)
- Automatic sitemap generation
- Semantic URL structure

## Performance Targets

- Lighthouse Performance: ≥90
- Lighthouse Accessibility: ≥95
- Lighthouse SEO: 100
- Time to Interactive: <1.8s
- TTFB: <200ms

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel
```

### Environment Variables

Make sure to set all required environment variables in your deployment platform:
- Database connection string
- API keys (Mapbox, Stripe, Clerk, etc.)
- Storage credentials
- Email service credentials

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For questions or issues, contact the development team.
