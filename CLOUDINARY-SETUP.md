# 🎬 Cloudinary Unsigned Upload Preset Setup

## ⚠️ CRITICAL: DO THIS FIRST!

Without this setup, video uploads will fail with **"Invalid upload preset"** error.

---

## 📋 Step-by-Step Instructions

### Step 1: Access Cloudinary Dashboard
1. Go to: https://cloudinary.com/console
2. Log in with your account

### Step 2: Navigate to Upload Settings
1. Click the **⚙️ Settings** icon (top-right corner)
2. In the left sidebar, click **Upload**
3. Scroll down to **Upload presets** section
4. Click **+ Add upload preset**

### Step 3: Configure Upload Preset

Enter these **EXACT** settings:

```
Preset name:        church_sermons
Signing mode:       Unsigned ⚠️ MUST BE UNSIGNED!
Folder:             church-sermons
Use filename:       No
Unique filename:    Yes
Overwrite:          No
Resource type:      Auto
```

### ⚠️ CRITICAL: Signing Mode

**The signing mode MUST be "Unsigned"!**

- ✅ If you select **Unsigned**: Mobile uploads will work
- ❌ If you select **Signed**: Mobile uploads will fail

### Step 4: Save the Preset
1. Click **Save** button at the bottom
2. You should see: "Upload preset created successfully"
3. The preset will appear in your list with:
   - **Name:** church_sermons
   - **Mode:** unsigned
   - **Status:** Active

---

## ✅ Verify Your Settings

Make sure these values match in your code:

**In `AdminPage.tsx`:**
```typescript
const CLOUDINARY_CLOUD_NAME = 'de0zuglgd';  // ✅ Your cloud name
const CLOUDINARY_UPLOAD_PRESET = 'church_sermons';  // ✅ The preset you created
```

You can find your **Cloud Name** in the Cloudinary Dashboard under **Account Details**.

---

## 🔒 Security Note

Unsigned presets allow anyone with the preset name to upload to your Cloudinary account.

**To secure it:**
- ✅ Folder restriction is set (church-sermons)
- ✅ Only accessible from your admin page
- ⚠️ Monitor your storage usage regularly
- 💡 Consider adding authentication to your admin page

---

## 🚀 After Creating the Preset

### 1. Rebuild the App
```bash
cd d:\church-of-god-evening-light
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

### 2. Install and Test
1. Uninstall old APK from phone
2. Install new `app-debug.apk`
3. Test with a **short video first** (30 seconds)
4. Then test with a **long video** (5+ minutes)

---

## 🎯 Expected Results

### For 15MB video (2 minutes):
```
[Admin] Starting direct upload to Cloudinary (unsigned)...
[Admin] Uploading to: https://api.cloudinary.com/v1_1/de0zuglgd/video/upload
[Admin] Upload response status: 200
[Admin] ✅ Upload successful!
[Admin] Video URL: https://res.cloudinary.com/de0zuglgd/video/upload/...
[Admin] Duration: 120 seconds
```

### For 50MB video (10 minutes):
- Will take 2-5 minutes depending on internet speed
- **Will NOT timeout** because it goes directly to Cloudinary
- **Bypasses Render's 30-second limit completely**

---

## 🆘 Troubleshooting

### "Invalid upload preset" error
**Cause:** Preset doesn't exist or name doesn't match

**Solution:**
1. Go to Cloudinary Dashboard → Settings → Upload
2. Check if `church_sermons` preset exists
3. Verify the name is **exactly** `church_sermons` (no spaces, lowercase)
4. Make sure it's **Active**

### "Upload failed: 401 Unauthorized"
**Cause:** Preset is in "Signed" mode instead of "Unsigned"

**Solution:**
1. Edit the preset in Cloudinary Dashboard
2. Change **Signing mode** to **Unsigned**
3. Click **Save**

### "Upload failed: 400 Bad Request"
**Cause:** Cloud name is wrong

**Solution:**
1. Check your Cloudinary Dashboard
2. Copy your **Cloud Name** from Account Details
3. Update `CLOUDINARY_CLOUD_NAME` in `AdminPage.tsx`

### Still timing out after 10 minutes
**Cause:** Internet connection too slow or video too large

**Solution:**
1. Compress the video before uploading
2. Use WiFi instead of mobile data
3. Try a smaller video first to test

---

## 💡 Video Compression Tips

If videos are too large, compress them before uploading:

### Android Apps:
- **Video Compressor** (by Sunshine Apps)
- **VidCompact**
- **Video Dieter 2**

### Recommended Settings:
- **Resolution:** 720p (1280x720)
- **Bitrate:** 1-2 Mbps
- **Format:** MP4 (H.264)

This will reduce a 50MB video to ~10-15MB without much quality loss.

---

## 📊 Why This Solution Works

| Problem | Previous Approach | New Approach |
|---------|------------------|--------------|
| Render 30s timeout | Upload through server ❌ | Direct to Cloudinary ✅ |
| CORS errors | XMLHttpRequest ❌ | Native fetch() with unsigned preset ✅ |
| Large files fail | Buffering in memory ❌ | Streaming upload ✅ |
| Need signatures | Server generates ❌ | Unsigned preset (no signature) ✅ |

---

## ✅ Checklist

Before testing, make sure you've done ALL of these:

- [ ] Created `church_sermons` preset in Cloudinary
- [ ] Set signing mode to **Unsigned**
- [ ] Verified cloud name is `de0zuglgd`
- [ ] Rebuilt the app (`npm run build` + `cap sync` + `gradlew assembleDebug`)
- [ ] Uninstalled old APK from phone
- [ ] Installed new APK
- [ ] Have a stable internet connection

---

**Last Updated:** November 5, 2025
**Status:** Ready to deploy after creating Cloudinary preset
