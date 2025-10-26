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
 * Get featured contractors (verified first, then recent)
 */
export async function getFeaturedContractors(limit = 3) {
  // Try to get verified contractors first
  const verified = await db
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

  // If we have enough verified contractors, return them
  if (verified.length >= limit) {
    return verified;
  }

  // Otherwise, get a mix of verified and recent active contractors
  const remaining = limit - verified.length;
  const recent = await db
    .select()
    .from(contractors)
    .where(
      and(
        eq(contractors.status, 'active'),
        eq(contractors.verified, false)
      )
    )
    .orderBy(desc(contractors.createdAt))
    .limit(remaining);

  return [...verified, ...recent];
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

/**
 * Generate SEO-friendly slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate contractor URL path
 */
export function generateContractorUrl(contractor: any): string {
  const location = generateSlug(`${contractor.city}-${contractor.state}`);
  const category = generateSlug(contractor.category);
  const name = generateSlug(contractor.businessName || contractor.name);
  return `/${location}/${category}/${name}`;
}

/**
 * Get contractor by SEO-friendly URL parts
 */
export async function getContractorBySlug(location: string, category: string, slug: string) {
  // Parse location into city and state
  const locationParts = location.split('-');
  const state = locationParts[locationParts.length - 1].toUpperCase();
  const city = locationParts.slice(0, -1).join('-');

  const result = await db
    .select()
    .from(contractors)
    .where(
      and(
        eq(contractors.status, 'active'),
        like(contractors.city, `%${city.replace(/-/g, ' ')}%`),
        like(contractors.state, `%${state}%`),
        like(contractors.category, `%${category.replace(/-/g, ' ')}%`)
      )
    );

  // Find best match by name slug
  const match = result.find(c => {
    const contractorSlug = generateSlug(c.businessName || c.name);
    return contractorSlug === slug;
  });

  return match || null;
}
