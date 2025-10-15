# Music Producer Portfolio - Architecture Overview

## Site Map

```
┌─────────────────────────────────────────────────────────────┐
│                      PUBLIC SITE                             │
└─────────────────────────────────────────────────────────────┘

/ (Portfolio Homepage)
├── Hero with producer name
├── Social media links (Instagram, Twitter, SoundCloud)
└── Featured tracks grid (max 6)
    └── Links to /shop

/shop (Shop Page)
├── All listings grid
├── Audio preview on hover
└── Buy Now buttons → /api/create-checkout-session

/contact (Contact Form)
├── Name, email, message fields
└── POST /api/contact → Saves to KV + D1

┌─────────────────────────────────────────────────────────────┐
│                      ADMIN AREA                              │
└─────────────────────────────────────────────────────────────┘

/admin (Listings Management)
├── Grid of all shop listings
├── + Add New Listing button
├── Red X delete on hover
└── Click listing → /admin/listings/[id]

/admin/listings/[id] (Listing Detail)
├── Full listing information
│   ├── Cover image
│   ├── Title, type, BPM, key
│   ├── Price and description
│   └── Preview audio player
├── Track list
│   ├── Track number
│   ├── Title, length, BPM, key
│   ├── Audio preview button
│   └── Delete track button
└── + Add Track button (placeholder)
```

## Data Flow

### Frontend → Backend

```
Portfolio Page
    ↓ (fetches featured listings)
    ShopListingService.getFeatured()
    ↓
    D1 Query: SELECT * WHERE featured = 1
    ↓
    Returns array of listings

Shop Page
    ↓ (fetches all listings)
    ShopListingService.getAll()
    ↓
    D1 Query: SELECT * FROM shop_listings
    ↓
    Returns array of listings

Contact Form
    ↓ (submits form data)
    POST /api/contact
    ↓
    Saves to KV: contact:{timestamp}
    Saves to D1: contact_submissions table
    ↓
    Returns success/error

Admin Listings
    ↓ (fetches all listings)
    ShopListingService.getAll()
    ↓
    D1 Query: SELECT * FROM shop_listings
    ↓
    Returns array of listings

Listing Detail
    ↓ (fetches listing + tracks)
    ShopListingService.getById(id)
    TrackService.getByListingId(id)
    ↓
    D1 Queries
    ↓
    Returns listing object + tracks array

Delete Actions
    ↓ (delete request)
    DELETE /api/admin/delete-listing?id=X
    DELETE /api/admin/delete-track?id=Y
    ↓
    D1: DELETE FROM table WHERE id = ?
    ↓
    Returns success/error
```

## Technology Stack

### Frontend
- **Framework**: Astro 5.10.1 (server-side rendering)
- **UI Components**: Shadcn UI (React components)
- **Styling**: Tailwind CSS with custom dark theme
- **Icons**: Lucide React
- **Fonts**: Poppins (Google Fonts)

### Backend
- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (object storage)
- **Cache**: Cloudflare KV (key-value store)
- **Validation**: Zod (not yet implemented)

### APIs & Integrations
- **Payments**: Stripe Checkout (placeholder)
- **Media**: R2 URLs for images and audio

## Database Architecture

```
┌──────────────────────────────────────┐
│         shop_listings                │
├──────────────────────────────────────┤
│ id (PK)                              │
│ title                                │
│ type (beats/samples/stems/pack)      │
│ length                               │
│ bpm                                  │
│ key                                  │
│ image_url (R2)                       │
│ preview_audio_url (R2)               │
│ price                                │
│ stripe_price_id                      │
│ description                          │
│ featured (boolean)                   │
│ created_at                           │
│ updated_at                           │
└──────────────────────────────────────┘
         │
         │ 1:N
         ↓
┌──────────────────────────────────────┐
│            tracks                    │
├──────────────────────────────────────┤
│ id (PK)                              │
│ listing_id (FK → shop_listings.id)   │
│ title                                │
│ length                               │
│ bpm                                  │
│ key                                  │
│ audio_url (R2)                       │
│ track_order                          │
│ created_at                           │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│       contact_submissions            │
├──────────────────────────────────────┤
│ id (PK)                              │
│ name                                 │
│ email                                │
│ message                              │
│ created_at                           │
└──────────────────────────────────────┘
```

