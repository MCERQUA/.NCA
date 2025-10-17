import type { APIRoute } from 'astro';
import { db, contractors } from '../../db';
import { geocodeAddress } from '../../lib/geocoding';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    // Extract form data
    const name = formData.get('name')?.toString();
    const businessName = formData.get('businessName')?.toString();
    const category = formData.get('category')?.toString();
    const description = formData.get('description')?.toString();
    const address = formData.get('address')?.toString();
    const city = formData.get('city')?.toString();
    const state = formData.get('state')?.toString();
    const zipCode = formData.get('zipCode')?.toString();
    const phone = formData.get('phone')?.toString();
    const email = formData.get('email')?.toString();
    const website = formData.get('website')?.toString();
    const licenseNumber = formData.get('licenseNumber')?.toString();
    const yearsInBusiness = formData.get('yearsInBusiness')?.toString();
    const employeeCount = formData.get('employeeCount')?.toString();
    const specialties = formData.get('specialties')?.toString();

    // Validate required fields
    if (!name || !category || !description || !city || !state || !phone || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Geocode the address
    const apiKey = import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY;
    const coordinates = await geocodeAddress(
      address || '',
      city,
      state,
      zipCode,
      apiKey
    );

    // Parse specialties
    const specialtiesArray = specialties
      ? specialties.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    // Insert into database
    const result = await db.insert(contractors).values({
      name,
      businessName: businessName || name,
      category,
      description,
      address: address || null,
      city,
      state,
      zipCode: zipCode || null,
      latitude: coordinates?.lat.toString() || null,
      longitude: coordinates?.lng.toString() || null,
      phone,
      email,
      website: website || null,
      licenseNumber: licenseNumber || null,
      yearsInBusiness: yearsInBusiness ? parseInt(yearsInBusiness) : null,
      employeeCount: employeeCount ? parseInt(employeeCount) : null,
      specialties: specialtiesArray,
      status: 'active', // Auto-approve for now
      verified: false,
      featured: false,
      rating: '0',
      reviewCount: 0,
    }).returning();

    return new Response(
      JSON.stringify({
        success: true,
        contractor: result[0],
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating contractor:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create contractor profile' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const GET: APIRoute = async () => {
  try {
    const results = await db
      .select()
      .from(contractors)
      .where(eq(contractors.status, 'active'));

    return new Response(
      JSON.stringify({ contractors: results }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching contractors:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch contractors' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
