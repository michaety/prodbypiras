import Stripe from 'stripe';

// Use Stripe hosted domains (checkout.stripe.com) for checkout
export const prerender = false;

export async function GET({ request, locals, url }) {
  try {
    const { STRIPE_SECRET_KEY, DB, NAMESPACE } = locals.runtime.env;

    console.log('Env vars check:', { 
      hasStripeKey: !!STRIPE_SECRET_KEY, 
      hasDB: !!DB, 
      hasNamespace: !!NAMESPACE 
    });
    console.log('Request URL:', url.href);
    console.log('Origin:', url.origin);

    // Validate environment variables with helpful error messages
    if (!DB || !NAMESPACE || !STRIPE_SECRET_KEY) {
      const missing = [];
      if (!DB) missing.push('DB');
      if (!NAMESPACE) missing.push('NAMESPACE');
      if (!STRIPE_SECRET_KEY) missing.push('STRIPE_SECRET_KEY');
      
      console.error('Missing required bindings/env vars:', missing.join(', '));
      return new Response(
        JSON.stringify({ 
          error: 'Configuration error', 
          message: 'Server configuration incomplete. Contact support.',
          details: `Missing: ${missing.join(', ')}`
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const isCartCheckout = url.searchParams.get('cart') === 'true';
    const listingId = url.searchParams.get('listing_id');

    // Fetch items from cart or single listing
    let items = [];
    if (isCartCheckout) {
      const cartJson = await NAMESPACE.get('cart');
      const cartIds = cartJson ? JSON.parse(cartJson) : [];
      console.log('Cart checkout - items in cart:', cartIds.length);
      
      if (cartIds.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Cart is empty', message: 'Your cart is empty. Add items before checking out.' }), 
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      const placeholders = cartIds.map(() => '?').join(',');
      const { results } = await DB.prepare(
        `SELECT * FROM shop_listings WHERE id IN (${placeholders})`
      ).bind(...cartIds).all();
      items = results || [];
    } else if (listingId) {
      console.log('Single item checkout - listing ID:', listingId);
      const listing = await DB.prepare('SELECT * FROM shop_listings WHERE id = ?').bind(listingId).first();
      if (!listing) {
        return new Response(
          JSON.stringify({ error: 'Listing not found', message: 'The requested item could not be found.' }), 
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      items = [listing];
    } else {
      return new Response(
        JSON.stringify({ error: 'Missing parameter', message: 'Please specify either cart=true or listing_id.' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No items found', message: 'No items to checkout.' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing', items.length, 'item(s) for checkout');

    // Initialize Stripe with proper API version
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' });
    
    // Build line items for Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: { 
          name: item.title, 
          description: item.description || '', 
          images: item.image_url ? [item.image_url] : [] 
        },
        unit_amount: Math.round((item.price || 1000) * 100),
      },
      quantity: 1,
    }));

    // Fix URL validation with domain check and proper fallback
    // Use request URL origin (works for both custom domain and Worker URL)
    const baseUrl = url.origin;
    
    // Validate the URL is properly formed
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      console.error('Invalid base URL:', baseUrl);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid URL', 
          message: 'Invalid checkout URL configuration.',
          details: 'Base URL must start with http:// or https://'
        }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const successUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/cancel`;
    
    console.log('Checkout URLs:', { baseUrl, successUrl, cancelUrl });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    console.log('Stripe session created:', session.id);

    // Clear cart if this was a cart checkout
    if (isCartCheckout) {
      await NAMESPACE.put('cart', JSON.stringify([]));
      console.log('Cart cleared after successful session creation');
    }

    // Redirect to Stripe checkout
    return Response.redirect(session.url, 303);
  } catch (error) {
    console.error('Checkout error:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack
    });
    
    // Provide user-friendly error messages based on error type
    let userMessage = 'Checkout failed. Please try again.';
    if (error.message.includes('Not a valid URL')) {
      userMessage = 'Invalid checkout URL—contact support.';
    } else if (error.message.includes('No such')) {
      userMessage = 'Invalid Stripe configuration—contact support.';
    } else if (error.type === 'StripeAuthenticationError') {
      userMessage = 'Stripe authentication failed—contact support.';
    } else if (error.type === 'StripeInvalidRequestError') {
      userMessage = 'Invalid request to Stripe—contact support.';
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Checkout failed', 
        message: userMessage, 
        details: error.message 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}