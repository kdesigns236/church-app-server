console.time('[Server] Startup');
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
// Lazy load database
let database;

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// JWT Middleware
// Verify token - allows both admin and member roles
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('[Auth] Invalid token:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Verify admin role only
const verifyAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('[Auth] Invalid token:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// In-memory data store
let dataStore = {
  sermons: [],
  announcements: [],
  events: [],
  siteContent: {},
  prayerRequests: [],
  bibleStudies: [],
  chatMessages: [],
  users: []
};

// Data file path
const DATA_FILE = path.join(__dirname, 'data.json');

// Load data from file
async function loadDataFromFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileData = await fs.promises.readFile(DATA_FILE, 'utf8');
      dataStore = JSON.parse(fileData);
      console.log('[Server] Loaded existing data from file');
    } else {
      console.log('[Server] No existing data file, starting fresh');
      await saveDataToFile();
    }
  } catch (error) {
    console.error('[Server] Error loading data:', error);
    // Initialize with empty data store if file can't be read
    dataStore = {
      sermons: [],
      announcements: [],
      events: [],
      siteContent: {},
      prayerRequests: [],
      bibleStudies: [],
      chatMessages: [],
      users: []
    };
  }
}

// Save data to file
async function saveDataToFile() {
  try {
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(dataStore, null, 2), 'utf8');
    console.log('[Server] Data saved to file');
  } catch (error) {
    console.error('[Server] Error saving data:', error);
    throw error; // Propagate error to caller
  }
}

// Initialize data store
async function initializeData() {
  try {
    // Load data from file first
    await loadDataFromFile();
    
    // Start server immediately - move admin user creation to after server start
    return true;
  } catch (error) {
    console.error('[Server] Error initializing data:', error);
    throw error;
  }
}

