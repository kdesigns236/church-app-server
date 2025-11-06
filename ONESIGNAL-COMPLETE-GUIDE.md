# 🔔 OneSignal Push Notifications - Complete Implementation Guide

## ✅ WHAT'S BEEN DONE:

1. ✅ Installed OneSignal plugin
2. ✅ Created OneSignal service (`services/oneSignalService.ts`)
3. ✅ Integrated into App.tsx
4. ✅ Auto-links user ID on login
5. ✅ Tags users by role (admin/member)

---

## 📋 WHAT YOU NEED TO DO NOW:

### STEP 1: Create OneSignal Account (5 minutes)

**1. Go to OneSignal:**
```
https://onesignal.com/
```

**2. Sign Up (FREE):**
- Click "Get Started Free"
- Use email or Google account
- No credit card needed!

**3. Create New App:**
- Click "New App/Website"
- App Name: **Church of God Evening Light**
- Select Platform: **Google Android (FCM)**

**4. Configuration:**
- You can use OneSignal's default FCM configuration
- OR connect your own Firebase project (optional)
- Click "Save & Continue"

**5. Get Your App ID:**
After creating, you'll see:
```
App ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```
**COPY THIS!**

---

### STEP 2: Add App ID to Your App

**1. Open `.env` file:**
```
d:\church-of-god-evening-light\.env
```

**2. Add this line:**
```
VITE_ONESIGNAL_APP_ID=your-app-id-here
```

**Example:**
```
VITE_ONESIGNAL_APP_ID=12345678-1234-1234-1234-123456789abc
```

**3. Save the file**

---

### STEP 3: Update Android Configuration

**Add OneSignal to package.json plugins:**

I'll do this automatically when you rebuild!

---

### STEP 4: Rebuild the App

**Run these commands:**
```bash
npm run build
npx cap sync android
```

**Then in Android Studio:**
1. Build → Clean Project
2. Build → Build APK(s)
3. Install on phone

---

## 🎯 HOW TO SEND NOTIFICATIONS:

### Method 1: OneSignal Dashboard (Manual)

**1. Go to OneSignal Dashboard:**
```
https://app.onesignal.com/
```

**2. Select your app**

**3. Click "Messages" → "New Push"**

**4. Create notification:**
```
Title: New Message!
Message: John: Hey everyone, prayer meeting at 7pm!
```

**5. Target:**
- All Users
- OR specific segments (by role, etc.)

**6. Click "Send Message"**

**7. Users get notification!** 🔔

---

### Method 2: API (Automatic - for chat)

**I'll implement this next!**

When someone sends a chat message:
```
1. Message sent to server
2. Server calls OneSignal API
3. All users get notification
4. Click → Opens chat
```

---

## 🔔 NOTIFICATION FEATURES:

### What Users Will See:

**Basic Notification:**
```
┌─────────────────────────────┐
│ 💬 Church Chat              │
│ John: Prayer meeting at 7pm │
└─────────────────────────────┘
```

**With Action Buttons:**
```
┌─────────────────────────────┐
│ 💬 Church Chat              │
│ John: Prayer meeting at 7pm │
│ [Reply] [Mark as Read]      │
└─────────────────────────────┘
```

**Reply Functionality:**
```
User clicks Reply
    ↓
┌─────────────────────────────┐
│ Reply to John               │
│ ┌─────────────────────────┐ │
│ │ I'll be there!          │ │
│ └─────────────────────────┘ │
│           [Send]            │
└─────────────────────────────┘
    ↓
Message sent WITHOUT opening app!
```

---

## 📱 TESTING:

### After Installing APK:

**1. Open the app**
- OneSignal will request permission
- Click "Allow"

**2. Check registration:**
- Go to OneSignal Dashboard
- Click "Audience" → "All Users"
- You should see 1 subscriber!

**3. Send test notification:**
- Click "Messages" → "New Push"
- Type: "Test notification!"
- Send to "All Users"
- Check your phone! 🔔

**4. Click notification:**
- Should open the app
- Navigate to correct page

---

## 🎯 NEXT STEPS (I'll implement):

### 1. Chat Notifications (Automatic)
```typescript
// When user sends chat message
// Server sends notification to all users
// "John: Hey everyone!"
```

### 2. Sermon Notifications
```typescript
// When admin uploads new sermon
// "New sermon: 'Walking in Faith'"
```

### 3. Event Reminders
```typescript
// 1 hour before event
// "Youth meeting starts in 1 hour!"
```

### 4. Comment Notifications
```typescript
// When someone comments on sermon
// "Sarah commented on 'Faith & Hope'"
```

---

## 💰 PRICING:

### FREE Tier (What you get):
- ✅ Up to 10,000 subscribers
- ✅ Unlimited push notifications
- ✅ Rich media (images, buttons)
- ✅ Action buttons
- ✅ Analytics
- ✅ Segmentation
- ✅ API access

### When to Upgrade:
- Only if you exceed 10,000 users
- Most churches never need to upgrade!

---

## 🔧 TROUBLESHOOTING:

### Notifications not working?

**1. Check App ID:**
- Is it in `.env` file?
- Is it correct?

**2. Check permissions:**
- Did user allow notifications?
- Go to phone Settings → Apps → Church App → Notifications

**3. Check OneSignal Dashboard:**
- Is user registered?
- Check "Audience" → "All Users"

**4. Check logs:**
- Open app
- Check browser console (if testing on web)
- Look for `[OneSignal]` logs

---

## 📊 ANALYTICS:

### OneSignal Dashboard Shows:

- **Delivery Rate:** How many received
- **Click Rate:** How many clicked
- **Conversion:** How many took action
- **Best Times:** When users are active
- **Segments:** Which groups engage most

---

## 🚀 READY TO TEST?

### Checklist:

- [ ] Created OneSignal account
- [ ] Created Android app in OneSignal
- [ ] Copied App ID
- [ ] Added to `.env` file
- [ ] Rebuilt app (`npm run build && npx cap sync android`)
- [ ] Built APK in Android Studio
- [ ] Installed on phone
- [ ] Allowed notifications
- [ ] Sent test notification from dashboard
- [ ] Received notification! 🎉

---

## 📞 NEED HELP?

**OneSignal Support:**
- Docs: https://documentation.onesignal.com/
- Support: support@onesignal.com
- Community: https://onesignal.com/community

**Or just ask me!** 😊

---

## ⏱️ TIME ESTIMATE:

- Create account: 2 mins
- Create app: 3 mins
- Get App ID: 1 min
- Add to `.env`: 1 min
- Rebuild app: 5 mins
- Test: 2 mins

**Total: ~15 minutes** 🚀

Then I'll implement automatic chat notifications!
