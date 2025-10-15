// API endpoint for handling contact form submissions
// Saves to both KV (primary) and D1 (backup)

export const prerender = false;

export async function POST({ request, locals }) {
  try {
    const { NAMESPACE, DB } = locals.runtime.env;

    const formData = await request.formData();
    const name = formData.get("name")?.toString() || "";
    const email = formData.get("email")?.toString() || "";
    const message = formData.get("message")?.toString() || "";

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "All fields are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create entry object
    const entry = {
      name,
      email,
      message,
      timestamp: new Date().toISOString(),
    };

    // Save to KV with timestamp-based key
    const kvKey = `contact:${Date.now()}`;
    await NAMESPACE.put(kvKey, JSON.stringify(entry));

    // Also save to D1 as backup
    try {
      await DB.prepare(
        "INSERT INTO contact_submissions (name, email, message) VALUES (?, ?, ?)"
      )
        .bind(name, email, message)
        .run();
    } catch (dbError) {
      console.error("Failed to save to D1:", dbError);
      // Continue even if D1 fails, KV is primary
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Contact form submitted successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error handling contact form:", error);
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
