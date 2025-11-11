require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const database = require('./database');

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
function loadDataFromFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileData = fs.readFileSync(DATA_FILE, 'utf8');
      dataStore = JSON.parse(fileData);
      console.log('[Server] Loaded existing data from file');
    } else {
      console.log('[Server] No existing data file, starting fresh');
      saveDataToFile();
    }
  } catch (error) {
    console.error('[Server] Error loading data:', error);
  }
}

// Save data to file
function saveDataToFile() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataStore, null, 2), 'utf8');
    console.log('[Server] Data saved to file');
  } catch (error) {
    console.error('[Server] Error saving data:', error);
  }
}

// Initialize data store
async function initializeData() {
  try {
    // Load data from file
    loadDataFromFile();
    
    // Create default admin user if no users exist
    if (!dataStore.users || dataStore.users.length === 0) {
      console.log('[Server] Creating default admin user...');
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUser = {
        id: 'user-admin-default',
        name: 'Admin',
        email: 'admin@church.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      dataStore.users = [adminUser];
      saveDataToFile();
      console.log('[Server] Default admin user created');
    }
  } catch (error) {
    console.error('[Server] Error initializing data:', error);
    throw error;
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
app.get('/api/sync/data', (req, res) => {
  console.log('[Server] Fetching all data for sync');
  res.json(dataStore);
});

app.get('/api/sermons', (req, res) => {
  console.log('[Server] Fetching all sermons');
  res.json(dataStore.sermons || []);
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

// Start server
(async () => {
  try {
    await initializeData();
    server.listen(PORT, () => {
      console.log(`[Server] Server running on port ${PORT}`);
      console.log(`[Server] Socket.io endpoint: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start server:', error);
    process.exit(1);
  }
})();