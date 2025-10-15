# Quick Start Guide - File Upload Fix

This guide helps you get started with the fixed file upload functionality after deploying the changes.

## What Was Fixed

The error "CustomFileReader is not a constructor" has been resolved. The file upload system now works properly in Cloudflare Workers environment.

### Key Changes Made

1. ✅ **Removed browser-only library** that was causing the error
2. ✅ **Added client-side WebP conversion** for images
3. ✅ **Added Workers-compatible file handling** using native APIs
4. ✅ **Created automatic file serving proxy** at `/api/uploads/[path]`
5. ✅ **Added flexible R2 URL configuration** via environment variable

## Getting Started (After Deployment)

### Step 1: Deploy the Changes

Using Cloudflare Dashboard:

1. Build the project locally:
   ```bash
   npm run build
   ```

2. Deploy via Cloudflare Dashboard:
   - Go to Workers & Pages → Your Worker
   - Click "Deploy" or use Quick Deploy
   - Upload the `dist` folder contents

### Step 2: Verify R2 Bucket Configuration

Your R2 bucket should already be configured as `UPLOADS` binding in wrangler.jsonc:

```json
"r2_buckets": [
  {
    "binding": "UPLOADS",
    "bucket_name": "piras-uploads"
  }
]
```

**No additional configuration needed!** Files will be served through the Worker proxy automatically.

### Step 3: Test File Upload

1. Navigate to `https://your-domain.com/admin/listings/new`
2. Fill in the form:
   - Title: "Test Beat"
   - Type: "beats"
   - Price: 9.99
   - Upload a cover image (any format - will auto-convert to WebP)
   - Upload an audio preview (MP3 recommended, ~20 seconds)
3. Click "Create Listing"
4. Verify the listing appears in `/admin` with the image displayed

### Step 4 (Optional): Enable Direct R2 Serving for Better Performance

For production, you can enable direct R2 serving for faster file access:

1. **Enable R2 Public Access:**
   - Go to Cloudflare Dashboard → R2
   - Select your bucket: `piras-uploads`
   - Go to Settings → Public access
   - Click "Allow Access"
   - Copy the public URL (e.g., `https://pub-xxxxx.r2.dev`)

2. **Set Environment Variable:**
   - Go to Workers & Pages → Your Worker → Settings → Variables
   - Add new environment variable:
     - Name: `R2_PUBLIC_URL`
     - Value: Your R2 public URL (e.g., `https://pub-xxxxx.r2.dev`)
   - Save and redeploy

3. **Test Again:**
   - Upload a new listing
   - Verify files are served directly from R2
   - Check the URLs in the page source (should use R2 URL instead of `/api/uploads/`)

## Troubleshooting

### "CustomFileReader is not a constructor" Still Appears

**Cause:** Browser cache holding old JavaScript code

**Solution:**
1. Hard refresh the page: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache completely
3. Try in incognito/private browsing mode
4. Check that deployment completed successfully

### Images Not Displaying

**Cause:** File serving issue

**Solutions:**
1. **Check if files are uploaded:**
   - Go to Cloudflare Dashboard → R2 → Your bucket
   - Navigate to `images/` folder
   - Verify files exist

2. **Test proxy endpoint:**
   - Try accessing: `https://your-domain.com/api/uploads/images/[filename].webp`
   - Should display the image or show specific error

3. **Check browser console:**
   - Open DevTools (F12)
   - Look for network errors
   - Check if URLs are correct

### Audio Not Playing

**Cause:** File format or serving issue

**Solutions:**
1. **Use MP3 format** - has best browser compatibility
2. **Test file locally** - ensure it's not corrupted
3. **Check file size** - very large files may timeout
4. **Verify content type:**
   - Check browser network tab
   - Audio should have `Content-Type: audio/mpeg` (for MP3)

### Upload Timeout

**Cause:** File too large

**Solutions:**
1. **For images:**
   - Resize images before upload (system will resize to 1920px anyway)
   - Use formats under 10MB

2. **For audio:**
   - Pre-trim to 20 seconds for previews
   - Use compressed formats (MP3 at 128-192 kbps)
   - Keep files under 20MB

## Best Practices

### Images

✅ **Do:**
- Upload square images (1:1 aspect ratio)
- Use high-quality source images (min 600x600px)
- Let the system handle WebP conversion
- Keep original files under 10MB

❌ **Don't:**
- Upload extremely large images (50MB+)
- Use very low quality source images
- Upload corrupted image files

### Audio

✅ **Do:**
- Pre-trim previews to 20 seconds
- Use MP3 format (128-192 kbps)
- Test audio files locally first
- Use descriptive filenames

❌ **Don't:**
- Upload full-length tracks as previews (10+ minutes)
- Use proprietary/uncommon formats
- Upload corrupted audio files
- Exceed 20MB per file

## Next Steps

1. **Test the upload flow** with a few sample listings
2. **Configure R2_PUBLIC_URL** for production (optional but recommended)
3. **Set up custom domain** for R2 bucket (optional)
4. **Add authentication** to protect admin pages
5. **Enable Stripe** for checkout functionality

## Support

If you continue to experience issues:

1. **Check Cloudflare Workers logs:**
   - Dashboard → Workers & Pages → Your Worker → Logs
   - Look for errors during file upload

2. **Check browser console:**
   - Open DevTools (F12) → Console tab
   - Look for JavaScript errors

3. **Verify configuration:**
   - R2 bucket binding is correct in wrangler.jsonc
   - Database migrations have run successfully
   - No TypeScript compilation errors

## Documentation

For more detailed information:

- **MEDIA_GUIDE.md** - Complete media upload guide
- **SETUP.md** - Full setup instructions
- **DEPLOYMENT_GUIDE.md** - Deployment procedures

## Summary

🎉 **You're all set!** The file upload system now works in Cloudflare Workers environment without any errors. Simply deploy the changes and start uploading your listings with images and audio.
