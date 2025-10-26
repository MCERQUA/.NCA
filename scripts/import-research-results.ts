import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { contractors } from '../apps/web/src/db/schema';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { eq, or } from 'drizzle-orm';
import axios from 'axios';

// Load environment variables from apps/web/.env
dotenv.config({ path: './apps/web/.env' });

const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('NETLIFY_DATABASE_URL or DATABASE_URL not found');
}

// Try both with and without PUBLIC_ prefix
const GOOGLE_MAPS_API_KEY = process.env.PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

if (GOOGLE_MAPS_API_KEY) {
  console.log('✅ Google Maps API key loaded - geocoding enabled');
} else {
  console.log('⚠️  Google Maps API key not found - geocoding disabled');
}

const client = postgres(connectionString);
const db = drizzle(client, { schema: { contractors } });

interface ResearchResult {
  name: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  description?: string;
  yearsInBusiness?: number;
  licenseNumber?: string;
  found: boolean;
}

/**
 * Geocode an address using Google Maps Geocoding API
 */
async function geocodeAddress(address: string, city: string, state: string, zipCode: string): Promise<{ lat: number; lng: number } | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('⚠️  Google Maps API key not configured - skipping geocoding');
    return null;
  }

  try {
    const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;
    const url = `https://maps.googleapis.com/maps/api/geocode/json`;
    const response = await axios.get(url, {
      params: {
        address: fullAddress,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng
      };
    } else {
      console.warn(`❌ Geocoding failed for ${fullAddress}: ${response.data.status}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Geocoding error for ${address}:`, error);
    return null;
  }
}

/**
 * Find contractor in database by name (fuzzy matching)
 */
async function findContractorByName(name: string): Promise<any | null> {
  // Try exact match first
  const exactMatch = await db
    .select()
    .from(contractors)
    .where(
      or(
        eq(contractors.name, name),
        eq(contractors.businessName, name)
      )
    )
    .limit(1);

  if (exactMatch.length > 0) {
    return exactMatch[0];
  }

  // Try partial match
  const allContractors = await db.select().from(contractors);
  const normalizedSearch = name.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const contractor of allContractors) {
    const normalizedName = (contractor.businessName || contractor.name).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedName.includes(normalizedSearch) || normalizedSearch.includes(normalizedName)) {
      return contractor;
    }
  }

  return null;
}

/**
 * Update contractor with research results
 */
async function updateContractor(result: ResearchResult): Promise<boolean> {
  try {
    const existing = await findContractorByName(result.name);

    if (!existing) {
      console.log(`⚠️  No existing contractor found for: ${result.name}`);
      return false;
    }

    const updates: any = {};

    if (result.phone) updates.phone = result.phone;
    if (result.email && result.email !== 'Not Found') updates.email = result.email;
    if (result.website) updates.website = result.website;
    if (result.address) updates.address = result.address;
    if (result.city) updates.city = result.city;
    if (result.state) updates.state = result.state;
    if (result.zipCode) updates.zipCode = result.zipCode;
    if (result.description) updates.description = result.description;
    if (result.yearsInBusiness) updates.yearsInBusiness = result.yearsInBusiness;
    if (result.licenseNumber && result.licenseNumber !== 'Not Found') {
      updates.licenseNumber = result.licenseNumber;
    }

    // Geocode if we have address
    if (result.address && result.city && result.state && result.zipCode) {
      const coords = await geocodeAddress(result.address, result.city, result.state, result.zipCode);
      if (coords) {
        updates.latitude = coords.lat.toString();
        updates.longitude = coords.lng.toString();
        console.log(`  ✅ Geocoded: ${coords.lat}, ${coords.lng}`);
      }
    }

    // Update the contractor
    await db
      .update(contractors)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contractors.id, existing.id));

    console.log(`✅ Updated: ${result.name}`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating ${result.name}:`, error);
    return false;
  }
}

/**
 * Load and process research results from JSON files
 */
async function importResults() {
  const batchesDir = '/mnt/HC_Volume_103321268/isolated-projects/NCA/temp/research-batches';
  const files = fs.readdirSync(batchesDir).filter(f => f.match(/batch-\d+-results\.json$/));

  console.log(`\n📦 Found ${files.length} result files to import\n`);

  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalFailed = 0;

  for (const file of files.sort()) {
    console.log(`\n📄 Processing ${file}...`);
    const filePath = path.join(batchesDir, file);
    const results: ResearchResult[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    for (const result of results) {
      totalProcessed++;

      if (!result.found) {
        console.log(`  ⏭️  Skipping ${result.name} (not found in research)`);
        totalFailed++;
        continue;
      }

      const updated = await updateContractor(result);
      if (updated) {
        totalUpdated++;
        // Small delay to avoid rate limiting on geocoding API
        await new Promise(resolve => setTimeout(resolve, 200));
      } else {
        totalFailed++;
      }
    }
  }

  console.log(`\n\n📊 Import Summary:`);
  console.log(`   Total processed: ${totalProcessed}`);
  console.log(`   Successfully updated: ${totalUpdated}`);
  console.log(`   Failed/Skipped: ${totalFailed}`);
  console.log(`   Success rate: ${((totalUpdated / totalProcessed) * 100).toFixed(1)}%`);

  await client.end();
}

importResults();
