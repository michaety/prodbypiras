import Stripe from 'stripe';

// Use Stripe hosted domains (buy.stripe.com) for Payment Links
export const prerender = false;

export async function POST({ request, locals }) {
  try {
    const { STRIPE_SECRET_KEY, DB } = locals.runtime.env;

    // Validate environment variables
    if (!STRIPE_SECRET_KEY || !DB) {
      return new Response(
        JSON.stringify({ 
          error: 'Configuration error', 
          message: 'Server configuration incomplete' 
        }), 
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    const { listing_id } = await request.json();
    
    if (!listing_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing parameter', 
          message: 'listing_id is required' 
        }), 
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch listing from database
    const listing = await DB.prepare('SELECT * FROM shop_listings WHERE id = ?')
      .bind(listing_id)
      .first();

    if (!listing) {
      return new Response(
        JSON.stringify({ 
          error: 'Listing not found', 
          message: 'The requested item could not be found' 
        }), 
        { 
          status: 404, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' });
    
    // Create Payment Link (redirects to buy.stripe.com)
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: listing.title,
              description: listing.description || '',
              images: listing.image_url ? [listing.image_url] : []
            },
            unit_amount: Math.round((listing.price || 0) * 100),
          },
          quantity: 1,
        },
      ],
    });

    console.log('Payment Link created:', paymentLink.id, 'for listing:', listing.title);

    return new Response(
      JSON.stringify({ url: paymentLink.url }), 
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Payment Link creation error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create payment link', 
        message: error.message 
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
