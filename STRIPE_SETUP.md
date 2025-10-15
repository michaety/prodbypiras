# Stripe Integration Setup Guide

This guide will help you set up Stripe payment integration for your producer portfolio website.

## Prerequisites

- A Stripe account (sign up at https://stripe.com)
- Access to the Cloudflare dashboard for your deployed application

## Step 1: Get Your Stripe Secret Key

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API keys**
3. Copy your **Secret key**
   - For testing: Use the key starting with `sk_test_`
   - For production: Use the key starting with `sk_live_`

> ⚠️ **Important**: Never share your secret key or commit it to your repository!

## Step 2: Configure Local Development

1. Create or update your `.dev.vars` file in the project root:

```bash
cp .dev.vars.example .dev.vars
```

2. Add your Stripe test secret key:

```
API_TOKEN=your_token_here
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key_here
```

3. Start the development server:

```bash
npm run dev
```

## Step 3: Configure Production (Cloudflare Dashboard)

### Option A: Using Cloudflare Dashboard

1. Go to your [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → Select your application
3. Go to **Settings** → **Variables and Secrets**
4. Under **Environment Variables**, click **Add variable**
5. Add:
   - **Variable name**: `STRIPE_SECRET_KEY`
   - **Value**: Your production Stripe secret key (starts with `sk_live_`)
   - Select **Encrypt** to make it a secret
6. Click **Save**

### Option B: Using Wrangler CLI

```bash
npx wrangler secret put STRIPE_SECRET_KEY
```

When prompted, paste your production Stripe secret key.

## Step 4: Test the Integration

1. Add a product in the admin dashboard (`/admin/listings/new`)
2. Visit the shop page (`/shop`)
3. Click **Buy Now** on any product
4. You should be redirected to Stripe Checkout
5. Use [Stripe test cards](https://stripe.com/docs/testing) to complete a test purchase:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Use any future expiry date and any 3-digit CVC

## Step 5: Go Live

When you're ready to accept real payments:

1. Activate your Stripe account (complete business verification)
2. Update the `STRIPE_SECRET_KEY` in production with your live key (`sk_live_...`)
3. Test with a real card to ensure everything works
4. Monitor your [Stripe Dashboard](https://dashboard.stripe.com) for transactions

## Features Implemented

✅ **Single Item Checkout**: Users can buy individual products  
✅ **Cart Checkout**: Users can add multiple items to cart and checkout together  
✅ **Automatic Price Conversion**: Prices are automatically converted to cents for Stripe  
✅ **Product Metadata**: Product images and descriptions are passed to Stripe Checkout  
✅ **Success/Cancel URLs**: Users are redirected appropriately after checkout  

## Troubleshooting

### "Stripe not configured" Error

**Problem**: You see an error message about Stripe not being configured.

**Solution**: Make sure you've set the `STRIPE_SECRET_KEY` environment variable in:
- `.dev.vars` for local development
- Cloudflare Dashboard or `wrangler secret` for production

### Checkout Page Not Loading

**Problem**: The checkout page doesn't load or shows an error.

**Solution**: 
1. Check your Stripe secret key is valid
2. Ensure the key matches your environment (test key for dev, live key for production)
3. Check the browser console for specific error messages

### Payments Not Appearing in Stripe

**Problem**: Test payments aren't showing in your Stripe Dashboard.

**Solution**:
1. Make sure you're viewing the correct mode (Test/Live) in Stripe Dashboard
2. Navigate to **Payments** in the Stripe Dashboard
3. If using test keys, payments will only appear in test mode

## Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing Cards](https://stripe.com/docs/testing)
- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)

## Support

If you encounter issues:
1. Check the Cloudflare Workers logs in your dashboard
2. Review the Stripe Dashboard logs for API errors
3. Enable debug mode in your browser's developer console
