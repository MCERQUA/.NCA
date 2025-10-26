import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { contractors } from '../apps/web/src/db/schema';
import * as dotenv from 'dotenv';
import { like, or } from 'drizzle-orm';

// Load environment variables
dotenv.config({ path: './apps/web/.env' });

const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('NETLIFY_DATABASE_URL or DATABASE_URL not found');
}

const client = postgres(connectionString);
const db = drizzle(client, { schema: { contractors } });

async function checkContractor() {
  console.log('\n🔍 Checking Eagle Point Custom Contractors LLC in database...\n');

  const results = await db
    .select()
    .from(contractors)
    .where(
      or(
        like(contractors.name, '%Eagle Point%'),
        like(contractors.businessName, '%Eagle Point%')
      )
    );

  if (results.length === 0) {
    console.log('❌ Eagle Point Custom Contractors LLC NOT FOUND in database\n');
  } else {
    console.log(`✅ Found ${results.length} matching contractor(s):\n`);
    results.forEach(c => {
      console.log(`Name: ${c.name}`);
      console.log(`Business Name: ${c.businessName}`);
      console.log(`Address: ${c.address || 'MISSING'}`);
      console.log(`City: ${c.city}`);
      console.log(`State: ${c.state}`);
      console.log(`ZIP: ${c.zipCode || 'MISSING'}`);
      console.log(`Phone: ${c.phone || 'MISSING'}`);
      console.log(`Email: ${c.email || 'MISSING'}`);
      console.log(`Website: ${c.website || 'MISSING'}`);
      console.log(`Coordinates: ${c.latitude && c.longitude ? `${c.latitude}, ${c.longitude}` : 'MISSING'}`);
      console.log('');
    });
  }

  await client.end();
}

checkContractor();
