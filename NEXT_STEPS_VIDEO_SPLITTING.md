# 🎬 Video Splitting Feature - Next Steps

## ✅ **What's Been Implemented**

I've added automatic video splitting that will:
1. Detect videos longer than 10 minutes
2. Prompt you to split into episodes
3. Automatically split using FFmpeg
4. Upload each 10-minute segment to Cloudinary
5. Create separate sermon entries for each episode

---

## ⚠️ **IMPORTANT: FFmpeg Required**

The video splitting feature requires **FFmpeg** to be installed on the server.

### **For Local Testing:**

**Windows (Your System):**
1. Download FFmpeg: https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip
2. Extract to `C:\ffmpeg`
3. Add to PATH:
   - Search "Environment Variables" in Windows
   - Edit "Path" variable
   - Add `C:\ffmpeg\bin`
   - Click OK
4. **Restart your terminal/PowerShell**
5. Test: `ffmpeg -version`

If you see FFmpeg version info, it's installed! ✅

### **For Render (Production):**

Render doesn't have FFmpeg by default. You have two options:

**Option 1: Add FFmpeg Buildpack (Easier)**

In Render Dashboard:
1. Go to your service settings
2. Add this to "Build Command":
   ```
   apt-get update && apt-get install -y ffmpeg && npm install
   ```

**Option 2: Use Docker (More Reliable)**

I can help you set this up if needed.

---

## 🚀 **To Deploy Now**

### **Step 1: Commit Backend Changes**

```powershell
cd d:\church-of-god-evening-light\server
git commit -m "Add video splitting feature"
git push origin main
```

### **Step 2: Wait for Render Deployment**

- Go to https://dashboard.render.com
- Watch deployment logs
- Look for: `[VideoSplit]` messages

### **Step 3: Install FFmpeg on Render**

Add to Build Command in Render:
```
apt-get update && apt-get install -y ffmpeg && npm install
```

Then redeploy.

---

## 🧪 **To Test Locally**

### **Step 1: Install FFmpeg (Windows)**

Follow instructions above.

### **Step 2: Restart Servers**

```powershell
# Stop current servers (Ctrl+C)

# Restart backend
cd d:\church-of-god-evening-light\server
npm run dev

# Restart frontend (in new terminal)
cd d:\church-of-god-evening-light
npm run dev
```

### **Step 3: Test with Your 58-Minute Video**

1. Open http://localhost:3001
2. Login as admin
3. Go to Admin Panel
4. Add New Sermon
5. Upload your 58-minute video
6. **You'll see prompt:**
   ```
   This video is 58 minutes long.
   
   Would you like to split it into 10-minute episodes?
   
   ✅ YES - Split into 6 episodes (Recommended)
   ❌ NO - Upload as single video
   ```
7. Click "OK" to split
8. Wait 10-15 minutes for processing
9. Check Sermons page - you should see 6 episodes!

---

## 📊 **What Happens**

### **Your 58-Minute Video:**

**Without Splitting:**
- ❌ File size: ~500MB-2GB
- ❌ Upload time: 10-30 minutes
- ❌ May timeout or fail
- ❌ Exceeds Cloudinary free tier

**With Splitting:**
- ✅ 6 episodes × 10 minutes each
- ✅ Each episode: ~50-100MB
- ✅ Upload time: 1-2 minutes per episode
- ✅ Total time: 10-15 minutes
- ✅ Within Cloudinary limits
- ✅ Better viewing experience

---

## 🎯 **Recommended Workflow**

1. **Install FFmpeg locally** (for testing)
2. **Test with your 58-minute video**
3. **Verify 6 episodes created**
4. **Commit and push changes**
5. **Add FFmpeg to Render**
6. **Deploy to production**
7. **Test in production**

---

## 💡 **Alternative: Compress First**

If you don't want to set up FFmpeg right now, you can:

1. **Compress your 58-minute video** to under 100MB using HandBrake
2. **Upload as single video** (will be faster)
3. **Set up video splitting later** for future long videos

---

## 📝 **Files to Commit**

### **Backend:**
```
server/index.js (modified)
server/utils/videoSplitter.js (new)
```

### **Frontend:**
```
pages/AdminPage.tsx (modified)
VIDEO_SPLITTING_GUIDE.md (new)
NEXT_STEPS_VIDEO_SPLITTING.md (new)
```

---

## 🤔 **Questions?**

**Q: Do I need FFmpeg for short videos?**
A: No! Videos under 10 minutes upload normally without FFmpeg.

**Q: Can I skip FFmpeg setup?**
A: Yes, but you won't be able to split long videos. You can compress them instead.

**Q: Will this work on Render free tier?**
A: Yes! Each 10-minute segment is small enough for free tier.

**Q: What if FFmpeg fails?**
A: The system will fall back to single video upload.

---

## ✅ **Ready to Deploy?**

Run these commands:

```powershell
# Backend
cd d:\church-of-god-evening-light\server
git commit -m "Add video splitting feature"
git push origin main

# Frontend (if you made changes)
cd d:\church-of-god-evening-light
git add pages/AdminPage.tsx
git commit -m "Add video splitting UI"
git push origin main
```

Then add FFmpeg to Render and test with your 58-minute video!

---

**Your long sermons will now upload successfully!** 🎉
