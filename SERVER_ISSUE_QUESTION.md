# Server Endpoint Returning 404 After Deployment - Need Help!

## 🔴 Problem Summary

I have an Express.js server deployed on Render.com. The `/api/sync/data` endpoint returns "Data type not found" error (404) even though:
- The code is correct on GitHub
- Render successfully deployed the latest commit
- The server is running (health check works)
- Other endpoints work fine

## 📋 Server Code (index.js)

```javascript
// Data file path
const DATA_FILE = path.join(__dirname, 'data.json');

// Load data from file or create default
let dataStore = {
  sermons: [],
  announcements: [],
  events: [],
  siteContent: {},
  prayerRequests: [],
  chatMessages: []
};

// Load existing data on startup
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileData = fs.readFileSync(DATA_FILE, 'utf8');
      dataStore = JSON.parse(fileData);
      console.log('[Server] Loaded existing data from file');
    } else {
      console.log('[Server] No existing data file, starting fresh');
      saveData(); // Create the file
    }
  } catch (error) {
    console.error('[Server] Error loading data:', error);
  }
  return dataStore;  // ← This line WAS ADDED to fix the issue
}

// The endpoint
app.get('/api/sync/data', (req, res) => {
  try {
    const data = loadData();
    console.log('[Server] Sync data requested');
    res.json(data);
  } catch (error) {
    console.error('[Server] Sync data error:', error);
    res.status(500).json({ error: 'Failed to load data' });
  }
});
```

## 🟢 What Works

- ✅ Server deploys successfully on Render
- ✅ Health check endpoint works: `GET /api/health` returns `{"status":"ok",...}`
- ✅ Server logs show: `[Server] Loaded existing data from file`
- ✅ Server logs show: `[Server] Sync server running on port 10000`
- ✅ Other endpoints like `/api/sync/stream` work

## 🔴 What Doesn't Work

- ❌ `GET https://church-app-server.onrender.com/api/sync/data` returns:
  ```
  {"error":"Data type not found"}
  ```
- ❌ This error comes from a DIFFERENT endpoint: `GET /api/sync/:type`
- ❌ It seems like the request is hitting the wrong route!

## 🤔 The Confusion

Looking at the code, there are TWO similar routes:

```javascript
// Route 1: Get specific data type (line ~210)
app.get('/api/sync/:type', (req, res) => {
  const { type } = req.params;
  
  if (!dataStore.hasOwnProperty(type)) {
    return res.status(404).json({ error: 'Data type not found' });  // ← THIS ERROR!
  }

  res.json(dataStore[type]);
});

// Route 2: Get ALL data (line ~258)
app.get('/api/sync/data', (req, res) => {
  try {
    const data = loadData();
    console.log('[Server] Sync data requested');
    res.json(data);  // ← Should return all data
  } catch (error) {
    console.error('[Server] Sync data error:', error);
    res.status(500).json({ error: 'Failed to load data' });
  }
});
```

## ❓ Questions

1. **Why is `/api/sync/data` matching `/api/sync/:type` instead of the specific route?**
2. **Should the more specific route (`/api/sync/data`) be defined BEFORE the parameterized route (`/api/sync/:type`)?**
3. **Is there a route ordering issue in Express?**
4. **How can I debug which route is actually being hit on Render?**

## 🔧 What I've Tried

- ✅ Added `return dataStore;` to `loadData()` function
- ✅ Verified code is correct on GitHub
- ✅ Manually deployed on Render (cleared cache)
- ✅ Tested in incognito mode (not a cache issue)
- ✅ Checked Render logs (server is running)
- ❌ Still getting "Data type not found" error

## 💡 Suspected Issue

I think Express is matching `/api/sync/data` to `/api/sync/:type` where `type = "data"`, and since `dataStore` doesn't have a property called `"data"`, it returns "Data type not found".

**Solution:** Define `/api/sync/data` route BEFORE `/api/sync/:type` route?

## 🙏 Help Needed

How do I fix this route matching issue? Should I:
1. Reorder the routes?
2. Use more specific route matching?
3. Add middleware to log which route is being hit?
4. Something else?

## 📦 Environment

- **Framework:** Express.js
- **Hosting:** Render.com
- **Node Version:** 22.16.0
- **GitHub Repo:** https://github.com/kdesigns236/church-app-server

---

**Any help would be greatly appreciated! Thank you!** 🙏
