# 🚀 Production Deployment Guide

## ✅ Authentication System - Complete!

### **Features Implemented:**
- ✅ User registration with profile picture (required)
- ✅ Secure password hashing (bcrypt)
- ✅ JWT token authentication
- ✅ Auto-login after registration
- ✅ Show/hide password toggle
- ✅ User data stored in `server/data.json`
- ✅ Session management with localStorage
- ❌ Email verification (removed for simplicity)
- ❌ Forgot password (removed for simplicity)

---

## 📋 Pre-Deployment Checklist

### **Backend (Render):**

1. **Environment Variables on Render:**
   ```
   JWT_SECRET=church-app-secret-key-12345-CHANGE-THIS-IN-PRODUCTION
   EMAIL_USER=ksimiyu236@gmail.com
   EMAIL_PASSWORD=gyzjbhvnxrruivrc
   CLOUDINARY_CLOUD_NAME=de0zuglgd
   CLOUDINARY_API_KEY=548664513886978
   CLOUDINARY_API_SECRET=nozLrI4x_1IdOJNkPkRVE7Jitqo
   NODE_ENV=production
   ```

2. **Deploy Backend:**
   - Go to: https://dashboard.render.com
   - Select: `church-app-server`
   - Click: "Manual Deploy" → "Deploy latest commit"
   - Wait 2-3 minutes for deployment

3. **Verify Backend:**
   - Check: https://church-app-server.onrender.com/api/sync/data
   - Should return: `{"users":[],"sermons":[],...}`

---

### **Frontend (Netlify/Vercel):**

1. **Build Command:**
   ```bash
   npm run build
   ```

2. **Publish Directory:**
   ```
   dist
   ```

3. **Environment Variables:**
   ```
   VITE_API_URL=https://church-app-server.onrender.com/api
   VITE_CLOUDINARY_CLOUD_NAME=de0zuglgd
   VITE_CLOUDINARY_API_KEY=548664513886978
   VITE_CLOUDINARY_API_SECRET=nozLrI4x_1IdOJNkPkRVE7Jitqo
   ```

---

## 🧪 Testing Production

### **1. Test Registration:**
1. Go to: `https://your-app.netlify.app/register`
2. Fill in:
   - Name: Test User
   - Email: test@example.com
   - Password: test123
   - Upload profile picture
3. Click "Create Account"
4. Should auto-login and redirect to home

### **2. Test Login:**
1. Go to: `https://your-app.netlify.app/login`
2. Enter same credentials
3. Should login successfully

### **3. Test Session:**
1. Refresh page
2. Should stay logged in
3. Logout and verify redirect to login

---

## 🔒 Security Notes

### **Current Setup:**
- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT tokens with 7-day expiration
- ✅ HTTPS on production (Render + Netlify)
- ✅ Profile pictures on Cloudinary CDN
- ⚠️ JWT secret should be changed in production

### **Recommended Improvements:**
1. **Change JWT_SECRET** to a strong random string
2. **Enable CORS** properly on backend
3. **Add rate limiting** for login/register endpoints
4. **Add HTTPS redirect** if not already enabled
5. **Monitor logs** on Render dashboard

---

## 📊 Data Storage

### **User Data Location:**
- **Development:** `server/data.json` (local file)
- **Production:** `server/data.json` (Render persistent disk)

### **User Object Structure:**
```json
{
  "id": "user-1730000000000",
  "name": "Kevin Simiyu",
  "email": "test@example.com",
  "password": "$2b$10$...", // hashed
  "profilePicture": "https://res.cloudinary.com/...",
  "phone": "",
  "role": "member",
  "isEmailVerified": true,
  "createdAt": "2025-10-30T12:00:00.000Z",
  "updatedAt": "2025-10-30T12:00:00.000Z"
}
```

---

## 🔄 Deployment Workflow

### **For Future Updates:**

1. **Make changes locally**
2. **Test thoroughly** at http://localhost:3000
3. **Commit to Git:**
   ```bash
   cd server
   git add .
   git commit -m "Your message"
   git push origin main
   ```
4. **Deploy on Render** (auto-deploys from GitHub)
5. **Build frontend:**
   ```bash
   npm run build
   ```
6. **Deploy to Netlify** (drag & drop `dist` folder or connect GitHub)

---

## 🆘 Troubleshooting

### **Issue: Login fails with 401**
- Check: User exists in `data.json`
- Check: Password is correct
- Check: JWT_SECRET is set on Render

### **Issue: Registration fails with 500**
- Check: Cloudinary credentials are correct
- Check: Profile picture uploaded successfully
- Check: Backend logs on Render

### **Issue: Can't upload profile picture**
- Check: Cloudinary upload preset is "Unsigned"
- Check: Upload preset name is `church_profiles`
- Check: Folder is `church-profiles`

### **Issue: Session lost on refresh**
- Check: localStorage is enabled in browser
- Check: JWT token is valid (not expired)
- Check: Token is being sent with requests

---

## 📞 Support

- **Backend Logs:** https://dashboard.render.com → church-app-server → Logs
- **Cloudinary Dashboard:** https://cloudinary.com/console
- **GitHub Repo:** https://github.com/kdesigns236/church-app-server

---

## ✅ Deployment Complete!

Your authentication system is now ready for production! 🎉

**Next Steps:**
1. Deploy backend to Render
2. Build and deploy frontend
3. Test registration and login
4. Monitor for any issues
5. Enjoy your secure app! 🚀
