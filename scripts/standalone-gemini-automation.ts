#!/usr/bin/env node
/**
 * STANDALONE AUTONOMOUS AUTOMATION
 *
 * This script runs completely independently:
 * - No Claude Code session needed
 * - Uses Gemini API directly via HTTP
 * - Can run in cron without any terminal
 * - Fully automated research → import → deploy loop
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
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!connectionString) throw new Error('DATABASE_URL not found');
if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not found in .env');

const client = postgres(connectionString);
const db = drizzle(client, { schema: { contractors } });

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'standalone-automation.log');

fs.mkdirSync(LOG_DIR, { recursive: true });

function log(message: string) {
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Toronto' });
  const logMessage = `[${timestamp} EST] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

/**
 * Call Gemini API directly (no MCP, no Claude Code needed)
 */
async function callGeminiDirect(prompt: string): Promise<any[]> {
  log('🔍 Calling Gemini API directly...');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await axios.post(url, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 8192,
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 120000 // 2 minutes
    });

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid Gemini API response structure');
    }

    const responseText = response.data.candidates[0].content.parts[0].text;
    log('✅ Gemini response received');

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = responseText;

    // Remove markdown code blocks if present
    if (jsonText.includes('```json')) {
      jsonText = jsonText.split('```json')[1].split('```')[0].trim();
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.split('```')[1].split('```')[0].trim();
    }

    // Parse JSON
    const results = JSON.parse(jsonText);

    if (!Array.isArray(results)) {
      throw new Error('Gemini response is not an array');
    }

    log(`✅ Parsed ${results.length} contractor results`);
    return results;

  } catch (error: any) {
    log(`❌ Gemini API error: ${error.message}`);
    if (error.response) {
      log(`   Status: ${error.response.status}`);
      log(`   Data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

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
    log(`❌ Geocoding error: ${error}`);
    return null;
  }
}

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

async function updateContractor(result: any): Promise<boolean> {
  try {
    const existing = await findContractorByName(result.name);
    if (!existing) {
      log(`⚠️  No match: ${result.name}`);
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

    if (result.address && result.city && result.state && result.zipCode) {
      const coords = await geocodeAddress(result.address, result.city, result.state, result.zipCode);
      if (coords) {
        updates.latitude = coords.lat.toString();
        updates.longitude = coords.lng.toString();
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    await db.update(contractors).set({ ...updates, updatedAt: new Date() }).where(eq(contractors.id, existing.id));
    log(`✅ Updated: ${result.name}`);
    return true;
  } catch (error) {
    log(`❌ Error updating ${result.name}: ${error}`);
    return false;
  }
}

async function deployToNetlify(contractorsUpdated: number, batchNum: number): Promise<void> {
  try {
    log('\n🚀 Deploying to Netlify...');

    const indexPath = path.join(process.cwd(), 'apps/web/src/pages/index.astro');
    let indexContent = fs.readFileSync(indexPath, 'utf-8');

    const timestamp = new Date().toISOString();
    const newComment = `// Auto-batch-${batchNum}: ${contractorsUpdated} contractors - ${timestamp}`;

    indexContent = indexContent.replace(/^(---\n)/, `$1${newComment}\n`);
    fs.writeFileSync(indexPath, indexContent);

    await execAsync('git add apps/web/src/pages/index.astro');

    const commitMessage = `Auto-batch ${batchNum}: ${contractorsUpdated} contractors researched

🤖 Standalone automation (no Claude Code session)
- Researched with Gemini API direct
- Geocoded addresses
- Deployed autonomously

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

    await execAsync(`git commit -m "${commitMessage.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`);
    await execAsync('git push origin main');

    log('✅ Pushed to GitHub - Netlify deploying...');
  } catch (error: any) {
    log(`❌ Deployment error: ${error.message}`);
    throw error;
  }
}

async function main() {
  const startTime = Date.now();

  log('\n========================================');
  log('🤖 STANDALONE AUTONOMOUS AUTOMATION');
  log('========================================\n');

  const unknownContractors = await db
    .select()
    .from(contractors)
    .where(or(eq(contractors.city, 'Unknown'), eq(contractors.state, 'Unknown')))
    .limit(20);

  if (unknownContractors.length === 0) {
    log('✅ All contractors researched!');
    log('🎉 AUTOMATION COMPLETE!\n');
    await client.end();
    return;
  }

  log(`📊 Found ${unknownContractors.length} contractors to research`);

  // Determine batch number
  const batchesDir = path.join(process.cwd(), 'temp/research-batches');
  fs.mkdirSync(batchesDir, { recursive: true });

  const existingBatches = fs.readdirSync(batchesDir)
    .filter(f => f.match(/^batch-\d+-results\.json$/))
    .map(f => parseInt(f.match(/batch-(\d+)-results/)?.[1] || '0'))
    .sort((a, b) => b - a);

  const batchNum = (existingBatches[0] || 0) + 1;

  const contractorList = unknownContractors.map((c, idx) =>
    `${idx + 1}. ${c.businessName || c.name}${c.category ? ` (${c.category})` : ''}`
  ).join('\n');

  const prompt = `Find complete NAP (Name, Address, Phone) contact information for these contractors:

${contractorList}

For each contractor, search the web and provide:
- Phone number (format: +1 XXX-XXX-XXXX)
- Email address
- Website URL
- Complete physical address (street, city, state, ZIP code)
- Brief business description (1-2 sentences)
- Years in business (if available)
- License number (if publicly available)

Return ONLY a valid JSON array (no markdown, no explanations):
[{"name":"Exact Company Name","phone":"+1 555-555-5555","email":"email@example.com","website":"https://example.com","address":"123 Main St","city":"City","state":"ST","zipCode":"12345","description":"Brief description","yearsInBusiness":10,"licenseNumber":"ABC123","found":true}]

For contractors where you cannot find information, use "found": false.`;

  try {
    const results = await callGeminiDirect(prompt);

    // Save results
    const resultsFile = path.join(batchesDir, `batch-${batchNum}-results.json`);
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    log(`💾 Saved results to: ${resultsFile}`);

    log(`\n📥 Importing ${results.length} research results...\n`);

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

    log(`\n📊 Batch #${batchNum} Summary:`);
    log(`   ✅ Successfully updated: ${successCount}`);
    log(`   ❌ Failed/Skipped: ${failCount}`);

    if (successCount > 0) {
      await deployToNetlify(successCount, batchNum);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`\n⏱️  Total time: ${duration}s`);
    log('========================================\n');

  } catch (error: any) {
    log(`\n❌ FATAL ERROR: ${error.message}`);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch(error => {
  log(`\n❌ Script failed: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
