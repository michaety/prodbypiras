// API endpoint for adding new shop listings
import { z } from "zod";
import imageCompression from 'browser-image-compression';

export const prerender = false;

// Helper function to convert image to WebP format
async function convertImageToWebP(file: File): Promise<Blob> {
  try {
    // Convert to WebP using browser-image-compression
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: false,
      fileType: 'image/webp' as const,
    };
    
    const compressedBlob = await imageCompression(file, options);
    return compressedBlob;
  } catch (error) {
    console.error('Error converting image to WebP:', error);
    throw error;
  }
}

// Helper function to generate audio preview (20 seconds)
// Note: This is a simplified version. In production, you'd use FFmpeg or a similar tool
// For now, we'll just upload the full audio file as the preview
// To implement proper audio trimming, you would need to:
// 1. Use ffmpeg.wasm in the browser
// 2. Or process on the server-side with a proper audio library
async function generateAudioPreview(file: File): Promise<File> {
  // For now, return the original file
  // TODO: Implement actual audio trimming to 20 seconds using ffmpeg.wasm
  // This would require adding @ffmpeg/ffmpeg and @ffmpeg/util packages
  return file;
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

    // Handle cover photo upload with WebP conversion
    let imageUrl = null;
    const coverPhoto = formData.get("cover_photo") as File | null;
    if (coverPhoto && coverPhoto.size > 0) {
      // Convert image to WebP format
      const webpBlob = await convertImageToWebP(coverPhoto);
      const webpFilename = coverPhoto.name.replace(/\.[^/.]+$/, '.webp');
      const imageKey = `images/${Date.now()}_${webpFilename}`;
      
      // Upload to R2 with proper content type
      await UPLOADS.put(imageKey, webpBlob, {
        httpMetadata: {
          contentType: 'image/webp',
        },
      });
      
      // Construct public URL - Using R2 bucket binding, files are accessible via custom domain
      // Update this URL based on your actual R2 bucket configuration
      imageUrl = `https://uploads.example.com/${imageKey}`;
    }

    // Handle preview audio upload with preview generation
    let previewAudioUrl = null;
    const previewAudio = formData.get("preview_audio") as File | null;
    if (previewAudio && previewAudio.size > 0) {
      // Generate 20-second preview (currently returns full file - see helper function for TODO)
      const previewFile = await generateAudioPreview(previewAudio);
      const audioKey = `audio/previews/${Date.now()}_${previewAudio.name}`;
      
      // Detect MIME type based on file extension
      const fileExtension = previewAudio.name.split('.').pop()?.toLowerCase();
      let contentType = 'audio/mpeg'; // default
      if (fileExtension === 'wav') contentType = 'audio/wav';
      else if (fileExtension === 'ogg') contentType = 'audio/ogg';
      else if (fileExtension === 'mp3') contentType = 'audio/mpeg';
      else if (fileExtension === 'm4a') contentType = 'audio/mp4';
      
      await UPLOADS.put(audioKey, previewFile.stream(), {
        httpMetadata: {
          contentType,
        },
      });
      
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
        
        // Detect MIME type for track files
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        let contentType = 'audio/mpeg'; // default
        if (fileExtension === 'wav') contentType = 'audio/wav';
        else if (fileExtension === 'ogg') contentType = 'audio/ogg';
        else if (fileExtension === 'mp3') contentType = 'audio/mpeg';
        else if (fileExtension === 'm4a') contentType = 'audio/mp4';
        
        await UPLOADS.put(trackKey, file.stream(), {
          httpMetadata: {
            contentType,
          },
        });
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
