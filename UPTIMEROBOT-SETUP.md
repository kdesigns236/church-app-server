# 🚀 UptimeRobot Setup Guide - Keep Your Server Awake 24/7

## 🎯 What This Does
- Pings your Render server every 5 minutes
- Keeps server awake (no more sleep!)
- Video uploads work anytime
- **100% FREE!**

---

## 📋 Step-by-Step Setup

### Step 1: Create Account

1. Go to: **https://uptimerobot.com/**
2. Click: **"Sign Up Free"**
3. Enter:
   - Email: `your-email@example.com`
   - Password: `create-strong-password`
4. Click: **"Sign Up"**
5. Check your email and verify account
6. Log in to UptimeRobot

---

### Step 2: Add Monitor

1. Click: **"+ Add New Monitor"** (big green button)

2. Fill in the form:

   ```
   Monitor Type: HTTP(s)
   Friendly Name: Church App Server
   URL (or IP): https://church-app-server.onrender.com/api/health
   Monitoring Interval: 5 minutes
   Monitor Timeout: 30 seconds
   ```

3. Click: **"Create Monitor"**

---

### Step 3: Verify It's Working

After 5 minutes, you should see:

```
✅ Church App Server
   Status: Up (green checkmark)
   Response Time: ~200-500ms
   Uptime: 100%
```

---

## ✅ What Happens Now

### Before UptimeRobot:
```
User opens app after 20 minutes
    ↓
Server is SLEEPING 😴
    ↓
First request takes 30-60 seconds to wake server
    ↓
Upload might timeout ❌
```

### After UptimeRobot:
```
UptimeRobot pings every 5 minutes
    ↓
Server is ALWAYS AWAKE ⚡
    ↓
User opens app anytime
    ↓
Upload works immediately ✅
```

---

## 📊 UptimeRobot Dashboard

You'll see:

### Monitor Status:
- **Up** (green) - Server is running
- **Down** (red) - Server is offline
- **Paused** (gray) - Monitoring paused

### Statistics:
- **Uptime %** - How often server is up (aim for 99%+)
- **Response Time** - How fast server responds
- **Last Check** - When UptimeRobot last pinged

### Alerts:
- **Email** - Get notified when server goes down
- **SMS** (paid) - Text message alerts
- **Webhook** (advanced) - Custom integrations

---

## 🎯 Free Plan Features

UptimeRobot Free includes:

✅ **50 Monitors** (you only need 1)
✅ **5-minute intervals** (perfect for keeping server awake)
✅ **Email alerts** (unlimited)
✅ **2-month data retention**
✅ **Public status pages** (optional)
✅ **SSL certificate monitoring**

---

## 📧 Email Alerts

You'll receive emails when:

1. **Server Goes Down:**
   ```
   ⚠️ Church App Server is DOWN
   URL: https://church-app-server.onrender.com/api/health
   Time: 2025-01-04 21:30:00
   ```

2. **Server Comes Back Up:**
   ```
   ✅ Church App Server is UP
   Downtime: 2 minutes
   ```

3. **Slow Response:**
   ```
   ⚠️ Church App Server is SLOW
   Response Time: 35 seconds (threshold: 30s)
   ```

---

## 🔧 Advanced Settings (Optional)

### Custom Alert Thresholds:
- **Response Time Alert:** 30 seconds (default)
- **Alert After:** 2 failed checks (to avoid false alarms)

### Monitoring Locations:
- UptimeRobot checks from multiple locations worldwide
- Ensures your server is accessible globally

### Maintenance Windows:
- Pause monitoring during planned maintenance
- Avoid false "down" alerts

---

## 🚀 Testing Your Setup

### Test 1: Check Monitor Status
1. Go to UptimeRobot dashboard
2. Look for "Church App Server"
3. Should show **"Up"** with green checkmark

### Test 2: Check Server Logs
1. Go to Render dashboard
2. Open your service logs
3. You should see requests from UptimeRobot every 5 minutes:
   ```
   GET /api/health 200 - 45ms
   ```

### Test 3: Try Video Upload
1. Open your app
2. Go to Admin page
3. Try uploading a video
4. Should work without delay!

---

## 💡 Troubleshooting

### Monitor Shows "Down"
**Possible causes:**
1. Render server is actually down (check Render dashboard)
2. URL is incorrect (verify: `https://church-app-server.onrender.com/api/health`)
3. Server is deploying (wait for deployment to finish)

**Solution:**
- Check Render dashboard for errors
- Verify URL is correct
- Wait 5 minutes and check again

### Monitor Shows "Paused"
**Cause:** You accidentally paused monitoring

**Solution:**
- Click the monitor
- Click "Resume Monitoring"

### Not Receiving Email Alerts
**Cause:** Email not verified or in spam

**Solution:**
- Check spam folder
- Verify email in UptimeRobot settings
- Add `uptimerobot.com` to safe senders

---

## 📈 Expected Results

### Before UptimeRobot:
- Server sleeps after 15 minutes
- First request takes 30-60 seconds
- Video uploads might fail
- Users experience delays

### After UptimeRobot:
- Server stays awake 24/7
- Instant response times
- Video uploads work reliably
- Happy users! 🎉

---

## 🎯 Next Steps

1. ✅ Set up UptimeRobot (you just did this!)
2. ✅ Wait 5 minutes for first ping
3. ✅ Verify monitor shows "Up"
4. ✅ Test video upload on live app
5. ✅ Enjoy reliable uploads! 🚀

---

## 💰 Cost Breakdown

### Current Setup (FREE):
- Render Free Tier: $0/month
- Cloudinary Free Tier: $0/month
- UptimeRobot Free: $0/month
- **Total: $0/month** ✅

### If You Need More (Later):
- Render Starter: $7/month (no sleep, better performance)
- Cloudinary Plus: $99/month (more storage, longer videos)
- UptimeRobot Pro: $7/month (1-minute checks, SMS alerts)

---

## 🎉 Success!

Your server will now:
- ✅ Stay awake 24/7
- ✅ Handle video uploads anytime
- ✅ Respond instantly to users
- ✅ Send you alerts if something goes wrong

**No more "Failed to save" errors due to sleeping server!** 🎊

---

## 📞 Support

If you have issues:
1. Check UptimeRobot dashboard
2. Check Render logs
3. Verify URL is correct
4. Contact UptimeRobot support (very responsive!)

---

## 🔗 Useful Links

- **UptimeRobot Dashboard:** https://uptimerobot.com/dashboard
- **Render Dashboard:** https://dashboard.render.com/
- **Your Server Health:** https://church-app-server.onrender.com/api/health
- **UptimeRobot Docs:** https://uptimerobot.com/api/

---

**Setup complete! Your server is now monitored and will stay awake 24/7!** 🚀✅
