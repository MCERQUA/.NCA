import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { contractors } from '../apps/web/src/db/schema';
import * as dotenv from 'dotenv';
import { count, sql } from 'drizzle-orm';

dotenv.config({ path: './apps/web/.env' });

const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('NETLIFY_DATABASE_URL or DATABASE_URL not found');
}

const client = postgres(connectionString);
const db = drizzle(client, { schema: { contractors } });

async function verifyImport() {
  try {
    // Count total contractors
    const totalCount = await db.select({ count: count() }).from(contractors);
    console.log(`\n📊 Total Contractors: ${totalCount[0].count}`);

    // Count by status
    const statusCounts = await db
      .select({
        status: contractors.status,
        count: count(),
      })
      .from(contractors)
      .groupBy(contractors.status);

    console.log('\n📈 By Status:');
    statusCounts.forEach(s => console.log(`  ${s.status}: ${s.count}`));

    // Count by category
    const categoryCounts = await db
      .select({
        category: contractors.category,
        count: count(),
      })
      .from(contractors)
      .groupBy(contractors.category)
      .orderBy(sql`count DESC`);

    console.log('\n🏷️  By Category:');
    categoryCounts.forEach(c => console.log(`  ${c.category}: ${c.count}`));

    // Show some sample contractors
    const samples = await db
      .select({
        name: contractors.name,
        category: contractors.category,
        city: contractors.city,
        state: contractors.state,
        status: contractors.status,
      })
      .from(contractors)
      .limit(10);

    console.log('\n📋 Sample Contractors:');
    samples.forEach(s => console.log(`  - ${s.name} (${s.category}) - ${s.city}, ${s.state} [${s.status}]`));

  } catch (error) {
    console.error('❌ Error verifying import:', error);
    throw error;
  } finally {
    await client.end();
  }
}

verifyImport();
