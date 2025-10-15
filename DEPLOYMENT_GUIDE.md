# Deployment Guide - Music Producer Portfolio Site

This guide explains how to deploy and configure the enhanced music producer site with social media logos, shopping cart, portfolio section, admin password protection, and add listing form.

## Prerequisites

Before deploying, ensure you have:

1. A Cloudflare account
2. Wrangler CLI installed: `npm install -g wrangler`
3. D1 database created
4. KV namespace created
5. R2 bucket created
6. (Optional) Stripe account for payments

## Step 1: Configure Cloudflare Resources

### Create KV Namespace
```bash
wrangler kv:namespace create "NAMESPACE"
```

Note the ID and update `wrangler.jsonc`:
```jsonc
"kv_namespaces": [
  {
    "binding": "NAMESPACE",
    "id": "YOUR_KV_NAMESPACE_ID"
  }
]
```

### Create R2 Bucket
```bash
wrangler r2 bucket create piras-uploads
```

Update `wrangler.jsonc`:
```jsonc
"r2_buckets": [
  {
    "binding": "UPLOADS",
    "bucket_name": "piras-uploads"
  }
]
```

### Configure R2 Public Access (Optional)

To serve uploaded images/audio publicly, you can:

1. Set up a custom domain for your R2 bucket in the Cloudflare dashboard
2. Update the URLs in `src/pages/api/admin/add-listing.ts` to use your R2 public URL:

```typescript
// Replace this placeholder URL
imageUrl = `https://uploads.example.com/${imageKey}`;

// With your actual R2 public URL, e.g.:
imageUrl = `https://r2.yourdomain.com/${imageKey}`;
```

### Apply Database Migrations
```bash
# For local development
npm run db:migrate

# For production
npm run db:migrate:remote
```

## Step 2: Set Environment Variables

If using Stripe for payments, set your secret key:

```bash
wrangler secret put STRIPE_SECRET_KEY
```

When prompted, enter your Stripe secret key (starts with `sk_`).

## Step 3: Deploy

```bash
npm run deploy
```

This will:
1. Build your application
2. Copy the worker wrapper
3. Deploy to Cloudflare Workers

## Features Overview

### 1. Social Media Integration

The homepage hero section now displays icon-based social media links for:
- Instagram
- Twitter
- SoundCloud
- YouTube
- TikTok

**To customize the links**, edit `src/pages/index.astro`:
```astro
<a href="https://instagram.com/yourusername" target="_blank" rel="noopener noreferrer">
  <Instagram className="w-6 h-6" />
