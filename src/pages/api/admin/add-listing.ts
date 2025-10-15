// API endpoint for adding new shop listings
import { z } from "zod";

export const prerender = false;

// Zod schema for validation
const listingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["beats", "stems", "samples", "pack"], {
    errorMap: () => ({ message: "Invalid type" }),
  }),
  description: z.string().optional(),
  length: z.string().optional(),
  bpm: z.number().int().min(0).max(300).optional(),
  key: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  stripe_price_id: z.string().optional(),
  featured: z.boolean().optional(),
});

export async function POST({ request, locals }) {
  try {
    const { DB, UPLOADS } = locals.runtime.env;
    const formData = await request.formData();

    // Extract form data
    const title = formData.get("title") as string;
    const type = formData.get("type") as string;
    const description = formData.get("description") as string | null;
    const length = formData.get("length") as string | null;
    const bpmStr = formData.get("bpm") as string | null;
    const key = formData.get("key") as string | null;
    const priceStr = formData.get("price") as string;
    const stripe_price_id = formData.get("stripe_price_id") as string | null;
    const featuredStr = formData.get("featured") as string | null;

    // Parse numeric values
    const bpm = bpmStr ? parseInt(bpmStr, 10) : undefined;
    const price = parseFloat(priceStr);
    const featured = featuredStr === "1";

    // Validate data
    const validatedData = listingSchema.parse({
      title,
      type,
      description: description || undefined,
      length: length || undefined,
      bpm: bpm || undefined,
      key: key || undefined,
      price,
      stripe_price_id: stripe_price_id || undefined,
      featured,
    });

    // Handle cover photo upload
    let imageUrl = null;
    const coverPhoto = formData.get("cover_photo") as File | null;
    if (coverPhoto && coverPhoto.size > 0) {
      const imageKey = `images/${Date.now()}_${coverPhoto.name}`;
      await UPLOADS.put(imageKey, coverPhoto.stream());
      // Construct public URL - adjust based on your R2 bucket configuration
      imageUrl = `https://uploads.example.com/${imageKey}`;
    }

    // Handle preview audio upload
    let previewAudioUrl = null;
    const previewAudio = formData.get("preview_audio") as File | null;
    if (previewAudio && previewAudio.size > 0) {
      const audioKey = `audio/${Date.now()}_${previewAudio.name}`;
      await UPLOADS.put(audioKey, previewAudio.stream());
      // Construct public URL - adjust based on your R2 bucket configuration
      previewAudioUrl = `https://uploads.example.com/${audioKey}`;
    }

    // Insert listing into database
    const result = await DB.prepare(
      `INSERT INTO shop_listings 
       (title, type, description, length, bpm, key, image_url, preview_audio_url, price, stripe_price_id, featured) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        validatedData.title,
        validatedData.type,
        validatedData.description || null,
        validatedData.length || null,
        validatedData.bpm || null,
        validatedData.key || null,
        imageUrl,
        previewAudioUrl,
        validatedData.price,
        validatedData.stripe_price_id || null,
        featured ? 1 : 0
      )
      .run();

    const listingId = result.meta?.last_row_id;

    // Handle track files
    if (listingId) {
      // Find all track file inputs
      const trackFiles: Array<{ title: string; file: File }> = [];
      let trackIndex = 1;

      while (formData.get(`track_file_${trackIndex}`)) {
        const trackTitle = formData.get(`track_title_${trackIndex}`) as string;
        const trackFile = formData.get(`track_file_${trackIndex}`) as File;

        if (trackFile && trackFile.size > 0) {
          trackFiles.push({ title: trackTitle || `Track ${trackIndex}`, file: trackFile });
        }
        trackIndex++;
      }

      // Upload and save track files
      for (let i = 0; i < trackFiles.length; i++) {
        const { title: trackTitle, file } = trackFiles[i];
        const trackKey = `tracks/${Date.now()}_${i}_${file.name}`;
        await UPLOADS.put(trackKey, file.stream());
        const trackUrl = `https://uploads.example.com/${trackKey}`;

        // Insert track into database
        await DB.prepare(
          `INSERT INTO tracks (listing_id, title, audio_url, track_order) VALUES (?, ?, ?, ?)`
        )
          .bind(listingId, trackTitle, trackUrl, i + 1)
          .run();
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        id: listingId,
        message: "Listing created successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating listing:", error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Validation error",
          details: error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
