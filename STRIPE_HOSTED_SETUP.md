# Stripe Hosted Domains Setup Guide

This guide explains how to set up and test the Stripe hosted domains integration for checkout, payment links, and customer portal.

## Overview

The integration uses Stripe's hosted domains to avoid custom domain costs:
- **Checkout**: `checkout.stripe.com` - For cart and single-item purchases
- **Payment Links**: `buy.stripe.com` - For shareable purchase links
- **Customer Portal**: `billing.stripe.com` - For subscription management

## Prerequisites

1. Stripe account with API keys
2. Cloudflare account with Workers and D1 database
3. Environment variables configured (see below)

## Setup Steps

### 1. Apply Database Migration

Run the migration to add the `sold` column to shop_listings table:

```bash
# Local development
npm run db:migrate

# Production
npm run db:migrate:remote
```

This adds a `sold` boolean column to track which listings have been purchased.

### 2. Configure Environment Variables

#### Development (.dev.vars file)
Create or update `.dev.vars` with:

```
STRIPE_SECRET_KEY=sk_test_your_test_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

#### Production (Cloudflare Dashboard)
1. Go to your Worker settings in Cloudflare Dashboard
2. Navigate to Variables and Secrets
3. Add environment variables:
   - `STRIPE_SECRET_KEY` (encrypted)
   - `STRIPE_PUBLISHABLE_KEY` (plain text)
   - `STRIPE_WEBHOOK_SECRET` (encrypted)

Or update `wrangler.jsonc` with the webhook secret (already configured):

```json
"vars": {
  "STRIPE_WEBHOOK_SECRET": ""
}
```

Then set the value in the dashboard.

### 3. Configure Stripe Webhook

1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL:
   - Development: `https://your-dev-url.workers.dev/api/webhook`
   - Production: `https://hevin.dev/api/webhook`
4. Select events to listen for:
   - `checkout.session.completed` (required)
   - `payment_intent.succeeded` (optional, for additional confirmation)
5. Copy the webhook signing secret and add it to your environment variables

### 4. Deploy

```bash
npm run deploy
```

## API Endpoints

### 1. Create Checkout Session (checkout.stripe.com)

**Endpoint**: `GET /api/create-checkout-session`

**Usage**:
- Cart checkout: `/api/create-checkout-session?cart=true`
- Single item: `/api/create-checkout-session?listing_id=123`

**Flow**:
1. Fetches items from cart (KV) or single listing (D1)
2. Creates Stripe Checkout Session
3. Redirects to `checkout.stripe.com`
4. After payment, redirects to success or cancel page

**Example**:
```html
<!-- Cart checkout button (already in cart.astro) -->
<a href="/api/create-checkout-session?cart=true">Proceed to Checkout</a>

<!-- Single item checkout (already in shop.astro) -->
<a href="/api/create-checkout-session?listing_id=123">Buy Now</a>
```

### 2. Create Payment Link (buy.stripe.com)

**Endpoint**: `POST /api/create-payment-link`

**Usage**: Generate a shareable payment link for a specific listing

**Request Body**:
```json
{
  "listing_id": 123
}
```

**Response**:
```json
{
  "url": "https://buy.stripe.com/test_abc123..."
}
```

**Example**:
```javascript
// Generate payment link
const response = await fetch('/api/create-payment-link', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ listing_id: 123 })
});
const { url } = await response.json();
// Share the URL via email, social media, etc.
```

### 3. Create Customer Portal Session (billing.stripe.com)

**Endpoint**: `GET /api/create-portal-session`

**Usage**: Redirect to Stripe Customer Portal for subscription management

**Query Parameters**:
- `customer_id` (required): Stripe customer ID

**Flow**:
1. Creates Customer Portal session
2. Redirects to `billing.stripe.com`
3. After management, redirects back to `/admin`

**Example**:
```html
<!-- In admin panel -->
<a href="/api/create-portal-session?customer_id=cus_123">Manage Subscription</a>
```

### 4. Webhook Handler

**Endpoint**: `POST /api/webhook`

