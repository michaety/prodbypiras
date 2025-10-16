// API endpoint for adding new shop listings
import { z } from "zod";

export const prerender = false;

// Helper function to get file extension and determine content type
function getImageContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'webp':
      return 'image/webp';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
}

// Helper function to get audio content type
function getAudioContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'ogg':
      return 'audio/ogg';
    case 'm4a':
      return 'audio/mp4';
    case 'aac':
      return 'audio/aac';
    default:
      return 'audio/mpeg';
  }
}

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
    // Note: WebP conversion happens on the client-side before upload
    let imageUrl = null;
    const coverPhoto = formData.get("cover_photo") as File | null;
    if (coverPhoto && coverPhoto.size > 0) {
      // Generate unique filename
      const timestamp = Date.now();
      const imageKey = `images/${timestamp}_${coverPhoto.name}`;
      
      // Get proper content type
      const contentType = getImageContentType(coverPhoto.name);
      
      // Read file as ArrayBuffer for Workers compatibility
      const arrayBuffer = await coverPhoto.arrayBuffer();
      
      // Upload to R2 with proper content type
      await UPLOADS.put(imageKey, arrayBuffer, {
        httpMetadata: {
          contentType,
        },
      });
      
      // Construct public URL using R2 public bucket URL
      // The R2 bucket should be configured with public access or custom domain
      // Get the public URL from environment variable or use the proxy endpoint
      const r2PublicUrl = locals.runtime.env.R2_PUBLIC_URL;
      if (r2PublicUrl) {
        imageUrl = `${r2PublicUrl}/${imageKey}`;
      } else {
        // Fallback: Use the Worker proxy endpoint to serve R2 files
        imageUrl = `/api/uploads/${imageKey}`;
      }
    }

    // Collect track files first (we'll need them for preview generation)
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

    // Track files are now required
    if (trackFiles.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "At least one track file is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Auto-generate preview audio from the first track file
    // Note: In a production environment, you would use FFmpeg or similar to trim the audio
    // For now, we'll use the first track as-is for preview
    let previewAudioUrl = null;
    const firstTrack = trackFiles[0];
    if (firstTrack) {
      const timestamp = Date.now();
      const audioKey = `audio/previews/${timestamp}_preview_${firstTrack.file.name}`;
      
      // Get proper content type
      const contentType = getAudioContentType(firstTrack.file.name);
      
      // Read file as ArrayBuffer for Workers compatibility
      const arrayBuffer = await firstTrack.file.arrayBuffer();
      
      // Upload to R2 with proper content type
      // TODO: Implement server-side audio trimming using FFmpeg for better previews
      await UPLOADS.put(audioKey, arrayBuffer, {
        httpMetadata: {
          contentType,
        },
      });
      
      // Construct public URL
      const r2PublicUrl = locals.runtime.env.R2_PUBLIC_URL;
      if (r2PublicUrl) {
        previewAudioUrl = `${r2PublicUrl}/${audioKey}`;
      } else {
        // Fallback: Use the Worker proxy endpoint to serve R2 files
        previewAudioUrl = `/api/uploads/${audioKey}`;
      }
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

    // Upload and save track files
    if (listingId && trackFiles.length > 0) {
      for (let i = 0; i < trackFiles.length; i++) {
        const { title: trackTitle, file } = trackFiles[i];
        const timestamp = Date.now();
        const trackKey = `tracks/${timestamp}_${i}_${file.name}`;
        
        // Get proper content type
        const contentType = getAudioContentType(file.name);
        
        // Read file as ArrayBuffer for Workers compatibility
        const arrayBuffer = await file.arrayBuffer();
        
        // Upload to R2 with proper content type
        await UPLOADS.put(trackKey, arrayBuffer, {
          httpMetadata: {
            contentType,
          },
        });
        
        // Construct public URL
        const r2PublicUrl = locals.runtime.env.R2_PUBLIC_URL;
        const trackUrl = r2PublicUrl ? `${r2PublicUrl}/${trackKey}` : `/api/uploads/${trackKey}`;

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
