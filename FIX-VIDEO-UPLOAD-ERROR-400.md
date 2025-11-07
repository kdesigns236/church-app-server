# Fix Video Upload Error 400

## 🔴 Problem
Video upload fails at 80% with "Error: Upload failed: 400"

## 🎯 Root Cause
The Cloudinary **unsigned upload preset** `church_sermons` is either:
1. Not created
2. Not set to "Unsigned" mode
3. Has wrong settings

## ✅ Solution (Fix in Cloudinary Dashboard)

### Step 1: Login to Cloudinary
1. Go to https://cloudinary.com/console
2. Login with your account

### Step 2: Check/Create Upload Preset

1. Click **Settings** (gear icon) in top right
2. Click **Upload** tab on the left
3. Scroll down to **Upload presets** section
4. Look for preset named: `church_sermons`

### Step 3: Configure the Preset

**If preset exists:**
1. Click on `church_sermons` preset
2. Make sure **Signing Mode** is set to **Unsigned** ⚠️ CRITICAL!
3. Set **Folder** to: `church-sermons`
4. Click **Save**

**If preset doesn't exist:**
1. Click **Add upload preset** button
2. Fill in:
   - **Preset name:** `church_sermons`
   - **Signing Mode:** **Unsigned** ⚠️ CRITICAL!
   - **Folder:** `church-sermons`
   - **Use filename:** Yes
   - **Unique filename:** Yes
3. Click **Save**

### Step 4: Verify Settings

Your preset should look like this:
```
Preset name: church_sermons
Signing Mode: Unsigned ✅
Folder: church-sermons
Resource type: Auto
Access mode: Public
```

## 🧪 Test Upload

After fixing the preset:
1. Open app
2. Go to Admin page
3. Try uploading a video
4. Should work now! ✅

## 📊 Current Configuration

**Your Cloudinary:**
- Cloud name: `de0zuglgd`
- Upload URL: `https://api.cloudinary.com/v1_1/de0zuglgd/video/upload`
- Preset: `church_sermons` (needs to be Unsigned!)

## 🔧 Alternative: Use Signed Upload (Server-Side)

If you can't create unsigned preset, we can switch to signed upload through server:

### Option A: Direct to Cloudinary (Current - Needs Fix)
```
App → Cloudinary (Direct)
✅ No server timeout
❌ Needs unsigned preset
```

### Option B: Through Server (Alternative)
```
App → Your Server → Cloudinary
❌ 30-second timeout risk
✅ No preset needed
```

To switch to Option B, I can update the app code, but it's better to fix the preset!

## 🎯 Quick Fix Checklist

- [ ] Login to Cloudinary Dashboard
- [ ] Go to Settings → Upload
- [ ] Find/Create `church_sermons` preset
- [ ] Set Signing Mode to **Unsigned**
- [ ] Set Folder to `church-sermons`
- [ ] Save
- [ ] Test upload in app

## 💡 Why This Happens

Cloudinary has two upload modes:

1. **Unsigned** (Public)
   - Anyone can upload
   - No signature needed
   - Perfect for mobile apps
   - ✅ What we need!

2. **Signed** (Private)
   - Needs server signature
   - More secure
   - Requires server call first
   - ❌ Not configured yet

Your preset is probably set to "Signed" mode, causing the 400 error.

## 🚀 After Fix

Once preset is set to Unsigned:
- ✅ Videos upload directly to Cloudinary
- ✅ No server timeout
- ✅ Works for any video size (up to 100MB)
- ✅ No app rebuild needed!

## 📞 Need Help?

If you can't access Cloudinary Dashboard:
1. Send me your Cloudinary login details (privately)
2. Or give me the error message from Cloudinary
3. Or I can switch to server-side upload (Option B)

The fix is just a setting change in Cloudinary Dashboard - takes 30 seconds! 🎉
