// API endpoint for deleting a shop listing
// This deletes the listing and all associated tracks (cascade)

export const prerender = false;

export async function DELETE({ request, locals, url }) {
  try {
    const { DB } = locals.runtime.env;

    // Get listing ID from query params
    const listingId = url.searchParams.get("id");

    if (!listingId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing listing ID",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if listing exists
    const listing = await DB.prepare(
      "SELECT id FROM shop_listings WHERE id = ?"
    )
      .bind(listingId)
      .first();

    if (!listing) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Listing not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Delete listing (tracks will be deleted automatically due to CASCADE in FK)
    await DB.prepare("DELETE FROM shop_listings WHERE id = ?")
      .bind(listingId)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Listing deleted successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error deleting listing:", error);
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
