import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Get database URL from environment
// Netlify provides NETLIFY_DATABASE_URL for Neon integration
const connectionString =
  import.meta.env.NETLIFY_DATABASE_URL ||
  import.meta.env.DATABASE_URL ||
  process.env.NETLIFY_DATABASE_URL ||
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

console.log('Connecting to database...');

// Create postgres client
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create drizzle instance
export const db = drizzle(client, { schema });

console.log('Database connection established');

export * from './schema';
