# Quick Render Deployment - Without Git

## 🚀 Deploy Your Server in 5 Minutes!

Since you don't have Git installed, we'll use Render's manual deployment.

### Step 1: Create a ZIP of Your Server Folder

1. **Go to**: `d:\church-of-god-evening-light\server`
2. **Right-click** on the `server` folder
3. **Select**: "Send to" → "Compressed (zipped) folder"
4. **Name it**: `church-server.zip`

### Step 2: Upload to GitHub (Easy Way)

**Option A: Use GitHub Web Interface**

1. **Go to**: https://github.com/new
2. **Repository name**: `church-app-server`
3. **Make it**: Public
4. **Click**: "Create repository"
5. **Click**: "uploading an existing file"
6. **Drag and drop** all files from `d:\church-of-god-evening-light\server` folder
7. **Click**: "Commit changes"

**Option B: Use Render's Public Git URL**

If you already have the code somewhere online, you can use that URL directly.

### Step 3: Deploy on Render

**You're already on Render dashboard! Perfect!**

1. **Click**: "+ New" (top right) → "Web Service"
2. **Click**: "Build and deploy from a Git repository"
3. **Click**: "Connect GitHub" (authorize if needed)
4. **Select**: Your `church-app-server` repository
5. **Configure**:
   - **Name**: `church-app-server`
   - **Root Directory**: Leave empty (or `.` if it asks)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free** ✅
6. **Click**: "Create Web Service"
7. **Wait** 2-3 minutes

### Step 4: Get Your URL

After deployment:
- You'll see: `https://church-app-server.onrender.com`
- **Copy this URL!**

### Step 5: Update Your App

**Create `.env` file:**

1. Open Notepad
2. Type:
   ```
   VITE_API_URL=https://church-app-server.onrender.com/api
   ```
3. Save as: `d:\church-of-god-evening-light\.env`
4. Make sure it's `.env` not `.env.txt`

### Step 6: Rebuild App

```bash
cd d:\church-of-god-evening-light
npm run build
npx cap sync android
npx cap open android
```

### Step 7: Keep Server Awake (FREE!)

1. **Go to**: https://uptimerobot.com
2. **Sign up** (free)
3. **Add Monitor**:
   - URL: `https://church-app-server.onrender.com/api/health`
   - Interval: 5 minutes
4. **Done!** Server stays awake 24/7

---

## ✅ That's It!

Your server is now:
- ✅ Deployed to Render (FREE)
- ✅ Always on (with UptimeRobot)
- ✅ Ready to sync data!

---

## 🎯 Quick Alternative: Deploy Server Files Directly

**Even Easier - No GitHub Needed!**

I can help you create a simple deployment package that you can upload directly to Render.

**Want me to prepare the files for direct upload?**
