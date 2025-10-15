# Media Upload Guide

This guide explains the image and audio upload features for the producer portfolio.

## Image Upload & WebP Conversion

### What Happens When You Upload Images

When you upload an image for a product listing, the system automatically:

1. **Converts to WebP Format**: Images are converted to WebP format on the client-side before upload (JPG, PNG, GIF, etc.)
2. **Optimizes File Size**: Images are compressed with 85% quality for optimal balance of size and quality
3. **Resizes**: Images are resized to a maximum dimension of 1920px (maintains aspect ratio)
4. **Sets Proper MIME Type**: Files are uploaded to R2 with the correct `image/webp` content type
5. **Stores in R2**: Files are stored securely in Cloudflare R2 bucket

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

**Important**: The system stores audio files as uploaded. For best results, manually create a 20-second preview before uploading.

**Option 1: Use Online Tools (Easiest)**
- [Audio Trimmer](https://audiotrimmer.com) - Free, no account needed
- [Online Audio Cutter](https://mp3cut.net) - Simple and fast
- [TwistedWave Online](https://twistedwave.com/online) - More advanced editing

**Option 2: Use Audio Software (Professional)**
- **Audacity** (Free, Windows/Mac/Linux)
  1. Open your audio file
  2. Select 20 seconds of audio (usually the hook)
  3. File → Export → Export as MP3
  4. Choose 128-192 kbps quality
- **Adobe Audition** (Professional)
- **Logic Pro / Ableton / FL Studio** (DAW users)

**Recommended Preview Section:**
- For beats: The main hook or drop (most energetic part)
- For samples: The core loop or signature sound
- For packs: A montage of the best sounds (can be created with DAW)

**Export Settings:**
- Format: MP3 (best compatibility)
- Bitrate: 128-192 kbps
- Duration: 15-30 seconds (20 seconds is ideal)
- Sample Rate: 44.1 kHz

### Why Manual Preview Creation?

While automatic audio trimming could be implemented using FFmpeg.wasm, manual creation gives you:
- **Creative Control**: Choose the best section of your track
- **Better Quality**: No automated cutting that might miss the beat
- **Smaller Files**: Optimized encoding for fast loading
- **Reliability**: No processing errors or compatibility issues

## Track Files (Full Products)

For product track files (the files customers download after purchase):

1. **Full Quality**: Upload your full-quality audio files
2. **Multiple Tracks**: You can upload multiple track files for packs or stems
3. **Formats**: Same audio formats supported (MP3, WAV, OGG, M4A)
4. **MIME Types**: Automatically set for proper downloads

## R2 Bucket Configuration

### Public Access Options

You have two options for serving files from R2:

#### Option 1: Worker Proxy (Default - No Configuration Needed)

By default, files are served through the Worker at `/api/uploads/[path]`. This works immediately without any R2 public access configuration. The Worker:
- Serves files with proper Content-Type headers
- Includes caching headers for performance
- Handles CORS automatically

#### Option 2: Direct R2 Public Access (Recommended for Production)

For better performance in production, configure direct R2 public access:

1. **Enable R2 Public Access:**
   - Go to **Cloudflare Dashboard** → **R2**
   - Select your bucket (default: `piras-uploads`)
   - Go to **Settings** → **Public access**
   - Enable **Allow Access**
   - Copy the public bucket URL (e.g., `https://pub-xxxxx.r2.dev`)

2. **Set Environment Variable:**
   - Add to your `.dev.vars` file (for local development):
     ```
     R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
     ```
   - Add to Cloudflare Workers environment variables (for production):
     - Go to **Workers & Pages** → Your Worker → **Settings** → **Variables**
     - Add `R2_PUBLIC_URL` with your bucket's public URL

3. **Custom Domain (Optional but Recommended):**
   - Go to your R2 bucket settings
   - Click **Connect Domain**
   - Add a custom domain (e.g., `uploads.yourdomain.com`)
   - Use this in your `R2_PUBLIC_URL` environment variable

## Troubleshooting

### Images Not Displaying

**Problem**: Uploaded images show broken image icons

**Solutions**:
1. **Using Worker Proxy (Default)**:
   - Images should work automatically via `/api/uploads/` endpoint
   - Check browser console for errors
   - Verify the file was uploaded to R2 (check Cloudflare dashboard)
   
2. **Using R2 Public URL**:
   - Verify R2 bucket has public access enabled
   - Check `R2_PUBLIC_URL` environment variable is set correctly
   - Test the R2 URL directly in browser
   - Check browser console for CORS errors
   
3. **General**:
   - Ensure images were uploaded with correct content type (`image/webp`)
   - Clear browser cache
   - Check Workers logs for upload errors

### Audio Not Playing

**Problem**: Audio preview button doesn't work or shows errors

**Solutions**:
1. **Using Worker Proxy (Default)**:
   - Audio should work automatically via `/api/uploads/` endpoint
   - Check browser console for playback errors
   - Verify file format is supported (MP3 recommended)
   
2. **Using R2 Public URL**:
   - Verify R2 bucket has public access enabled
   - Check `R2_PUBLIC_URL` environment variable is set correctly
   - Test the audio URL directly in browser
   
3. **General**:
   - Ensure audio format is browser-compatible (MP3 has best support)
   - Check that audio files have correct MIME types
   - Try different browser to rule out compatibility issues
   - Verify the audio file isn't corrupted (test locally first)

### Upload Fails

**Problem**: File upload returns an error or shows "CustomFileReader is not a constructor"

**Solutions**:
1. **Clear browser cache** and try again (may have cached old code)
2. Check file size (files over 100MB may timeout)
3. Verify R2 bucket binding in `wrangler.jsonc` is correct
4. Check Cloudflare Workers logs for specific errors:
   - Go to Cloudflare Dashboard → Workers & Pages → Your Worker → Logs
5. Ensure you have write permissions to the R2 bucket
6. For images: Try uploading a different format (JPG, PNG)
7. For audio: Ensure format is supported (MP3, WAV, OGG, M4A)

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

## Technical Implementation

### How File Upload Works

The file upload system is designed to work in Cloudflare Workers environment:

1. **Client-Side Processing** (Browser):
   - Image files are converted to WebP format using HTML5 Canvas API
   - Images are resized to max 1920px while maintaining aspect ratio
   - WebP quality set to 85% for optimal size/quality balance
   - Converted files are sent to the server via FormData

2. **Server-Side Processing** (Cloudflare Worker):
   - Files are read as ArrayBuffer (Workers-compatible API)
   - Files are uploaded to R2 bucket with proper Content-Type headers
   - File paths are stored in D1 database
   - URLs are constructed based on R2_PUBLIC_URL configuration

3. **File Serving**:
   - **With R2_PUBLIC_URL**: Files served directly from R2 (faster, recommended for production)
   - **Without R2_PUBLIC_URL**: Files served through Worker proxy at `/api/uploads/[path]` (works immediately, good for development)

### Why This Approach?

**Cloudflare Workers Limitations:**
- Workers don't have access to Node.js libraries like `sharp` or `ffmpeg`
- Browser-only libraries (like `browser-image-compression`) don't work in Workers
- Limited to Web Standard APIs (Fetch, FormData, ArrayBuffer, etc.)

**Our Solution:**
- Move image processing to client-side (where browser APIs are available)
- Use Workers-compatible APIs for file storage
- Provide flexible serving options (direct R2 or Worker proxy)

### Environment Variables

**R2_PUBLIC_URL** (Optional)
- Purpose: Direct R2 file serving URL
- Format: `https://pub-xxxxx.r2.dev` or custom domain
- When set: Files are served directly from R2
- When not set: Files are served through Worker proxy
- Set in: `.dev.vars` (local) or Cloudflare Workers environment variables (production)

## Support

For issues with media uploads:
1. Check Cloudflare Workers logs (Dashboard → Workers & Pages → Logs)
2. Verify R2 bucket settings and permissions
3. Test with different file formats and sizes
4. Review browser console for client-side errors
5. Ensure `wrangler.jsonc` has correct R2 bucket binding
