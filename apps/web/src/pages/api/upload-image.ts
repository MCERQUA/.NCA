import type { APIRoute } from 'astro';
import { uploadContractorLogo, uploadContractorImage } from '../../lib/cloudinary';

export const prerender = false; // This route needs to be server-rendered

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type');

    if (!contentType || !contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({ error: 'Content-Type must be multipart/form-data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'logo' or 'image'
    const contractorSlug = formData.get('contractorSlug') as string;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!type || !['logo', 'image'].includes(type)) {
      return new Response(
        JSON.stringify({ error: 'Type must be either "logo" or "image"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'File size exceeds 5MB limit' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate a slug if not provided
    const slug = contractorSlug || `contractor-${Date.now()}`;

    // Upload to Cloudinary
    let result;
    if (type === 'logo') {
      result = await uploadContractorLogo(buffer, slug);
    } else {
      result = await uploadContractorImage(buffer, slug);
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: result.secureUrl,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
