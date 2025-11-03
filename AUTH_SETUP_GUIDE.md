# 🔐 Complete Authentication System Setup Guide

## ✅ **Features Implemented**

1. ✅ **Secure User Registration** - Hashed passwords with bcrypt
2. ✅ **Email Verification** - 6-digit code sent to user's email
3. ✅ **Forgot Password** - Reset password with email code
4. ✅ **Mandatory Profile Picture** - Required during registration
5. ✅ **JWT Authentication** - Secure token-based auth
6. ✅ **Protected Routes** - Secure API endpoints

---

## 📦 **Step 1: Install Dependencies**

```powershell
cd d:\church-of-god-evening-light\server
npm install
```

This will install:
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT tokens
- `nodemailer` - Email sending

---

## 🔧 **Step 2: Configure Environment Variables**

### **Backend (.env)**

Create `d:\church-of-god-evening-light\server\.env`:

```env
# Server
PORT=3001
NODE_ENV=development

# JWT Secret (CHANGE THIS!)
JWT_SECRET=your-super-secret-jwt-key-12345-change-in-production

# Email Configuration (Gmail)
EMAIL_USER=your-church-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=de0zuglgd
CLOUDINARY_API_KEY=548664513886978
CLOUDINARY_API_SECRET=nozLrI4x_1IdOJNkPkRVE7Jitqo
```

### **Frontend (.env)**

Your existing `.env` should have:

```env
VITE_API_URL=https://church-app-server.onrender.com/api
CLOUDINARY_CLOUD_NAME=de0zuglgd
CLOUDINARY_API_KEY=548664513886978
CLOUDINARY_API_SECRET=nozLrI4x_1IdOJNkPkRVE7Jitqo
```

---

## 📧 **Step 3: Setup Gmail for Sending Emails**

### **Option A: Gmail App Password (Recommended)**

1. **Go to:** https://myaccount.google.com/apppasswords
2. **Sign in** to your Google account
3. **Create app password:**
   - App: Mail
   - Device: Other (Custom name) → "Church App"
4. **Copy the 16-character password**
5. **Add to `.env`:**
   ```env
   EMAIL_USER=your-church-email@gmail.com
   EMAIL_PASSWORD=abcd efgh ijkl mnop  # (remove spaces)
   ```

### **Option B: Use Another Email Service**

Update `server/routes/auth.js` line 13-19:

```javascript
// For Outlook/Hotmail
const transporter = nodemailer.createTransporter({
  service: 'hotmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// For custom SMTP
const transporter = nodemailer.createTransporter({
  host: 'smtp.your-domain.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

---

## ☁️ **Step 4: Setup Cloudinary Upload Preset**

For profile picture uploads, you need to create an upload preset:

1. **Go to:** https://cloudinary.com/console
2. **Navigate to:** Settings → Upload
3. **Scroll to:** Upload presets
4. **Click:** "Add upload preset"
5. **Configure:**
   - Preset name: `church_profiles`
   - Signing Mode: **Unsigned**
   - Folder: `church-profiles`
   - Access Mode: Public
6. **Save**

---

## 🚀 **Step 5: Test Locally**

### **Start Backend:**

```powershell
cd d:\church-of-god-evening-light\server
npm start
```

You should see:
```
[Server] Sync server running on port 3001
[Server] Socket.io endpoint: http://localhost:3001
```

### **Start Frontend:**

```powershell
cd d:\church-of-god-evening-light
npm run dev
```

### **Test Registration Flow:**

1. **Go to:** http://localhost:3000/register
2. **Fill in:**
   - Name: Test User
   - Email: your-test-email@gmail.com
   - Password: test123
   - Upload a profile picture
3. **Click:** "Create account"
4. **Check your email** for 6-digit code
5. **Enter code** on verification page
6. **Success!** You're logged in

---

## 📱 **Step 6: Test All Features**

### **✅ Registration:**
- [ ] Can't register without profile picture
- [ ] Password must be 6+ characters
- [ ] Email validation works
- [ ] Receives verification email
- [ ] Profile picture uploads to Cloudinary

### **✅ Email Verification:**
- [ ] 6-digit code sent to email
- [ ] Code expires after 15 minutes
- [ ] Can resend code
- [ ] Redirects to home after verification

### **✅ Login:**
- [ ] Can't login without email verification
- [ ] Redirects to verification if not verified
- [ ] Correct password required
- [ ] JWT token saved to localStorage
- [ ] User data saved to localStorage

### **✅ Forgot Password:**
- [ ] Receives reset code via email
- [ ] Code expires after 15 minutes
- [ ] New password must be 6+ characters
- [ ] Passwords must match
- [ ] Can login with new password

---

## 🌐 **Step 7: Deploy to Production**

### **Update Render Environment Variables:**

1. **Go to:** https://dashboard.render.com
2. **Select:** church-app-server
3. **Go to:** Environment
4. **Add variables:**
   ```
   JWT_SECRET=your-production-secret-key-make-it-long-and-random
   EMAIL_USER=your-church-email@gmail.com
   EMAIL_PASSWORD=your-gmail-app-password
   CLOUDINARY_CLOUD_NAME=de0zuglgd
   CLOUDINARY_API_KEY=548664513886978
   CLOUDINARY_API_SECRET=nozLrI4x_1IdOJNkPkRVE7Jitqo
   NODE_ENV=production
   ```

5. **Save Changes**
6. **Redeploy** the service

### **Update Frontend .env:**

Make sure your frontend `.env` points to production:

```env
VITE_API_URL=https://church-app-server.onrender.com/api
```

---

## 🔒 **Security Best Practices**

### **✅ Implemented:**
- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT tokens with expiration (7 days)
- ✅ Email verification required
- ✅ Verification codes expire (15 minutes)
- ✅ Password reset codes expire (15 minutes)
- ✅ Profile pictures stored on Cloudinary (not server)

### **⚠️ Additional Recommendations:**

1. **Use HTTPS in production** (Render does this automatically)
2. **Rate limit auth endpoints** (prevent brute force)
3. **Add CAPTCHA** to registration/login (prevent bots)
4. **Enable 2FA** for admin accounts
5. **Log auth attempts** for security monitoring

---

## 📊 **API Endpoints**

### **Public Endpoints:**

```
POST /api/auth/register
POST /api/auth/verify-email
POST /api/auth/resend-verification
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### **Protected Endpoints (require JWT):**

