# Real-Time Sync Setup Guide

## Overview
This guide explains how to set up real-time synchronization so that when you (admin) make changes on your device, they automatically propagate to all users' devices, even across different networks.

## Architecture

```
Admin Device → Backend Server → All User Devices
     ↓              ↓                  ↓
  Push Update   Broadcast        Receive Update
                via SSE          & Apply Locally
```

## Components

### 1. **Sync Service** (`services/syncService.ts`)
- Handles real-time communication with the backend
- Uses Server-Sent Events (SSE) for push notifications
- Queues updates when offline
- Manages local cache synchronization

### 2. **Backend Server** (`server/index.js`)
- Express.js server for handling sync requests
- Broadcasts updates to all connected clients
- Stores data in-memory (can be replaced with database)

### 3. **Service Worker** (`public/service-worker.js`)
- Caches data for offline access
- Updates cache when new data arrives

## Setup Instructions

### Step 1: Install Server Dependencies

```bash
cd server
npm install
```

### Step 2: Start the Sync Server

```bash
# Development mode (with auto-restart)
cd server
npm run dev

# Production mode
cd server
npm start
```

The server will run on `http://localhost:3000`

### Step 3: Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3000/api
```

For production, use your actual server URL:
```env
VITE_API_URL=https://your-domain.com/api
```

### Step 4: Update AppContext to Use Sync Service

Add this to your `context/AppContext.tsx`:

```typescript
import { syncService } from '../services/syncService';

// In your component:
useEffect(() => {
  // Subscribe to real-time updates
  const unsubscribeSermons = syncService.subscribe('sermons', (data) => {
    // Reload sermons when update received
    const updated = JSON.parse(localStorage.getItem('sermonsData') || '[]');
    setSermons(updated);
  });

  const unsubscribeAnnouncements = syncService.subscribe('announcements', (data) => {
    const updated = JSON.parse(localStorage.getItem('announcementsData') || '[]');
    setAnnouncements(updated);
  });

  // ... repeat for other data types

  return () => {
    unsubscribeSermons();
    unsubscribeAnnouncements();
  };
}, []);

// When admin makes changes:
const addSermon = async (sermon) => {
  // Add locally
  const newSermon = { ...sermon, id: Date.now().toString(), /* ... */ };
  
  // Push to server (will broadcast to all users)
  await syncService.pushUpdate({
    type: 'sermons',
    action: 'add',
    data: newSermon
  });
  
  // Update local state
  setSermons(prev => [...prev, newSermon]);
};
```

### Step 5: Deploy the Backend Server

#### Option A: Deploy to Heroku

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create cogel-sync-server

# Deploy
cd server
git init
git add .
git commit -m "Initial commit"
heroku git:remote -a cogel-sync-server
git push heroku master
```

#### Option B: Deploy to Railway

1. Go to https://railway.app/
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your repository
5. Set root directory to `/server`
6. Railway will auto-deploy

#### Option C: Deploy to Your Own Server

```bash
# SSH into your server
ssh user@your-server.com

# Clone repository
git clone your-repo-url
cd your-repo/server

# Install dependencies
npm install

# Install PM2 for process management
npm install -g pm2

# Start server
pm2 start index.js --name cogel-sync

# Make it start on boot
pm2 startup
pm2 save
```

