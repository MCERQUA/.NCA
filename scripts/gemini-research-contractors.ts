/**
 * Use Gemini to research contractor NAP information
 * This script processes contractors in batches and uses Gemini's web search capabilities
 */

import * as fs from 'fs';
import * as path from 'path';

interface ContractorResearchTask {
  name: string;
  legalName?: string;
  dbaName?: string;
  specialty?: string;
  searchQuery: string;
}

interface ContractorData {
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
}

/**
 * Parse the CSV to create research tasks
 */
function parseCSV(): ContractorResearchTask[] {
  const csvPath = '/home/mikecerqua/projects-extra-drive/isolated-projects/NCA/temp/companies_directory_data-2025.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');

  const tasks: ContractorResearchTask[] = [];

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parsing (handles quoted fields)
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    fields.push(currentField.trim());

    // CSV columns: company_name,legal_name,dba_name,phone,email,website,address,city,state,zip,business_hours,description,services,specialty,...
    const companyName = fields[0];
    const legalName = fields[1];
    const dbaName = fields[2];
    const specialty = fields[13]; // specialty column

    if (companyName) {
      tasks.push({
        name: companyName,
        legalName: legalName || companyName,
        dbaName: dbaName || undefined,
        specialty: specialty || undefined,
        searchQuery: `"${companyName}" contractor contact information phone address website`
      });
    }
  }

  return tasks;
}

/**
 * Create a prompt for Gemini to research a batch of contractors
 */
function createBatchResearchPrompt(contractors: ContractorResearchTask[]): string {
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
${contractors.map((c, idx) => `${idx + 1}. ${c.name}${c.specialty ? ` (${c.specialty})` : ''}`).join('\n')}

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
  console.log('📋 Parsing CSV to create research tasks...');
  const allTasks = parseCSV();
  console.log(`Found ${allTasks.length} contractors to research\n`);

  // Create output directory
  const outputDir = '/mnt/HC_Volume_103321268/isolated-projects/NCA/temp/research-batches';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Split into batches of 10 for efficient processing
  const batchSize = 10;
  const batches: ContractorResearchTask[][] = [];

  for (let i = 0; i < allTasks.length; i += batchSize) {
    batches.push(allTasks.slice(i, i + batchSize));
  }

  console.log(`Created ${batches.length} batches of up to ${batchSize} contractors each\n`);

  // Save batch prompts for manual or API processing
  batches.forEach((batch, idx) => {
    const prompt = createBatchResearchPrompt(batch);
    const promptPath = path.join(outputDir, `batch-${idx + 1}-prompt.txt`);
    fs.writeFileSync(promptPath, prompt);

    // Also save the contractor list for this batch
    const contractorListPath = path.join(outputDir, `batch-${idx + 1}-contractors.json`);
    fs.writeFileSync(contractorListPath, JSON.stringify(batch, null, 2));
  });

  console.log(`✅ Created ${batches.length} research batch files in: ${outputDir}`);
  console.log('\nNext steps:');
  console.log('1. Use Gemini MCP tool to process each batch');
  console.log('2. Save results to temp/research-results/ directory');
  console.log('3. Run update script to import into database');

  // Create a master index file
  const indexPath = path.join(outputDir, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify({
    totalContractors: allTasks.length,
    totalBatches: batches.length,
    batchSize: batchSize,
    createdAt: new Date().toISOString(),
    batches: batches.map((b, idx) => ({
      batchNumber: idx + 1,
      contractorCount: b.length,
      promptFile: `batch-${idx + 1}-prompt.txt`,
      contractorsFile: `batch-${idx + 1}-contractors.json`,
      resultsFile: `batch-${idx + 1}-results.json`
    }))
  }, null, 2));

  console.log(`\n📊 Index file created: ${indexPath}`);
}

main();
