# 🚀 Uploadcare Setup Guide

## Why Uploadcare?

✅ **100MB video limit** (vs Cloudinary's 10MB free tier)  
✅ **FREE forever** for your use case  
✅ **3GB storage**  
✅ **30GB CDN traffic/month**  
✅ **Automatic video transcoding**  
✅ **No credit card required**

---

## Step 1: Sign Up

1. Go to: https://uploadcare.com/accounts/signup/
2. Sign up with your email
3. Verify your email
4. Complete the onboarding

---

## Step 2: Get Your Public Key

1. Go to **Dashboard** → **API Keys**
2. Copy your **Public Key** (looks like: `demopublickey`)
3. Keep this handy!

---

## Step 3: Update the Code

I've already updated the code! Just need to add your public key:

1. Open: `d:\church-of-god-evening-light\pages\AdminPage.tsx`
2. Find line 316:
   ```typescript
   const UPLOADCARE_PUBLIC_KEY = 'YOUR_UPLOADCARE_PUBLIC_KEY';
   ```
3. Replace `YOUR_UPLOADCARE_PUBLIC_KEY` with your actual key:
   ```typescript
   const UPLOADCARE_PUBLIC_KEY = 'demopublickey'; // Your actual key
   ```

---

## Step 4: Rebuild and Test

```bash
cd d:\church-of-god-evening-light
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

Then install the new APK and test!

---

## 🎯 What Changed?

### Before (Cloudinary):
- ❌ 10MB video limit
- ❌ Videos over 10MB failed
- ❌ Required upload preset setup

### After (Uploadcare):
- ✅ 100MB video limit
- ✅ Videos up to 100MB work
- ✅ Simple API, no preset needed

---

## 📊 Uploadcare Response Format

When a video uploads successfully, Uploadcare returns:

```json
{
  "file": "a6f9c0f6-8f3e-4c3e-9b1a-1234567890ab"
}
```

The video URL will be:
```
https://ucarecdn.com/a6f9c0f6-8f3e-4c3e-9b1a-1234567890ab/
```

---

## 🔧 Configuration Details

**Upload Endpoint:**
```
https://upload.uploadcare.com/base/
```

**FormData Parameters:**
- `UPLOADCARE_PUB_KEY`: Your public key
- `UPLOADCARE_STORE`: '1' (store permanently)
- `file`: The video file

**CDN URL Format:**
```
https://ucarecdn.com/{file_uuid}/
```

---

## ✅ Testing Checklist

- [ ] Signed up for Uploadcare
- [ ] Got public key from dashboard
- [ ] Updated `UPLOADCARE_PUBLIC_KEY` in AdminPage.tsx
- [ ] Rebuilt the app
- [ ] Synced with Capacitor
- [ ] Built new APK
- [ ] Installed on phone
- [ ] Tested with 15MB video
- [ ] Tested with 50MB video
- [ ] Tested with 80MB video

---

## 🆘 Troubleshooting

### "Invalid public key" error
- Check that you copied the key correctly
- Make sure there are no extra spaces
- Verify the key in Uploadcare dashboard

### "Upload failed: 403"
- Public key might be wrong
- Check your Uploadcare account status

### "Upload timeout"
- Video might be too large (>100MB)
- Internet connection too slow
- Try compressing the video

---

## 📈 Monitoring Usage

**Check your usage:**
1. Go to Uploadcare Dashboard
2. Click **Statistics**
3. See:
   - Storage used
   - CDN traffic
   - Number of files

**Free tier limits:**
- 3GB storage
- 30GB CDN traffic/month
- Unlimited uploads (up to 100MB each)

---

## 🎉 Benefits Summary

| Feature | Cloudinary Free | Uploadcare Free |
|---------|----------------|-----------------|
| Video limit | 10MB ❌ | 100MB ✅ |
| Storage | 25GB | 3GB |
| Bandwidth | 25GB/month | 30GB/month |
| Setup | Complex (presets) | Simple (just key) |
| Cost | $0 | $0 |

**Perfect for your church app!** 🙏

---

**Next:** Get your public key and paste it here so I can update the code!
