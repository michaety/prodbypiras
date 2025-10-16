import Stripe from 'stripe';

export const prerender = false;

export async function GET({ request, locals, url }) {
  try {
    const { STRIPE_SECRET_KEY, DB, NAMESPACE } = locals.runtime.env;

    // Debug env vars
    console.log('Env vars:', { STRIPE_SECRET_KEY, DB, NAMESPACE });

    // Validate bindings
    if (!DB || !NAMESPACE || !STRIPE_SECRET_KEY) {
      console.error('Missing bindings:', { DB, NAMESPACE, STRIPE_SECRET_KEY });
      return new Response('Configuration error', { status: 500 });
    }

    const isCartCheckout = url.searchParams.get('cart') === 'true';
    const listingId = url.searchParams.get('listing_id');

    let items = [];
    if (isCartCheckout) {
      const cartJson = await NAMESPACE.get('cart');
      const cartIds = cartJson ? JSON.parse(cartJson) : [];
      if (cartIds.length === 0) return new Response('Cart is empty', { status: 400 });
      const { results } = await DB.prepare(`SELECT * FROM shop_listings WHERE id IN (${cartIds.map(() => '?').join(',')})`).bind(...cartIds).all();
      items = results || [];
    } else if (listingId) {
      const listing = await DB.prepare('SELECT * FROM shop_listings WHERE id = ?').bind(listingId).first();
      if (!listing) return new Response('Listing not found', { status: 404 });
      items = [listing];
    } else {
      return new Response('Missing cart or listing_id', { status: 400 });
    }

    if (items.length === 0) return new Response('No items found', { status: 404 });

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' });
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.title, description: item.description || '', images: item.image_url ? [item.image_url] : [] },
        unit_amount: Math.round((item.price || 1000) * 100),
      },
      quantity: 1,
    }));

    // Hardcode URLs to bypass dynamic issues
    const siteUrl = 'https://hevin.dev';
    console.log('Using URLs:', `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`, `${siteUrl}/cancel`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cancel`,
    });

    if (isCartCheckout) await NAMESPACE.put('cart', JSON.stringify([]));
    return Response.redirect(session.url, 303);
  } catch (error) {
    console.error('Checkout error:', error.message);
    const userMessage = error.message.includes('Not a valid URL') ? 'Invalid checkout URL—contact support.' : 'Checkout failed. Try again.';
    return new Response(JSON.stringify({ error: 'Checkout failed', message: userMessage, details: error.message }), { status: 500 });
  }
}