# Project Requirements Document (PRD)

## Project Overview
**Working title:** National Contractor Association (NCA) — modern rebuild

**Goal:** Recreate and improve the nationalcontractorassociation website using **Astro + React** with a best‑in‑class contractor directory, SEO/AI‑search‑optimized company profile pages, and a modern, trustworthy visual design aligned to the provided logo and brand colors.

**Primary outcomes**
- Increase qualified contractor leads and membership sign‑ups
- Improve organic visibility (national + local) for trade/service keywords (e.g., “roofing contractors near me”)
- Provide fast, intuitive discovery of contractors by location, trade, specialization, certifications, and ratings
- Establish a scalable content system to publish resources, guides, standards, and regulatory updates

**KPIs**
- +60–120% organic traffic in 6 months (baseline required)
- <1.8s TTI, <200ms TTFB, **Core Web Vitals**: LCP <2.5s, CLS <0.1, INP <200ms
- 3–5% contractor sign‑up conversion (visitor→account), 40% profile completion rate
- 20% YoY increase in inbound member inquiries via profile CTAs

---

## Users & Jobs-To-Be-Done
**Homeowners / Commercial customers**
- Find reputable contractors nearby and compare options
- Validate credibility via reviews, licenses, insurance, portfolio
- Contact quickly and safely

**Contractors / Companies**
- Get discovered in relevant local searches
- Showcase services, coverage areas, credentials, projects, testimonials
- Receive leads; manage profile and membership/subscription

**NCA Admins/Editors**
- Approve/verify contractors, moderate content/reviews
- Publish editorial content; manage taxonomies and SEO
- Export reports and manage billing

---

## Information Architecture (proposed)
- **/** — Home
- **/contractors** — Directory landing (browse + search)
- **/contractors/[state]/[city]** — Geo landing pages (SEO)
- **/contractors/[category]** — Trade/category landing pages (SEO)
- **/company/[slug]** — Contractor profile page (primary SEO object)
- **/join** — Plans & pricing (membership)
- **/signup** / **/login** — Auth
- **/resources** — Guides, checklists, regulations, cost calculators
- **/about**, **/standards**, **/code-of-ethics**, **/contact**
- **/dashboard** — Contractor portal
- **/admin** — Admin console
- System: **/sitemap.xml**, **/robots.txt**, **/api/** endpoints

**URL Strategy**
- Semantic, lowercase, hyphenated slugs (e.g., `/contractors/roofing/oh/columbus`)
- Canonicals for deduped geo/category intersections
- Pagination with query params (`?page=2`) + rel=prev/next

---

## Visual & Brand Direction
**Colors (derived from logo)**
- Primary Orange: `#F47A20` (approx — confirm from source artwork)
- Black: `#000000`
- Charcoal: `#1F1F23`
- Off‑white: `#F8F8FA`
- Accent Slate: `#6B7280`
- Success: `#10B981`, Warning: `#F59E0B`, Error: `#EF4444`

**Typography**
- Headings: **Poppins** or **Inter** (semi‑bold/bold)
- Body: **Inter** or **Source Sans 3**
- Monospace (code snippets in resources): **JetBrains Mono**

**Design System**
- Component library: **Tailwind CSS** + **shadcn/ui** primitives
- Motion: subtle **Framer Motion** for page and card transitions (≤150ms)
- Aesthetic: high‑contrast, clean grid, large touch targets, rounded‑2xl, soft shadows, ample white space

---

## Key Features & Requirements

### 1) Contractor Directory & Map
- **Search**: full‑text, faceted filters (trade, services, certifications, ratings, years in business, availability, emergency service, languages), location radius
- **Map**: clustering, hover/selection sync with list; provider **Mapbox GL** (preferred) or **Leaflet + OpenStreetMap**
- **Geo**: forward + reverse geocoding, radius/drive‑time filters (Mapbox Isochrone optional)
- **Sorting**: relevance, distance, rating, verified status, most reviewed
- **Saved searches** (contractor alerts optional phase 2)

### 2) Company Profile Pages (SEO/AI‑ready)
- **Hero**: logo, NAP (name/address/phone), rating badge, verification badge, primary CTAs (Call, Email, Request Quote)
- **About & Services**: structured bullets + detailed service descriptions
- **Coverage Areas**: cities/counties/ZIPs served + service radius map
- **Credentials**: licenses, insurance, certifications, bonding, associations
- **Portfolio**: projects with images, captions, tags, before/after
- **Reviews**: first‑party reviews + optional import from Google via user‑provided link (no scraping)
- **Team & Safety**: leadership, safety program summary, OSHA certifications
- **FAQs**: auto‑generated suggestions, human‑edited
- **Structured Data**: `LocalBusiness` (or subtype), `Service`, `Review`, `AggregateRating`, `ImageObject` via JSON‑LD
- **Lead capture**: form with spam protection, consent, CRM webhook; dynamic UTM and source tracking
- **Performance**: statically generated via Astro (SSG/ISR) with incremental revalidation on edits

### 3) Membership & Onboarding
- **Plans**: Free (listing), Pro (enhanced features), Verified (priority placement)
- **Payments**: **Stripe** subscriptions (monthly/annual), tax support, invoices, dunning
- **Verification workflow**: document upload for license/insurance; admin review & approve; badge issuance
- **Claim listing**: for pre‑seeded companies created by admins
- **Company users**: owner + team members (roles: Owner, Editor, Billing)

### 4) Contractor Dashboard
- Profile completeness checklist & progress
- Manage company info, coverage, services, portfolio, FAQs
- Lead inbox (messages), export CSV, webhooks to CRM (Zapier, Make, or direct API)
- Review requests link + QR, respond to reviews
- Billing & plan management
- Analytics: profile views, search impressions, top queries, map interactions, conversions

### 5) Editorial Content & Tools
- CMS‑backed **Resources** with categories/tags for SEO topical authority
- Calculators (e.g., roof replacement cost, paint calculator) — serverless or edge functions
- Downloadable templates/checklists (lead magnets)

### 6) Admin Console
- User, company, reviews moderation
- Verification queue & document storage
- Taxonomies (categories, services, certifications)
- Geo data manager (states/cities preloads)
- Content approval workflows
- Exports & metrics

---

## Technical Architecture

**Framework**: **Astro** (content & routing, SSG/SSR as needed) with **React islands** for interactive components (directory search, map, dashboard).

**Language & Tooling**
- TypeScript, ESLint, Prettier, Husky + lint‑staged
- Styling: Tailwind CSS, shadcn/ui
- Animations: Framer Motion

**Data & Services**
- **Database**: PostgreSQL (e.g., Neon/Supabase) with **Prisma ORM**
- **Search**: PostgreSQL trigram + **Typesense**/**Meilisearch** for full‑text & faceting
- **Vector/AI search**: vector store (e.g., **pgvector** or **Pinecone**) with content embeddings for companies, services, FAQs
- **Auth**: Clerk or Auth0 (email + social + magic link)
- **Storage**: S3‑compatible (AWS S3 or Cloudflare R2) for images & docs
- **Geocoding/Maps**: Mapbox (geocoding, tiles, iso‑chrones) or OSM stack
- **Email**: Postmark/SendGrid; reCAPTCHA/Turnstile for forms
- **Payments**: Stripe
- **CMS**: Sanity (preferred), Contentful, or Astro Content Collections + MDX for editorial
- **Analytics**: GA4 + Plausible; GSC; server‑side event forwarding
- **Monitoring**: Sentry (frontend/server), Logtail for logs

