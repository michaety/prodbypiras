import Stripe from 'stripe';

// Use Stripe hosted domains, add webhook for D1 sync
export const prerender = false;

export async function POST({ request, locals }) {
  try {
    const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, DB } = locals.runtime.env;
    
    // Validate environment variables
    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !DB) {
      console.error('Missing required environment variables for webhook');
      return new Response('Configuration error', { status: 500 });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' });
    const sig = request.headers.get('stripe-signature');
    const body = await request.text();

    if (!sig) {
      console.error('Missing stripe-signature header');
      return new Response('Missing signature', { status: 400 });
    }

    // Verify webhook signature and construct event
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log('Webhook received:', event.type);

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Processing checkout session:', session.id);

      // Get line items from the session to determine what was purchased
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
      
      // Update sold status for each purchased item
      // Note: We use product name matching since we create prices dynamically
      for (const item of lineItems.data) {
        // Stripe line items have the product name in the description field
        const productName = item.description;
        if (productName) {
          // Try to match by product name/title
          const result = await DB.prepare(
            'UPDATE shop_listings SET sold = 1 WHERE title = ? AND sold = 0'
          ).bind(productName).run();
          
          if (result.success && result.meta.changes > 0) {
            console.log(`Marked listing "${productName}" as sold`);
          } else {
            console.warn(`Could not find listing with title "${productName}" to mark as sold`);
          }
        }
      }
    }

    // Handle payment_intent.succeeded for additional confirmation
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('Payment succeeded:', paymentIntent.id);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
