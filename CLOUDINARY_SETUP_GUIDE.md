# Cloudinary Video Hosting - Setup Guide

## ✅ **Implementation Complete!**

Your church app now uses **Cloudinary** for cloud video hosting. Videos uploaded by admin are stored in the cloud and accessible to all members on any device.

---

## 🚀 **Quick Start**

### **Step 1: Create Cloudinary Account** (5 minutes)

1. Go to https://cloudinary.com
2. Click "Sign Up for Free"
3. Fill in your details:
   - Email
   - Password
   - Cloud name (e.g., "church-of-god-evening-light")
4. Verify your email
5. Login to Cloudinary Dashboard

### **Step 2: Get Your Credentials**

From your Cloudinary Dashboard:

1. Click on **"Dashboard"** in the left menu
2. You'll see your credentials:
   ```
   Cloud Name: your_cloud_name
   API Key: 123456789012345
   API Secret: abcdefghijklmnopqrstuvwxyz
   ```
3. **Copy these values** - you'll need them next

---

## 🔧 **Step 3: Configure Backend (Render)**

### **Add Environment Variables to Render:**

1. Go to https://dashboard.render.com
2. Select your **church-app-server** service
3. Click **"Environment"** tab
4. Click **"Add Environment Variable"**
5. Add these three variables:

```
CLOUDINARY_CLOUD_NAME = your_cloud_name_here
CLOUDINARY_API_KEY = your_api_key_here
CLOUDINARY_API_SECRET = your_api_secret_here
```

6. Click **"Save Changes"**
7. Render will automatically redeploy your server

---

## 💻 **Step 4: Configure Local Development**

### **Create `.env` file in server folder:**

1. Navigate to `server/` folder
2. Create a file named `.env`
3. Add your Cloudinary credentials:

```env
PORT=3001
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

4. Save the file

**Important:** The `.env` file is already in `.gitignore` so your secrets won't be committed to GitHub.

---

## 📦 **Step 5: Install Dependencies**

### **Backend:**

```bash
cd server
npm install
```

This will install the new `cloudinary` package.

### **Frontend:**

No new dependencies needed! ✅

---

## 🎬 **Step 6: Deploy to Render**

### **Option A: Push to GitHub (Recommended)**

```bash
cd server
git add .
git commit -m "Add Cloudinary video hosting"
git push origin main
```

Render will automatically deploy the changes.

### **Option B: Manual Deploy**

1. Go to Render Dashboard
2. Select your service
3. Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## ✅ **Step 7: Verify Setup**

### **Check Backend:**

1. Wait for Render deployment to complete
2. Visit: `https://church-app-server.onrender.com/api/health`
3. You should see: `{"status":"ok","clients":0,"timestamp":...}`

### **Check Logs:**

1. In Render Dashboard, click **"Logs"**
2. Look for: `[Cloudinary] Configuration loaded`
3. If you see this, Cloudinary is configured! ✅

---

## 🎥 **How to Use**

### **For Admin:**

1. Login to your church app as admin
2. Go to **Admin Panel**
3. Click **"Add New Sermon"**
4. Fill in sermon details
5. **Upload video file** (MP4 recommended)
6. Click **"Save"**
7. You'll see: **"Uploading Video to Cloud..."**
8. Wait for upload to complete (may take 1-5 minutes)
9. Done! ✅

### **For Members:**

1. Login to church app
2. Go to **Sermons** page
3. Videos will play automatically from the cloud
4. Works on all devices! 📱💻

---

## 🔍 **Troubleshooting**

### **Problem: "Upload failed" error**

**Solution:**
- Check Cloudinary credentials in Render environment variables
- Verify credentials are correct (no extra spaces)
- Check Render logs for detailed error message
- Ensure video file is under 500MB

### **Problem: Videos not playing**

**Solution:**
- Check browser console for errors
- Verify sermon has `videoUrl` starting with `https://res.cloudinary.com`
- Try different browser
- Check internet connection

### **Problem: "Cloudinary configuration not found"**

**Solution:**
- Verify environment variables are set in Render
- Redeploy server after adding variables
- Check Render logs for `[Cloudinary] Configuration loaded`

### **Problem: Slow upload**

**Solution:**
- Compress video before upload (recommended: 720p, H.264 codec)
- Use tools like HandBrake or FFmpeg
- Cloudinary free tier has upload speed limits
- Consider upgrading Cloudinary plan

---

## 📊 **Cloudinary Free Tier Limits**

Your free account includes:

