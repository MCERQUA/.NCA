import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ No database connection string found');
  process.exit(1);
}

const sql = postgres(connectionString);

async function fixContractorLogos() {
  console.log('🔧 Fixing contractor logos and business names...\n');

  try {
    // Fix Insulation Contractors of Arizona logo
    const icaUpdate = await sql`
      UPDATE contractors
      SET logo_url = '/contractors/logos/ICA-logo.png'
      WHERE business_name = 'Insulation Contractors of Arizona'
      RETURNING id, business_name, logo_url;
    `;

    if (icaUpdate.length > 0) {
      console.log('✅ Updated ICA logo:', icaUpdate[0]);
    } else {
      console.log('⚠️  No ICA contractor found');
    }

    // Fix Mrs. Spray Foam logo and ensure correct business name
    const mrsSprayfoamUpdate = await sql`
      UPDATE contractors
      SET
        logo_url = '/contractors/logos/mrs-sprayfoam-logo.jpg',
        business_name = 'Mrs. Spray Foam'
      WHERE business_name ILIKE '%spray%foam%'
      RETURNING id, business_name, logo_url;
    `;

    if (mrsSprayfoamUpdate.length > 0) {
      console.log('✅ Updated Mrs. Spray Foam logo:', mrsSprayfoamUpdate[0]);
    } else {
      console.log('⚠️  No Mrs. Spray Foam contractor found');
    }

    console.log('\n✨ Contractor logos updated successfully!');
  } catch (error) {
    console.error('❌ Error updating contractors:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

fixContractorLogos();
