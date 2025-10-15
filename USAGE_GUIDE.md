# Usage Guide - Music Producer Portfolio Site

This guide shows you how to use the new features after deployment.

## For Site Administrators

### Accessing the Admin Panel

1. Navigate to `https://yourdomain.com/admin`
2. When prompted, enter credentials:
   - Username: `thomas`
   - Password: `7Falklands`
3. You'll see the admin dashboard with all your listings

### Adding a New Listing

1. Click **"Add New Listing"** button on the admin dashboard
2. Fill out the form:

#### Basic Information
- **Title**: Name of your beat/sample/pack (e.g., "Dark Trap Beat")
- **Type**: Select from dropdown (beats, stems, samples, or pack)
- **Description**: Detailed description of the product (optional but recommended)

#### Music Details
- **Length**: Duration or track count (e.g., "3:45" or "10 tracks")
- **BPM**: Tempo of the beat (e.g., 140)
- **Key**: Musical key (e.g., "Am" or "G Major")

#### Pricing
- **Price**: Cost in USD (e.g., 29.99)
- **Stripe Price ID**: If you have a pre-created Stripe price, enter it here (optional)

#### Media Files
- **Cover Photo**: Upload a square image (recommended: 600x600px or larger)
  - Supported formats: JPG, PNG, GIF
  - This image appears in the shop and portfolio
- **Preview Audio**: Upload an audio snippet customers can preview
  - Supported formats: MP3, WAV, OGG
  - Recommended: 30-60 second preview

#### Track Files (For Packs/Stems)
- Click **"+ Add Track File"** to add individual tracks
- For each track:
  - Enter track title
  - Upload the audio file
- Add as many tracks as needed
- Click the X button to remove a track

#### Display Options
- **Featured**: Check this box to display the listing on the homepage portfolio section

3. Click **"Create Listing"** to save

### Editing a Listing

1. From the admin dashboard, click on any listing card
2. Update the fields you want to change
3. Click **"Save Changes"**

### Deleting a Listing

1. From the admin dashboard, hover over a listing
2. Click the red trash icon that appears
3. Confirm deletion

### Managing Featured Items

Featured items appear on the homepage in the portfolio section:

1. Edit a listing
2. Check/uncheck the "Featured" checkbox
3. Save changes

Best practices:
- Feature 3-6 of your best items
- Update featured items regularly to keep the homepage fresh
- Choose items with good cover photos and descriptions

## For Site Visitors

### Browsing the Shop

1. Click **"Shop"** in the navigation
2. Browse all available beats, samples, and packs
3. Each item shows:
   - Cover image
   - Title and description
   - Type (beats/stems/samples/pack)
   - Music details (BPM, key, length)
   - Price

### Previewing Audio

1. Hover over any product image in the shop or portfolio
2. Click the play button that appears
3. Listen to the preview
4. Click again to stop

### Single Item Purchase

1. Browse the shop
2. Click **"Buy Now"** on any item
3. Complete the Stripe checkout process
4. Access your purchase after payment

### Using the Shopping Cart

#### Adding Items to Cart
1. Browse the shop
2. Click **"Add to Cart"** on items you want
3. See the cart count update in the navigation

#### Viewing Your Cart
1. Click **"Cart"** in the navigation
2. Review all items in your cart
3. See the total price

#### Managing Cart Items
- **Remove Item**: Click the X button next to any item
- **Clear Cart**: Click "Clear Cart" to remove all items

#### Checkout
1. Review your cart at `/cart`
2. Click **"Proceed to Checkout"**
3. Complete the Stripe payment process
4. Your cart will be cleared automatically after successful payment

### Social Media Links

Find circular social media icons on the homepage hero:
- Click any icon to visit the producer's social media profile
- Available platforms: Instagram, Twitter, SoundCloud, YouTube, TikTok

### Portfolio Section

The homepage features a portfolio grid showcasing the best work:
- Hover over any item to see the audio preview button
- Click items to view more details in the shop

## Tips & Best Practices

### For Administrators

**Product Photography**
- Use square images (1:1 aspect ratio)
- Minimum 600x600px, recommended 1200x1200px
- Use consistent branding/style across all covers
- Keep text on images minimal and readable

**Audio Previews**
- 30-60 seconds is ideal
- Start with the hook or most interesting part
- Ensure good audio quality
- Consider adding a subtle watermark/tag

**Pricing Strategy**
- Price beats individually: $20-50
- Price sample packs: $30-100+
- Price stems higher: $50-200+
- Offer bundle discounts when ready

**Descriptions**
- Be specific about what's included
- Mention file formats
- List key features
- Include usage terms
- Add inspiration/style keywords

**Featured Items**
- Rotate featured items monthly
- Feature diverse types (beats, samples, packs)
- Prioritize items with great visuals
- Test which items convert best

### For Customers

**Before Purchasing**
- Listen to all audio previews
- Read descriptions carefully
- Check BPM and key if relevant to your project
- Add multiple items to cart for bundle deals (future feature)

**Using the Cart**
- Add all items you want before checkout
- Review cart before proceeding to payment
- Cart is saved if you need to leave and come back

## Common Questions

**Q: How do I change the admin password?**
A: Edit `src/middleware.ts` and update the expected credentials, then redeploy.

**Q: Can I offer discount codes?**
A: Not yet, but this can be added through Stripe coupons. Contact your developer.

**Q: How do customers receive their files after purchase?**
A: Currently, you'll need to set up Stripe webhooks to deliver files. This is a future enhancement.

**Q: Can I see who purchased what?**
A: This requires setting up Stripe webhooks and a customer order system (future enhancement).

**Q: How many items can I add to cart?**
A: There's no limit, but we recommend 10-15 items max for optimal checkout experience.

**Q: Are cover photos required?**
A: No, but they're strongly recommended. Items without photos show a music icon placeholder.

**Q: Can I bulk upload listings?**
A: Not currently. Each listing must be added individually through the form.

**Q: How do I update my social media links?**
A: Edit `src/pages/index.astro` and update the `href` attributes, then redeploy.

## Keyboard Shortcuts

While in admin:
- `Ctrl/Cmd + N`: Quick access to new listing form (future feature)
- `Escape`: Close modals/dialogs (future feature)

## Mobile Experience

The site is fully responsive:
- All features work on mobile devices
- Touch-friendly navigation
- Optimized forms for mobile input
- Responsive grid layouts

## Accessibility

The site includes:
- Proper ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader friendly content
- Semantic HTML structure

## Getting Help

If you encounter issues:
1. Check the DEPLOYMENT_GUIDE.md for setup issues
2. Verify all Cloudflare resources are properly configured
3. Check browser console for JavaScript errors
4. Review Cloudflare Workers logs for server errors

## Future Enhancements

Planned features:
- Automatic file delivery after purchase
- Customer accounts and order history
- Discount codes and promotions
- Bulk listing import
- Sales analytics dashboard
- Email notifications
- Review/rating system
- Bulk file downloads for packs
