import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

// Load environment variables from root .env
dotenv.config({ path: '../../.env' });

const connectionString = import.meta.env.DATABASE_URL || process.env.DATABASE_URL;

// During static builds, database might not be available
// Export a safe null db that can be checked before use
let db: ReturnType<typeof drizzle> | null = null;

if (connectionString) {
  try {
    // Create postgres client
    const client = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    // Create drizzle instance
    db = drizzle(client, { schema });
  } catch (error) {
    console.warn('Failed to connect to database:', error);
  }
} else {
  console.warn('DATABASE_URL not set - database features will be disabled');
}

export { db };
export * from './schema';
