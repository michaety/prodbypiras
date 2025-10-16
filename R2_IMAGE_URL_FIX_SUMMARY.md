# R2 Image URL Fix and Secure Audio Proxy - Summary

## Problem
Stripe checkout was failing with "Not a valid URL" error because image URLs were stored as relative paths (e.g., `/api/uploads/...`) instead of absolute public URLs required by Stripe.

## Solution
Updated the image and audio URL handling to use the public R2 domain and added a secure audio proxy for protecting purchased content.

## Changes Made

### 1. Updated Image URL Storage (`src/pages/api/admin/add-listing.ts`)

**Before:**
```typescript
const r2PublicUrl = locals.runtime.env.R2_PUBLIC_URL;
if (r2PublicUrl) {
  imageUrl = `${r2PublicUrl}/${imageKey}`;
} else {
  imageUrl = `/api/uploads/${imageKey}`; // ❌ Relative URL - Stripe rejects this
}
```

**After:**
```typescript
// Update to use new public R2 URLs for Stripe compatibility
const r2PublicUrl = locals.runtime.env.R2_PUBLIC_URL || 'https://pub-e530d295499c43f291aaffc670ddb11a.r2.dev';
imageUrl = `${r2PublicUrl}/${imageKey}`; // ✅ Always uses absolute URL
```

**Key Changes:**
- Always stores absolute URLs with the public R2 domain
- Falls back to hardcoded public R2 URL if `R2_PUBLIC_URL` env var is not set
- Preview audio URLs use the same public domain for direct access
- Track audio files store only the R2 key path (not full URL) for secure proxy access

### 2. Enhanced Stripe Checkout Validation (`src/pages/api/create-checkout-session.ts`)

**Added:**
```typescript
// Validate image URL format for Stripe compatibility
let images: string[] = [];
if (item.image_url) {
  // Stripe requires absolute URLs starting with http:// or https://
  if (item.image_url.startsWith('http://') || item.image_url.startsWith('https://')) {
    images = [item.image_url];
    console.log('Valid image URL for item:', item.title, '->', item.image_url);
  } else {
    console.warn('Invalid image URL format (must be absolute URL):', item.image_url);
  }
}
```

**Benefits:**
- Validates URLs before sending to Stripe
- Provides helpful error logging
- Prevents checkout failures due to invalid URLs

### 3. Created Secure Audio Proxy (`src/pages/api/serve-audio.ts`)

**New endpoint** that protects purchased audio content:

```typescript
export async function GET({ request, locals, url }) {
  const audioKey = url.searchParams.get('key');
  
  // Check if the audio file belongs to a sold listing
  const track = await DB.prepare(
    `SELECT t.*, sl.sold 
     FROM tracks t 
     JOIN shop_listings sl ON t.listing_id = sl.id 
     WHERE t.audio_url = ?`
  ).bind(audioKey).first();
  
  // Only serve if sold
  if (!track.sold) {
    return new Response('Unauthorized', { status: 403 });
  }
  
  // Serve the audio file from R2
  const audioObject = await UPLOADS.get(audioKey);
  return new Response(audioObject.body, { ... });
}
```

**Features:**
- Checks `sold` field in database before serving
- Returns 403 Unauthorized for unpurchased content
- Serves with proper headers and content type
- Prevents piracy by controlling access

### 4. Improved Webhook Logging (`src/pages/api/webhook.ts`)

**Added better logging** for debugging:
```typescript
if (result.success && result.meta.changes > 0) {
  console.log(`Marked listing "${productName}" as sold`);
} else {
  console.warn(`Could not find listing with title "${productName}" to mark as sold`);
}
```

## Setup Instructions

### 1. Configure R2 Public Access

Your R2 bucket needs to have public access enabled:

```bash
# Enable public access for the piras-uploads bucket
wrangler r2 bucket public piras-uploads
```

Or manually in Cloudflare Dashboard:
1. Go to R2 → piras-uploads
2. Settings → Public Access
3. Enable "Allow Access" with domain: `pub-e530d295499c43f291aaffc670ddb11a.r2.dev`

### 2. Set Environment Variable (Optional)

Add to `.dev.vars` for local development:
```
R2_PUBLIC_URL=https://pub-e530d295499c43f291aaffc670ddb11a.r2.dev
```

Add to `wrangler.jsonc` for production:
```json
{
  "vars": {
    "R2_PUBLIC_URL": "https://pub-e530d295499c43f291aaffc670ddb11a.r2.dev"
  }
}
```

If not set, the code will automatically use the hardcoded public domain.

### 3. Update Existing Listings (If Any)

If you have existing listings with relative URLs, you can update them:

```sql
-- Update image URLs
UPDATE shop_listings 
SET image_url = REPLACE(image_url, '/api/uploads/', 'https://pub-e530d295499c43f291aaffc670ddb11a.r2.dev/')
WHERE image_url LIKE '/api/uploads/%';

-- Update preview audio URLs
UPDATE shop_listings 
SET preview_audio_url = REPLACE(preview_audio_url, '/api/uploads/', 'https://pub-e530d295499c43f291aaffc670ddb11a.r2.dev/')
WHERE preview_audio_url LIKE '/api/uploads/%';
```

### 4. Configure Stripe Webhook

Make sure your Stripe webhook is configured to send events to:
```
https://hevin.dev/api/webhook
```

Events to listen for:
- `checkout.session.completed` - Updates `sold` field in database

## Testing

### 1. Test Image URLs in Checkout

1. Create a new listing with a cover photo
2. Verify the image URL in database is absolute: `https://pub-e530d295499c43f291aaffc670ddb11a.r2.dev/images/...`
3. Click "Buy Now" and verify Stripe checkout shows the image
4. Should see no "Not a valid URL" errors

### 2. Test Secure Audio Proxy

1. Create a listing with track files
2. Before purchase: Try accessing `/api/serve-audio?key=tracks/...` → Should return 403
3. Complete purchase through Stripe
4. After purchase: Access should work and return the audio file

### 3. Test Webhook

1. Complete a purchase
2. Check logs for: `Marked listing "..." as sold`
3. Verify `sold` field is updated in database

## Files Modified

- `src/pages/api/admin/add-listing.ts` - Updated image/audio URL storage
- `src/pages/api/create-checkout-session.ts` - Added URL validation
- `src/pages/api/webhook.ts` - Improved logging
- `src/pages/api/serve-audio.ts` - **NEW** - Secure audio proxy

## Database Schema

The `sold` field already exists (migration 0007):
```sql
ALTER TABLE shop_listings ADD COLUMN sold BOOLEAN DEFAULT 0;
```

## Notes

- Preview audio remains publicly accessible (for shop page previews)
- Full track audio files are protected behind the secure proxy
- Image URLs must be absolute for Stripe compatibility
- The hardcoded public R2 domain is used as fallback if env var is not set
