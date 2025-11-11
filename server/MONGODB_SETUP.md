# FREE MongoDB Atlas Setup (No Credit Card Required!)

## ✅ Why MongoDB Atlas?
- **100% FREE forever** (512MB storage)
- **No credit card needed**
- **Automatic backups**
- **Data persists forever** (never disappears)
- **Works perfectly with Render free tier**

## 📝 Step-by-Step Setup (5 minutes)

### 1. Create Free MongoDB Atlas Account
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google/GitHub (fastest) or email
3. Choose **FREE M0 tier** (no payment required)

### 2. Create a Cluster
1. Click "Build a Database"
2. Choose **M0 FREE** tier
3. Select **AWS** provider
4. Choose region closest to your Render server (e.g., US East)
5. Name it: `church-app-cluster`
6. Click "Create"

### 3. Create Database User
1. Click "Database Access" (left sidebar)
2. Click "Add New Database User"
3. Username: `churchapp`
4. Password: Generate a strong password (save it!)
5. Database User Privileges: **Read and write to any database**
6. Click "Add User"

### 4. Allow Network Access
1. Click "Network Access" (left sidebar)
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
   - This is safe because you have username/password protection
4. Click "Confirm"

### 5. Get Connection String
1. Go back to "Database" (left sidebar)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string (looks like):
   ```
   mongodb+srv://churchapp:<password>@church-app-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **Replace `<password>` with your actual password**

### 6. Add to Render Environment Variables
1. Go to Render Dashboard → Your Service
2. Click "Environment" tab
3. Add new variable:
   - **Key:** `MONGODB_URI`
   - **Value:** `mongodb+srv://churchapp:YOUR_PASSWORD@church-app-cluster.xxxxx.mongodb.net/church-app?retryWrites=true&w=majority`
4. Click "Save Changes"

Render will automatically restart with MongoDB connection!

## ✅ That's It!

Your data will now:
- ✅ Persist forever (never disappear)
- ✅ Survive Render restarts
- ✅ Work on free tier
- ✅ Auto-backup daily
- ✅ Scale as you grow

## 🧪 Test It

After setup, post a sermon from your app, then:
1. Restart your Render service
2. Check if the sermon is still there
3. It should be! 🎉

## 💡 Migration

Your existing data in `data.json` will automatically migrate to MongoDB on first run.
The server will detect MongoDB and use it instead of the JSON file.

## 🆘 Need Help?

If you get stuck, the connection string should look exactly like this:
```
mongodb+srv://username:password@cluster.mongodb.net/database-name
```

Make sure:
- No spaces in the connection string
- Password is URL-encoded (no special characters like @, :, /)
- Database name is at the end (e.g., `/church-app`)
