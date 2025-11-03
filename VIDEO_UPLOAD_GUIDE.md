# 📹 Video Upload Guide - Cloudinary Limits & Best Practices

## ☁️ **Cloudinary Free Tier Limits**

### **File Size Limits:**
- **Maximum:** 100MB per video file
- **Recommended:** Under 50MB for best performance
- **Optimal:** 20-30MB for fast loading

### **Video Length:**
- **Recommended:** 5-10 minutes per video
- **For longer sermons:** Split manually into parts

---

## ⚠️ **What Happens When You Upload**

### **If Video is Over 100MB:**
You'll see this error:
```
⚠️ VIDEO TOO LARGE

File size: 248MB
Cloudinary free tier limit: 100MB

SOLUTIONS:
1. Compress video using HandBrake (recommended)
2. Split video manually into smaller parts
3. Upgrade Cloudinary plan

Target: Keep videos under 100MB for best results.
```

### **If Video is 50-100MB:**
You'll see this warning:
```
⚠️ LARGE VIDEO WARNING

File size: 75MB

This video is large and may:
• Take 5-10 minutes to upload
• Use significant bandwidth
• Be slow to load for members

RECOMMENDATION:
Compress to under 50MB for better performance.

Continue anyway?
```

### **If Video is Under 50MB:**
✅ Upload proceeds smoothly with no warnings!

---

## 🎬 **How to Handle Your 58-Minute Sermon**

Your 58-minute video is **248MB** - too large for Cloudinary free tier.

### **Option 1: Compress the Video (Recommended)**

**Using HandBrake (Free):**

1. **Download:** https://handbrake.fr/downloads.php
2. **Install and open HandBrake**
3. **Open your video file**
4. **Settings:**
   - Preset: "Fast 720p30" or "Fast 1080p30"
   - Quality: RF 22-24
   - Format: MP4
5. **Click "Start Encode"**
6. **Result:** 58 minutes = ~80-95MB (under 100MB limit!)

**Target Settings:**
- Resolution: 720p (1280x720)
- Bitrate: 1.5-2 Mbps
- Audio: AAC 128kbps
- Result: ~1.5MB per minute = 87MB for 58 minutes

### **Option 2: Split Video Manually**

Split your 58-minute sermon into parts:

**Example Split:**
- Part 1: Minutes 0-20 (Introduction & Opening)
- Part 2: Minutes 20-40 (Main Message)
- Part 3: Minutes 40-58 (Conclusion & Altar Call)

**Tools to Split:**
1. **HandBrake** - Set start/end times
2. **FFmpeg** - Command line tool
3. **Online tools** - clipchamp.com, kapwing.com

**Upload as separate sermons:**
- "Sunday Service - Part 1"
- "Sunday Service - Part 2"
- "Sunday Service - Part 3"

### **Option 3: Upgrade Cloudinary Plan**

**Cloudinary Plus Plan ($99/month):**
- 500MB max file size
- More bandwidth
- Better for regular long videos

---

## 📊 **File Size Reference**

| Video Length | 720p (Good) | 1080p (Better) | Original Quality |
|--------------|-------------|----------------|------------------|
| 5 minutes    | ~8 MB       | ~15 MB         | ~40 MB           |
| 10 minutes   | ~15 MB      | ~30 MB         | ~80 MB           |
| 20 minutes   | ~30 MB      | ~60 MB         | ~160 MB          |
| 30 minutes   | ~45 MB      | ~90 MB         | ~240 MB          |
| 58 minutes   | ~87 MB ✅   | ~174 MB ❌     | ~465 MB ❌       |

**Sweet Spot:** 720p at 1.5 Mbps = ~1.5MB per minute

---

## 🛠️ **Compression Guide (HandBrake)**

### **Quick Settings:**

**For 58-Minute Sermon:**
1. Preset: "Fast 720p30"
2. Quality: RF 23
3. Audio: AAC 128kbps
4. Result: ~85MB (fits under 100MB!)

**For Shorter Videos (10-20 min):**
1. Preset: "Fast 1080p30"
2. Quality: RF 22
3. Audio: AAC 128kbps
4. Result: ~30-60MB

### **Advanced Settings:**

```
Video:
- Codec: H.264
- Framerate: Same as source
- Quality: Constant Quality RF 22-24
- Encoder Preset: Medium

Audio:
- Codec: AAC
- Bitrate: 128 kbps
- Mixdown: Stereo

Dimensions:
- Width: 1280 (720p) or 1920 (1080p)
- Keep aspect ratio
```

---

## ✅ **Best Practices**

### **Before Uploading:**
1. ✅ Compress video to under 100MB
2. ✅ Use MP4 format (H.264 codec)
3. ✅ Test video plays correctly
4. ✅ Check file size in properties

### **During Upload:**
1. ✅ Don't close the browser tab
2. ✅ Wait for "Upload successful" message
3. ✅ Check video appears in Sermons list
4. ✅ Test playback on different devices

### **After Upload:**
1. ✅ Verify video plays on desktop
2. ✅ Verify video plays on mobile
3. ✅ Check video quality is acceptable
4. ✅ Delete original large file from your computer

---

## 🎯 **Recommended Workflow**

### **For Regular Sermons:**

1. **Record sermon** (any quality)
2. **Compress with HandBrake** to 720p, RF 23
3. **Check file size** (should be under 100MB)
4. **Upload to church app**
5. **Verify playback**
6. **Done!** ✅

### **For Long Sermons (45+ minutes):**

**Option A - Compress Heavily:**
- Use 720p, RF 24-25
- Target: ~1.2MB per minute
- 58 minutes = ~70MB

**Option B - Split Manually:**
- Split into 2-3 parts
- Each part: 20-30 minutes
- Upload as separate sermons

---

## 📱 **Mobile Optimization**

Videos compressed to 720p work great on mobile:
- ✅ Fast loading
- ✅ Less data usage
- ✅ Smooth playback
- ✅ Good quality on phone screens

---

## 🆘 **Troubleshooting**

### **"Video too large" error:**
- Compress video with HandBrake
- Target under 100MB

### **Upload takes forever:**
- Video might be too large
- Check internet connection
- Try compressing more

### **Video won't play:**
- Make sure format is MP4
- Use H.264 codec
- Re-encode with HandBrake

### **Poor video quality:**
- Increase RF quality (lower number)
- Use 1080p instead of 720p
- But watch file size!

---

## 📞 **Need Help?**

**HandBrake Tutorial:**
https://handbrake.fr/docs/en/latest/introduction/quick-start.html

**Video Compression Guide:**
https://www.youtube.com/results?search_query=handbrake+compress+video+tutorial

**Cloudinary Limits:**
https://cloudinary.com/pricing

---

## 🎉 **Summary**

**For your 58-minute sermon:**
1. Use HandBrake
2. Preset: "Fast 720p30"
3. Quality: RF 23
4. Result: ~85MB (under 100MB limit!)
5. Upload successfully! ✅

**Quality will still be excellent for church viewing!** 🙏
