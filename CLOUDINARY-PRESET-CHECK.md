# Cloudinary Preset Troubleshooting

## ✅ What's Already Correct

From your screenshot, I can see:
- ✅ Upload preset name: `church_sermons`
- ✅ Signing mode: **Unsigned** (correct!)
- ✅ Asset folder: `church-sermons`

## 🔍 What to Check Next

### 1. Scroll Down in Preset Settings

Please scroll down on that Cloudinary page and check for:

#### A. **Allowed Formats**
- Should allow: `mp4, mov, avi, webm, mkv` (all video formats)
- If restricted, add all video formats

#### B. **Maximum File Size**
- Should be at least 100MB
- Your video is 9.53MB, so this should be fine
- But check if there's a limit set

#### C. **Access Control**
- Should be: **Public** or **Authenticated**
- Not: **Private**

#### D. **Transformation Settings**
- Check if any transformations are causing issues
- Try disabling transformations temporarily

### 2. Check Account Quota

Your error might be because:
- ❌ Storage quota exceeded
- ❌ Bandwidth limit reached
- ❌ Upload limit for the month

**To check:**
1. Go to Cloudinary Dashboard home
2. Look at the usage meters
3. See if you're at 100% of any limit

### 3. Test the Preset

I created a test page for you:

**Open:** `test-cloudinary-upload.html` in your browser

This will:
1. Upload directly to Cloudinary (same as your app)
2. Show the exact error message
3. Display the full response from Cloudinary

**This will tell us exactly what's wrong!**

## 🎯 Most Likely Issues

Based on error 400, it's usually one of these:

### Issue 1: Format Restriction
```
Problem: Preset only allows certain video formats
Solution: Add all video formats to allowed list
```

### Issue 2: File Size Limit
```
Problem: Preset has max file size < 9.53MB
Solution: Increase or remove file size limit
```

### Issue 3: Account Quota
```
Problem: Free tier storage/bandwidth exceeded
Solution: Upgrade plan or delete old videos
```

### Issue 4: CORS Issue
```
Problem: Cloudinary blocking mobile uploads
Solution: Enable CORS in Cloudinary settings
```

## 📋 Action Items

1. **Scroll down** in the preset settings page
2. **Screenshot** the rest of the settings (especially restrictions)
3. **Check** your account quota/usage
4. **Test** with `test-cloudinary-upload.html`
5. **Share** the error message from the test

## 🔧 Quick Fixes to Try

### Fix 1: Remove All Restrictions
In the preset settings:
- Allowed formats: **Leave empty** (allows all)
- Max file size: **Leave empty** (no limit)
- Access control: **Public**

### Fix 2: Check CORS Settings
1. Cloudinary Dashboard → Settings → Security
2. Find **Allowed domains**
3. Add: `*` (allow all) or your app domain

### Fix 3: Try Different Folder
In your app, the code sends:
```javascript
formData.append('folder', 'church-sermons');
```

But the preset might have a different folder set. Try:
1. Remove folder from preset settings
2. Or make sure preset folder matches `church-sermons`

## 🧪 Test Results

After you run `test-cloudinary-upload.html`, you'll see:
- ✅ Success: Shows video URL and full response
- ❌ Error: Shows exact error message and status code

**This will tell us exactly what's wrong!**

## 💡 Alternative Solution

If we can't fix the preset, I can switch the app to use **signed uploads** through your server:

**Pros:**
- ✅ More secure
- ✅ No preset needed
- ✅ Full control

**Cons:**
- ❌ 30-second server timeout risk (but we can increase it)
- ❌ Goes through server (slower)

Let me know what you find, and I'll help fix it! 🚀
