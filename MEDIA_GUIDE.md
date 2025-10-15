# Media Upload Guide

This guide explains the image and audio upload features for the producer portfolio.

## Image Upload & WebP Conversion

### What Happens When You Upload Images

When you upload an image for a product listing, the system automatically:

1. **Converts to WebP Format**: All images (JPG, PNG, GIF, etc.) are automatically converted to WebP format
2. **Optimizes File Size**: Images are compressed to a maximum of 1MB while maintaining quality
3. **Resizes**: Images are resized to a maximum dimension of 1920px (maintains aspect ratio)
4. **Sets Proper MIME Type**: Files are uploaded to R2 with the correct `image/webp` content type

### Benefits of WebP

- **Smaller File Sizes**: WebP images are typically 25-35% smaller than JPG/PNG
- **Better Quality**: Superior compression at the same file size
- **Universal Support**: Supported by all modern browsers
- **Faster Loading**: Smaller files mean faster page loads for your customers

### Supported Input Formats

You can upload images in any of these formats:
- JPEG/JPG
- PNG
- GIF
- BMP
- TIFF
- WebP (will be re-optimized)

### Recommended Image Specifications

For best results:
- **Minimum Size**: 600x600 pixels
- **Recommended Size**: 1200x1200 pixels (will be optimized automatically)
- **Aspect Ratio**: Square (1:1) for product thumbnails
- **File Size**: Any size (will be compressed automatically)

## Audio Upload

### Audio Preview Files

When uploading audio files for product listings, the system:

1. **Detects File Type**: Automatically detects the audio format (MP3, WAV, OGG, M4A)
2. **Sets MIME Type**: Uploads with the correct content type for browser playback
3. **Stores in R2**: Files are stored in the `audio/previews/` directory

### Supported Audio Formats

- **MP3** (audio/mpeg) - Recommended for best compatibility
- **WAV** (audio/wav) - High quality, larger file size
- **OGG** (audio/ogg) - Open format, good compression
- **M4A** (audio/mp4) - Apple audio format

### Audio Preview Best Practices

- **Duration**: Upload a 20-30 second preview clip (manual trimming required currently)
- **Quality**: Use 128-192 kbps for MP3 files
- **File Size**: Keep previews under 5MB for fast loading
- **Format**: MP3 is recommended for best browser compatibility

### Creating Audio Previews

The system currently accepts full audio files. To create a proper preview:

**Option 1: Use Online Tools**
- [Audio Trimmer](https://audiotrimmer.com)
- [Online Audio Cutter](https://online-audio-converter.com)

**Option 2: Use Audio Software**
- Audacity (free)
- Adobe Audition
- Logic Pro / Ableton / FL Studio

**Steps:**
1. Open your full audio file
2. Select the most interesting 20 seconds (usually the hook or main section)
3. Export as MP3 (128-192 kbps)
4. Upload the exported file as the preview

### Future Enhancement: Automatic Audio Trimming

> **Note**: Automatic 20-second preview generation is planned for a future update using FFmpeg.wasm. This will allow the system to automatically trim uploaded audio files to 20 seconds.

## Track Files (Full Products)

For product track files (the files customers download after purchase):

1. **Full Quality**: Upload your full-quality audio files
2. **Multiple Tracks**: You can upload multiple track files for packs or stems
3. **Formats**: Same audio formats supported (MP3, WAV, OGG, M4A)
4. **MIME Types**: Automatically set for proper downloads

## R2 Bucket Configuration

### Public Access

For images and audio to display properly, your R2 bucket needs to be configured with public access:

1. Go to **Cloudflare Dashboard** → **R2**
2. Select your bucket (default: `piras-uploads`)
3. Go to **Settings** → **Public access**
4. Enable **Allow Access** or set up a custom domain

### Custom Domain (Recommended)

Instead of using the default R2 URL, set up a custom domain:

1. Go to your R2 bucket settings
2. Click **Connect Domain**
3. Add a custom domain (e.g., `uploads.yourdomain.com`)
4. Update the URL in `add-listing.ts` from `https://uploads.example.com/` to your custom domain

## Troubleshooting

### Images Not Displaying

**Problem**: Uploaded images show broken image icons

**Solutions**:
1. Check R2 bucket has public access enabled
2. Verify the R2 URL in the code matches your bucket domain
3. Check browser console for CORS errors
4. Ensure images were uploaded with correct content type (`image/webp`)

### Audio Not Playing

**Problem**: Audio preview button doesn't work or shows errors

**Solutions**:
1. Verify R2 bucket has public access for audio files
2. Check that audio files have correct MIME types
3. Test audio URL directly in browser
4. Check browser console for playback errors
5. Ensure audio format is supported by the browser (MP3 is most compatible)

### Upload Fails

**Problem**: File upload returns an error

**Solutions**:
1. Check file size (very large files may timeout)
2. Verify R2 bucket binding in `wrangler.jsonc` is correct
3. Check Cloudflare Workers logs for specific errors
4. Ensure you have write permissions to the R2 bucket

## File Storage Structure

Your R2 bucket will have this structure:

```
piras-uploads/
├── images/
│   ├── 1634567890_product1.webp
│   └── 1634567891_product2.webp
├── audio/
│   └── previews/
│       ├── 1634567892_preview1.mp3
│       └── 1634567893_preview2.mp3
└── tracks/
    ├── 1634567894_0_full_track.mp3
    └── 1634567895_1_full_track.wav
```

## Admin Upload Interface

### Adding a New Listing

1. Navigate to `/admin/listings/new`
2. Fill in product details (title, type, price, etc.)
3. **Cover Photo**: Click "Choose File" under "Cover Photo"
   - Select any image format
   - System will automatically convert to WebP
4. **Preview Audio**: Click "Choose File" under "Preview Audio"
   - Upload a pre-trimmed 20-second preview
   - System will detect format and set MIME type
5. **Track Files** (Optional): Click "+ Add Track File" to add downloadable tracks
6. Click **Create Listing**

### Viewing Uploaded Media

After creating a listing:
- **Shop Page** (`/shop`): Images display automatically
- **Admin Dashboard** (`/admin`): Thumbnails shown for all listings
- **Audio Previews**: Hover over product cards and click play button

## Best Practices Summary

✅ **Images**: Upload high-quality square images (1200x1200px minimum)  
✅ **Audio Previews**: Pre-trim to 20 seconds, use MP3 format  
✅ **Track Files**: Use lossless formats (WAV) or high-quality MP3 (320 kbps)  
✅ **File Names**: Use descriptive names (they're timestamped automatically)  
✅ **Testing**: Test uploads in dev environment before production  

## Support

For issues with media uploads:
1. Check Cloudflare Workers logs
2. Verify R2 bucket settings and permissions
3. Test with different file formats and sizes
4. Review browser console for client-side errors
