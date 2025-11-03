# Render Deployment Guide - 100% FREE!

## 🎯 Deploy Your Server to Render (FREE Forever!)

### ✅ What You Get:
- 100% FREE hosting
- No credit card needed
- Automatic HTTPS
- Easy deployment
- Perfect for church apps

## 📋 Step-by-Step Deployment:

### Method 1: Deploy from GitHub (Recommended - Easiest!)

#### Step 1: Push Code to GitHub

**If you don't have a GitHub repo yet:**

1. **Go to**: https://github.com
2. **Click**: "New repository"
3. **Name**: `church-of-god-evening-light`
4. **Click**: "Create repository"

**Then push your code:**

```bash
# In your project folder
cd d:\church-of-god-evening-light

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Church app with server"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/church-of-god-evening-light.git

# Push
git push -u origin main
```

#### Step 2: Deploy on Render

1. **Go to**: https://dashboard.render.com
2. **Click**: "New +" → "Web Service"
3. **Click**: "Connect GitHub" (authorize if needed)
4. **Select**: Your repository (`church-of-god-evening-light`)
5. **Configure**:
   - **Name**: `church-app-server`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: **Free** ✅
6. **Click**: "Create Web Service"
7. **Wait** 2-3 minutes for deployment

#### Step 3: Get Your Server URL

After deployment completes:
- You'll see: `https://church-app-server.onrender.com`
- **Copy this URL!**

---

### Method 2: Deploy Manually (No GitHub)

#### Step 1: Install Render CLI

```bash
npm install -g render-cli
```

#### Step 2: Login to Render

```bash
render login
```

#### Step 3: Deploy

```bash
cd d:\church-of-god-evening-light\server
render deploy
```

---

## 🎯 After Deployment:

### Step 1: Test Your Server

**Open these URLs in your browser:**

1. **Health Check:**
   ```
   https://your-app-name.onrender.com/api/health
   ```
   Should show: `{"status":"ok","clients":0,"timestamp":...}`

2. **Sync Data:**
   ```
   https://your-app-name.onrender.com/api/sync/data
   ```
   Should show JSON data

### Step 2: Update Your App

**Create `.env` file in project root:**

```bash
cd d:\church-of-god-evening-light
echo VITE_API_URL=https://your-app-name.onrender.com/api > .env
```

**Replace `your-app-name` with your actual Render URL!**

Example:
```
VITE_API_URL=https://church-app-server.onrender.com/api
```

### Step 3: Rebuild App

```bash
# Build web app
npm run build

# Sync with Android
npx cap sync android

# Open in Android Studio
npx cap open android

# Build signed APK
# Build → Generate Signed Bundle / APK
```

---

## 🔥 Keep Server Awake 24/7 (FREE!)

### Use UptimeRobot to Prevent Sleep:

#### Step 1: Create UptimeRobot Account

1. **Go to**: https://uptimerobot.com
2. **Click**: "Free Sign Up"
3. **Create account** (free, no credit card)
4. **Verify email**

#### Step 2: Add Monitor

1. **Click**: "Add New Monitor"
2. **Configure**:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Church App Server
   - **URL**: `https://your-app-name.onrender.com/api/health`
   - **Monitoring Interval**: 5 minutes
3. **Click**: "Create Monitor"

#### Step 3: Done!

✅ Server will be pinged every 5 minutes
✅ Server stays awake 24/7
✅ 100% FREE!

---

## 📊 How It Works:

### Without UptimeRobot:
```
No activity for 15 min → Server sleeps
Member opens app → Server wakes (1-2 sec) → Syncs
```

### With UptimeRobot:
```
UptimeRobot pings every 5 min → Server stays awake
Member opens app → Instant sync! ✅
```

---

## 🎯 Complete Setup Checklist:

- [ ] Render account created
- [ ] Code pushed to GitHub (or deployed manually)
- [ ] Web service created on Render
- [ ] Deployment successful
- [ ] Server URL copied
- [ ] `.env` file created with server URL
- [ ] App rebuilt with new URL
- [ ] UptimeRobot account created
- [ ] Monitor added to UptimeRobot
- [ ] Server staying awake 24/7
- [ ] APK installed on phones
- [ ] Testing sync between devices

---

## 🧪 Testing:

### Test 1: Server is Running
```bash
# Open in browser:
https://your-app-name.onrender.com/api/health

# Should show:
{"status":"ok","clients":0,"timestamp":1234567890}
```

### Test 2: Data Sync
```bash
# Open in browser:
https://your-app-name.onrender.com/api/sync/data

# Should show JSON with sermons, announcements, etc.
```

### Test 3: App Sync
1. Install app on Phone 1 (admin)
2. Add sermon
3. Install app on Phone 2 (member)
4. ✅ Member sees sermon!

### Test 4: Real-Time Updates
1. Both phones online
2. Admin adds announcement
3. ✅ Member sees it instantly!

### Test 5: Offline Mode
1. Turn off WiFi on member phone
2. Open app
3. ✅ Shows cached data
4. Turn WiFi back on
5. ✅ Syncs latest updates

---

## 🐛 Troubleshooting:

### Issue: Deployment Failed

**Check Render logs:**
1. Go to Render dashboard
2. Click your service
3. Click "Logs" tab
4. Look for errors

**Common fixes:**
- Ensure `package.json` has `start` script
- Ensure `server` folder has all files
- Check Node.js version compatibility

### Issue: App Can't Connect

**Solutions:**
1. Verify `.env` has correct URL
2. Rebuild app after changing `.env`
3. Check server is running in Render dashboard
4. Test server URL in browser

### Issue: Server Sleeping

**Solution:**
- Set up UptimeRobot (see above)
- Ping interval: 5 minutes
- Monitor URL: `/api/health`

---

## 💰 Cost Breakdown:

| Service | Cost | Purpose |
|---------|------|---------|
| Render | **FREE** | Server hosting |
| UptimeRobot | **FREE** | Keep server awake |
| **TOTAL** | **$0/month** | 🎉 |

---

## 🎉 Success!

**You now have:**
- ✅ Free cloud server
- ✅ Always-on (with UptimeRobot)
- ✅ Real-time sync
- ✅ Offline support
- ✅ Professional infrastructure
- ✅ $0 cost!

---

## 📝 Important URLs:

### Render:
- **Dashboard**: https://dashboard.render.com
- **Docs**: https://render.com/docs
- **Support**: https://render.com/support

### UptimeRobot:
- **Dashboard**: https://uptimerobot.com/dashboard
- **Docs**: https://uptimerobot.com/api

### Your Server:
- **URL**: `https://your-app-name.onrender.com`
- **Health**: `https://your-app-name.onrender.com/api/health`
- **Sync**: `https://your-app-name.onrender.com/api/sync/data`

---

## 🚀 Next Steps:

1. ✅ Server deployed to Render
2. ✅ UptimeRobot keeping it awake
3. ✅ App updated with server URL
4. ✅ APK rebuilt and distributed
5. ✅ All members syncing!

**Congratulations! Your church app is now live!** 🎊

---

## 📞 Need Help?

**If you get stuck:**
1. Check Render logs
2. Check browser console (F12)
3. Test server URL directly
4. Verify `.env` file
5. Rebuild app

**Common issues are usually:**
- Wrong URL in `.env`
- Forgot to rebuild app
- Server not deployed correctly

**Everything should work perfectly!** 🚀