## Service Layer

```
ShopListingService
├── getAll() - Fetch all listings
├── getFeatured() - Fetch featured listings
├── getById(id) - Fetch single listing
├── create(data) - Create new listing
├── update(id, data) - Update listing
└── delete(id) - Delete listing

TrackService
├── getByListingId(listingId) - Fetch tracks for listing
├── getById(id) - Fetch single track
├── create(data) - Create new track
├── update(id, data) - Update track
├── delete(id) - Delete track
└── deleteByListingId(listingId) - Delete all tracks
```

## Cloudflare Bindings

```
Environment Variables (Secrets)
├── STRIPE_PUBLISHABLE_KEY
└── STRIPE_SECRET_KEY

D1 Database
└── DB = "admin"

KV Namespace
└── NAMESPACE = "namespace"

R2 Bucket
└── UPLOADS = "piras-uploads"

Workflow
└── CUSTOMER_WORKFLOW = "saas-admin-template-customer-workflow"
```

## Theme & Styling

### Color Palette
```
Background:       #0f1419 (dark navy)
Card:             #1a1f2e (lighter navy)
Border:           #2a3441 (subtle border)
Primary:          #ffcc00 (yellow accent)
Text:             #ffffff (white)
Muted Text:       #94a3b8 (gray)
```

### Typography
```
Font Family:      'Poppins', sans-serif
Headings:         Bold, tracking-tight
Body:             Regular, comfortable line-height
Code:             Monospace (for technical elements)
```

### Layout
```
Container:        max-width with auto margins
Padding:          px-6 (mobile), px-8 (desktop)
Grid:             1 col (mobile) → 3-4 cols (desktop)
Spacing:          Consistent gap-4 to gap-6
```

## API Endpoints

### Public APIs
```
POST /api/contact
  - Accepts: FormData (name, email, message)
  - Returns: JSON { success, message }
  - Saves to: KV + D1

GET /api/create-checkout-session?listing_id=X
  - Creates Stripe checkout session
  - Redirects to Stripe or placeholder page
```

### Admin APIs
```
DELETE /api/admin/delete-listing?id=X
  - Deletes listing and associated tracks
  - Returns: JSON { success, message }

DELETE /api/admin/delete-track?id=X
  - Deletes single track
  - Returns: JSON { success, message }
```

## Performance Optimizations

### Caching Strategy
```
Static Assets (_astro/*)
├── Cache-Control: public, max-age=31536000, immutable
└── Permanent cache with hash-based URLs

Images & Media
├── Cache-Control: public, max-age=86400
└── 24-hour cache

API Responses
├── No caching (always fresh data)
└── Real-time updates
```

### Asset Optimization
- Images: Serve from R2 with CDN
- Audio: Stream from R2 with range requests
- CSS/JS: Bundled and minified by Vite
- Fonts: Google Fonts with preconnect

## Security Headers

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: Restrictive (no camera, microphone, etc.)
```

## Deployment Flow

```
Local Development
    ↓
    npm run build
    ↓
    Astro builds SSR output
    ↓
    Vite bundles client assets
    ↓
    dist/ directory created
    ↓
    Deploy via Cloudflare Dashboard
    ↓
    Worker deployed to edge
    ↓
    Live at your domain
```

## Future Enhancements

### Short Term
- [ ] Add listing/track creation forms
- [ ] File upload to R2
- [ ] Admin authentication
- [ ] Complete Stripe integration

### Medium Term
- [ ] Search and filter on shop page
- [ ] Shopping cart functionality
- [ ] User accounts and order history
- [ ] Email notifications

### Long Term
- [ ] Analytics dashboard
- [ ] License key generation
- [ ] Download management
- [ ] Affiliate system

## Monitoring & Debugging

### Logs
- Worker logs: Cloudflare Dashboard → Workers → Logs
- D1 queries: D1 Dashboard → Query history
- KV operations: KV Dashboard → Metrics

### Metrics
- Request count and latency
- Database query performance
- R2 bandwidth usage
- Error rates

### Testing
- Build: `npm run build`
- Local dev: `npm run dev`
- Type check: `npm run astro check`
- Dry run: `npm run check`
