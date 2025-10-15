// API endpoint for creating Stripe checkout sessions
// This handles the "Buy Now" button click on shop listings

export const prerender = false;

export async function GET({ request, locals, url }) {
  try {
    const { STRIPE_SECRET_KEY, DB } = locals.runtime.env;

    // Get listing ID from query params
    const listingId = url.searchParams.get("listing_id");

    if (!listingId) {
      return new Response("Missing listing_id parameter", { status: 400 });
    }

    // Fetch listing from D1
    const listing = await DB.prepare(
      "SELECT * FROM shop_listings WHERE id = ?"
    )
      .bind(listingId)
      .first();

    if (!listing) {
      return new Response("Listing not found", { status: 404 });
    }

    // Check if Stripe is configured
    if (!STRIPE_SECRET_KEY) {
      return new Response(
        "Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.",
        { status: 500 }
      );
    }

    // In a real implementation, you would call Stripe's API here
    // For now, we'll return a placeholder response
    // This is where you'd integrate with Stripe Checkout:
    /*
    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: listing.title,
            description: listing.description || '',
            images: listing.image_url ? [listing.image_url] : [],
          },
          unit_amount: Math.round(listing.price * 100), // Convert to cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${url.origin}/shop?success=true`,
      cancel_url: `${url.origin}/shop?canceled=true`,
    });
    
    return Response.redirect(session.url, 303);
    */

    // For now, redirect to a placeholder or show instructions
    return new Response(
      `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Checkout - ${listing.title}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              background: #0f1419;
              color: #fff;
            }
            .card {
              background: #1a1f2e;
              border: 1px solid #2a3441;
              border-radius: 8px;
              padding: 30px;
            }
            h1 { color: #ffcc00; margin-top: 0; }
            .price { font-size: 2em; color: #ffcc00; margin: 20px 0; }
            .info { color: #94a3b8; margin: 10px 0; }
            a {
              display: inline-block;
              background: #ffcc00;
              color: #0f1419;
              padding: 12px 24px;
              border-radius: 6px;
              text-decoration: none;
              font-weight: 600;
              margin-top: 20px;
            }
            a:hover { background: #e6b800; }
            .note {
              margin-top: 30px;
              padding: 15px;
              background: #2a3441;
              border-radius: 6px;
              font-size: 0.9em;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Checkout: ${listing.title}</h1>
            <div class="info">Type: ${listing.type}</div>
            ${listing.bpm ? `<div class="info">BPM: ${listing.bpm}</div>` : ""}
            ${listing.key ? `<div class="info">Key: ${listing.key}</div>` : ""}
            <div class="price">$${Number(listing.price).toFixed(2)}</div>
            
            <div class="note">
              <strong>⚠️ Stripe Integration Required</strong><br>
              To complete the checkout integration, you need to:
              <ol>
                <li>Install the Stripe SDK: <code>npm install stripe</code></li>
                <li>Set your Stripe secret key in the Cloudflare dashboard</li>
                <li>Uncomment the Stripe API code in this file</li>
              </ol>
            </div>
            
            <a href="/shop">← Back to Shop</a>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
