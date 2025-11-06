# Video Upload Fix - v2.1.0

## Problem
Videos fail to upload due to:
1. **Render Free Tier Timeout** - 30 second request limit
2. **Large File Sizes** - Videos over 50MB take too long
3. **Network Issues** - Slow mobile uploads

## Solutions Applied

### Server-Side Fixes (index.js)
✅ Increased request timeout to 10 minutes
✅ Added chunked upload (6MB chunks)
✅ Cloudinary timeout set to 10 minutes
✅ Better error logging

### Recommendations for Users

#### For Best Results:
1. **Compress Videos Before Upload**
   - Use HandBrake (free): https://handbrake.fr/
   - Target: 720p, 30fps, ~5-10MB per minute
   - Keep videos under 50MB for fast uploads

2. **Video Guidelines**
   - Max size: 100MB (Cloudinary free tier)
   - Recommended: 20-50MB
   - Format: MP4 (H.264)
   - Resolution: 720p or 1080p

3. **Upload Tips**
   - Use WiFi, not mobile data
   - Don't close the app during upload
   - Wait for "Upload successful" message
   - If it fails, try again with smaller file

#### Compression Settings (HandBrake):
```
Format: MP4
Video Codec: H.264
Quality: RF 23-25
Frame Rate: 30fps
Resolution: 1280x720 (720p)
Audio: AAC, 128kbps
```

## Technical Details

### Cloudinary Limits (Free Tier):
- Max file size: 100MB
- Max video length: Varies by plan
- Monthly bandwidth: 25GB
- Monthly transformations: 25,000

### Upload Flow:
1. User selects video in Admin panel
2. App uploads to server (/api/sermons/upload-video)
3. Server saves temp file
4. Server uploads to Cloudinary (chunked)
5. Cloudinary processes video
6. Server returns video URL
7. App saves sermon with video URL

### Timeout Settings:
- Server request: 10 minutes
- Server response: 10 minutes
- Cloudinary upload: 10 minutes
- Chunk size: 6MB

## Future Improvements (v2.2.0+)

### Planned Features:
1. **Direct Upload to Cloudinary**
   - Upload from app directly to Cloudinary
   - Bypass server for faster uploads
   - Use Cloudinary upload widget

2. **Progress Indicator**
   - Real-time upload progress
   - Estimated time remaining
   - Pause/resume support

3. **Video Compression in App**
   - Compress before upload
   - Reduce file size automatically
   - Faster uploads

4. **Multiple Video Qualities**
   - Auto-generate 480p, 720p, 1080p
   - Users choose quality
   - Save bandwidth

## Testing

### Test Video Upload:
1. Create a small test video (< 10MB)
2. Go to Admin → Sermons → Add Sermon
3. Fill in details and select video
4. Click Save
5. Wait for upload (check progress bar)
6. Verify video appears in sermon list

### If Upload Fails:
1. Check video size (must be < 100MB)
2. Check internet connection
3. Try compressing video
4. Check server logs on Render
5. Verify Cloudinary credentials

## Deployment

### To Deploy This Fix:
1. Commit changes to GitHub
2. Render auto-deploys
3. Wait 2-3 minutes
4. Test video upload

### Verify Fix:
```powershell
# Check if server is running
Invoke-WebRequest -Uri "https://church-app-server.onrender.com/api/app-version"
```

## Support

If videos still fail to upload:
1. Check Cloudinary dashboard for errors
2. Check Render logs for timeout errors
3. Reduce video file size
4. Contact support with error message
