// API endpoint to update listing in D1 database
import { z } from 'zod';
import { ShopListingService } from '@/lib/services/shop-listing';
import type { APIRoute } from 'astro';

export const prerender = false;

// Zod schema for validation
const updateListingSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  type: z.enum(['beat', 'sample', 'stems', 'pack']),
  price: z.string(),
  description: z.string().optional(),
  length: z.string().optional(),
  bpm: z.string().optional(),
  key: z.string().optional(),
  image_url: z.string().optional(),
  preview_audio_url: z.string().optional(),
  stripe_price_id: z.string().optional(),
  featured: z.string().optional(),
});

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  try {
    const { DB } = locals.runtime.env;
    const formData = await request.formData();

    // Convert FormData to object
    const rawData: any = {};
    for (const [key, value] of formData.entries()) {
      rawData[key] = value;
    }

    // Validate with Zod
    const validatedData = updateListingSchema.parse(rawData);

    // Convert types as needed
    const updateData: any = {
      title: validatedData.title,
      type: validatedData.type,
      price: parseFloat(validatedData.price),
    };

    // Add optional fields if provided
    if (validatedData.description) updateData.description = validatedData.description;
    if (validatedData.length) updateData.length = validatedData.length;
    if (validatedData.bpm) updateData.bpm = parseInt(validatedData.bpm);
    if (validatedData.key) updateData.key = validatedData.key;
    if (validatedData.image_url) updateData.image_url = validatedData.image_url;
    if (validatedData.preview_audio_url) updateData.preview_audio_url = validatedData.preview_audio_url;
    if (validatedData.stripe_price_id) updateData.stripe_price_id = validatedData.stripe_price_id;
    
    // Handle checkbox value
    updateData.featured = validatedData.featured === 'on' || validatedData.featured === 'true';

    // Update in D1
    const shopListingService = new ShopListingService(DB);
    await shopListingService.update(parseInt(validatedData.id), updateData);

    // Redirect back to listing detail page
    return redirect(`/admin/listings/${validatedData.id}`, 303);
  } catch (error) {
    console.error('Error updating listing:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to update listing',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
