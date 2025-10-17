import type { APIRoute } from 'astro';
import { db, contractors } from '../../db';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    const name = formData.get('name') as string;
    const businessName = formData.get('businessName') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const zipCode = formData.get('zipCode') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const website = formData.get('website') as string;
    const specialtiesStr = formData.get('specialties') as string;
    const licenseNumber = formData.get('licenseNumber') as string;
    const yearsInBusiness = formData.get('yearsInBusiness') as string;
    const employeeCount = formData.get('employeeCount') as string;

    // Parse specialties
    const specialties = specialtiesStr
      ? specialtiesStr.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
      : [];

    // Geocode address using Google Maps API
    let latitude: string | null = null;
    let longitude: string | null = null;

    if (address && city && state) {
      try {
        const fullAddress = `${address}, ${city}, ${state} ${zipCode || ''}`.trim();
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY}`;

        const geocodeResponse = await fetch(geocodeUrl);
        const geocodeData = await geocodeResponse.json();

        if (geocodeData.results && geocodeData.results.length > 0) {
          latitude = geocodeData.results[0].geometry.location.lat.toString();
          longitude = geocodeData.results[0].geometry.location.lng.toString();
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      }
    }

    // Insert contractor with PENDING status
    const [newContractor] = await db
      .insert(contractors)
      .values({
        name,
        businessName: businessName || null,
        category,
        description,
        address: address || null,
        city,
        state,
        zipCode: zipCode || null,
        latitude,
        longitude,
        phone: phone || null,
        email: email || null,
        website: website || null,
        specialties,
        licenseNumber: licenseNumber || null,
        yearsInBusiness: yearsInBusiness ? parseInt(yearsInBusiness) : null,
        employeeCount: employeeCount ? parseInt(employeeCount) : null,
        status: 'pending', // Important: set to pending for admin approval
        verified: false,
        rating: '0',
        reviewCount: 0,
      })
      .returning();

    return new Response(JSON.stringify({ success: true, contractor: newContractor }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating contractor:', error);
    return new Response(JSON.stringify({ error: 'Failed to create contractor profile' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
