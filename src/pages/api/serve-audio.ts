// Secure audio proxy endpoint - serves audio files only after purchase
// Checks the D1 database to verify the listing was sold before serving the audio file
export const prerender = false;

export async function GET({ request, locals, url }) {
  try {
    const { DB, UPLOADS } = locals.runtime.env;
    
    // Get the audio key from query parameter
    const audioKey = url.searchParams.get('key');
    
    if (!audioKey) {
      return new Response(
        JSON.stringify({ error: 'Audio key is required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if the audio file belongs to a sold listing
    // Query tracks table to find the listing_id, then check if it's sold
    const track = await DB.prepare(
      `SELECT t.*, sl.sold 
       FROM tracks t 
       JOIN shop_listings sl ON t.listing_id = sl.id 
       WHERE t.audio_url = ?`
    ).bind(audioKey).first();

    if (!track) {
      return new Response(
        JSON.stringify({ error: 'Track not found' }), 
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if the listing has been sold
    if (!track.sold) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - This audio is only available after purchase' }), 
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the audio file from R2
    const audioObject = await UPLOADS.get(audioKey);

    if (!audioObject) {
      return new Response(
        JSON.stringify({ error: 'Audio file not found in storage' }), 
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get content type from metadata or infer from file extension
    const contentType = audioObject.httpMetadata?.contentType || 'audio/mpeg';

    // Serve the audio file with appropriate headers
    return new Response(audioObject.body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${audioKey.split('/').pop()}"`,
        'Cache-Control': 'private, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error serving secure audio:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
