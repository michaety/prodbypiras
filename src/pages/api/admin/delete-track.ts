// API endpoint for deleting a track from a listing

export const prerender = false;

export async function DELETE({ request, locals, url }) {
  try {
    const { DB } = locals.runtime.env;

    // Get track ID from query params
    const trackId = url.searchParams.get("id");

    if (!trackId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing track ID",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if track exists
    const track = await DB.prepare("SELECT id FROM tracks WHERE id = ?")
      .bind(trackId)
      .first();

    if (!track) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Track not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Delete track
    await DB.prepare("DELETE FROM tracks WHERE id = ?").bind(trackId).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Track deleted successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error deleting track:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
