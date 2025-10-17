import { db, contractors } from '../db';
import { eq, desc, and, like, or, sql } from 'drizzle-orm';

export interface ContractorFilters {
  category?: string;
  location?: string;
  verified?: boolean;
  status?: string;
}

/**
 * Get all active contractors from database
 */
export async function getAllContractors() {
  return await db
    .select()
    .from(contractors)
    .where(eq(contractors.status, 'active'))
    .orderBy(desc(contractors.rating));
}

/**
 * Get contractors with filters
 */
export async function getFilteredContractors(filters: ContractorFilters) {
  const conditions = [eq(contractors.status, 'active')];

  if (filters.category) {
    conditions.push(
      or(
        like(contractors.category, `%${filters.category}%`),
        sql`${contractors.specialties}::text LIKE ${`%${filters.category}%`}`
      )!
    );
  }

  if (filters.location) {
    conditions.push(
      or(
        like(contractors.city, `%${filters.location}%`),
        like(contractors.state, `%${filters.location}%`),
        like(contractors.zipCode, `%${filters.location}%`)
      )!
    );
  }

  if (filters.verified !== undefined) {
    conditions.push(eq(contractors.verified, filters.verified));
  }

  return await db
    .select()
    .from(contractors)
    .where(and(...conditions))
    .orderBy(desc(contractors.rating));
}

/**
 * Get top rated contractors
 */
export async function getFeaturedContractors(limit = 3) {
  return await db
    .select()
    .from(contractors)
    .where(
      and(
        eq(contractors.status, 'active'),
        eq(contractors.verified, true)
      )
    )
    .orderBy(desc(contractors.rating))
    .limit(limit);
}

/**
 * Get contractor by ID
 */
export async function getContractorById(id: string) {
  const result = await db
    .select()
    .from(contractors)
    .where(eq(contractors.id, id))
    .limit(1);

  return result[0] || null;
}

/**
 * Get contractors count
 */
export async function getContractorsCount() {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(contractors)
    .where(eq(contractors.status, 'active'));

  return result[0]?.count || 0;
}
