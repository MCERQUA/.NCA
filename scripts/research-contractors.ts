import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { contractors } from '../apps/web/src/db/schema';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { eq } from 'drizzle-orm';

dotenv.config({ path: './apps/web/.env' });

const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('NETLIFY_DATABASE_URL or DATABASE_URL not found');
}

const client = postgres(connectionString);
const db = drizzle(client, { schema: { contractors } });

interface ContractorInfo {
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
}

/**
 * Read the CSV to get the list of contractors to research
 */
function readContractorsFromCSV(): string[] {
  const csvPath = '/home/mikecerqua/projects-extra-drive/isolated-projects/NCA/temp/companies_directory_data-2025.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').slice(1); // Skip header

  const contractorNames: string[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;

    // Parse CSV line (simple parsing - handle quoted fields)
    const match = line.match(/^"?([^",]+)"?,/);
    if (match && match[1]) {
      contractorNames.push(match[1].trim());
    }
  }

  return contractorNames;
}

/**
 * Save research results to a JSON file for review and batch processing
 */
async function saveResearchResults(results: any[]) {
  const outputPath = '/mnt/HC_Volume_103321268/isolated-projects/NCA/temp/contractor-research-results.json';
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ Research results saved to: ${outputPath}`);
  console.log(`Found information for ${results.filter(r => r.found).length} out of ${results.length} contractors`);
}

async function main() {
  console.log('📋 Reading contractor names from CSV...');
  const contractorNames = readContractorsFromCSV();
  console.log(`Found ${contractorNames.length} contractors to research\n`);

  // For now, just prepare the list for batch research
  // We'll use Gemini API to research these in batches
  const researchTasks = contractorNames.map(name => ({
    name,
    searchQuery: `"${name}" contractor phone address website email`,
    found: false,
    data: null as ContractorInfo | null
  }));

  console.log('Sample contractors to research:');
  researchTasks.slice(0, 10).forEach(task => {
    console.log(`  - ${task.name}`);
  });

  console.log('\n📝 Next steps:');
  console.log('1. Use web search or Gemini to find contact information');
  console.log('2. Populate the contractor-research-results.json file');
  console.log('3. Run update script to import the data into database');

  await saveResearchResults(researchTasks);
  await client.end();
}

main();
