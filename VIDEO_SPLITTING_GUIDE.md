# Automatic Video Splitting Feature

## 🎬 **What This Does**

Automatically splits long sermon videos into 10-minute episodes (reels) for easier uploading and viewing!

---

## ✨ **Features**

- ✅ **Auto-detect** videos longer than 10 minutes
- ✅ **Prompt admin** to split or upload as single video
- ✅ **Split into 10-minute segments** using FFmpeg
- ✅ **Upload each segment** to Cloudinary
- ✅ **Create multiple sermon entries** (Episode 1, 2, 3, etc.)
- ✅ **Automatic cleanup** of temporary files

---

## 📋 **Requirements**

### **Server Requirements:**

**FFmpeg must be installed on the server!**

#### **For Render (Production):**

Render doesn't have FFmpeg by default. You need to add it via a buildpack or Docker.

**Option 1: Use Docker (Recommended)**

Create `Dockerfile` in server folder:

```dockerfile
FROM node:18

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 10000
CMD ["node", "index.js"]
```

Then update `render.yaml`:

```yaml
services:
  - type: web
    name: church-app-server
    env: docker
    dockerfilePath: ./Dockerfile
```

**Option 2: Use Buildpack**

Add to `render.yaml`:

```yaml
services:
  - type: web
    name: church-app-server
    env: node
    buildCommand: |
      apt-get update && apt-get install -y ffmpeg
      npm install
```

#### **For Local Development:**

**Windows:**
1. Download FFmpeg: https://ffmpeg.org/download.html
2. Extract to `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to PATH
4. Restart terminal
5. Test: `ffmpeg -version`

**Mac:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt-get install ffmpeg
```

---

## 🚀 **How to Use**

### **As Admin:**

1. **Go to Admin Panel**
2. **Click "Add New Sermon"**
3. **Fill in sermon details:**
   - Title: "Sunday Service"
   - Pastor: "Pastor Name"
   - Scripture: "John 3:16"
   - Date: Today
4. **Select video file** (e.g., 58-minute sermon)
5. **You'll see a prompt:**
   ```
   This video is 58 minutes long.
   
   Would you like to split it into 10-minute episodes?
   
   ✅ YES - Split into 6 episodes (Recommended)
   ❌ NO - Upload as single video (may take longer)
   ```
6. **Click "OK" to split**
7. **Wait for processing:**
   - ⏱️ Splitting video...
   - 📤 Uploading Episode 1/6...
   - 📤 Uploading Episode 2/6...
   - ...
   - ✅ Creating sermon entries...
8. **Done!** You'll see 6 sermon entries:
   - "Sunday Service - Episode 1"
   - "Sunday Service - Episode 2"
   - ...

### **As Member:**

1. **Go to Sermons page**
2. **Scroll through reels**
3. **Each episode plays automatically**
4. **Swipe to next episode**

---

## 📊 **Benefits**

### **Before (Single Long Video):**
- ❌ 58-minute video = 500MB-2GB
- ❌ Upload time: 10-30 minutes
- ❌ May exceed Cloudinary limits
- ❌ Hard to navigate
- ❌ Members must watch entire video

### **After (Split into Episodes):**
- ✅ 6 episodes × 10 minutes each
- ✅ Each episode: ~50-100MB
- ✅ Upload time: 1-2 minutes per episode
- ✅ Within Cloudinary free tier
- ✅ Easy to navigate
- ✅ Members can watch specific parts
- ✅ Better for mobile viewing
- ✅ Faster loading

---

## 🔧 **Technical Details**

### **How It Works:**

1. **Admin uploads long video**
2. **Frontend detects duration > 10 minutes**
3. **Prompts admin to split**
4. **If yes:**
   - Video sent to `/api/sermons/upload-video-split`
   - Server uses FFmpeg to split into 10-minute segments
   - Each segment uploaded to Cloudinary
   - Server returns array of uploaded segments
   - Frontend creates sermon entry for each episode
5. **If no:**
   - Video sent to `/api/sermons/upload-video`
   - Uploaded as single video

### **FFmpeg Command Used:**

```bash
ffmpeg -i input.mp4 -ss 0 -t 600 -c copy -avoid_negative_ts 1 output_part1.mp4
ffmpeg -i input.mp4 -ss 600 -t 600 -c copy -avoid_negative_ts 1 output_part2.mp4
...
```

- `-ss`: Start time (seconds)
- `-t`: Duration (600 seconds = 10 minutes)
- `-c copy`: Copy codec (no re-encoding, fast!)
- `-avoid_negative_ts 1`: Fix timestamp issues

---

## 🧪 **Testing**

### **Test with Your 58-Minute Video:**

1. Make sure FFmpeg is installed
2. Start local server: `cd server && npm run dev`
3. Start frontend: `npm run dev`
4. Login as admin
5. Upload your 58-minute video
6. Choose "Split into episodes"
7. Wait for processing (may take 5-10 minutes)
8. Verify 6 episodes created
9. Go to Sermons page
10. Verify each episode plays

---

## 🐛 **Troubleshooting**

### **"FFmpeg not found" error:**

**Solution:** Install FFmpeg on your system (see Requirements section)

### **"Failed to split video" error:**

**Possible causes:**
- FFmpeg not installed
- Video format not supported
- Disk space full
- Permissions issue

**Solution:**
- Check server logs for detailed error
- Verify FFmpeg installation: `ffmpeg -version`
- Try different video format (MP4 recommended)

### **Splitting takes too long:**

**Normal behavior:**
- 58-minute video may take 5-10 minutes to split
- Each 10-minute segment takes 1-2 minutes to upload
- Total time: 10-20 minutes

**To speed up:**
- Compress video before upload
- Use faster server
- Upgrade Cloudinary plan

### **Episodes out of order:**

**Solution:**
- Episodes are numbered automatically
- They should appear in order
- If not, check sermon date/time

---

## 📝 **Files Changed**

### **Backend:**
- ✅ `server/utils/videoSplitter.js` [NEW] - FFmpeg video splitting utility
- ✅ `server/index.js` [MODIFIED] - Added `/api/sermons/upload-video-split` endpoint

### **Frontend:**
- ✅ `pages/AdminPage.tsx` [MODIFIED] - Added split detection and upload logic

---

## 🎯 **Next Steps**

1. **Install FFmpeg** on your local machine
2. **Test with your 58-minute video**
3. **Deploy to Render** with FFmpeg support (Docker or buildpack)
4. **Test in production**
5. **Enjoy automatic video splitting!** 🎉

---

## 💡 **Pro Tips**

1. **Always split long videos** - faster uploads, better experience
2. **10 minutes is optimal** - good balance between file size and content
3. **Episode titles are automatic** - "Title - Episode 1", "Title - Episode 2", etc.
4. **Members see seamless experience** - just swipe between episodes
5. **Saves bandwidth** - members can watch specific episodes instead of entire video

---

**Your 58-minute sermon will now upload in 10-20 minutes instead of timing out!** 🚀
