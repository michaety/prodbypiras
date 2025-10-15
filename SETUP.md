# Music Producer Portfolio Site - Setup Guide

This is a complete music producer portfolio and shop built with Astro, Cloudflare Workers, D1, KV, and R2.

## Features

- **Portfolio Page**: Hero section with social links and featured tracks grid
- **Shop Page**: Browse all beats, samples, and packs with audio preview
- **Contact Form**: Saves submissions to KV and D1
- **Admin Dashboard**: Manage shop listings with images, metadata, and tracks
- **Stripe Integration**: Ready for checkout (requires SDK installation)
- **Dark Theme**: Navy blue background (#0f1419) with yellow accent (#ffcc00)
- **Responsive Design**: Mobile and desktop friendly

## Project Structure

```
src/
├── pages/
│   ├── index.astro              # Portfolio homepage
│   ├── shop.astro               # Shop page
│   ├── contact.astro            # Contact form
│   ├── admin/
│   │   ├── index.astro          # Admin listings grid
│   │   └── listings/
│   │       └── [id].astro       # Listing detail with tracks
│   └── api/
│       ├── contact.ts           # Contact form handler
│       ├── create-checkout-session.ts  # Stripe checkout
│       └── admin/
│           ├── delete-listing.ts
│           └── delete-track.ts
├── lib/
│   └── services/
│       ├── shop-listing.ts      # D1 service for listings
│       └── track.ts             # D1 service for tracks
└── styles/
    └── globals.css              # Dark theme styles
```

## Database Schema

### shop_listings
- `id` - Auto-increment primary key
- `title` - Listing title
- `type` - 'stems', 'samples', 'beats', or 'pack'
- `length` - Duration or track count
- `bpm` - Beats per minute
- `key` - Musical key (e.g., "Am", "G Major")
- `image_url` - R2 URL for cover image
- `preview_audio_url` - R2 URL for preview audio
- `price` - Price in USD
- `stripe_price_id` - Stripe price ID
- `description` - Description text
- `featured` - Boolean flag for homepage
- `created_at`, `updated_at` - Timestamps

### tracks
- `id` - Auto-increment primary key
- `listing_id` - Foreign key to shop_listings (CASCADE delete)
- `title` - Track title
- `length` - Duration
- `bpm` - Beats per minute
- `key` - Musical key
- `audio_url` - R2 URL for full audio
- `track_order` - Order within listing
- `created_at` - Timestamp

### contact_submissions
- `id` - Auto-increment primary key
- `name` - Submitter name
- `email` - Submitter email
- `message` - Message content
- `created_at` - Timestamp

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Cloudflare Dashboard

#### D1 Database
1. Go to Cloudflare Dashboard → D1
2. Create database named "admin" (or use existing)
3. Copy the database ID from wrangler.jsonc or update it

#### KV Namespace
1. Go to Cloudflare Dashboard → KV
2. Create namespace named "namespace"
3. Bind it as "NAMESPACE" in your Worker settings

#### R2 Bucket
1. Go to Cloudflare Dashboard → R2
2. Create bucket named "piras-uploads"
3. Bind it as "UPLOADS" in your Worker settings

#### Environment Variables (Secrets)
Set these in Worker Settings → Variables:
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `STRIPE_SECRET_KEY`: Your Stripe secret key

### 3. Run Database Migrations

For local development:
```bash
npm run db:migrate
```

For production (before deploying):
```bash
npm run db:migrate:remote
```

This will create all three tables: `shop_listings`, `tracks`, and `contact_submissions`.

### 4. Build and Deploy

#### Local Development
```bash
npm run dev
```

The site will be available at http://localhost:4321

#### Deploy to Production
Use the Cloudflare Dashboard to deploy:
1. Build the project: `npm run build`
2. Deploy via Dashboard (not npx wrangler as requested)
3. Configure bindings in Dashboard as described above

## Usage

### Adding Your First Listing

Since the "Add New Listing" form isn't implemented yet, you can add listings directly to D1:

```sql
INSERT INTO shop_listings 
  (title, type, price, description, featured, bpm, key) 
VALUES 
  ('Dark Trap Beat', 'beats', 29.99, 'Hard hitting trap beat with dark vibes', 1, 140, 'Am');
```

Or use the D1 API to insert data programmatically.

### Uploading Media

For images and audio files:
1. Upload to your R2 bucket "piras-uploads"
2. Get the public URL
3. Store the URL in the `image_url`, `preview_audio_url`, or `audio_url` fields

Example R2 URL structure:
```
https://piras-uploads.your-account.r2.cloudflarestorage.com/beat-cover.jpg
```

### Managing Content

- **Admin Dashboard**: Visit `/admin` to see all listings
- **View Listing**: Click on any listing to see details and track list
- **Delete**: Hover over a listing and click the red X button
- **Featured**: Mark listings as featured to show on homepage

## Stripe Integration

To complete the Stripe integration:

1. Install Stripe SDK:
```bash
npm install stripe
```

2. Uncomment the Stripe code in `src/pages/api/create-checkout-session.ts`

3. Set your Stripe keys in Dashboard environment variables

4. Test checkout flow

## Customization

### Styling
Edit `src/styles/globals.css` to change:
- Background color: `--background: 220 40% 8%`
- Primary color: `--primary: 48 100% 50%` (yellow)
- Font: Currently using Poppins from Google Fonts

### Content
- Update producer name in navigation (`Producer` placeholder)
- Update social links in `src/pages/index.astro`
- Update footer copyright text

### Shop Types
The shop supports these types:
- `beats` - Individual beats
- `samples` - Sample packs
- `stems` - Stem packs
- `pack` - Collection packs

Add custom types by modifying the `type` field validation.

## Troubleshoading

### Build Errors
If you get binding errors during build, make sure:
1. All bindings are configured in wrangler.jsonc
2. The binding names match the code (DB, NAMESPACE, UPLOADS)
3. You've run `npm install` after pulling changes

### Database Errors
If listings don't show:
1. Check migrations ran successfully
2. Verify D1 database is bound correctly
3. Check browser console for API errors

### Images Not Loading
1. Verify R2 bucket is public or has correct CORS settings
2. Check image URLs are valid and accessible
3. Ensure R2 binding is configured correctly

## Next Steps

1. **Add Form UI**: Create forms for adding/editing listings
2. **Upload Handler**: Add API for uploading files to R2
3. **Auth**: Add authentication to protect admin pages
4. **Search**: Add search/filter functionality to shop
5. **Cart**: Add shopping cart for multiple purchases
6. **Analytics**: Track page views and purchases

## Support

For issues or questions:
1. Check the Cloudflare Workers documentation
2. Review Astro documentation
3. Check browser console for errors
4. Verify all bindings are configured

## License

This template is based on the Cloudflare SaaS Admin Template, customized for music producer portfolios.
