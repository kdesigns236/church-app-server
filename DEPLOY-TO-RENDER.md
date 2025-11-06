# 🚀 Deploy Updated Server to Render

## ⚠️ IMPORTANT: Your server needs to be updated on Render!

The new ImageKit integration requires the `/api/imagekit-auth` endpoint on your Render server.

---

## 📋 How to Deploy:

### **Option 1: Git Push (If you use Git)**

```bash
# 1. Commit changes
git add server/index.js
git commit -m "Add ImageKit authentication endpoint"

# 2. Push to GitHub/GitLab
git push origin main

# 3. Render will auto-deploy!
```

### **Option 2: Manual Deploy (Render Dashboard)**

1. Go to: https://dashboard.render.com
2. Find your service: `church-app-server`
3. Click **"Manual Deploy"** → **"Deploy latest commit"**
4. Wait 2-3 minutes for deployment

### **Option 3: Re-upload server folder**

If you don't use Git:
1. Go to Render dashboard
2. Delete old service
3. Create new Web Service
4. Upload `server` folder
5. Configure as before

---

## ✅ Verify Deployment:

After deploying, test the endpoint:

**Visit this URL in your browser:**
```
https://church-app-server.onrender.com/api/imagekit-auth
```

**You should see:**
```json
{
  "token": "abc123...",
  "expire": 1730000000,
  "signature": "def456..."
}
```

If you see this, **deployment successful!** ✅

---

## 🔧 Alternative: Use Environment Variable

Add this to Render environment variables:
```
IMAGEKIT_PRIVATE_KEY=private_4SqrpJluMMXKA6BoIIVkEE/Nf94=
```

**How:**
1. Render Dashboard → Your Service
2. Environment → Add Environment Variable
3. Key: `IMAGEKIT_PRIVATE_KEY`
4. Value: `private_4SqrpJluMMXKA6BoIIVkEE/Nf94=`
5. Save Changes
6. Render will auto-redeploy

---

## ⏱️ How Long?

- **Git push**: 2-3 minutes
- **Manual deploy**: 2-3 minutes
- **Re-upload**: 5-10 minutes

---

## 🆘 If Deployment Fails:

Check Render logs for errors:
1. Render Dashboard → Your Service
2. Logs tab
3. Look for errors

Common issues:
- Missing dependencies (run `npm install` in server folder)
- Syntax errors (check server/index.js)
- Port issues (should use PORT from env)

---

## 📞 Need Help?

Let me know if you need help deploying!
