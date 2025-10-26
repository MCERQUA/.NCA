import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { contractors } from '../apps/web/src/db/schema';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: './apps/web/.env' });

const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('NETLIFY_DATABASE_URL or DATABASE_URL not found');
}

const client = postgres(connectionString);
const db = drizzle(client, { schema: { contractors } });

// Helper function to parse DBA from company name
function parseDBA(companyName: string): { businessName: string; dba?: string } {
  const dbaMatch = companyName.match(/^(.+?)\s+DBA:\s+(.+)$/i);
  if (dbaMatch) {
    return {
      businessName: dbaMatch[1].trim(),
      dba: dbaMatch[2].trim(),
    };
  }
  return { businessName: companyName };
}

// Helper function to determine category from company name
function determineCategory(companyName: string): string {
  const name = companyName.toLowerCase();

  if (name.includes('roofing') || name.includes('roof')) return 'Roofing';
  if (name.includes('insulation') || name.includes('foam') || name.includes('spray foam')) return 'Insulation';
  if (name.includes('plumbing')) return 'Plumbing';
  if (name.includes('construction') || name.includes('builders') || name.includes('building')) return 'General Contracting';
  if (name.includes('painting')) return 'Painting';
  if (name.includes('excavation') || name.includes('landscaping') || name.includes('landscape')) return 'Excavation & Grading';
  if (name.includes('siding')) return 'Siding';
  if (name.includes('masonry')) return 'Masonry';
  if (name.includes('electrical') || name.includes('electric')) return 'Electrical';
  if (name.includes('hvac') || name.includes('mechanical')) return 'HVAC';
  if (name.includes('concrete')) return 'Concrete';
  if (name.includes('carpentry')) return 'Carpentry';
  if (name.includes('gutter')) return 'Gutters';
  if (name.includes('solar')) return 'Solar';

  // Default to General Contracting
  return 'General Contracting';
}

// Helper function to extract state from company name if available
function extractLocation(companyName: string): { city?: string; state?: string } {
  // Look for state abbreviations in company name
  const stateMatch = companyName.match(/\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/);

  if (stateMatch) {
    return { state: stateMatch[1] };
  }

  // Look for city names in common patterns
  const cityPatterns = [
    /Chicago/i,
    /Nevada/i,
    /Kentucky/i,
    /Texas/i,
    /Maine/i,
    /Idaho/i,
    /Augusta/i,
    /Lexington/i,
    /Phoenix/i,
    /Arizona/i,
    /Nevada/i,
    /Oklahoma/i,
  ];

  for (const pattern of cityPatterns) {
    const match = companyName.match(pattern);
    if (match) {
      const location = match[0];
      // Map known locations to state
      const stateMap: Record<string, { city?: string; state: string }> = {
        'Chicago': { city: 'Chicago', state: 'IL' },
        'Nevada': { state: 'NV' },
        'Kentucky': { state: 'KY' },
        'Texas': { state: 'TX' },
        'Maine': { state: 'ME' },
        'Idaho': { state: 'ID' },
        'Augusta': { city: 'Augusta', state: 'GA' },
        'Lexington': { city: 'Lexington', state: 'KY' },
        'Phoenix': { city: 'Phoenix', state: 'AZ' },
        'Arizona': { state: 'AZ' },
        'Oklahoma': { state: 'OK' },
      };

      if (stateMap[location]) {
        return stateMap[location];
      }
    }
  }

  // Default location
  return { city: 'Unknown', state: 'Unknown' };
}

async function importContractors() {
  try {
    // Read CSV file
    const csvPath = '/home/mikecerqua/projects-extra-drive/isolated-projects/NCA/temp/Renewal List - 2025.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Parse CSV - split by newlines and filter out empty lines
    const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    console.log(`Found ${lines.length} companies in CSV`);

    // Track unique companies (to avoid duplicates)
    const uniqueCompanies = new Map<string, string>();

    for (const line of lines) {
      const companyName = line.trim();
      if (companyName && !uniqueCompanies.has(companyName)) {
        uniqueCompanies.set(companyName, companyName);
      }
    }

    console.log(`Processing ${uniqueCompanies.size} unique companies...`);

    const contractorsToInsert = [];

    for (const [_, companyName] of uniqueCompanies) {
      const { businessName, dba } = parseDBA(companyName);
      const category = determineCategory(companyName);
      const location = extractLocation(companyName);

      // Create contractor record with minimal data
      const contractor = {
        name: businessName,
        businessName: businessName,
        category: category,
        description: dba
          ? `${businessName} (doing business as ${dba}) - Professional contractor services.`
          : `${businessName} - Professional contractor services.`,
        city: location.city || 'Not Specified',
        state: location.state || 'Not Specified',
        status: 'active',
        verified: false,
        featured: false,
        rating: '0.00',
        reviewCount: 0,
        insuranceVerified: false,
      };

      contractorsToInsert.push(contractor);
    }

    // Insert in batches of 50 to avoid overwhelming the database
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < contractorsToInsert.length; i += batchSize) {
      const batch = contractorsToInsert.slice(i, i + batchSize);
      await db.insert(contractors).values(batch);
      inserted += batch.length;
      console.log(`Inserted ${inserted}/${contractorsToInsert.length} contractors...`);
    }

    console.log(`\n✅ Successfully imported ${inserted} contractors!`);

  } catch (error) {
    console.error('❌ Error importing contractors:', error);
    throw error;
  } finally {
    await client.end();
  }
}

importContractors();
