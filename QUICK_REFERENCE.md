# Quick Reference Guide

## New Routes & Features

### 1. Dedicated Listing Page
**URL:** `/shop/listings/[id]`
**Purpose:** Display detailed view of a single listing with tracks and waveforms

**Features:**
- Large cover image
- Listing metadata (type, length, BPM, key)
- Price and purchase buttons
- Preview audio with waveform visualization
- Track list with individual waveforms (if multiple tracks)
- Responsive layout

**Usage:**
1. Navigate to any listing from shop or home page
2. Click "View Details" button
3. Preview audio with waveform
4. View and play individual tracks
5. Add to cart or buy now

---

### 2. Edit Listing
**URL:** `/admin/listings/edit/[id]`
**Purpose:** Edit existing listing details

**How to Access:**
1. Go to admin dashboard (`/admin`)
2. Hover over any listing card
3. Click the edit icon (pencil) in top-left corner
4. OR click on listing to view details, then click "Edit Listing" button

**Editable Fields:**
- Title, Type, Price (required)
- Description, Length, BPM, Key (optional)
- Featured checkbox
- Image URL, Preview Audio URL
- Stripe Price ID

**Submit:**
- Click "Save Changes" → redirects to listing detail
- Click "Cancel" → returns to listing detail

---

### 3. Admin Dashboard Enhancements
**URL:** `/admin`

**New Stats Cards:**
1. **Total Listings** - Shows count of all products
2. **Total Sales** - Number of items sold
3. **Total Revenue** - Dollar amount earned
4. **Total Customers** - User count + new this month

**Active Promotions:**
- Displays current promo codes
- BEATS20: 20% off for first-time customers

**Enhanced Listing Cards:**
- Edit button (top-left on hover)
- Delete button (top-right on hover)
- Play/pause preview audio (center on hover)
- Timeline progress bar (bottom on hover)

---

### 4. Home Page Updates
**URL:** `/`

**Fixes:**
- ✅ Play/pause button toggles correctly
- ✅ Timeline/scrub bar shows progress
- ✅ "View Details" links to `/shop/listings/[id]`

**New Promo Pop-up:**
- Appears once per visitor (localStorage tracking)
- Shows BEATS20 promo code
- Copy-to-clipboard button
- Close with X or click outside
- 1-second delay after page load

---

## Quick Code Snippets

### Using the New Listing Link
```astro
<!-- Old way (shop page) -->
<a href="/shop">View Details</a>

<!-- New way (dedicated listing page) -->
<a href={`/shop/listings/${listing.id}`}>View Details</a>
```

### Adding a Waveform
```javascript
import WaveSurfer from 'wavesurfer.js';

const wavesurfer = WaveSurfer.create({
  container: '#waveform',
  waveColor: 'rgb(147, 51, 234)',
  progressColor: 'rgb(168, 85, 247)',
  height: 80,
  barWidth: 2,
  barRadius: 3,
});

wavesurfer.load(audioUrl);
```

### Updating a Listing (API)
```javascript
const formData = new FormData();
formData.append('id', '123');
formData.append('title', 'New Title');
formData.append('price', '29.99');

const response = await fetch('/api/admin/update-listing', {
  method: 'POST',
  body: formData,
});
```

### Checking Promo Status
```javascript
// Check if user has seen promo
const hasSeenPromo = localStorage.getItem('hasSeenPromo');

// Mark as seen
localStorage.setItem('hasSeenPromo', 'true');
```

---

## Database Schema Reference

### shop_listings
- `id` - Primary key
- `title` - Listing name
- `type` - beat/sample/stems/pack
- `price` - Decimal(10,2)
- `description` - Text
- `length`, `bpm`, `key` - Metadata
- `image_url` - R2 bucket URL
- `preview_audio_url` - R2 bucket URL
- `stripe_price_id` - Stripe integration
- `featured` - Boolean (show on home)
- `sold` - Count of sales
- `created_at`, `updated_at`

### tracks
- `id` - Primary key
- `listing_id` - Foreign key
- `title` - Track name
- `length`, `bpm`, `key` - Metadata
- `audio_url` - R2 bucket URL
- `track_order` - Display order
- `created_at`

---

## Testing Checklist

Before deploying:

**Dedicated Listing Page:**
- [ ] Navigate to `/shop/listings/1` (or any valid ID)
- [ ] Verify cover image displays
- [ ] Play preview audio and see waveform
- [ ] Check track list appears (if tracks exist)
- [ ] Play individual tracks
- [ ] Test "Add to Cart" button
- [ ] Test "Buy Now" button

**Edit Functionality:**
- [ ] Access edit page from admin
- [ ] Modify title and save
- [ ] Verify redirect to detail page
- [ ] Check database updated
- [ ] Test form validation (empty required fields)

**Admin Dashboard:**
- [ ] Verify stats cards show correct numbers
- [ ] Hover over listing and see edit/delete buttons
- [ ] Play preview audio
- [ ] Watch timeline progress
- [ ] Check promotions section

**Home Page:**
- [ ] Play a featured listing preview
- [ ] Verify play/pause toggle works
- [ ] Check timeline appears
- [ ] Click "View Details" and verify URL
- [ ] See promo pop-up on first visit
- [ ] Copy BEATS20 code
- [ ] Close pop-up and verify no re-show

**Responsive Design:**
- [ ] Test on mobile (< 768px)
- [ ] Test on tablet (768px - 1024px)
- [ ] Test on desktop (> 1024px)

---

## Troubleshooting

### Waveform Not Appearing
- Check audio URL is valid and accessible
- Open browser console for errors
- Verify WaveSurfer.js is loaded
- Check CORS headers on R2 bucket

### Edit Button Not Working
- Verify listing ID in URL
- Check network tab for 404s
- Ensure edit page route exists
- Check admin permissions

### Promo Pop-up Always Showing
- Clear localStorage: `localStorage.removeItem('hasSeenPromo')`
- Check browser console for errors
- Verify pop-up element exists in DOM

### Stats Not Updating
- Check D1 database connection
- Verify SQL queries execute
- Look for console errors
- Ensure tables have data

---

## Next Steps

Potential enhancements:
1. Add search/filter to listings
2. Implement bulk edit
3. Create promotion management UI
4. Add purchase history
5. Build analytics charts
6. Add export functionality
7. Implement user reviews

---

For detailed technical documentation, see `IMPLEMENTATION_DETAILS.md`.
