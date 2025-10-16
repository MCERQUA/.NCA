# Deployment Checklist

Use this checklist to ensure your NCA website is ready for production deployment.

## Pre-Deployment Checklist

### Code Quality
- [ ] All pages load without errors in dev mode
- [ ] Build completes successfully (`pnpm build`)
- [ ] No TypeScript errors (warnings are okay)
- [ ] Forms work correctly in local testing
- [ ] All links navigate properly

### Forms Ready
- [x] Contact form (`/contact`) with Netlify attributes
- [x] Contractor signup form (`/join`) with Netlify attributes
- [x] Thank you pages created (`/thank-you`, `/signup-thank-you`)
- [x] Hidden forms file (`/public/forms.html`) for Netlify detection
- [x] Honeypot fields added for spam protection
- [x] Form validation working

### Configuration Files
- [x] `netlify.toml` configured with build settings
- [x] `.gitignore` includes sensitive files
- [x] `.env.example` documented
- [x] `astro.config.mjs` has site URL
- [x] `package.json` has correct scripts

### Content
- [x] Home page complete with sections
- [x] Contact page with working form
- [x] Join page with membership plans and signup form
- [ ] About page (optional - create if needed)
- [ ] Logo and images optimized

## GitHub Setup

- [ ] Git repository initialized
- [ ] `.gitignore` file in place
- [ ] All files committed
- [ ] GitHub repository created
- [ ] Local repo connected to GitHub remote
- [ ] Code pushed to `main` branch
- [ ] Repository visibility set (Private/Public)

## Netlify Deployment

- [ ] Netlify account created
- [ ] Site connected to GitHub repository
- [ ] Build settings auto-detected from `netlify.toml`
- [ ] First deployment successful
- [ ] Site URL noted

### Netlify Forms Configuration
- [ ] Forms visible in Netlify dashboard
- [ ] Email notifications configured
- [ ] Spam filtering enabled
- [ ] Test submission on contact form successful
- [ ] Test submission on signup form successful

### Environment Variables (in Netlify)
- [ ] `PUBLIC_SITE_URL` set to deployed URL
- [ ] Any additional API keys added (if applicable)

## Post-Deployment Testing

### Functionality Tests
- [ ] Home page loads correctly
- [ ] All navigation links work
- [ ] Contact form submits successfully
- [ ] Contact form redirects to thank you page
- [ ] Contact form submission appears in Netlify dashboard
- [ ] Signup form submits successfully
- [ ] Signup form redirects to thank you page
- [ ] Signup form submission appears in Netlify dashboard
- [ ] Mobile responsive design works
- [ ] Images load properly

### Performance Tests
- [ ] Run Lighthouse audit (aim for 90+ performance)
- [ ] Check Core Web Vitals
- [ ] Test page load speed
- [ ] Verify images are optimized
- [ ] Check font loading

### SEO Tests
- [ ] Page titles are correct
- [ ] Meta descriptions present
- [ ] Open Graph tags working
- [ ] Canonical URLs set
- [ ] Sitemap accessible (if implemented)
- [ ] robots.txt accessible

### Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browsers

## Optional Enhancements

- [ ] Custom domain configured
- [ ] SSL/HTTPS enabled (automatic with Netlify)
- [ ] Analytics installed (GA4, Plausible)
- [ ] Error monitoring (Sentry)
- [ ] Form notification emails set up
- [ ] Branch deploy previews configured
- [ ] Deploy hooks configured

## Documentation

- [ ] README.md updated with deployment info
- [ ] DEPLOYMENT.md guide reviewed
- [ ] Team members have access to:
  - GitHub repository
  - Netlify dashboard
  - Form submissions
  - Environment variables

## Security

- [ ] No API keys in code
- [ ] Environment variables properly set
- [ ] Forms have spam protection
- [ ] HTTPS enabled
- [ ] Security headers configured (in netlify.toml)

## Maintenance Plan

- [ ] Form submission monitoring plan
- [ ] Backup strategy for form data
- [ ] Update schedule defined
- [ ] Bug reporting process established

---

## Quick Deployment Commands

```bash
# Check build locally
pnpm build

# Initialize git
git init
git add .
git commit -m "Initial deployment"

# Add GitHub remote (replace URL)
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main

# Deploy to Netlify
netlify login
netlify deploy --prod
```

## Common Issues & Solutions

### Forms Not Showing in Netlify
- Ensure `data-netlify="true"` is on form element
- Check `/public/forms.html` exists
- Trigger new deploy after fixing

### Build Fails
- Check Node version (18+)
- Verify all dependencies installed
- Check build logs for specific errors

### Form Submissions Not Received
- Check spam folder
- Verify notification email in Netlify
- Check form name matches exactly

### Slow Performance
- Optimize images
- Check bundle size
- Enable Netlify asset optimization

---

## Support Resources

- **Netlify Support**: https://answers.netlify.com
- **Netlify Forms Docs**: https://docs.netlify.com/forms/setup/
- **Astro Discord**: https://astro.build/chat

**Status**: Ready for Deployment ✅

Last Updated: 2025-10-16
