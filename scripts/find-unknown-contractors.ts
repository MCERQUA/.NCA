import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { contractors } from '../apps/web/src/db/schema';
import * as dotenv from 'dotenv';
import { eq, or, like } from 'drizzle-orm';

// Load environment variables
dotenv.config({ path: './apps/web/.env' });

const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('NETLIFY_DATABASE_URL or DATABASE_URL not found');
}

const client = postgres(connectionString);
const db = drizzle(client, { schema: { contractors } });

async function findUnknownContractors() {
  console.log('\n🔍 Searching for contractors with "Unknown" city or state...\n');

  // Get all contractors where city or state is "Unknown"
  const unknownContractors = await db
    .select()
    .from(contractors)
    .where(
      or(
        eq(contractors.city, 'Unknown'),
        eq(contractors.state, 'Unknown')
      )
    );

  console.log(`📊 Found ${unknownContractors.length} contractors with "Unknown" city or state:\n`);

  unknownContractors.forEach(c => {
    console.log(`❌ ${c.businessName || c.name}`);
    console.log(`   Category: ${c.category}`);
    console.log(`   Address: ${c.address || 'N/A'}`);
    console.log(`   City: ${c.city}`);
    console.log(`   State: ${c.state}`);
    console.log(`   ZIP: ${c.zipCode || 'N/A'}`);
    console.log(`   Phone: ${c.phone || 'N/A'}`);
    console.log(`   Email: ${c.email || 'N/A'}`);
    console.log(`   Website: ${c.website || 'N/A'}`);
    console.log(`   Coordinates: ${c.latitude && c.longitude ? `${c.latitude}, ${c.longitude}` : 'MISSING'}`);
    console.log('');
  });

  await client.end();
}

findUnknownContractors();
