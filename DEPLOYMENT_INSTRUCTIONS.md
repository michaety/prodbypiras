# Deployment Instructions - File Upload Fix

## 🎯 What This Fixes

The error you were seeing:
```json
{"success":false,"error":"CustomFileReader is not a constructor"}
```

This is now **completely fixed**. You can upload images and audio files without any errors.

## 📦 What Changed

- ✅ Fixed file upload functionality to work in Cloudflare Workers
- ✅ Images automatically convert to WebP format
- ✅ Audio files upload with proper MIME types
- ✅ Files can be served immediately (no extra configuration needed)
- ✅ Optional: Configure for direct R2 serving (faster performance)

## 🚀 How to Deploy (Step-by-Step)

### Step 1: Review the Pull Request

This PR contains all the fixes. Review the changes:
- Code changes in `src/pages/api/admin/add-listing.ts`
- UI changes in `src/pages/admin/listings/new.astro`
- New file serving endpoint at `src/pages/api/uploads/[...path].ts`
- Documentation updates

### Step 2: Merge the PR

Once you're happy with the changes:
1. Click "Merge pull request" on GitHub
2. Confirm the merge
3. The changes are now in your main branch

### Step 3: Deploy to Cloudflare

**Using Cloudflare Dashboard (Recommended):**

1. **Build locally:**
   ```bash
   git pull origin main  # Get the latest changes
   npm install           # Install dependencies
   npm run build         # Build the project
   ```

2. **Deploy via Dashboard:**
   - Go to Cloudflare Dashboard → Workers & Pages
   - Find your worker/site
   - Click "Deploy" or "Create deployment"
   - Upload the `dist` folder (or use automatic deployment if configured)

3. **Wait for deployment:**
   - Cloudflare will show deployment progress
   - Wait for "Deployment successful" message

**Alternative - Automatic Deployment:**

If you have GitHub Actions or Cloudflare Pages connected:
- Merging the PR should trigger automatic deployment
- Wait for the deployment to complete
- Check the deployment logs for any errors

### Step 4: Test the Fix

1. **Navigate to admin:**
   ```
   https://hevin.dev/admin/listings/new
   ```

2. **Create a test listing:**
   - Fill in the title: "Test Beat"
   - Select type: "beats"
   - Set price: 9.99
   - Upload a cover image (any format - JPG, PNG, etc.)
   - Upload an audio preview (MP3 recommended)
   - Click "Create Listing"

3. **Verify success:**
   - You should see "Listing created successfully"
   - No "CustomFileReader" error
   - Redirected to `/admin`
   - New listing appears with image

4. **Test display:**
   - Click on the listing
   - Verify image displays correctly
   - Click play on audio preview
   - Audio should play without errors

### Step 5 (Optional): Configure for Better Performance

For production use, you can enable direct R2 serving:

1. **Enable R2 Public Access:**
   - Go to Cloudflare Dashboard → R2
   - Select bucket: `piras-uploads`
   - Go to Settings → Public access
   - Click "Allow Access"
   - Copy the public URL (e.g., `https://pub-xxxxx.r2.dev`)

2. **Set Environment Variable:**
   - Go to Workers & Pages → Your Worker
   - Go to Settings → Variables
   - Click "Add variable"
   - Name: `R2_PUBLIC_URL`
   - Value: Your R2 public URL
   - Click "Save"

3. **Redeploy:**
   - Trigger a new deployment
   - Files will now be served directly from R2 (faster!)

## 📝 What to Expect

### Before Deployment

- ❌ "CustomFileReader is not a constructor" error
- ❌ Cannot upload images or audio
- ❌ Cannot create listings with media

### After Deployment

- ✅ No errors when uploading files
- ✅ Images automatically convert to WebP
- ✅ Images display correctly in admin
- ✅ Audio previews play correctly
- ✅ Multiple track files can be uploaded
- ✅ Everything works smoothly

## 🔍 Troubleshooting

### Issue: Still seeing "CustomFileReader" error

**Solution:** Clear browser cache
1. Hard refresh: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
2. Or try incognito/private browsing mode
3. Verify deployment completed successfully in Cloudflare Dashboard

### Issue: Images not displaying

**Check:**
1. Verify files uploaded to R2 (check in Cloudflare Dashboard → R2)
2. Try accessing directly: `https://hevin.dev/api/uploads/images/[filename].webp`
3. Check browser console for errors (F12 → Console tab)
4. Verify R2 bucket binding in wrangler.jsonc

### Issue: Audio not playing

**Check:**
1. Try MP3 format (best compatibility)
2. Verify file uploaded to R2
3. Test URL directly in browser
4. Check if file is corrupted (test locally first)

### Issue: Upload times out

**Solution:**
1. Reduce image size (system resizes to 1920px anyway)
2. For audio: Pre-trim to 20 seconds
3. Use compressed formats (MP3 at 128-192 kbps)
4. Keep files under 20MB

## 📚 Additional Documentation

Detailed guides are available in the repository:

- **QUICK_START.md** - Quick deployment guide
- **MEDIA_GUIDE.md** - Complete media upload guide
- **FILE_UPLOAD_FIX_SUMMARY.md** - Technical details
- **SETUP.md** - Full setup instructions

## 🎓 Understanding the Fix

**Simple Explanation:**

The old code tried to use browser-specific functions (like `FileReader`) on the server, which doesn't work. The new code:
1. Processes images in the browser (where browser functions are available)
2. Uploads processed files to the server
3. Server saves files using server-compatible functions
4. Files are served through a proxy endpoint

**No Configuration Needed:**
- Files work immediately after deployment
- The proxy endpoint serves R2 files automatically
- Optional R2 public URL for better performance

## ✅ Verification Checklist

After deployment, verify:

- [ ] Can access `/admin/listings/new` without errors
- [ ] Can upload an image file
- [ ] Image converts to WebP automatically
- [ ] Can upload an audio file
- [ ] Can submit the form successfully
- [ ] Listing appears in `/admin` with image
- [ ] Clicking listing shows details correctly
- [ ] Audio preview plays when clicked
- [ ] No console errors in browser (F12)

## 🆘 Need Help?

If you encounter issues:

1. **Check Cloudflare Workers logs:**
   - Dashboard → Workers & Pages → Your Worker → Logs
   - Look for error messages during upload

2. **Check browser console:**
   - Press F12 → Console tab
   - Look for JavaScript errors

3. **Verify deployment:**
   - Check that deployment completed successfully
   - Verify you're testing the deployed version (not cached)

4. **Test incrementally:**
   - Try uploading just an image (no audio)
   - Try uploading just audio (no image)
   - Isolate what's failing

## 🎉 Success!

Once deployed and tested, you should be able to:
- Upload listings with images and audio
- See images display in WebP format
- Play audio previews
- Manage your shop inventory without errors

The system is production-ready and optimized for Cloudflare Workers environment.

---

**Questions?** Check the documentation files or review the code changes in this PR.