- **Storage:** 25 GB
- **Bandwidth:** 25 GB/month
- **Transformations:** 25 credits/month
- **Videos:** Unlimited uploads

**Estimated capacity:**
- ~50-100 sermon videos (depending on length/quality)
- ~500-1000 video views per month

**When to upgrade:**
- If you exceed 25GB storage
- If you exceed 25GB bandwidth/month
- If you need faster uploads
- If you need advanced features

---

## 🎯 **Best Practices**

### **Video Optimization:**

1. **Format:** MP4 (H.264 codec)
2. **Resolution:** 720p or 1080p
3. **Bitrate:** 2-5 Mbps
4. **Audio:** AAC, 128 kbps

### **Recommended Tools:**

- **HandBrake** (Free): https://handbrake.fr
- **FFmpeg** (Free): https://ffmpeg.org
- **Cloudinary Media Library**: Built-in optimization

### **Upload Tips:**

- Upload during off-peak hours
- Compress videos before upload
- Test with small video first
- Monitor Cloudinary usage dashboard

---

## 🔐 **Security**

### **Keep Credentials Secret:**

✅ **DO:**
- Store credentials in `.env` file
- Add `.env` to `.gitignore`
- Use Render environment variables
- Rotate API keys periodically

❌ **DON'T:**
- Commit credentials to GitHub
- Share credentials publicly
- Hardcode credentials in code
- Use same credentials for multiple projects

---

## 📈 **Monitoring Usage**

### **Check Cloudinary Dashboard:**

1. Login to Cloudinary
2. Go to **"Dashboard"**
3. View:
   - Storage used
   - Bandwidth used
   - Number of videos
   - Transformations used

### **Set Up Alerts:**

1. Go to **"Settings"** → **"Notifications"**
2. Enable email alerts for:
   - 80% storage limit
   - 80% bandwidth limit
   - Failed uploads

---

## 🔄 **Migration from IndexedDB**

### **Old Sermons (indexed-db:// URLs):**

Old sermons with `indexed-db://` URLs will:
- ✅ Still work on admin's device (where video was uploaded)
- ❌ NOT work on member devices

### **How to Migrate:**

1. Admin must re-upload videos for old sermons
2. Edit each old sermon in Admin Panel
3. Upload video file again
4. Save sermon
5. Old `indexed-db://` URL replaced with Cloudinary URL
6. Now works on all devices! ✅

### **Batch Migration:**

If you have many old sermons, contact me for a migration script.

---

## 📞 **Support**

### **Cloudinary Support:**
- Docs: https://cloudinary.com/documentation
- Support: https://support.cloudinary.com
- Community: https://community.cloudinary.com

### **Common Issues:**
- Video format not supported → Convert to MP4
- Upload timeout → Compress video or check internet
- Quota exceeded → Upgrade plan or delete old videos

---

## 🎉 **Success Checklist**

Before going live, verify:

- ✅ Cloudinary account created
- ✅ Credentials added to Render
- ✅ Backend deployed successfully
- ✅ Test video uploaded as admin
- ✅ Test video plays on member device
- ✅ Test video plays on mobile
- ✅ No errors in browser console
- ✅ No errors in Render logs

---

## 📝 **What Changed**

### **Backend:**
- ✅ Added Cloudinary SDK
- ✅ Added `/api/sermons/upload-video` endpoint
- ✅ Added `/api/sermons/delete-video` endpoint
- ✅ Added temp file handling

### **Frontend:**
- ✅ Admin panel uploads to Cloudinary
- ✅ Upload progress indicator
- ✅ SermonReel streams from cloud URLs
- ✅ Backwards compatible with IndexedDB

### **Types:**
- ✅ Updated `Sermon` interface
- ✅ Added `videoPublicId` field

---

## 🚀 **Next Steps**

1. **Test thoroughly** with different video sizes
2. **Monitor Cloudinary usage** for first month
3. **Optimize videos** before upload
4. **Set up usage alerts** in Cloudinary
5. **Plan for upgrade** if needed

---

## 💡 **Pro Tips**

1. **Compress videos before upload** - saves bandwidth and storage
2. **Use consistent naming** - e.g., "2025-01-15-sunday-service"
3. **Delete old videos** from Cloudinary if no longer needed
4. **Enable auto-backup** in Cloudinary settings
5. **Test on multiple devices** before announcing to church

---

**Setup Complete!** 🎉

Your church app now has professional cloud video hosting. Videos work on all devices, all the time!

**Questions?** Check the troubleshooting section or contact support.
