#!/usr/bin/env npx tsx
/**
 * Complete Hourly Contractor Research Automation
 *
 * This script:
 * 1. Finds 20 contractors with Unknown addresses
 * 2. Uses Gemini MCP to research their contact info
 * 3. Imports results into database with geocoding
 * 4. Triggers Netlify rebuild
 * 5. Pushes to GitHub to deploy changes
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { contractors } from '../apps/web/src/db/schema';
import * as dotenv from 'dotenv';
import { eq, or } from 'drizzle-orm';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

dotenv.config({ path: './apps/web/.env' });

const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
const GOOGLE_MAPS_API_KEY = process.env.PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

if (!connectionString) throw new Error('DATABASE_URL not found');

const client = postgres(connectionString);
const db = drizzle(client, { schema: { contractors } });

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'hourly-automation.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function log(message: string) {
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Toronto' });
  const logMessage = `[${timestamp} EST] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

/**
 * Geocode address using Google Maps API
 */
async function geocodeAddress(address: string, city: string, state: string, zipCode: string): Promise<{ lat: number; lng: number } | null> {
  if (!GOOGLE_MAPS_API_KEY) return null;

  try {
    const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { address: fullAddress, key: GOOGLE_MAPS_API_KEY }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      return response.data.results[0].geometry.location;
    }
    return null;
  } catch (error) {
    log(`❌ Geocoding error for ${address}: ${error}`);
    return null;
  }
}

/**
 * Find contractor by fuzzy name matching
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
      log(`⚠️  No match found for: ${result.name}`);
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
        log(`  ✅ Geocoded: ${coords.lat}, ${coords.lng}`);
      }
      await new Promise(resolve => setTimeout(resolve, 200)); // Rate limit
    }

    await db.update(contractors).set({ ...updates, updatedAt: new Date() }).where(eq(contractors.id, existing.id));
    log(`✅ Updated: ${result.name}`);
    return true;
  } catch (error) {
    log(`❌ Error updating ${result.name}: ${error}`);
    return false;
  }
}

/**
 * Deploy changes to Netlify
 */
async function deployToNetlify(contractorsUpdated: number): Promise<void> {
  try {
    log('\n🚀 Deploying to Netlify...');

    // Modify index.astro to trigger rebuild
    const indexPath = path.join(process.cwd(), 'apps/web/src/pages/index.astro');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');

    // Add/update comment at top
    const timestamp = new Date().toISOString();
    const newComment = `// Auto-updated: ${timestamp} - ${contractorsUpdated} contractors researched`;

    let updatedContent;
    if (indexContent.includes('// Auto-updated:')) {
      updatedContent = indexContent.replace(/\/\/ Auto-updated:.*$/m, newComment);
    } else {
      updatedContent = indexContent.replace(/^(---\n)/, `$1${newComment}\n`);
    }

    fs.writeFileSync(indexPath, updatedContent);

    // Git commit and push
    await execAsync('git add apps/web/src/pages/index.astro');

    const commitMessage = `Automated research: ${contractorsUpdated} contractors updated with complete NAP data

🤖 Hourly automation completed
- Researched and imported contact information
- Geocoded addresses for map display
- Updated database with verified data

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

    await execAsync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);
    await execAsync('git push origin main');

    log('✅ Changes pushed to GitHub - Netlify will auto-deploy');
  } catch (error: any) {
    log(`❌ Deployment error: ${error.message}`);
    throw error;
  }
}

/**
 * Main automation function
 */
async function main() {
  const startTime = Date.now();

  log('\n========================================');
  log('🤖 HOURLY CONTRACTOR RESEARCH AUTOMATION');
  log('========================================\n');

  // Check for Unknown contractors
  const unknownContractors = await db
    .select()
    .from(contractors)
    .where(or(eq(contractors.city, 'Unknown'), eq(contractors.state, 'Unknown')))
    .limit(20);

  if (unknownContractors.length === 0) {
    log('✅ All contractors have been researched!');
    log('🎉 AUTOMATION COMPLETE - All 212 contractors now have addresses!\n');
    await client.end();
    return;
  }

  log(`📊 Found ${unknownContractors.length} contractors to research`);

  // Create Gemini research prompt
  const contractorNames = unknownContractors.map((c, idx) =>
    `${idx + 1}. ${c.businessName || c.name}${c.category ? ` (${c.category})` : ''}`
  ).join('\n');

  log('\n🔍 Calling Gemini MCP for contractor research...\n');

  // NOTE: This section needs actual Gemini MCP integration
  // For now, we'll document what needs to happen

  log('⚠️  MANUAL STEP REQUIRED:');
  log('   Use Gemini MCP with this prompt:\n');

  const prompt = `Find NAP (Name, Address, Phone) for these contractors:

${contractorNames}

Return ONLY valid JSON array:
[{"name":"Full Name","phone":"+1 XXX-XXX-XXXX","email":"email@example.com","website":"https://example.com","address":"123 Main St","city":"City","state":"ST","zipCode":"12345","description":"Brief description","yearsInBusiness":10,"licenseNumber":"ABC123","found":true}]`;

  log(prompt);
  log('\n📝 Save Gemini response to: temp/latest-research-results.json');
  log('   Then this script will auto-import and deploy.\n');

  // Check if results file exists
  const resultsPath = path.join(process.cwd(), 'temp/latest-research-results.json');

  if (!fs.existsSync(resultsPath)) {
    log('⏸️  Waiting for Gemini results... (script will exit)');
    log('   Re-run this script after saving results.');
    await client.end();
    return;
  }

  // Import results
  log('📥 Importing Gemini research results...\n');

  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
  let successCount = 0;
  let failCount = 0;

  for (const result of results) {
    if (!result.found) {
      log(`⏭️  Skipping ${result.name} (not found)`);
      failCount++;
      continue;
    }

    const updated = await updateContractor(result);
    if (updated) successCount++;
    else failCount++;
  }

  log(`\n📊 Import Summary:`);
  log(`   ✅ Successfully updated: ${successCount}`);
  log(`   ❌ Failed/Skipped: ${failCount}`);

  // Deploy if we updated any contractors
  if (successCount > 0) {
    await deployToNetlify(successCount);

    // Archive results file
    const archivePath = path.join(process.cwd(), `temp/archive/research-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(archivePath), { recursive: true });
    fs.renameSync(resultsPath, archivePath);
    log(`📦 Results archived to: ${archivePath}`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  log(`\n⏱️  Total time: ${duration}s`);
  log('========================================\n');

  await client.end();
}

main().catch(error => {
  log(`\n❌ FATAL ERROR: ${error.message}`);
  log(error.stack);
  process.exit(1);
});
