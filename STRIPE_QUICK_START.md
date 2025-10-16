# Stripe Integration Quick Start (Beginner-Friendly)

This is a simple guide for setting up Stripe payments on your music producer site using hosted pages (no custom domain needed).

## What This Does

- ✅ Customers can buy beats/samples from your shop
- ✅ Payments are processed securely on Stripe's website (checkout.stripe.com)
- ✅ Sold items are automatically marked as sold in your database
- ✅ No need to set up custom domains for payments

## Setup in 5 Minutes

### Step 1: Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click "Developers" → "API Keys"
3. Copy your **Publishable key** (starts with `pk_test_`)
4. Copy your **Secret key** (starts with `sk_test_`) - click "Reveal test key"

### Step 2: Set Environment Variables

**Option A: Using Cloudflare Dashboard (Recommended)**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your Worker
3. Go to "Settings" → "Variables and Secrets"
4. Add these variables (click "Add variable"):
   - Name: `STRIPE_SECRET_KEY`, Value: `sk_test_your_key_here`, Type: Encrypted
   - Name: `STRIPE_PUBLISHABLE_KEY`, Value: `pk_test_your_key_here`, Type: Plain text
   - Name: `STRIPE_WEBHOOK_SECRET`, Value: (leave empty for now), Type: Encrypted

**Option B: For Local Testing**

Create a file named `.dev.vars` in your project root:

```
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

### Step 3: Run Database Migration

Open your terminal and run:

```bash
# For local database
npm run db:migrate

# For production database (after deploy)
npm run db:migrate:remote
```

This adds a "sold" column to track which items have been purchased.

### Step 4: Deploy Your Site

```bash
npm run deploy
```

### Step 5: Set Up Webhook

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter: `https://hevin.dev/api/webhook` (or your domain)
4. Click "Select events"
5. Choose: `checkout.session.completed`
6. Click "Add endpoint"
7. Copy the **Signing secret** (starts with `whsec_`)
8. Go back to Cloudflare Dashboard → Variables and Secrets
9. Update `STRIPE_WEBHOOK_SECRET` with the signing secret

**Done!** Your Stripe integration is now active.

## How It Works

### For Customers:

1. **Browse Shop**: Customer visits your shop page
2. **Add to Cart**: Click "Add to Cart" or "Buy Now"
3. **Checkout**: Click "Proceed to Checkout"
4. **Pay on Stripe**: Redirects to secure Stripe page (checkout.stripe.com)
5. **Complete Purchase**: After payment, returns to your success page
6. **Item Marked Sold**: Database automatically updates

### Behind the Scenes:

```
Your Shop → Create Checkout Session → Stripe Hosted Checkout → Payment → Webhook → Update Database
```

## Testing With Test Cards

Use these test credit cards (they won't charge real money):

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Auth**: `4000 0025 0000 3155`

Use any future expiration date, any 3-digit CVC, and any ZIP code.

[More test cards](https://stripe.com/docs/testing)

## Testing Locally

1. Start your local server:
   ```bash
   npm run dev
   ```

2. Open browser to `http://localhost:4321/shop`

3. Try buying an item - it will redirect to Stripe's test checkout

4. Use test card `4242 4242 4242 4242` to complete purchase

5. Check if it redirects back to success page

## Common Issues

### ❌ "Not a valid URL" Error

**Fixed!** The code now automatically uses the correct domain.

### ❌ "Configuration error"

- Make sure you added the environment variables in Cloudflare Dashboard
- Check that they match your Stripe keys exactly (no extra spaces)

### ❌ Items Not Marked as Sold

- Make sure webhook is set up in Stripe Dashboard
- Verify webhook secret is correct in Cloudflare variables
- Check Stripe Dashboard > Webhooks > Your endpoint > Events log

### ❌ "Webhook signature verification failed"

- The webhook secret in Cloudflare must match the one from Stripe Dashboard
- Go to Stripe > Webhooks > Click your endpoint > "Signing secret"

## File Structure

Here's what was added/changed:

```
migrations/
  └── 0007_add_sold_to_shop_listings.sql  ← Adds 'sold' column

src/pages/api/
  ├── create-checkout-session.ts  ← Updated (checkout.stripe.com)
  ├── create-payment-link.ts      ← NEW (buy.stripe.com)
  ├── create-portal-session.ts    ← NEW (billing.stripe.com)
  └── webhook.ts                  ← NEW (receives payment events)

wrangler.jsonc  ← Updated (added webhook secret config)
```

## Copy-Paste Code Examples

### Example 1: Add Payment Link Button to Shop

If you want to add a "Share Link" button to generate a payment link:

```typescript
// In shop.astro, add this function to the script section:
async function generatePaymentLink(listingId) {
  const response = await fetch('/api/create-payment-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listing_id: listingId })
  });
  const { url } = await response.json();
  
  // Copy to clipboard
  navigator.clipboard.writeText(url);
  alert('Payment link copied! Share it anywhere.');
}
```

Then add a button:
```html
<button onclick="generatePaymentLink(123)">
  Share Payment Link
</button>
```

### Example 2: Add Customer Portal Link to Admin

If you have customer IDs and want to let them manage subscriptions:

```html
<!-- In admin panel -->
<a href="/api/create-portal-session?customer_id=cus_abc123">
  Manage My Subscription
</a>
```

## What Each File Does (Simple Explanation)

| File | What It Does |
|------|--------------|
| `create-checkout-session.ts` | Creates a payment page on Stripe and redirects user there |
| `create-payment-link.ts` | Generates a shareable link for a product (like `buy.stripe.com/abc123`) |
| `create-portal-session.ts` | Creates a page where customers can manage their subscriptions |
| `webhook.ts` | Listens for payment success and marks items as sold in database |
| `0007_add_sold_to_shop_listings.sql` | Adds a "sold" field to your products table |

## Need Help?

- Check the detailed guide: `STRIPE_HOSTED_SETUP.md`
- Stripe documentation: https://stripe.com/docs
- Test in Stripe test mode first (keys starting with `pk_test_` and `sk_test_`)
- Check Cloudflare Worker logs for errors

## Going Live (Production)

When you're ready to accept real payments:

1. Complete Stripe account verification
2. Get your **live** keys from Stripe (start with `pk_live_` and `sk_live_`)
3. Update environment variables in Cloudflare with live keys
4. Create a new webhook endpoint in Stripe with live mode selected
5. Test with a small real purchase
6. You're live! 🎉

---

**Remember**: Always test in test mode first. Never share your secret keys. Keep them encrypted in Cloudflare.
