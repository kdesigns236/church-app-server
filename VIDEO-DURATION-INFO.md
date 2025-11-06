# Video Duration & Upload Limits - v2.1.0

## ✅ FIXED: Videos of Any Duration Now Supported

### Previous Issue:
- Videos over 1 minute were failing to upload
- Timeout was too short (10 minutes)

### Solution Applied:
- ✅ Increased timeout to **30 minutes**
- ✅ Added `eager_async` for background processing
- ✅ Chunked upload (6MB chunks)
- ✅ Better error handling

---

## 📊 Current Limits

### Cloudinary Free Tier:
- **Max file size:** 100MB
- **Max video duration:** Unlimited (as long as under 100MB)
- **Monthly bandwidth:** 25GB
- **Monthly transformations:** 25,000

### Server Configuration:
- **Upload timeout:** 30 minutes
- **Chunk size:** 6MB
- **Max file size:** 500MB (server limit, but Cloudinary limits to 100MB)

---

## 🎬 Video Guidelines for Best Results

### Recommended Specs:
- **File size:** 20-50MB (optimal)
- **Duration:** Any length under 100MB
- **Format:** MP4 (H.264)
- **Resolution:** 720p or 1080p
- **Frame rate:** 30fps
- **Audio:** AAC, 128kbps

### File Size vs Duration Examples:
```
720p @ 30fps:
- 5 minutes  = ~15-25MB
- 10 minutes = ~30-50MB
- 20 minutes = ~60-100MB
- 30 minutes = ~90-150MB (may exceed 100MB limit)

1080p @ 30fps:
- 5 minutes  = ~30-50MB
- 10 minutes = ~60-100MB
- 15 minutes = ~90-150MB (may exceed 100MB limit)
```

---

## 🔧 Compression Tips

### For Long Sermons (30+ minutes):

**Option 1: Compress with HandBrake** ⭐ (Recommended)
1. Download HandBrake: https://handbrake.fr/
2. Open your video
3. Settings:
   - **Preset:** "Fast 720p30"
   - **Video Codec:** H.264
   - **Quality:** RF 23-25
   - **Frame Rate:** 30fps constant
   - **Audio:** AAC 128kbps
4. Start encode
5. Result: 30-min sermon = ~60-80MB

**Option 2: Lower Resolution**
- Use 480p instead of 720p
- 30-min sermon @ 480p = ~40-60MB

**Option 3: Split into Parts**
- Part 1: First 15 minutes
- Part 2: Last 15 minutes
- Upload as separate sermons

---

## 📱 Upload Process

### For Users:
1. **Prepare video** - Compress if over 100MB
2. **Go to Admin** → Sermons → Add Sermon
3. **Fill details** - Title, pastor, date, scripture
4. **Select video** - Choose compressed file
5. **Click Save** - Wait for upload (don't close app!)
6. **Progress bar** - Shows upload progress
7. **Success!** - Video appears in sermon list

### Upload Times (WiFi):
- 10MB video: ~30 seconds
- 25MB video: ~1-2 minutes
- 50MB video: ~3-5 minutes
- 100MB video: ~5-10 minutes

### Upload Times (Mobile Data):
- 10MB video: ~1-2 minutes
- 25MB video: ~3-5 minutes
- 50MB video: ~8-15 minutes
- 100MB video: ~15-30 minutes

---

## ⚠️ Troubleshooting

### "Upload Failed" Error:

**1. Check File Size**
```
File must be under 100MB
Current size: [check in file properties]
```

**2. Check Internet Connection**
- Use WiFi for best results
- Mobile data may be slow/unstable
- Try again with better connection

**3. Check Video Format**
- Must be MP4, MOV, or AVI
- H.264 codec recommended
- Convert if needed

**4. Compress Video**
- Use HandBrake (free)
- Target: Under 50MB
- See compression tips above

### "Timeout" Error:

**Cause:** Video too large or slow connection

**Solution:**
1. Compress video to under 50MB
2. Use WiFi instead of mobile data
3. Try again during off-peak hours
4. Split into smaller parts if needed

### Video Uploads But Won't Play:

**Cause:** Cloudinary still processing

**Solution:**
1. Wait 5-10 minutes
2. Refresh the app
3. Video should play now

---

## 🚀 Future Improvements (v2.3.0+)

### Planned Features:
1. **Direct Cloudinary Upload**
   - Upload directly from app to Cloudinary
   - Bypass server for faster uploads
   - Better progress tracking

2. **In-App Compression**
   - Compress videos before upload
   - Automatic optimization
   - No external tools needed

3. **Resume Upload**
   - Pause and resume uploads
   - Handle connection drops
   - Better reliability

4. **Multiple Qualities**
   - Auto-generate 480p, 720p, 1080p
   - Users choose quality
   - Save bandwidth

---

## 📊 Cloudinary Dashboard

### Monitor Usage:
1. Go to: https://cloudinary.com/console
2. Check:
   - Storage used
   - Bandwidth used
   - Transformations used
3. Upgrade if needed

### Free Tier Limits:
- **Storage:** 25GB
- **Bandwidth:** 25GB/month
- **Transformations:** 25,000/month
- **Videos:** Unlimited duration (under 100MB each)

---

## ✅ Summary

**What Works Now:**
- ✅ Videos of any duration (under 100MB)
- ✅ 30-minute timeout (enough for large files)
- ✅ Chunked upload (6MB chunks)
- ✅ Background processing
- ✅ Better error handling

**Best Practice:**
- Keep videos under 50MB for fast uploads
- Use 720p @ 30fps for quality/size balance
- Compress with HandBrake if needed
- Use WiFi for uploads

**Limits:**
- Max file size: 100MB (Cloudinary free tier)
- Max duration: Unlimited (as long as under 100MB)
- Upload timeout: 30 minutes
