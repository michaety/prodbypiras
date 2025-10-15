// API endpoint to serve files from R2 bucket
// This is used when R2_PUBLIC_URL is not configured
// Enables file serving through the Worker instead of direct R2 access

export const prerender = false;

export async function GET({ params, locals }) {
  try {
    const { UPLOADS } = locals.runtime.env;
    const path = params.path;

    if (!path) {
      return new Response("File path is required", { status: 400 });
    }

    // Get the file from R2
    const object = await UPLOADS.get(path);

    if (!object) {
      return new Response("File not found", { status: 404 });
    }

    // Get the content type from metadata or infer from extension
    const contentType = object.httpMetadata?.contentType || inferContentType(path);

    // Return the file with appropriate headers
    return new Response(object.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error serving file from R2:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

// Helper function to infer content type from file extension
function inferContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  
  // Image types
  if (ext === 'webp') return 'image/webp';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'gif') return 'image/gif';
  
  // Audio types
  if (ext === 'mp3') return 'audio/mpeg';
  if (ext === 'wav') return 'audio/wav';
  if (ext === 'ogg') return 'audio/ogg';
  if (ext === 'm4a') return 'audio/mp4';
  if (ext === 'aac') return 'audio/aac';
  
  // Default
  return 'application/octet-stream';
}