</a>
```

### 2. Shopping Cart System

**How it works:**
- Users can add multiple items to cart before checkout
- Cart data is stored in Cloudflare KV
- Cart persists across page refreshes
- Users can view, modify, and checkout from `/cart` page

**API Endpoints:**
- `POST /api/cart` - Add or remove items
- `GET /api/cart` - View cart contents
- `DELETE /api/cart` - Clear cart

**Usage:**
1. Browse shop at `/shop`
2. Click "Add to Cart" on any item
3. View cart at `/cart`
4. Proceed to checkout

### 3. Enhanced Portfolio Section

The featured tracks section on the homepage now includes:
- Grid layout with hover effects
- Audio preview overlays (play button appears on hover)
- Product descriptions
- Metadata display (BPM, key, length)
- Call-to-action buttons

**To feature items on the portfolio:**
1. Go to `/admin`
2. Edit a listing
3. Check the "Featured" checkbox

### 4. Admin Password Protection

All admin routes (`/admin/*`) are now protected with HTTP Basic Authentication.

**Credentials:**
- Username: `thomas`
- Password: `7Falklands`

**How it works:**
- When you visit any admin page, your browser will prompt for credentials
- Authentication is handled by `src/middleware.ts`
- Credentials are validated on every request to admin routes

**To change credentials:**
Edit `src/middleware.ts`:
```typescript
const expectedAuth = "Basic " + btoa("newusername:newpassword");
```

### 5. Add Listing Form

A comprehensive form for adding new products at `/admin/listings/new`.

**Form Fields:**
- **Basic Info**: Title, type (beats/stems/samples/pack), description
- **Music Details**: Length, BPM, key
- **Pricing**: Price (USD), optional Stripe price ID
- **Media**: Cover photo, audio preview
- **Tracks**: Multiple track files (for packs/stems)
- **Display**: Featured checkbox

**How to add a listing:**
1. Login to admin at `/admin`
2. Click "Add New Listing"
3. Fill out the form
4. Upload cover photo (recommended: square, min 600x600px)
5. Upload audio preview (customers can listen before buying)
6. (Optional) Upload individual track files for packs/stems
7. Check "Featured" to display on homepage portfolio
8. Click "Create Listing"

**File Upload Handling:**
- Files are uploaded to R2 bucket
- URLs are stored in D1 database
- Multiple track files are supported for packs

## Step 4: Stripe Integration (Optional)

To enable real Stripe checkout:

1. Install Stripe SDK:
```bash
npm install stripe
```

2. Uncomment the Stripe code in `src/pages/api/create-checkout-session.ts`:

```typescript
const stripe = new Stripe(STRIPE_SECRET_KEY);
const session = await stripe.checkout.sessions.create({
  line_items: items.map(item => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.title,
        description: item.description || '',
        images: item.image_url ? [item.image_url] : [],
      },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: 1,
  })),
  mode: 'payment',
  success_url: `${url.origin}/shop?success=true`,
  cancel_url: `${url.origin}/${isCartCheckout ? 'cart' : 'shop'}?canceled=true`,
});

if (isCartCheckout) {
  await NAMESPACE.put("cart", JSON.stringify([]));
}

return Response.redirect(session.url, 303);
```

3. Set your Stripe secret key (see Step 2)

4. Redeploy: `npm run deploy`

## Development

### Local Development
```bash
npm run dev
```

This will:
1. Apply database migrations locally
2. Build the project
3. Start Wrangler dev server on port 4321

### Preview Before Deploy
```bash
npm run preview
```

### Check Build
```bash
npm run check
```

## Troubleshooting

### "Invalid binding" Errors

Make sure all bindings in `wrangler.jsonc` are created:
- D1 database `DB`
- KV namespace `NAMESPACE`
- R2 bucket `UPLOADS`

### Images Not Displaying

1. Check that R2 bucket is public or has custom domain configured
2. Update URLs in `src/pages/api/admin/add-listing.ts`
3. Verify uploaded files exist in R2 bucket

### Cart Not Persisting

- Cart data is stored in KV which is eventually consistent
- In local development, cart is stored in `.wrangler` cache
- In production, ensure KV namespace is properly bound

### Admin Login Not Working

1. Check that middleware is applied (should be in `src/middleware.ts`)
2. Clear browser cache and try again
3. Verify credentials match those in middleware

### Build Failures

1. Run `npm install` to ensure dependencies are up to date
2. Check for TypeScript errors: `npm run astro check`
3. Verify all imports are correct

## File Structure

```
src/
├── middleware.ts                       # Admin auth middleware
├── pages/
│   ├── index.astro                    # Homepage with social icons & portfolio
│   ├── shop.astro                     # Shop page with "Add to Cart"
│   ├── cart.astro                     # Shopping cart page
│   ├── admin/
│   │   ├── index.astro               # Admin dashboard (protected)
│   │   └── listings/
│   │       ├── [id].astro            # Edit listing
│   │       └── new.astro             # Add listing form (NEW)
│   └── api/
│       ├── cart.ts                   # Cart API endpoints (NEW)
│       ├── create-checkout-session.ts # Updated for cart support
│       └── admin/
│           └── add-listing.ts         # Add listing handler (NEW)
└── lib/
    └── services/
        └── shop-listing.ts            # D1 database service
```

## Support

For issues or questions:
1. Check this guide first
2. Review Cloudflare Workers documentation: https://developers.cloudflare.com/workers/
3. Check D1 documentation: https://developers.cloudflare.com/d1/
4. Check KV documentation: https://developers.cloudflare.com/kv/
5. Check R2 documentation: https://developers.cloudflare.com/r2/

## Next Steps

After deployment:

1. **Add Sample Data**: Login to admin and add your first listing
2. **Customize Social Links**: Update URLs in `src/pages/index.astro`
3. **Configure Stripe**: Set up Stripe for real payments
4. **Setup R2 Domain**: Configure custom domain for R2 bucket
5. **Test Cart Flow**: Add items to cart and test checkout
6. **Update Branding**: Customize colors, fonts, and content

## Security Notes

- Admin credentials are in code - consider using environment variables for production
- Ensure R2 bucket permissions are configured correctly
- Use HTTPS in production (automatic with Cloudflare)
- Regularly update dependencies: `npm update`
