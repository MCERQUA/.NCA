# Deployment Guide - National Contractor Association

This guide will help you deploy the NCA website to GitHub and Netlify.

## Prerequisites

- Git installed locally
- GitHub account
- Netlify account (free tier works great)
- All environment variables ready

## Step 1: Initialize Git Repository

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: NCA website setup

- Astro + React project structure
- Tailwind CSS + shadcn/ui design system
- Prisma database schema
- Netlify-ready forms
- Home, Contact, and Join pages
- SEO optimized layouts

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## Step 2: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and log in
2. Click the "+" icon in the top right
3. Select "New repository"
4. Name it: `national-contractor-association` (or your preferred name)
5. Make it **Private** (recommended) or Public
6. DO NOT initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

## Step 3: Push to GitHub

```bash
# Add GitHub remote (replace USERNAME with your GitHub username)
git remote add origin https://github.com/USERNAME/national-contractor-association.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 4: Deploy to Netlify

### Option A: Deploy via Netlify UI (Recommended)

1. Go to [netlify.com](https://netlify.com) and log in
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub" and authorize Netlify to access your repositories
4. Select your `national-contractor-association` repository
5. Netlify will auto-detect the settings from `netlify.toml`:
   - **Build command**: `pnpm build` (already set)
   - **Publish directory**: `apps/web/dist` (already set)
   - **Base directory**: `apps/web` (already set)
6. Click "Deploy site"

### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy

# When prompted:
# - Create & configure a new site
# - Choose your team
# - Site name: (press enter for random or type your preferred name)
# - Base directory: apps/web
# - Build command: pnpm build
# - Publish directory: apps/web/dist

# For production deployment
netlify deploy --prod
```

## Step 5: Configure Environment Variables

In Netlify dashboard:

1. Go to "Site configuration" → "Environment variables"
2. Add the following variables:

### Required for Forms
- `PUBLIC_SITE_URL`: Your Netlify URL (e.g., `https://your-site.netlify.app`)

### Optional (for future features)
- `DATABASE_URL`: PostgreSQL connection string
- `PUBLIC_MAPBOX_ACCESS_TOKEN`: Mapbox API key
- `PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk auth public key
- `CLERK_SECRET_KEY`: Clerk auth secret
- `PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe public key
- `STRIPE_SECRET_KEY`: Stripe secret
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret

## Step 6: Enable Netlify Forms

Netlify Forms are automatically enabled through our configuration:

1. In Netlify dashboard → "Forms"
2. You should see: "contact" and "contractor-signup"
3. Configure email notifications:
   - Click on each form
   - Add notification recipients
   - Set up Slack/email notifications (optional)

### Form Spam Protection

The forms already include:
- Hidden honeypot fields
- Netlify's built-in spam filtering
- reCAPTCHA can be added via Netlify Forms settings

## Step 7: Set Custom Domain (Optional)

1. In Netlify → "Domain management"
2. Click "Add custom domain"
3. Enter your domain (e.g., `nationalcontractorassociation.com`)
4. Follow DNS configuration instructions
5. Enable HTTPS (automatic with Let's Encrypt)

## Step 8: Update Site URL

After deployment, update the site URL in:

1. **astro.config.mjs**:
   ```javascript
   site: 'https://your-custom-domain.com',
   ```

2. Commit and push:
   ```bash
   git add apps/web/astro.config.mjs
   git commit -m "Update site URL for production"
   git push
   ```

## Form Testing

### Test Contact Form
1. Visit `/contact`
2. Fill out the form
3. Submit
4. Should redirect to `/thank-you`
5. Check Netlify dashboard → Forms for submission

### Test Contractor Signup
1. Visit `/join`
2. Fill out the signup form
3. Submit
4. Should redirect to `/signup-thank-you`
5. Check Netlify dashboard → Forms for submission

## Continuous Deployment

Netlify automatically deploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Your changes"
git push

# Netlify will automatically rebuild and deploy
```

## Build Logs

View build logs in Netlify:
- Go to "Deploys"
- Click on any deployment
- View build log for errors/warnings

## Troubleshooting

### Forms Not Working
- Check that `data-netlify="true"` is in form tags
- Verify `/public/forms.html` exists
- Check Netlify Forms dashboard for errors

### Build Fails
- Check build logs in Netlify
- Verify all dependencies are in `package.json`
- Ensure Node version matches (18+)

### Environment Variables Not Working
- Make sure they start with `PUBLIC_` for client-side access
- Rebuild site after adding env vars
- Check capitalization (case-sensitive)

## Performance Optimization

### Enable Netlify Features
1. **Asset Optimization**: Auto-enabled
2. **Image CDN**: Configure in netlify.toml
3. **Prerendering**: Already configured in Astro
4. **Edge Functions**: For future API routes

### Monitor Performance
- Lighthouse scores (aim for 90+)
- Core Web Vitals
- Netlify Analytics (optional paid feature)

## Security Headers

Already configured in `netlify.toml`:
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy

## Next Steps

After successful deployment:

1. **Test all pages**:
   - Home (`/`)
   - Contact (`/contact`)
   - Join (`/join`)
   - Thank you pages

2. **Set up form notifications**
3. **Configure custom domain**
4. **Add Google Analytics** (optional)
5. **Set up monitoring** (Sentry, LogRocket, etc.)

## Support

- **Netlify Docs**: https://docs.netlify.com
- **Astro Docs**: https://docs.astro.build
- **GitHub Issues**: Create issues for bugs/features

---

**Congratulations!** Your NCA website is now live and ready for development! 🎉
