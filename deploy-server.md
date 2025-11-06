# Deploy Server to Render

## Option 1: If you have GitHub connected to Render (RECOMMENDED)

1. Go to your GitHub repository
2. Upload the `server/index.js` file (the one with auto-admin creation)
3. Render will auto-deploy when it detects the change
4. Wait 2-3 minutes for deployment

## Option 2: Manual Deployment via Render Dashboard

1. Go to https://dashboard.render.com/
2. Find your "church-app-server" service
3. Click on it
4. Go to "Manual Deploy" → "Deploy latest commit"
5. OR: Click "Shell" and run:
   ```bash
   cd /opt/render/project/src
   git pull origin master
   pm2 restart all
   ```

## Option 3: Push to GitHub (if you have repo)

```bash
# Add your GitHub repo as remote (replace with your actual repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push changes
git push origin master
```

## Verify Deployment

After deployment, test if admin user is created:

```powershell
# Run this in PowerShell
Invoke-WebRequest -Uri "https://church-app-server.onrender.com/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"admin@church.com","password":"admin123"}' -UseBasicParsing
```

If you get 200 OK, it's working! ✅
If you get 401, wait a bit longer for deployment to complete.

## What Changed

The server now auto-creates an admin user on startup:
- Email: admin@church.com
- Password: admin123
- Role: admin

This happens automatically if no users exist in the database!