```
GET  /api/auth/me
PUT  /api/auth/update-profile
POST /api/auth/change-password
```

---

## 🧪 **Testing Examples**

### **Register User:**

```javascript
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "profilePicture": "https://res.cloudinary.com/..."
}
```

### **Verify Email:**

```javascript
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "john@example.com",
  "code": "123456"
}
```

### **Login:**

```javascript
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### **Forgot Password:**

```javascript
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### **Reset Password:**

```javascript
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "john@example.com",
  "code": "123456",
  "newPassword": "newpassword123"
}
```

---

## 🐛 **Troubleshooting**

### **Email not sending:**

**Check:**
1. Gmail App Password is correct (no spaces)
2. Less secure app access is enabled
3. Check server logs for email errors
4. Try sending test email manually

**Test email manually:**

```javascript
// In server console
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});

transporter.sendMail({
  from: 'your-email@gmail.com',
  to: 'test@example.com',
  subject: 'Test',
  text: 'Test email'
}, (error, info) => {
  if (error) console.log('Error:', error);
  else console.log('Success:', info);
});
```

### **Profile picture upload fails:**

**Check:**
1. Cloudinary upload preset `church_profiles` exists
2. Upload preset is set to "Unsigned"
3. CLOUDINARY_CLOUD_NAME is correct in `.env`
4. Image file is valid (jpg, png, etc.)

### **JWT token invalid:**

**Check:**
1. JWT_SECRET is set in `.env`
2. Token is being sent in Authorization header
3. Token hasn't expired (7 days)
4. Token format: `Bearer <token>`

### **Can't login after registration:**

**Check:**
1. Email was verified (check `isEmailVerified` in database)
2. Verification code hasn't expired
3. Check server logs for errors

---

## 📝 **User Flow Diagrams**

### **Registration Flow:**

```
User → Register Page
  ↓
Upload Profile Picture (Required)
  ↓
Submit Form → Upload to Cloudinary
  ↓
Create User (password hashed)
  ↓
Generate 6-digit code
  ↓
Send verification email
  ↓
Redirect to Verification Page
  ↓
Enter Code → Verify
  ↓
Generate JWT Token
  ↓
Login & Redirect to Home ✅
```

### **Login Flow:**

```
User → Login Page
  ↓
Enter Email & Password
  ↓
Check if email verified
  ↓ NO → Redirect to Verification
  ↓ YES
Verify password (bcrypt)
  ↓
Generate JWT Token
  ↓
Save token & user data
  ↓
Redirect to Home ✅
```

### **Forgot Password Flow:**

```
User → Forgot Password Page
  ↓
Enter Email
  ↓
Generate 6-digit reset code
  ↓
Send reset email
  ↓
Enter Code & New Password
  ↓
Verify code
  ↓
Hash new password
  ↓
Update password
  ↓
Redirect to Login ✅
```

---

## ✅ **Deployment Checklist**

- [ ] Install backend dependencies (`npm install`)
- [ ] Create server `.env` file
- [ ] Setup Gmail App Password
- [ ] Create Cloudinary upload preset
- [ ] Test registration locally
- [ ] Test email verification locally
- [ ] Test login locally
- [ ] Test forgot password locally
- [ ] Update Render environment variables
- [ ] Deploy backend to Render
- [ ] Update frontend `.env` to production
- [ ] Test all flows in production
- [ ] Monitor server logs for errors

---

## 🎉 **Success!**

Your church app now has a complete, secure authentication system with:
- ✅ User registration with profile pictures
- ✅ Email verification
- ✅ Secure login with JWT
- ✅ Password reset functionality
- ✅ Protected API endpoints

**All user credentials are securely stored with hashed passwords!** 🔒

---

## 📞 **Need Help?**

Check the console logs for detailed error messages:
- **Backend:** Terminal running `npm start`
- **Frontend:** Browser DevTools Console (F12)
- **Email:** Check spam folder if not receiving emails

**Common issues and solutions are in the Troubleshooting section above!**
