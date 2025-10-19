import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, or, like } from 'drizzle-orm';
import * as schema from '../src/db/schema';
import { config } from 'dotenv';
import { resolve } from 'path';

/**
 * Script to update contractor records with local image URLs
 * Run with: pnpm tsx scripts/update-contractor-images.ts
 */

// Load environment variables from .env file in project root
config({ path: resolve(process.cwd(), '../../.env') });

// Load environment variables
const connectionString =
  process.env.NETLIFY_DATABASE_URL ||
  process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.log('   Please set DATABASE_URL or NETLIFY_DATABASE_URL in your .env file');
  process.exit(1);
}

// Create database connection
const client = postgres(connectionString);
const db = drizzle(client, { schema });
const { contractors } = schema;

async function updateContractorImages() {
  console.log('🔍 Searching for contractors to update...\n');

  // Find ICA (Insulation Contractors of Arizona)
  const icaContractors = await db
    .select()
    .from(contractors)
    .where(
      or(
        like(contractors.businessName, '%Insulation%Arizona%'),
        like(contractors.businessName, '%ICA%'),
        like(contractors.name, '%Insulation%Arizona%')
      )
    );

  console.log(`Found ${icaContractors.length} ICA contractors`);

  // Find Mrs. Sprayfoam
  const mrsSprayfoamContractors = await db
    .select()
    .from(contractors)
    .where(
      or(
        like(contractors.businessName, '%Mrs%Sprayfoam%'),
        like(contractors.businessName, '%Mrs.%Sprayfoam%'),
        like(contractors.name, '%Mrs%Sprayfoam%')
      )
    );

  console.log(`Found ${mrsSprayfoamContractors.length} Mrs. Sprayfoam contractors\n`);

  // Update ICA contractors
  for (const contractor of icaContractors) {
    console.log(`📝 Updating: ${contractor.businessName || contractor.name}`);

    await db
      .update(contractors)
      .set({
        logoUrl: '/contractors/logos/ica-logo.webp',
        imageUrl: '/contractors/images/ICA/509430945_743792478214456_699274312190880149_n.jpg',
        updatedAt: new Date(),
      })
      .where(eq(contractors.id, contractor.id));

    console.log(`   ✅ Logo: /contractors/logos/ica-logo.webp`);
    console.log(`   ✅ Featured Image: /contractors/images/ICA/509430945_743792478214456_699274312190880149_n.jpg`);
    console.log(`   📷 Gallery: 5 jobsite images available in /contractors/images/ICA/\n`);
  }

  // Update Mrs. Sprayfoam contractors
  for (const contractor of mrsSprayfoamContractors) {
    console.log(`📝 Updating: ${contractor.businessName || contractor.name}`);

    await db
      .update(contractors)
      .set({
        logoUrl: '/contractors/logos/mrs-sprayfoam-logo.jpg',
        imageUrl: '/contractors/images/Mrs.Sprayfoam/494074864_1102586738578156_7447190070476670660_n.jpg',
        updatedAt: new Date(),
      })
      .where(eq(contractors.id, contractor.id));

    console.log(`   ✅ Logo: /contractors/logos/mrs-sprayfoam-logo.jpg`);
    console.log(`   ✅ Featured Image: /contractors/images/Mrs.Sprayfoam/494074864_1102586738578156_7447190070476670660_n.jpg`);
    console.log(`   📷 Gallery: 5 jobsite images available in /contractors/images/Mrs.Sprayfoam/\n`);
  }

  const totalUpdated = icaContractors.length + mrsSprayfoamContractors.length;

  if (totalUpdated === 0) {
    console.log('⚠️  No matching contractors found in database.');
    console.log('   Please ensure contractors are created first with matching business names:\n');
    console.log('   - "Insulation Contractors of Arizona" or containing "ICA"');
    console.log('   - "Mrs. Sprayfoam" or "Mrs Sprayfoam"\n');
    console.log('   You can add them via /signup or directly in the database.');
  } else {
    console.log(`✨ Successfully updated ${totalUpdated} contractor${totalUpdated > 1 ? 's' : ''}!`);
  }

  console.log('\n📋 Image Inventory:');
  console.log('   ICA:');
  console.log('     - Logo: /contractors/logos/ica-logo.webp');
  console.log('     - Jobsite Images (5):');
  console.log('       • 509430945_743792478214456_699274312190880149_n.jpg');
  console.log('       • 511146280_746374591289578_7457903423549445317_n.jpg');
  console.log('       • 511200877_747038391223198_3041720709348562847_n.jpg');
  console.log('       • 520283796_760187506574953_6764472423521285766_n.jpg');
  console.log('       • 529973528_780163767910660_4159666756334738252_n.jpg\n');

  console.log('   Mrs. Sprayfoam:');
  console.log('     - Logo: /contractors/logos/mrs-sprayfoam-logo.jpg');
  console.log('     - Jobsite Images (5):');
  console.log('       • 494074864_1102586738578156_7447190070476670660_n.jpg');
  console.log('       • 496828334_18067338590504404_4045996225567687938_n.jpg');
  console.log('       • 500864457_1125439939626169_5653532517149426032_n.jpg');
  console.log('       • 504325524_1130283205808509_6537418619613075220_n.jpg');
  console.log('       • 518412218_1163862585783904_4560658369403756717_n.jpg\n');

  // Close database connection
  await client.end();
  process.exit(0);
}

// Run the update
updateContractorImages().catch(async (error) => {
  console.error('❌ Error updating contractor images:', error);
  await client.end();
  process.exit(1);
});
