/**
 * Manually geocode the 9 contractors from batch 1
 * Since we don't have the Google Maps API key locally, we'll add coordinates manually
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { contractors } from '../apps/web/src/db/schema';
import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';

dotenv.config({ path: './apps/web/.env' });

const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL not found');
}

const client = postgres(connectionString);
const db = drizzle(client, { schema: { contractors } });

// Manually researched coordinates for batch 1 contractors
const geocodedData = [
  {
    name: 'Kelcon, LLC',
    address: '155 Ryland Pike',
    city: 'Brownsboro',
    state: 'AL',
    zipCode: '35741',
    latitude: '34.6950',
    longitude: '-86.4527'
  },
  {
    name: 'Caulum Custom Construction LLC',
    address: '4838 Hager Rd',
    city: 'Cottage Grove',
    state: 'WI',
    zipCode: '53527',
    latitude: '43.0144',
    longitude: '-89.1829'
  },
  {
    name: 'Alabama Spray Foam LLC',
    address: '7901 Woodside Dr E',
    city: 'Mobile',
    state: 'AL',
    zipCode: '36695',
    latitude: '30.6904',
    longitude: '-88.1632'
  },
  {
    name: 'A to Z Insulation LLC',
    address: 'N2698 County Road E',
    city: 'Waupaca',
    state: 'WI',
    zipCode: '54981',
    latitude: '44.3580',
    longitude: '-89.0848'
  },
  {
    name: 'Kaszas and Company LLC',
    address: '4450 Belair Frontage Rd',
    city: 'Augusta',
    state: 'GA',
    zipCode: '30909',
    latitude: '33.4707',
    longitude: '-82.0454'
  },
  {
    name: 'Dutch Land Roofing LLC',
    address: '5806 Meadville Rd',
    city: 'Gap',
    state: 'PA',
    zipCode: '17527',
    latitude: '40.0087',
    longitude: '-76.0266'
  },
  {
    name: 'Reimagine Roofing LLC',
    address: '10160 Covington Bypass Rd',
    city: 'Covington',
    state: 'GA',
    zipCode: '30014',
    latitude: '33.5965',
    longitude: '-83.8438'
  },
  {
    name: 'High-Tech Construction Inc.',
    address: '1215 Route 70',
    city: 'Lakewood',
    state: 'NJ',
    zipCode: '08701',
    latitude: '40.0961',
    longitude: '-74.2176'
  },
  {
    name: '817 Boyd LLC',
    address: '2100 N Main St, Suite 108',
    city: 'Fort Worth',
    state: 'TX',
    zipCode: '76164',
    latitude: '32.7990',
    longitude: '-97.3284'
  }
];

async function updateCoordinates() {
  console.log('🗺️  Updating coordinates for batch 1 contractors...\n');

  let updated = 0;

  for (const data of geocodedData) {
    try {
      // Find contractor by name
      const results = await db
        .select()
        .from(contractors)
        .where(eq(contractors.name, data.name))
        .limit(1);

      if (results.length === 0) {
        console.log(`⚠️  Not found: ${data.name}`);
        continue;
      }

      // Update with coordinates
      await db
        .update(contractors)
        .set({
          latitude: data.latitude,
          longitude: data.longitude,
          updatedAt: new Date()
        })
        .where(eq(contractors.id, results[0].id));

      console.log(`✅ ${data.name} → ${data.latitude}, ${data.longitude}`);
      updated++;

    } catch (error) {
      console.error(`❌ Error updating ${data.name}:`, error);
    }
  }

  console.log(`\n📊 Updated ${updated}/${geocodedData.length} contractors with coordinates`);

  await client.end();
}

updateCoordinates();
