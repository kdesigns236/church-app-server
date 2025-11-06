# Video Upload Troubleshooting Guide

## ❌ "Failed to save, please try again" Error

### Most Common Causes:

### 1. **Cloudinary Credentials Not Set** ⭐ (MOST LIKELY)

**Symptoms:**
- Upload fails immediately
- Error: "Server configuration error"
- No progress shown

**Solution:**
Check if Cloudinary is configured on Render:

```bash
# Test endpoint (after deploying updated server):
https://church-app-server.onrender.com/api/sermons/check-cloudinary
```

**If credentials are missing:**
1. Go to Render Dashboard: https://dashboard.render.com/
2. Select your `church-app-server` service
3. Go to **Environment** tab
4. Add these variables:
   - `CLOUDINARY_CLOUD_NAME` = `de0zuglgd`
   - `CLOUDINARY_API_KEY` = [Your API Key]
   - `CLOUDINARY_API_SECRET` = [Your API Secret]
5. Click **Save Changes**
6. Service will auto-restart

**Get Cloudinary Credentials:**
1. Go to: https://cloudinary.com/console
2. Login to your account
3. Copy credentials from dashboard
4. Add to Render environment variables

---

### 2. **File Too Large**

**Symptoms:**
- Upload starts but fails after a while
- Error mentions "quota" or "limit"

**Solution:**
- Max file size: **100MB**
- Compress video using HandBrake
- Target: 50MB or less

---

### 3. **Timeout (Slow Connection)**

**Symptoms:**
- Upload progresses but fails at 50-90%
- Takes very long time
- Error: "timeout"

**Solution:**
- Use WiFi instead of mobile data
- Compress video to under 50MB
- Try during off-peak hours
- Check internet speed

---

### 4. **Wrong Video Format**

**Symptoms:**
- Upload fails immediately
- Error about file type

**Solution:**
- Use MP4, MOV, or AVI
- H.264 codec recommended
- Convert using HandBrake if needed

---

### 5. **Server Not Running**

**Symptoms:**
- "Failed to fetch" error
- Can't connect to server

**Solution:**
- Check Render dashboard
- Ensure service is running
- Check server logs for errors

---

## 🔍 Diagnostic Steps

### Step 1: Check Cloudinary Configuration

After deploying the updated server, visit:
```
https://church-app-server.onrender.com/api/sermons/check-cloudinary
```

**Expected Response (Good):**
```json
{
  "configured": true,
  "cloudName": "Set",
  "apiKey": "Set",
  "apiSecret": "Set",
  "message": "Cloudinary is properly configured"
}
```

**Problem Response:**
```json
{
  "configured": false,
  "cloudName": "Missing",
  "apiKey": "Missing",
  "apiSecret": "Missing",
  "message": "Cloudinary credentials missing - video uploads will fail"
}
```

---

### Step 2: Check File Size

```bash
# On Windows:
Right-click video → Properties → Size

# Must be under 100MB (104,857,600 bytes)
```

---

### Step 3: Check Server Logs

1. Go to Render Dashboard
2. Select `church-app-server`
3. Click **Logs** tab
4. Look for errors during upload attempt

**Good logs:**
```
[Cloudinary] Uploading video: sermon.mp4
[Cloudinary] File size: 52428800 bytes
[Cloudinary] ✅ File exists, starting Cloudinary upload...
[Cloudinary] ✅ Video uploaded successfully
```

**Bad logs:**
```
[Cloudinary] ❌ Missing credentials!
[Cloudinary] CLOUD_NAME: Missing
[Cloudinary] API_KEY: Missing
```

---

## 🔧 Fix Cloudinary Credentials on Render

### Step-by-Step:

**1. Get Your Cloudinary Credentials:**
- Go to: https://cloudinary.com/console
- Login
- Copy these values:
  - Cloud Name
  - API Key
  - API Secret

**2. Add to Render:**
- Go to: https://dashboard.render.com/
- Select `church-app-server`
- Click **Environment** tab
- Click **Add Environment Variable**
- Add each variable:

```
CLOUDINARY_CLOUD_NAME = de0zuglgd
CLOUDINARY_API_KEY = [your_api_key_here]
CLOUDINARY_API_SECRET = [your_api_secret_here]
```

**3. Save and Restart:**
- Click **Save Changes**
- Service will auto-restart (takes 1-2 minutes)
- Test upload again

---

## 📱 Testing After Fix

### Test with Small Video First:
1. Create a short test video (< 10MB)
2. Go to Admin → Sermons → Add Sermon
3. Fill in details
4. Select test video
5. Click Save
6. Should upload successfully!

### If Still Fails:
1. Check Render logs for specific error
2. Verify Cloudinary credentials are correct
3. Try even smaller video (< 5MB)
4. Check internet connection
5. Contact support with error details

---

## 🚀 Deploy Updated Server

The updated `index.js` is in your clipboard!

**Deploy to GitHub:**
1. Go to: https://github.com/kdesigns236/church-app-server
2. Click `index.js`
3. Click pencil icon (Edit)
4. Select All (Ctrl+A)
5. Paste (Ctrl+V)
6. Commit message: `Add Cloudinary diagnostics and better error handling`
7. Click "Commit changes"
8. Render auto-deploys (2-3 minutes)

**After Deployment:**
1. Test diagnostic endpoint
2. Add Cloudinary credentials if missing
3. Test video upload
4. Should work! ✅

---

## 📊 Common Error Messages

### "Server configuration error"
- **Cause:** Cloudinary credentials not set
- **Fix:** Add credentials to Render environment

### "Upload timeout"
- **Cause:** Video too large or slow connection
- **Fix:** Compress video, use WiFi

### "Storage limit reached"
- **Cause:** Cloudinary quota exceeded
- **Fix:** Upgrade plan or delete old videos

### "File not found after upload"
- **Cause:** Server storage issue
- **Fix:** Restart Render service

### "No video file provided"
- **Cause:** File not selected or upload cancelled
- **Fix:** Select video file and try again

---

## ✅ Success Checklist

After fixing, you should be able to:
- ✅ Upload videos under 100MB
- ✅ See upload progress bar
- ✅ Video appears in sermon list
- ✅ Video plays in app
- ✅ Any duration works (under 100MB)

---

## 🆘 Still Not Working?

**Collect This Information:**
1. Video file size (in MB)
2. Video duration
3. Video format (MP4, MOV, etc.)
4. Error message shown in app
5. Server logs from Render
6. Result of diagnostic endpoint

**Then:**
- Check Cloudinary dashboard for errors
- Verify credentials are correct
- Try with a very small test video (< 5MB)
- Check if other admin functions work

---

## 📞 Support Resources

- **Cloudinary Dashboard:** https://cloudinary.com/console
- **Render Dashboard:** https://dashboard.render.com/
- **HandBrake (Compression):** https://handbrake.fr/
- **Diagnostic Endpoint:** https://church-app-server.onrender.com/api/sermons/check-cloudinary
