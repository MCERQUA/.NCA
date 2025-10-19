# Contractor Images

This directory contains manually uploaded contractor logos and images for admin-managed listings.

## Directory Structure

- `logos/` - Company logos (recommended: square format, min 400x400px)
- `images/` - Profile/cover images (recommended: 16:9 format, min 1200x675px)

## Usage

Place images here for manually added contractors, then reference them in the database:

```javascript
imageUrl: '/contractors/images/company-name.jpg'
logoUrl: '/contractors/logos/company-logo.png'
```

## Image Guidelines

### Logos
- Format: PNG with transparent background preferred
- Size: 400x400px to 800x800px
- Max file size: 500KB
- Naming: `company-slug.png` (e.g., `acme-insulation.png`)

### Profile Images
- Format: JPG or PNG
- Size: 1200x675px (16:9 ratio)
- Max file size: 1MB
- Naming: `company-slug-cover.jpg` (e.g., `acme-insulation-cover.jpg`)

## User-Uploaded Images

User uploads from the signup form are automatically handled by Cloudinary and stored in the cloud.
These manual uploads are only for admin-managed contractor listings.
