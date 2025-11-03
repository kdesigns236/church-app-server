# Railway Deployment Guide - FREE Cloud Server

## 🚀 Deploy Your Church App Server to Railway (FREE)

### ✅ What You'll Get:
- Free cloud server
- Automatic HTTPS
- Custom domain
- 500 hours/month free
- No credit card needed (for starter)

## 📋 Step-by-Step Instructions:

### Step 1: Create Railway Account

1. **Go to**: https://railway.app
2. **Click**: "Start a New Project"
3. **Sign up with GitHub** (recommended) or email
4. **Verify your email**
5. ✅ Account created!

### Step 2: Deploy Server via Railway CLI

**Open PowerShell/Terminal and run:**

```bash
# Navigate to server folder
cd d:\church-of-god-evening-light\server

# Login to Railway (opens browser)
railway login

# Initialize Railway project
railway init

# When prompted:
# - Project name: church-of-god-evening-light-server
# - Select: "Empty Project"

# Deploy to Railway
railway up

# Wait for deployment (1-2 minutes)
```

### Step 3: Get Your Server URL

```bash
# Get your server URL
railway domain

# Example output:
# https://church-of-god-evening-light-server-production.up.railway.app
```

**Copy this URL!** You'll need it for the app.

### Step 4: Configure Environment Variables

**In Railway Dashboard:**

1. Go to: https://railway.app/dashboard
2. Click your project
3. Click "Variables" tab
4. Add these variables:
   - `PORT`: `3001`
   - `NODE_ENV`: `production`

5. Click "Deploy" to apply changes

### Step 5: Update App Configuration

**Create `.env` file in project root:**

```bash
# In d:\church-of-god-evening-light\
echo VITE_API_URL=https://your-railway-url.railway.app/api > .env
```

**Replace `your-railway-url` with your actual Railway URL!**

Example:
```
VITE_API_URL=https://church-of-god-evening-light-server-production.up.railway.app/api
```

### Step 6: Rebuild App

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

## 🎯 Alternative: Deploy via Railway Dashboard (Easier!)

### Method 2: GitHub Deploy (Recommended)

1. **Push your code to GitHub:**

```bash
# Initialize git (if not already)
cd d:\church-of-god-evening-light
git init
git add .
git commit -m "Initial commit"

# Create GitHub repo and push
# (Follow GitHub instructions)
```

2. **Deploy on Railway:**
   - Go to: https://railway.app/dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select `server` folder as root directory
   - Click "Deploy"

3. **Get URL:**
   - Click "Settings"
   - Click "Generate Domain"
   - Copy the URL

4. **Update app** with the URL (see Step 5 above)

## 📊 Railway Dashboard Features:

### Monitor Your Server:
- **Logs**: View server logs in real-time
- **Metrics**: CPU, memory, network usage
- **Deployments**: See deployment history
- **Variables**: Manage environment variables

### Access Dashboard:
https://railway.app/dashboard

## 🔧 Server Configuration:

### Required Files (Already Set Up):

1. **`package.json`** ✅
   - Has `start` script
   - Lists dependencies

2. **`index.js`** ✅
   - Express server
   - API endpoints
   - SSE support

3. **`data.json`** ✅
   - Data storage
   - Auto-created if missing

### Railway Auto-Detects:
- Node.js version
- Dependencies
- Start command
- Port configuration

## ✅ Verification:

### Test Your Server:

**After deployment, test these URLs:**

1. **Health Check:**
   ```
   https://your-railway-url.railway.app/
   ```
   Should show: "Church of God Evening Light Sync Server"

2. **API Endpoint:**
   ```
   https://your-railway-url.railway.app/api/sync/data
   ```
   Should return JSON data

3. **SSE Stream:**
   ```
   https://your-railway-url.railway.app/api/sync/stream
   ```
   Should connect (use browser or curl)

## 🎬 Complete Workflow:

```
1. Deploy server to Railway
   ↓
2. Get Railway URL
   ↓
3. Update .env with URL
   ↓
4. Rebuild app
   ↓
5. Install on phones
   ↓
6. All phones sync automatically!
```

## 💰 Railway Pricing:

### Free Tier:
- **500 hours/month** (enough for 24/7 uptime)
- **100 GB bandwidth**
- **1 GB RAM**
- **1 GB storage**
- **Perfect for your church app!**

### If You Need More:
- **Hobby Plan**: $5/month
- **Unlimited hours**
- **More resources**

## 🔒 Security:

### Railway Provides:
- ✅ Automatic HTTPS
- ✅ SSL certificates
- ✅ DDoS protection
- ✅ Secure environment

### Your Server Has:
- ✅ Admin authentication
- ✅ Token verification
- ✅ CORS protection

## 🐛 Troubleshooting:

### Issue: Deployment Failed
**Solution:**
- Check Railway logs
- Ensure `package.json` has `start` script
- Verify Node.js version compatibility

### Issue: Can't Access Server
**Solution:**
- Check Railway dashboard for errors
- Verify domain is generated
- Check firewall settings

### Issue: App Can't Connect
**Solution:**
- Verify `.env` has correct URL
- Rebuild app after changing URL
- Check server is running in Railway dashboard

## 📝 Quick Reference:

### Railway CLI Commands:
```bash
railway login          # Login to Railway
railway init           # Initialize project
railway up             # Deploy
railway logs           # View logs
railway domain         # Get domain
railway status         # Check status
railway open           # Open dashboard
```

### Important URLs:
- **Railway Dashboard**: https://railway.app/dashboard
- **Documentation**: https://docs.railway.app
- **Support**: https://railway.app/help

## ✅ Next Steps After Deployment:

1. ✅ Server deployed to Railway
2. ✅ Got Railway URL
3. ✅ Updated `.env` file
4. ✅ Rebuilt app
5. ✅ Installed on phones
6. ✅ All phones syncing!

## 🎉 Success Checklist:

- [ ] Railway account created
- [ ] Server deployed
- [ ] Domain generated
- [ ] URL copied
- [ ] `.env` file updated
- [ ] App rebuilt
- [ ] APK installed on phones
- [ ] Admin can add content
- [ ] Members see updates
- [ ] Offline mode works
- [ ] Auto-sync works

## 🚀 You're Ready!

**Your church app now has:**
- ✅ Free cloud server
- ✅ Real-time sync
- ✅ Offline support
- ✅ Automatic updates
- ✅ Professional infrastructure

**Congratulations!** 🎊

---

## 📞 Need Help?

If you get stuck at any step, let me know which step and I'll help you through it!

**Common Questions:**

**Q: Do I need a credit card?**
A: No! Railway's free tier doesn't require a credit card.

**Q: Will my server stay online 24/7?**
A: Yes! Railway keeps your server running continuously.

**Q: What if I exceed free tier limits?**
A: Railway will notify you. You can upgrade to Hobby plan ($5/month) if needed.

**Q: Can I use a custom domain?**
A: Yes! Railway supports custom domains (e.g., api.yourchurch.com)

**Q: Is my data secure?**
A: Yes! Railway provides HTTPS, encryption, and secure storage.

---

**Ready to deploy? Follow the steps above and let me know if you need help!** 🚀