**Hosting**: Vercel (preferred) or Netlify; image optimization via Astro/Vercel; CDN caching; edge functions for geo pages.

**Performance Targets**
- Static generation for all category/geo and profile pages with ISR (revalidate on data change)
- Image CDN, AVIF/WebP, responsive `<picture>`
- JS budget: ≤120KB initial, defer hydration (Astro islands), code‑splitting

---

## Data Model (initial)
```
User { id, name, email, role[admin,contractor,member], createdAt }
Company { id, slug, name, logoUrl, description, yearFounded, phone, email, website, address, city, state, zip, country, geo{lat,lng}, serviceRadiusMi, coverageAreas[], licenses[], certifications[], insuranceCarrier, verified:boolean, plan[tier], status[active,pending,hidden], createdAt, updatedAt }
ServiceCategory { id, slug, name, parentId|null }
Service { id, companyId, categoryId, title, description, tags[] }
Project { id, companyId, title, description, images[], city, state, date, tags[] }
Review { id, companyId, rating(1-5), title, body, authorName, createdAt, source[first-party|imported] }
Lead { id, companyId, name, email, phone, message, utm{}, createdAt, status }
Subscription { id, companyId, stripeCustomerId, plan, status, periodStart, periodEnd }
AuditLog { id, actorId, action, targetType, targetId, meta, createdAt }
```

**Search Index docs**
- Company doc includes: text fields (name, services, cities), geo point, facets (state, category, verified, rating), embeddings vector

---

## SEO Requirements
- **Semantic HTML** with accessible components
- **Titles/Meta**: rule‑based patterns for all page types
- **Open Graph/Twitter Card**: dynamic OG images (company logo + city + rating)
- **Schema.org** JSON‑LD:
  - Organization (site‑wide)
  - LocalBusiness (or subtype: RoofingContractor, Electrician, Plumber, etc.) on profile pages
  - BreadcrumbList on all hierarchical pages
  - Review & AggregateRating
- **Sitemap**: index + child sitemaps (profiles, categories, geo, resources) with ≤50k URLs per file
- **Robots**: allow discoverability; disallow admin/dashboard
- **Canonical** & **pagination rels**
- **Hreflang** (phase 2 if multilingual)
- **CWV** optimizations as above; prune client JS via Astro
- **Internal linking**: auto‑link companies from geo/category pages; related services and nearby companies
- **Content strategy**: programmatic SEO pages for `[service] contractors in [city]` using quality templates and unique value (verified counts, pricing guidance, permits info)

---

