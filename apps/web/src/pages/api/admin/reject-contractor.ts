import type { APIRoute } from 'astro';
import { db, contractors } from '../../../db';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'Contractor ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete the contractor application
    await db.delete(contractors).where(eq(contractors.id, id));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error rejecting contractor:', error);
    return new Response(JSON.stringify({ error: 'Failed to reject contractor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