**Usage**: Receives Stripe events and updates database

**Events Handled**:
- `checkout.session.completed`: Marks purchased items as sold

**Webhook Flow**:
1. Stripe sends event to webhook endpoint
2. Verifies signature using `STRIPE_WEBHOOK_SECRET`
3. Processes event based on type
4. Updates D1 database (marks items as sold)

## Testing

### Test Checkout Flow

1. **Start local development**:
   ```bash
   npm run dev
   ```

2. **Navigate to shop page**: `http://localhost:4321/shop`

3. **Test single item purchase**:
   - Click "Buy Now" on any item
   - Should redirect to `checkout.stripe.com`
   - Complete test payment using [Stripe test cards](https://stripe.com/docs/testing)
   - Should redirect to success page

4. **Test cart checkout**:
   - Add items to cart
   - Navigate to cart page
   - Click "Proceed to Checkout"
   - Should redirect to `checkout.stripe.com`
   - Complete payment
   - Should redirect to success page

### Test Payment Links

Use a tool like curl or Postman:

```bash
curl -X POST http://localhost:4321/api/create-payment-link \
  -H "Content-Type: application/json" \
  -d '{"listing_id": 1}'
```

Response should contain a `buy.stripe.com` URL that you can share.

### Test Customer Portal

Navigate to: `http://localhost:4321/api/create-portal-session?customer_id=cus_test123`

Should redirect to Stripe's hosted customer portal.

### Test Webhook Locally

Use Stripe CLI to forward webhooks to local development:

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks
stripe listen --forward-to http://localhost:4321/api/webhook

# In another terminal, trigger test event
stripe trigger checkout.session.completed
```

Check your local server logs to see the webhook being processed.

## Troubleshooting

### "Not a valid URL" Error

**Issue**: The create-checkout-session endpoint returns a 500 error with "Not a valid URL"

**Solutions**:
- ✅ **Fixed**: The endpoint now uses `url.origin` to get the proper base URL
- This works with both custom domains and Worker URLs
- Success/cancel URLs are properly constructed with the base URL

### Webhook Signature Verification Failed

**Issue**: Webhook returns 400 error

**Solutions**:
- Verify `STRIPE_WEBHOOK_SECRET` is set correctly
- Check that the secret matches the one in Stripe Dashboard
- Ensure the webhook endpoint URL in Stripe Dashboard is correct
- Make sure the request body is passed as raw text (not parsed JSON)

### Items Not Marked as Sold

**Issue**: Purchased items not updating in database

**Solutions**:
- Check webhook is receiving events (check Stripe Dashboard > Webhooks > logs)
- Verify `checkout.session.completed` event is enabled
- Check server logs for webhook processing errors
- Ensure database migration was applied (sold column exists)

### Missing Environment Variables

**Issue**: 500 error with "Configuration error"

**Solutions**:
- Verify all environment variables are set:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET` (for webhook endpoint)
  - `DB` binding
  - `NAMESPACE` binding
- Check Cloudflare Dashboard > Workers > Settings > Variables
- For local development, check `.dev.vars` file

## Code Comments

All code includes explanatory comments:

```typescript
// Use Stripe hosted domains (checkout.stripe.com) for checkout
// webhook.ts: Use Stripe hosted domains, add webhook for D1 sync
// create-payment-link.ts: Use Stripe hosted domains (buy.stripe.com)
// create-portal-session.ts: Use Stripe hosted domains (billing.stripe.com)
```

## Next Steps

1. **Set webhook secret in dashboard**: Update `STRIPE_WEBHOOK_SECRET` in Cloudflare
2. **Test locally**: Use `npm run dev` and Stripe CLI
3. **Deploy**: Use `npm run deploy`
4. **Configure Stripe webhook**: Add production webhook endpoint
5. **Test in production**: Complete a real purchase and verify

## Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Payment Links Documentation](https://stripe.com/docs/payment-links)
- [Stripe Customer Portal Documentation](https://stripe.com/docs/customer-management/customer-portal)
- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe Testing Documentation](https://stripe.com/docs/testing)
