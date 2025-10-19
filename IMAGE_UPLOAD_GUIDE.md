# Contractor Image Upload Guide

This guide explains how to manage contractor images in the NCA project using both local storage (for manual additions) and Cloudinary (for user uploads).

## Overview

The project uses a **hybrid approach** for image management:

1. **Public Folder** - For manually added contractors (admin-managed)
2. **Cloudinary** - For user-uploaded images via the signup form (automatic)

## Setup Instructions

### 1. Cloudinary Setup (Required for User Uploads)

#### Create a Cloudinary Account
1. Go to [Cloudinary](https://cloudinary.com/users/register_free)
2. Sign up for a free account
3. Once logged in, go to the Dashboard

#### Get Your Credentials
On the Cloudinary Dashboard, you'll see:
- **Cloud Name** (e.g., `dxyz123abc`)
- **API Key** (e.g., `123456789012345`)
- **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123`)

#### Add to Environment Variables

**For Local Development:**
Add to your `.env` file (at the project root):
```env
CLOUDINARY_CLOUD_NAME="your_cloud_name_here"
CLOUDINARY_API_KEY="your_api_key_here"
CLOUDINARY_API_SECRET="your_api_secret_here"
```

**For Netlify Deployment:**
1. Go to your Netlify dashboard
2. Navigate to: **Site settings → Build & deploy → Environment variables**
3. Add the three environment variables:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

### 2. Local Image Storage (For Manual Additions)

#### Directory Structure
```
apps/web/public/contractors/
├── logos/          # Company logos (square, 400-800px)
├── images/         # Profile/cover images (16:9, 1200x675px)
└── README.md       # Guidelines
```

#### Adding Images Manually

1. **Prepare Your Images:**
   - **Logos**: PNG with transparent background, 400x400px to 800x800px, max 500KB
   - **Profile Images**: JPG or PNG, 1200x675px (16:9 ratio), max 1MB

2. **Name Your Files:**
   - Use the company slug (lowercase, hyphens): `acme-roofing.png`
   - Example: `acme-roofing-logo.png`, `acme-roofing-cover.jpg`

3. **Place Files in Public Directory:**
   ```bash
   # Copy logo
   cp /path/to/logo.png apps/web/public/contractors/logos/acme-roofing.png

   # Copy profile image
   cp /path/to/image.jpg apps/web/public/contractors/images/acme-roofing.jpg
   ```

4. **Reference in Database:**
   When creating a contractor record manually, use these URL patterns:
   ```javascript
   {
     logoUrl: '/contractors/logos/acme-roofing.png',
     imageUrl: '/contractors/images/acme-roofing.jpg'
   }
   ```

## How It Works

### User Signup Flow (Automatic - via Cloudinary)

1. User visits `/signup` and fills out the contractor form
2. User uploads logo and/or profile image
3. Form JavaScript uploads images to Cloudinary via `/api/upload-image`
4. Cloudinary returns secure URLs (e.g., `https://res.cloudinary.com/...`)
5. These URLs are saved to the database with the contractor record
6. Images are immediately available via Cloudinary's CDN

**Benefits:**
- ✅ Real-time uploads
- ✅ No rebuild required
- ✅ Automatic image optimization
- ✅ CDN delivery (fast worldwide)
- ✅ Responsive image transformations

### Manual Addition Flow (Admin - via Public Folder)

1. Admin prepares images (logos/covers)
2. Admin places images in `public/contractors/` directory
3. Admin creates contractor record with local URLs
4. Site is rebuilt/redeployed
5. Images are served as static assets

**Benefits:**
- ✅ Full control over image quality
- ✅ No external dependencies
- ✅ Committed to Git (version control)
- ✅ No usage limits or quotas

## Image URL Patterns

### Cloudinary URLs (User Uploads)
```
https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/nca-contractors/logos/logo-company-slug-1234567890.jpg
https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/nca-contractors/images/image-company-slug-1234567890.jpg
```

### Public Folder URLs (Manual)
```
/contractors/logos/company-slug.png
/contractors/images/company-slug.jpg
```

## Cloudinary Free Tier Limits

- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25 credits/month
- **Cloud Names**: 1 account
- **Projects**: Unlimited (use folders to organize)

**Can be used for multiple websites!** Just organize with folders:
```
nca-contractors/          # This project
another-project/          # Another website
third-project/           # Yet another site
```

## Database Schema

The `contractors` table supports both image types:

```typescript
{
  imageUrl: text('image_url'),  // Profile/cover image
  logoUrl: text('logo_url'),    // Company logo
}
```

Both fields accept either Cloudinary URLs or public folder paths.

## Testing Locally

1. **Set up Cloudinary credentials** in `.env`
2. **Start dev server**: `pnpm dev`
3. **Visit signup page**: `http://localhost:4321/signup`
4. **Fill out form and upload images**
5. **Check console** for upload progress
6. **Verify** contractor appears in `/directory` with images

## Troubleshooting

### Images Not Uploading
- ✅ Check Cloudinary credentials in `.env`
- ✅ Ensure file size is under 5MB
- ✅ Check file type (JPEG, PNG, WebP only)
- ✅ Check browser console for errors

### Manual Images Not Showing
- ✅ Ensure files are in correct directory
- ✅ Check file path spelling/case sensitivity
- ✅ Rebuild the project: `pnpm build`
- ✅ Clear browser cache

### Cloudinary Quota Exceeded
- ✅ Check usage at: https://cloudinary.com/console/usage
- ✅ Delete old/unused images from Cloudinary dashboard
- ✅ Consider upgrading plan if needed

## API Endpoints

### Upload Image
**POST** `/api/upload-image`

**Body (multipart/form-data):**
```
file: File (required)
type: 'logo' | 'image' (required)
contractorSlug: string (optional)
```

**Response:**
```json
{
  "success": true,
  "url": "https://res.cloudinary.com/...",
  "publicId": "nca-contractors/logos/...",
  "width": 800,
  "height": 800
}
```

## Best Practices

1. **Optimize images before uploading** - Even though Cloudinary optimizes, smaller uploads = faster
2. **Use descriptive slugs** - Makes URLs readable and organized
3. **Monitor Cloudinary usage** - Stay within free tier limits
4. **Use public folder sparingly** - Only for special/featured contractors
5. **Backup Cloudinary images** - Download periodically for safety

## Migration Path

If you want to move all manual images to Cloudinary later:

1. Upload existing public images to Cloudinary
2. Update database records with new Cloudinary URLs
3. Remove old files from public folder
4. Rebuild and deploy

This keeps your Git repo lighter and leverages Cloudinary's CDN!

## Questions?

Refer to:
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Astro Static Assets](https://docs.astro.build/en/guides/images/)
- Project CLAUDE.md for deployment info
