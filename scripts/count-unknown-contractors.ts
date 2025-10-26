import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { contractors } from '../apps/web/src/db/schema';
import * as dotenv from 'dotenv';
import { eq, or } from 'drizzle-orm';

// Load environment variables
dotenv.config({ path: './apps/web/.env' });

const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('NETLIFY_DATABASE_URL or DATABASE_URL not found');
}

const client = postgres(connectionString);
const db = drizzle(client, { schema: { contractors } });

async function countUnknown() {
  const unknownContractors = await db
    .select()
    .from(contractors)
    .where(
      or(
        eq(contractors.city, 'Unknown'),
        eq(contractors.state, 'Unknown')
      )
    );

  console.log(unknownContractors.length);
  await client.end();
}

countUnknown().catch(console.error);
