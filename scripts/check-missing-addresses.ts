import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { contractors } from '../apps/web/src/db/schema';
import * as dotenv from 'dotenv';
import { isNull, or } from 'drizzle-orm';

// Load environment variables
dotenv.config({ path: './apps/web/.env' });

const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('NETLIFY_DATABASE_URL or DATABASE_URL not found');
}

const client = postgres(connectionString);
const db = drizzle(client, { schema: { contractors } });

async function checkMissingAddresses() {
  console.log('\n🔍 Checking for contractors with missing address data...\n');

  // Get all contractors
  const allContractors = await db.select().from(contractors);

  console.log(`📊 Total contractors in database: ${allContractors.length}\n`);

  // Find contractors missing city or state
  const missingAddress = allContractors.filter(c => !c.city || !c.state);
  const hasAddress = allContractors.filter(c => c.city && c.state);
  const hasCoordinates = allContractors.filter(c => c.latitude && c.longitude);

  console.log(`✅ Contractors WITH city/state: ${hasAddress.length}`);
  console.log(`❌ Contractors MISSING city/state: ${missingAddress.length}`);
  console.log(`📍 Contractors WITH coordinates: ${hasCoordinates.length}\n`);

  if (missingAddress.length > 0) {
    console.log('❌ Contractors missing city/state data:\n');
    missingAddress.forEach(c => {
      console.log(`  - ${c.businessName || c.name}`);
      console.log(`    Address: ${c.address || 'N/A'}`);
      console.log(`    City: ${c.city || 'MISSING'}`);
      console.log(`    State: ${c.state || 'MISSING'}`);
      console.log(`    ZIP: ${c.zipCode || 'N/A'}`);
      console.log(`    Coordinates: ${c.latitude && c.longitude ? `${c.latitude}, ${c.longitude}` : 'MISSING'}`);
      console.log('');
    });
  }

  console.log('\n✅ Contractors WITH complete address data:\n');
  hasAddress.slice(0, 10).forEach(c => {
    console.log(`  ✓ ${c.businessName || c.name} - ${c.city}, ${c.state}`);
  });
  if (hasAddress.length > 10) {
    console.log(`  ... and ${hasAddress.length - 10} more`);
  }

  await client.end();
}

checkMissingAddresses();
