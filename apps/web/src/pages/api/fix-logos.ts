import type { APIRoute } from 'astro';
import { db } from '../../db';
import { contractors } from '../../db/schema';
import { eq, ilike } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    console.log('🔧 Fixing contractor logos and business names...');

    // Fix Insulation Contractors of Arizona logo
    const icaContractors = await db
      .select()
      .from(contractors)
      .where(eq(contractors.businessName, 'Insulation Contractors of Arizona'));

    if (icaContractors.length > 0) {
      await db
        .update(contractors)
        .set({ logoUrl: '/contractors/logos/ICA-logo.png' })
        .where(eq(contractors.id, icaContractors[0].id));

      console.log('✅ Updated ICA logo');
    }

    // Fix Mrs. Spray Foam logo and ensure correct business name
    const sprayfoamContractors = await db
      .select()
      .from(contractors)
      .where(ilike(contractors.businessName, '%spray%foam%'));

    if (sprayfoamContractors.length > 0) {
      await db
        .update(contractors)
        .set({
          logoUrl: '/contractors/logos/mrs-sprayfoam-logo.jpg',
          businessName: 'Mrs. Spray Foam'
        })
        .where(eq(contractors.id, sprayfoamContractors[0].id));

      console.log('✅ Updated Mrs. Spray Foam logo and business name');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Logos fixed successfully',
        updated: {
          ica: icaContractors.length > 0,
          mrsSprayfoam: sprayfoamContractors.length > 0
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error fixing logos:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