### Step 6: Configure Nginx (if using own server)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Important for SSE
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }
}
```

## How It Works

### For Admin:

1. **Make a change** (add sermon, update announcement, etc.)
2. **Change is pushed** to the backend server via `syncService.pushUpdate()`
3. **Server broadcasts** the change to all connected users
4. **Admin's local storage** is also updated

### For Users:

1. **App connects** to server via Server-Sent Events (SSE)
2. **Listens for updates** in real-time
3. **Receives notification** when admin makes changes
4. **Automatically updates** local storage and UI
5. **Works offline** - changes sync when back online

## Testing

### Test Real-Time Sync:

1. **Start the server**:
   ```bash
   cd server
   npm run dev
   ```

2. **Open two browser windows**:
   - Window 1: Admin (logged in as admin)
   - Window 2: Regular user

3. **Make a change in Window 1** (admin):
   - Add a new sermon
   - Update an announcement

4. **Watch Window 2** (user):
   - The change should appear automatically!
   - No refresh needed

### Test Offline Sync:

1. **Make changes while offline** (admin)
2. **Changes are queued** locally
3. **Go back online**
4. **Queued changes sync** automatically
5. **All users receive** the updates

## Security Considerations

### Current Implementation:
- Simple token-based authentication
- No encryption on data

### Production Recommendations:

1. **Use JWT tokens**:
   ```javascript
   const jwt = require('jsonwebtoken');
   
   const verifyAdmin = (req, res, next) => {
     const token = req.headers.authorization?.replace('Bearer ', '');
     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       if (decoded.role === 'Admin') {
         next();
       } else {
         res.status(403).json({ error: 'Forbidden' });
       }
     } catch (error) {
       res.status(401).json({ error: 'Invalid token' });
     }
   };
   ```

2. **Use HTTPS**:
   - Required for production
   - Get free SSL from Let's Encrypt

3. **Add rate limiting**:
   ```javascript
   const rateLimit = require('express-rate-limit');
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   
   app.use('/api/', limiter);
   ```

4. **Validate input**:
   ```javascript
   const { body, validationResult } = require('express-validator');
   
   app.post('/api/sync/push', [
     body('type').isIn(['sermons', 'announcements', 'events']),
     body('action').isIn(['add', 'update', 'delete', 'clear']),
     body('data').notEmpty()
   ], verifyAdmin, (req, res) => {
     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return res.status(400).json({ errors: errors.array() });
     }
     // ... rest of code
   });
   ```

## Database Integration

To persist data, replace in-memory storage with a database:

### MongoDB Example:

```javascript
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Define schemas
const SermonSchema = new mongoose.Schema({
  title: String,
  pastor: String,
  videoUrl: String,
  // ... other fields
});

const Sermon = mongoose.model('Sermon', SermonSchema);

// Update applyUpdate function
async function applyUpdate(syncData) {
  const { type, action, data } = syncData;
  
  switch (type) {
    case 'sermons':
      if (action === 'add') {
        await Sermon.create(data);
      } else if (action === 'update') {
        await Sermon.findByIdAndUpdate(data.id, data);
      } else if (action === 'delete') {
        await Sermon.findByIdAndDelete(data.id);
      }
      break;
    // ... handle other types
  }
}
```

## Troubleshooting

### Issue: Updates not reaching users

**Solution:**
- Check if server is running
- Verify SSE connection in browser DevTools (Network tab)
- Check CORS settings
- Ensure firewall allows connections

### Issue: High latency

**Solution:**
- Use a CDN for static assets
- Deploy server closer to users
- Implement caching strategies
- Use WebSocket instead of SSE for bi-directional communication

### Issue: Server crashes

**Solution:**
- Use PM2 for process management
- Implement error handling
- Add logging (Winston, Morgan)
- Monitor with tools like New Relic or Datadog

## Monitoring

Add health check endpoint monitoring:

```javascript
// In your monitoring service
setInterval(async () => {
  try {
    const response = await fetch('http://your-server.com/api/health');
    const data = await response.json();
    console.log(`Server health: ${data.status}, Clients: ${data.clients}`);
  } catch (error) {
    console.error('Server health check failed:', error);
    // Send alert
  }
}, 60000); // Check every minute
```

## Cost Estimation

### Free Tier Options:
- **Railway**: 500 hours/month free
- **Heroku**: 1000 hours/month free (with credit card)
- **Render**: Free tier available

### Paid Options:
- **DigitalOcean**: $5/month (Basic Droplet)
- **AWS EC2**: ~$10/month (t2.micro)
- **Linode**: $5/month (Nanode)

## Next Steps

1. ✅ Set up the sync server
2. ✅ Test locally with two browser windows
3. ⬜ Deploy to production
4. ⬜ Update environment variables
5. ⬜ Test with real users
6. ⬜ Monitor performance
7. ⬜ Add database persistence
8. ⬜ Implement proper authentication

## Support

For issues or questions:
- Check server logs: `pm2 logs cogel-sync`
- Check browser console for sync errors
- Verify network connectivity
- Test SSE endpoint directly: `curl http://localhost:3000/api/sync/stream`
