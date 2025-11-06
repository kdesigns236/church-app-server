# OneSignal Push Notifications Setup Guide

## 🎯 What You'll Get:
- ✅ Push notifications when someone sends a chat message
- ✅ Reply directly from notification bar (Android)
- ✅ Works even when app is closed
- ✅ Action buttons (Reply, Mark as Read)
- ✅ FREE for up to 10,000 users

---

## 📋 STEP 1: Create OneSignal Account (5 minutes)

### 1. Go to OneSignal:
```
https://onesignal.com/
```

### 2. Sign Up (FREE):
- Click "Get Started Free"
- Use your email or Google account
- No credit card required!

### 3. Create New App:
- Click "New App/Website"
- Name: **Church of God Evening Light**
- Platform: **Google Android (FCM)**

---

## 📋 STEP 2: Configure Android (5 minutes)

### 1. Select Google Android (FCM):
- Click "Google Android (FCM)"
- You'll see configuration options

### 2. Firebase Server Key (Optional):
**You can SKIP this for now!**
- OneSignal provides a default FCM configuration
- Click "Next" or "Save & Continue"

### 3. Get Your App ID:
After creating the app, you'll see:
```
App ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```
**COPY THIS APP ID!** We need it for the next step.

---

## 📋 STEP 3: Add App ID to Your App

### Open this file:
```
d:\church-of-god-evening-light\.env
```

### Add this line:
```
VITE_ONESIGNAL_APP_ID=your-app-id-here
```

**Example:**
```
VITE_ONESIGNAL_APP_ID=12345678-1234-1234-1234-123456789abc
```

---

## 📋 STEP 4: Configure Android Manifest

### OneSignal needs permissions in AndroidManifest.xml

**File location:**
```
d:\church-of-god-evening-light\android\app\src\main\AndroidManifest.xml
```

**I'll add these automatically in the code!**

---

## 📋 STEP 5: Test Notifications

### After building the APK:

1. **Install app on your phone**
2. **Open the app** - OneSignal will register
3. **Go to OneSignal Dashboard**
4. **Click "Messages" → "New Push"**
5. **Type a test message**
6. **Send to "All Users"**
7. **Check your phone!** 🔔

---

## 🎯 WHAT HAPPENS NEXT:

### I'll implement:
1. ✅ OneSignal initialization in app
2. ✅ Chat notification triggers
3. ✅ Reply-from-notification functionality
4. ✅ User ID tracking
5. ✅ Notification click handling

### You'll be able to:
1. 📱 Send notifications from OneSignal dashboard
2. 💬 Auto-notify users when chat messages arrive
3. 🔔 Users can reply from notification bar
4. 📊 See notification analytics in OneSignal

---

## 💰 PRICING (FREE TIER):

### What's Included (FREE):
- ✅ Up to 10,000 subscribers
- ✅ Unlimited notifications
- ✅ Rich media notifications
- ✅ Action buttons
- ✅ Analytics
- ✅ Segmentation

### When to Upgrade:
- Only if you get more than 10,000 users
- Most churches won't need to upgrade!

---

## 🚀 READY TO PROCEED?

### What I need from you:
1. ✅ Create OneSignal account
2. ✅ Create new app for Android
3. ✅ Copy the App ID
4. ✅ Give me the App ID

### Then I'll:
1. ✅ Configure the app
2. ✅ Implement notifications
3. ✅ Add reply functionality
4. ✅ Test it!

---

## 📞 SUPPORT:

If you get stuck:
- OneSignal Docs: https://documentation.onesignal.com/
- OneSignal Support: support@onesignal.com
- Or just ask me! 😊

---

## ⏱️ ESTIMATED TIME:

- Create account: 2 minutes
- Create app: 3 minutes
- Get App ID: 1 minute
- **Total: ~5 minutes**

Then I'll do the rest! 🚀