// Create admin user in background
async function ensureAdminUser() {
  if (!dataStore.users || dataStore.users.length === 0) {
    console.log('[Server] Creating default admin user...');
    const bcrypt = require('bcrypt');
    // Reduced rounds for development
    const hashedPassword = await bcrypt.hash('admin123', 4);
    const adminUser = {
      id: 'user-admin-default',
      name: 'Admin',
      email: 'admin@church.com',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    dataStore.users = [adminUser];
    await saveDataToFile();
    console.log('[Server] Default admin user created');
  }
}

// Store active Socket.io connections
const connectedClients = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  connectedClients.set(socket.id, socket);

  socket.emit('connected', { message: 'Connected to sync server' });

  socket.on('disconnect', () => {
    connectedClients.delete(socket.id);
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Broadcast update to all connected clients via Socket.io
function broadcastUpdate(syncData) {
  // Emit to all connected clients
  io.emit('sync_update', syncData);
  console.log(`[Socket.io] Broadcasted ${syncData.type} ${syncData.action} to ${connectedClients.size} clients`);
}

// API Routes
// Sync endpoint - receive updates from clients
app.post('/api/sync/push', verifyToken, async (req, res) => {
  try {
    const syncData = req.body;
    const { type, action, data } = syncData;

    console.log(`[Server] Received sync update: ${type} ${action}`);

    // Validate data type
    if (!type || !dataStore.hasOwnProperty(type)) {
      return res.status(400).json({ error: `Invalid data type: ${type}` });
    }

    // Process based on action
    if (action === 'add') {
      // Add new item
      if (!Array.isArray(dataStore[type])) {
        return res.status(400).json({ error: `${type} is not an array` });
      }
      dataStore[type].unshift(data);
      console.log(`[Server] ✅ Added ${type}: ${data.id}`);
    } else if (action === 'update') {
      // Update existing item
      if (Array.isArray(dataStore[type])) {
        const index = dataStore[type].findIndex(item => item.id === data.id);
        if (index !== -1) {
          dataStore[type][index] = data;
          console.log(`[Server] ✅ Updated ${type}: ${data.id}`);
        } else {
          console.warn(`[Server] Item not found for update: ${type} ${data.id}`);
        }
      }
    } else if (action === 'delete') {
      // Delete item
      if (Array.isArray(dataStore[type])) {
        const index = dataStore[type].findIndex(item => item.id === data.id);
        if (index !== -1) {
          dataStore[type].splice(index, 1);
          console.log(`[Server] ✅ Deleted ${type}: ${data.id}`);
        }
      }
    }

    // Save to file
    await saveDataToFile();

    // Broadcast update to all connected clients
    broadcastUpdate(syncData);

    res.json({ success: true, message: `${action} ${type} completed` });
  } catch (error) {
    console.error('[Server] Error processing sync update:', error);
    res.status(500).json({ error: 'Failed to process sync update', details: error.message });
  }
});

app.get('/api/sync/data', (req, res) => {
  console.log('[Server] Fetching all data for sync');
  res.json(dataStore);
});

app.get('/api/sermons', (req, res) => {
  console.log('[Server] Fetching all sermons');
  res.json(dataStore.sermons || []);
});

// Create sermon endpoint
app.post('/api/sermons', verifyAdmin, async (req, res) => {
  try {
    console.log('[Server] Creating sermon:', req.body);
    
    const { title, pastor, scripture, videoUrl } = req.body;
    
    // Create new sermon
    const newSermon = {
      id: Date.now().toString(),
      title,
      pastor,
      scripture: scripture || '',
      date: new Date().toISOString().split('T')[0],
      videoUrl,
      likes: 0,
      comments: [],
      isLiked: false,
      isSaved: false,
      createdAt: new Date().toISOString()
    };
    
    // Add to sermons array
    dataStore.sermons.unshift(newSermon);
    
    // Save to file
    await saveDataToFile();
    
    // Broadcast update
    broadcastUpdate({ type: 'sermons', action: 'add', data: newSermon });
    
    console.log('[Server] ✅ Sermon created:', newSermon.id);
    res.json({ success: true, sermon: newSermon });
  } catch (error) {
    console.error('[Server] Error creating sermon:', error);
    res.status(500).json({ error: 'Failed to create sermon', details: error.message });
  }
});

app.get('/api/announcements', (req, res) => {
  console.log('[Server] Fetching all announcements');
  res.json(dataStore.announcements || []);
});

app.get('/api/events', (req, res) => {
  console.log('[Server] Fetching all events');
  res.json(dataStore.events || []);
});

app.get('/api/site-content', (req, res) => {
  console.log('[Server] Fetching site content');
  res.json(dataStore.siteContent || {});
});

app.get('/api/prayer-requests', (req, res) => {
  console.log('[Server] Fetching all prayer requests');
  res.json(dataStore.prayerRequests || []);
});

app.get('/api/bible-studies', (req, res) => {
  console.log('[Server] Fetching all bible studies');
  res.json(dataStore.bibleStudies || []);
});

app.get('/api/chat-messages', (req, res) => {
  console.log('[Server] Fetching all chat messages');
  res.json(dataStore.chatMessages || []);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    clients: connectedClients.size,
    timestamp: Date.now()
  });
});

// App version endpoint - for update notifications
app.get('/api/app-version', (req, res) => {
  res.json({
    version: '2.1.0', // UPDATE THIS when you release new version
    downloadUrl: 'https://your-lime-link-here.com', // Replace with actual download link
    releaseNotes: `✅ JWT authentication enabled\n✅ Socket.io real-time sync\n✅ Health checks working`,
    forceUpdate: false // Set to true if old versions shouldn't work
  });
});

// Start server
(async () => {
  try {
    // Start server immediately
    server.listen(PORT, () => {
      console.timeEnd('[Server] Startup');
      console.log(`[Server] Server running on port ${PORT}`);
      console.log(`[Server] Socket.io endpoint: http://localhost:${PORT}`);
      
      // Initialize data and create admin user in background
      initializeData()
        .then(() => ensureAdminUser())
        .catch(err => {
          console.error('[Server] Background initialization error:', err);
        });
    });
  } catch (error) {
    console.error('[Server] Failed to start server:', error);
    process.exit(1);
  }
})();