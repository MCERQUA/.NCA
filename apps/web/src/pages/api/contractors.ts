import type { APIRoute } from 'astro';
import { db } from '../../db';
import { contractors } from '../../db/schema';

// This must be a serverless function, not prerendered
export const prerender = false;

// Google Maps Geocoding API
const GOOGLE_MAPS_API_KEY = import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY;

async function geocodeAddress(address: string, city: string, state: string, zipCode?: string): Promise<{ lat: number; lng: number } | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API key not configured, skipping geocoding');
    return null;
  }

  try {
    const fullAddress = `${address ? address + ', ' : ''}${city}, ${state}${zipCode ? ' ' + zipCode : ''}`;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results[0]) {
      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    }

    console.warn('Geocoding failed:', data.status);
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    // Extract form fields
    const name = formData.get('name') as string;
    const businessName = formData.get('businessName') as string || null;
    const category = formData.get('category') as string;
    const specialtiesRaw = formData.get('specialties') as string;
    const specialties = specialtiesRaw ? specialtiesRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
    const description = formData.get('description') as string;
    const address = formData.get('address') as string || null;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const zipCode = formData.get('zipCode') as string || null;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const website = formData.get('website') as string || null;
    const licenseNumber = formData.get('licenseNumber') as string || null;
    const yearsInBusinessRaw = formData.get('yearsInBusiness') as string;
    const yearsInBusiness = yearsInBusinessRaw ? parseInt(yearsInBusinessRaw) : null;
    const employeeCountRaw = formData.get('employeeCount') as string;
    const employeeCount = employeeCountRaw ? parseInt(employeeCountRaw) : null;
    const logoUrl = formData.get('logoUrl') as string || null;
    const imageUrl = formData.get('imageUrl') as string || null;

    // Validate required fields
    if (!name || !category || !description || !city || !state || !phone || !email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: name, category, description, city, state, phone, email'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Geocode address to get coordinates
    let latitude: string | null = null;
    let longitude: string | null = null;

    const coords = await geocodeAddress(address || '', city, state, zipCode || undefined);
    if (coords) {
      latitude = coords.lat.toString();
      longitude = coords.lng.toString();
    }

    // Insert contractor into database
    const [newContractor] = await db.insert(contractors).values({
      name,
      businessName,
      category,
      specialties,
      description,
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      website,
      licenseNumber,
      yearsInBusiness,
      employeeCount,
      logoUrl,
      imageUrl,
      latitude,
      longitude,
      status: 'pending', // Pending approval
      verified: false,
      rating: '0',
      reviewCount: 0,
    }).returning();

    console.log('Contractor created:', newContractor.id, businessName || name);

    return new Response(
      JSON.stringify({
        success: true,
        contractor: {
          id: newContractor.id,
          name: newContractor.businessName || newContractor.name,
        }
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error creating contractor:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create contractor profile'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
