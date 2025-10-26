/**
 * Create a research batch from contractors with Unknown addresses
 * Pulls next 20 contractors from database and generates Gemini research prompt
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { contractors } from '../apps/web/src/db/schema';
import * as dotenv from 'dotenv';
import { eq, or } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: './apps/web/.env' });

const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL not found');
}

const client = postgres(connectionString);
const db = drizzle(client, { schema: { contractors } });

interface ContractorResearchTask {
  name: string;
  category?: string;
  searchQuery: string;
}

/**
 * Create a Gemini research prompt for a batch
 */
function createBatchPrompt(contractors: ContractorResearchTask[]): string {
  return `You are a business research assistant. I need you to find accurate NAP (Name, Address, Phone) contact information for the following contractors.

For each contractor, search for:
- Business name (legal name and DBA if applicable)
- Phone number (formatted as +1 XXX-XXX-XXXX)
- Email address
- Website URL
- Complete physical address (street, city, state, ZIP)
- Brief business description (1-2 sentences)
- Years in business (if available)
- License number (if publicly available)

Contractors to research:
${contractors.map((c, idx) => `${idx + 1}. ${c.name}${c.category ? ` (${c.category})` : ''}`).join('\n')}

IMPORTANT:
- Use web search to find verified, current information
- Prioritize official websites, Google Business profiles, and government registrations
- If information is not found, mark it as "Not Found"
- Return results in JSON format

Return the data in this exact JSON structure:
\`\`\`json
[
  {
    "name": "Company Name",
    "phone": "+1 555-555-5555",
    "email": "contact@example.com",
    "website": "https://example.com",
    "address": "123 Main St",
    "city": "City Name",
    "state": "ST",
    "zipCode": "12345",
    "description": "Brief description",
    "yearsInBusiness": 10,
    "licenseNumber": "12345",
    "found": true
  }
]
\`\`\`

For contractors where you cannot find information, still include them with "found": false.`;
}

async function main() {
  console.log('🔍 Fetching contractors with Unknown addresses...\n');

  // Get contractors with Unknown city or state
  const unknownContractors = await db
    .select()
    .from(contractors)
    .where(
      or(
        eq(contractors.city, 'Unknown'),
        eq(contractors.state, 'Unknown')
      )
    )
    .limit(20);  // Next 20 contractors

  if (unknownContractors.length === 0) {
    console.log('✅ No contractors with Unknown addresses found!');
    await client.end();
    return;
  }

  console.log(`Found ${unknownContractors.length} contractors to research\n`);

  // Convert to research tasks
  const tasks: ContractorResearchTask[] = unknownContractors.map(c => ({
    name: c.businessName || c.name,
    category: c.category,
    searchQuery: `"${c.businessName || c.name}" contractor contact information phone address website`
  }));

  // Create output directory
  const outputDir = path.join(process.cwd(), 'temp/research-batches');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Determine next batch number
  const existingBatches = fs.readdirSync(outputDir)
    .filter(f => f.match(/^batch-\d+-prompt\.txt$/))
    .map(f => parseInt(f.match(/batch-(\d+)-prompt/)?.[1] || '0'))
    .sort((a, b) => b - a);

  const nextBatchNum = (existingBatches[0] || 0) + 1;

  // Save prompt
  const prompt = createBatchPrompt(tasks);
  const promptPath = path.join(outputDir, `batch-${nextBatchNum}-prompt.txt`);
  fs.writeFileSync(promptPath, prompt);

  // Save contractor list
  const contractorListPath = path.join(outputDir, `batch-${nextBatchNum}-contractors.json`);
  fs.writeFileSync(contractorListPath, JSON.stringify(tasks, null, 2));

  console.log(`✅ Created batch #${nextBatchNum}:`);
  console.log(`   Prompt: ${promptPath}`);
  console.log(`   Contractors: ${contractorListPath}`);
  console.log(`\nNext steps:`);
  console.log(`1. Use Gemini MCP to process the prompt`);
  console.log(`2. Save results to: temp/research-batches/batch-${nextBatchNum}-results.json`);
  console.log(`3. Run: npx tsx scripts/import-research-results.ts`);

  await client.end();
}

main().catch(console.error);
