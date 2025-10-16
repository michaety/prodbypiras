import Stripe from 'stripe';

// Use Stripe hosted domains (billing.stripe.com) for Customer Portal
export const prerender = false;

export async function GET({ request, locals, url }) {
  try {
    const { STRIPE_SECRET_KEY } = locals.runtime.env;

    // Validate environment variables
    if (!STRIPE_SECRET_KEY) {
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

    // Get customer ID from query parameter
    const customerId = url.searchParams.get('customer_id');
    
    if (!customerId) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing parameter', 
          message: 'customer_id is required' 
        }), 
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' });
    
    // Get the base URL from the request
    const baseUrl = url.origin;
    
    // Create Customer Portal session (redirects to billing.stripe.com)
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/admin`,
    });

    console.log('Customer Portal session created:', session.id, 'for customer:', customerId);

    // Redirect to Stripe's hosted Customer Portal
    return Response.redirect(session.url, 303);
  } catch (error) {
    console.error('Customer Portal session error:', error);
    
    // Provide user-friendly error message
    let userMessage = 'Failed to create portal session. Please try again.';
    if (error.message.includes('No such customer')) {
      userMessage = 'Invalid customer ID. Please contact support.';
    } else if (error.type === 'StripeAuthenticationError') {
      userMessage = 'Stripe authentication failed. Please contact support.';
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Portal session failed', 
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
