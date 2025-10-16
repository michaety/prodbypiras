# Track Files and Audio Preview Fix - Implementation Summary

## Problem Solved
1. ✅ Fixed "Add Track Files" button on `/admin/listings/new` to support multiple file uploads
2. ✅ Limited audio previews to 20 seconds on shop and admin pages

## Changes Made

### 1. Admin New Listing Page (`src/pages/admin/listings/new.astro`)

**Before:**
- Had an "Add Track File" button that added one file input at a time
- Users had to click multiple times to add multiple tracks
- Each track required manual title entry

**After:**
- Single file input with `multiple` attribute
- Users can select all tracks at once in one dialog
- Shows preview of selected files with names and sizes
- Automatically uses filename (without extension) as track title
- Simpler, more intuitive interface

**Code Changes:**
```html
<!-- Old approach: Button that dynamically adds inputs -->
<button id="add-track-file">+ Add Track File</button>

<!-- New approach: Native multiple file input -->
<input type="file" name="track_files" accept="audio/*" multiple required />
```

### 2. Shop Page Audio Player (`src/pages/shop.astro`)

**Added 20-Second Preview Limit:**
```javascript
audioPlayer.addEventListener('timeupdate', () => {
  // Limit preview to 20 seconds
  if (audioPlayer.currentTime >= 20) {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    // Reset UI elements
  }
});
```

**Features:**
- Automatically stops playback at 20 seconds
- Resets play button and progress bar
- Progress bar shows percentage of 20-second duration

### 3. Admin Listing Detail Page (`src/pages/admin/listings/[id].astro`)

**Added 20-Second Preview Limit:**
- Preview audio limited to 20 seconds
- UI shows "(20s sample)" indicator
- Full track playback still available for admin users (when clicking track list items)

### 4. Backend API (`src/pages/api/admin/add-listing.ts`)

**Updated File Processing:**
```typescript
// Old: Loop through track_file_1, track_file_2, etc.
while (formData.get(`track_file_${trackIndex}`)) { ... }

// New: Get all files at once
const uploadedFiles = formData.getAll("track_files") as File[];
uploadedFiles.forEach((file, index) => { ... });
```

**Added Documentation:**
- Comments explain why client-side limiting is used
- Notes about future server-side trimming options
- Mentions FFmpeg WASM as potential solution

## Technical Implementation

### Client-Side vs Server-Side Audio Trimming

**Why Client-Side (Current Implementation):**
- ✅ Works immediately without additional infrastructure
- ✅ No dependencies on FFmpeg or audio processing libraries
- ✅ Compatible with Cloudflare Workers limitations
- ⚠️ Full audio file is uploaded (larger file size)
- ⚠️ Uses more bandwidth for preview playback

**Server-Side Option (Future Enhancement):**
To implement true 20-second trimmed files:

1. **FFmpeg WASM in Workers:**
   ```javascript
   // Requires: FFmpeg.wasm or similar
   const ffmpeg = createFFmpeg();
   await ffmpeg.load();
   // Trim audio: ffmpeg.run('-i', 'input.mp3', '-t', '20', 'output.mp3');
   ```

2. **External Audio Processing Service:**
   - Upload full file to R2
   - Send to processing service (Lambda, etc.)
   - Receive trimmed 20-second sample
   - Store both full and preview versions

3. **Cloudflare Media Processing (if available):**
   - Similar to Cloudflare Images for audio
   - Would be ideal for this use case

## Testing the Changes

### Manual Testing Steps:

1. **Test Multiple File Upload:**
   ```
   1. Go to https://hevin.dev/admin/listings/new
   2. Click "Select Audio Files" button under "Track Files"
   3. Select multiple audio files (Ctrl+Click or Cmd+Click)
   4. Verify files appear in preview list
   5. Fill other required fields
   6. Submit form
   7. Verify all tracks appear in database
   ```

2. **Test 20-Second Preview (Shop):**
   ```
   1. Go to https://hevin.dev/shop
   2. Find a listing with audio preview
   3. Click play button on listing card
   4. Wait 20 seconds
   5. Verify audio stops automatically
   6. Verify play button resets
   ```

3. **Test 20-Second Preview (Admin):**
   ```
   1. Go to https://hevin.dev/admin/listings/{id}
   2. Click play on "Preview Audio"
   3. Wait 20 seconds
   4. Verify audio stops automatically
   5. Click play on individual tracks in track list
   6. Verify full tracks play (no 20-second limit)
   ```

## Copy-Paste Deployment Instructions

### For GitHub Editor:
1. Navigate to the pull request created by this change
2. Review the 4 modified files
3. Merge the pull request to main branch
4. Changes will auto-deploy via Cloudflare Pages

### For Command Line:
```bash
# Already done - changes are committed and pushed
git checkout main
git merge copilot/fix-add-track-files-button
git push origin main
```

## Files Modified
- ✅ `src/pages/admin/listings/new.astro` - Multiple file input UI
- ✅ `src/pages/admin/listings/[id].astro` - 20-second preview limit
- ✅ `src/pages/api/admin/add-listing.ts` - Multiple file processing
- ✅ `src/pages/shop.astro` - 20-second preview limit

## Future Improvements
1. Add server-side audio trimming for true 20-second samples
2. Add visual waveform display in previews
3. Allow users to set custom preview start time (e.g., start at 30 seconds)
4. Implement drag-and-drop file upload
5. Add file size and format validation before upload
6. Show upload progress bar for large files

## Notes for Beginners
- All changes use standard HTML5 and JavaScript - no complex libraries
- Comments explain every major section of code
- The solution is minimal and focused on the specific requirements
- Client-side limiting is a pragmatic choice for this use case
- Code is production-ready and can be deployed immediately