## AI Search Optimization
- **Embeddings** for: company descriptions, services, FAQs, reviews; stored in vector DB; exposed via `/api/semantic-search`
- **Hybrid search**: keyword + vector, re‑ranked by geo distance and verification
- **On‑page Q&A**: structured FAQ blocks with editor assistance to generate suggested Q&A from services & reviews
- **Content enrichment**: server function to suggest SEO snippets (title/meta/alt text) for editors; human approval mandatory
- **Chat Assist (phase 2)**: site search assistant that routes to directory results and resources; guardrails + analytics

---

## Security, Privacy, Compliance
- **OWASP ASVS** best practices; parameterized queries via Prisma; rate limiting on auth/lead forms; CSRF for dashboard forms
- **File scanning** for uploads (ClamAV or provider‑side)
- **Access Control**: RBAC, organization‑scoped permissions
- **PII**: store only necessary lead + billing info; encryption at rest (DB/storage) and TLS in transit
- **Legal**: Terms, Privacy, Cookie policy; consent for marketing opt‑in; CCPA/GDPR readiness (DSAR workflow)

---

## Accessibility
- WCAG 2.2 AA: focus states, skip links, high color contrast, keyboard nav, labels/ARIA for interactive components
- Map alternatives: list view is primary; map is complementary; ensure SR‑only descriptions of pins/clusters

---

## Content & Taxonomy
- Master list of **Service Categories** (e.g., roofing, electrical, plumbing, HVAC, painting, remodeling, landscaping, concrete, solar, fencing, flooring, windows/doors, insulation, pest control, etc.) with synonyms for search mapping
- **Geo seed**: states → cities → ZIPs; pre‑generated landing pages prioritized by demand
- Editorial style guide and tone (trustworthy, plain language, safety‑first)

---

## Success Metrics & Analytics
- GA4 + Plausible events: search, filter change, map marker click, profile view, CTA clicks, form starts/submits
- Conversion tracking by plan tier; UTM capture on leads; call tracking number integration optional
- SEO dashboards: index coverage, top landing pages, query share of voice

---

## Milestones & Timeline (indicative)
1. **Discovery & UX** (2–3 wks): user flows, content audit, IA, low‑fi wireframes, brand tokens
2. **MVP Build** (6–8 wks): core pages, directory, profiles, onboarding, payments, admin v1
3. **Content & SEO** (parallel): category/geo page templates, schema, sitemaps
4. **Beta & Verification** (2 wks): seed 200–500 companies, verification ops, QA, perf tuning
5. **Launch**: production cutover, monitoring, growth experiments

---

## Acceptance Criteria (high‑level)
- Pages pass Lighthouse: Performance ≥90, Accessibility ≥95, SEO ≥100 on reference devices
- Profile pages render valid `LocalBusiness` JSON‑LD; appear in `Rich Results Test`
- Directory returns relevant, paginated results with map/list sync in <350ms p95 (search backend)
- Stripe subscriptions create/update access tier and webhooks update `Subscription`
- Admin verification toggles surface “Verified” badge and boosts rank
- Sitemaps index all public entities; robots served; 200 OK
- Core Web Vitals meet targets in field data (after 14 days)

---

## Open Questions
- Final list of membership plan features & pricing?
- Review policy & moderation rules? (import allowed? proof?)
- Preferred CMS (Sanity vs Contentful vs MDX)?
- Map provider choice and budget (Mapbox vs OSM stack)?
- Multilingual roadmap?
- Lead routing: email only, or CRM integrations to prioritize?

---

## Implementation Notes (Dev)
- Monorepo (pnpm) with apps: `web` (Astro), `api` (Astro endpoints/edge), `admin` (within `web`), `packages/ui`, `packages/config`
- CI/CD: GitHub Actions (typecheck, lint, test, preview deploy); feature environments
- Testing: Vitest + Playwright (critical flows: signup, search, profile edit, checkout)
- Migration scripts with Prisma; seeders for geo/categories
- Image handling: `@astrojs/image` + upload pipeline (server action → S3 → transform)

---

## Wireframe Notes (descriptions)
- **Home**: search bar centered, category quick links, trust badges, featured verified companies, editorial highlights
- **Directory**: left filters, right map; sticky results toolbar; cards show rating, badges, primary services, coverage tags
- **Profile**: left main content (About, Services, Projects, Reviews); right sticky CTA card with phone/email/quote, hours, address map
- **Join**: plan comparison cards with feature checklist; trust/social proof; FAQs
- **Dashboard**: progress widget, tabs (Profile, Portfolio, Reviews, Leads, Billing, Analytics)

---

## Deliverables
- Production Astro/React codebase, design tokens, component library
- CMS schema and starter content
- Data model & infra IaC (if applicable)
- Admin console
- QA checklist & test plans
- SEO/AI search configuration + sitemaps
- Documentation: runbooks, moderation & verification SOPs

---

## Future Enhancements
- Lead marketplace & routing rules; SLA‑based response scoring
- Consumer login to bookmark companies and request quotes from multiple contractors at once
- Project galleries with filtering by materials/brands
- Mobile apps (Expo) consuming the same API

