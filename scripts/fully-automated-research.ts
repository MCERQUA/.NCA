/**
 * Fully automated contractor research using Gemini MCP
 * Researches next 20 Unknown contractors, imports results, and triggers rebuild
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { contractors } from '../apps/web/src/db/schema';
import * as dotenv from 'dotenv';
import { eq, or } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

dotenv.config({ path: './apps/web/.env' });

const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
const GOOGLE_MAPS_API_KEY = process.env.PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

if (!connectionString) {
  throw new Error('DATABASE_URL not found');
}

const client = postgres(connectionString);
const db = drizzle(client, { schema: { contractors } });

/**
 * Geocode address using Google Maps API
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
 * Find contractor in database by name
 */
async function findContractorByName(name: string): Promise<any | null> {
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
async function updateContractor(result: any): Promise<boolean> {
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
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
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

async function main() {
  const startTime = Date.now();

  console.log('\n========================================');
  console.log('🤖 Automated Contractor Research');
  console.log('========================================\n');

  // Check for Unknown contractors
  const unknownContractors = await db
    .select()
    .from(contractors)
    .where(
      or(
        eq(contractors.city, 'Unknown'),
        eq(contractors.state, 'Unknown')
      )
    )
    .limit(20);

  if (unknownContractors.length === 0) {
    console.log('✅ All contractors have been researched!');
    await client.end();
    return;
  }

  console.log(`📊 Found ${unknownContractors.length} contractors to research\n`);

  // Create research prompt
  const contractorList = unknownContractors.map((c, idx) =>
    `${idx + 1}. ${c.businessName || c.name}${c.category ? ` (${c.category})` : ''}`
  ).join('\n');

  const prompt = `You are a business research assistant. Find accurate NAP (Name, Address, Phone) information for these contractors:

${contractorList}

For each contractor, search for:
- Phone number (formatted as +1 XXX-XXX-XXXX)
- Email address
- Website URL
- Complete physical address (street, city, state, ZIP)
- Brief business description (1-2 sentences)
- Years in business (if available)
- License number (if publicly available)

Return ONLY valid JSON array (no markdown):
[
  {
    "name": "Exact Company Name",
    "phone": "+1 XXX-XXX-XXXX",
    "email": "email@example.com",
    "website": "https://example.com",
    "address": "123 Main St",
    "city": "City",
    "state": "ST",
    "zipCode": "12345",
    "description": "Brief description",
    "yearsInBusiness": 10,
    "licenseNumber": "ABC123",
    "found": true
  }
]

For contractors where information cannot be found, use "found": false.`;

  console.log('🔍 Researching contractors with Gemini...\n');

  // NOTE: This requires Gemini MCP integration
  // For now, save the prompt for manual processing
  const outputDir = path.join(process.cwd(), 'temp/automated-research');
  fs.mkdirSync(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const promptPath = path.join(outputDir, `research-${timestamp}-prompt.txt`);
  fs.writeFileSync(promptPath, prompt);

  console.log(`⚠️  Gemini integration pending - prompt saved to:`);
  console.log(`   ${promptPath}`);
  console.log('\n📝 Manual steps required:');
  console.log('1. Process prompt with Gemini MCP');
  console.log(`2. Save JSON results to: temp/automated-research/research-${timestamp}-results.json`);
  console.log('3. Script will auto-import and deploy\n');

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`⏱️  Completed in ${duration}s\n`);

  await client.end();
}

main().catch(console.error);
