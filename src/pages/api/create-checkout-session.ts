// API endpoint for creating Stripe checkout sessions
// This handles the "Buy Now" button click on shop listings
import Stripe from 'stripe';

export const prerender = false;

export async function GET({ request, locals, url }) {
  try {
    const { STRIPE_SECRET_KEY, DB, NAMESPACE } = locals.runtime.env;

    // Check if this is a cart checkout or single item
    const isCartCheckout = url.searchParams.get("cart") === "true";
    const listingId = url.searchParams.get("listing_id");

    let items: any[] = [];

    if (isCartCheckout) {
      // Get cart items from KV
      const cartJson = await NAMESPACE.get("cart");
      const cartIds = cartJson ? JSON.parse(cartJson) : [];

      if (cartIds.length === 0) {
        return new Response("Cart is empty", { status: 400 });
      }

      // Fetch listings for cart items
      const placeholders = cartIds.map(() => '?').join(',');
      const query = `SELECT * FROM shop_listings WHERE id IN (${placeholders})`;
      const { results } = await DB.prepare(query).bind(...cartIds).all();
      items = results;
    } else {
      // Single item checkout
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

      items = [listing];
    }

    // Check if Stripe is configured
    if (!STRIPE_SECRET_KEY) {
      return new Response(
        "Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.",
        { status: 500 }
      );
    }

    const total = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

    // Initialize Stripe with secret key
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.title,
            description: item.description || '',
            images: item.image_url ? [item.image_url] : [],
          },
          unit_amount: Math.round(Number(item.price) * 100), // Convert to cents
        },
        quantity: 1,
      })),
      mode: 'payment',
      success_url: `${url.origin}/shop?success=true`,
      cancel_url: `${url.origin}/${isCartCheckout ? 'cart' : 'shop'}?canceled=true`,
    });
    
    // Clear cart after successful checkout session creation
    if (isCartCheckout) {
      await NAMESPACE.put("cart", JSON.stringify([]));
    }
    
    // Redirect to Stripe checkout
    return Response.redirect(session.url, 303);

    /* For testing without Stripe, uncomment this section and comment out the Stripe code above:
    const itemsList = items.map(item => `
      <div style="background: #2a3441; padding: 15px; border-radius: 6px; margin: 10px 0;">
        <h3 style="margin: 0 0 10px 0;">${item.title}</h3>
        <div style="color: #94a3b8; font-size: 0.9em;">
          ${item.type} ${item.bpm ? `• ${item.bpm} BPM` : ''} ${item.key ? `• ${item.key}` : ''}
        </div>
        <div style="color: #ffcc00; font-size: 1.2em; margin-top: 10px;">$${Number(item.price).toFixed(2)}</div>
      </div>
    `).join('');

    return new Response(
      `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Checkout</title>
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
            .total { font-size: 2em; color: #ffcc00; margin: 20px 0; border-top: 2px solid #2a3441; padding-top: 20px; }
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
            <h1>Checkout${isCartCheckout ? ' - Cart Items' : ''}</h1>
            ${itemsList}
            <div class="total">Total: $${total.toFixed(2)}</div>
            
            <div class="note">
              <strong>⚠️ Stripe Integration Required</strong><br>
              To complete the checkout integration, you need to:
              <ol>
                <li>Install the Stripe SDK: <code>npm install stripe</code></li>
                <li>Set your Stripe secret key in the Cloudflare dashboard</li>
                <li>Uncomment the Stripe API code in this file</li>
              </ol>
            </div>
            
            <a href="${isCartCheckout ? '/cart' : '/shop'}">← Back</a>
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
    */
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
