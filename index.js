// Simple Express server for real-time data synchronization
// This server broadcasts admin changes to all connected clients

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 files
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

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
  return dataStore;
}

// Save data to file
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataStore, null, 2), 'utf8');
    console.log('[Server] Data saved to file');
  } catch (error) {
    console.error('[Server] Error saving data:', error);
  }
}

// Load data on startup
loadData();

// Store active SSE connections
const clients = new Set();

// Middleware to verify admin (simple token check)
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  // In production, verify JWT token
  if (token) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Server-Sent Events endpoint for real-time updates
app.get('/api/sync/stream', (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to sync stream' })}\n\n`);

  // Add client to set
  clients.add(res);
  console.log(`[Sync] Client connected. Total clients: ${clients.size}`);

  // Remove client on disconnect
  req.on('close', () => {
    clients.delete(res);
    console.log(`[Sync] Client disconnected. Total clients: ${clients.size}`);
  });
});

// Broadcast update to all connected clients
function broadcastUpdate(syncData) {
  const message = `data: ${JSON.stringify(syncData)}\n\n`;
  
  clients.forEach(client => {
    try {
      client.write(message);
    } catch (error) {
      console.error('[Sync] Error broadcasting to client:', error);
      clients.delete(client);
    }
  });

  console.log(`[Sync] Broadcasted ${syncData.type} ${syncData.action} to ${clients.size} clients`);
}

// Push update endpoint (called by admin)
app.post('/api/sync/push', verifyAdmin, (req, res) => {
  const syncData = req.body;
  
  // Validate sync data
  if (!syncData.type || !syncData.action) {
    return res.status(400).json({ error: 'Invalid sync data' });
  }

  // Apply update to in-memory store
  applyUpdate(syncData);

  // Broadcast to all connected clients
  broadcastUpdate(syncData);

  res.json({ success: true, timestamp: syncData.timestamp });
});

// Apply update to in-memory store and save to file
function applyUpdate(syncData) {
  const { type, action, data } = syncData;

  if (action === 'clear') {
    if (type === 'siteContent') {
      dataStore[type] = {};
    } else {
      dataStore[type] = [];
    }
    saveData(); // Save to file
    return;
  }

  switch (action) {
    case 'add':
      if (Array.isArray(dataStore[type])) {
        dataStore[type].push(data);
      } else {
        dataStore[type] = data;
      }
      break;
    case 'update':
      if (Array.isArray(dataStore[type])) {
        const index = dataStore[type].findIndex(item => item.id === data.id);
        if (index !== -1) {
          dataStore[type][index] = data;
        }
      } else {
        dataStore[type] = { ...dataStore[type], ...data };
      }
      break;
    case 'delete':
      if (Array.isArray(dataStore[type])) {
        dataStore[type] = dataStore[type].filter(item => item.id !== data.id);
      }
      break;
  }
  
  // Save to file after every change
  saveData();
}

// File upload endpoint
app.post('/api/upload', verifyAdmin, upload.single('file'), (req, res) => {
  try {
    console.log('[Server] Upload request received');
    console.log('[Server] File:', req.file);
    
    if (!req.file) {
      console.error('[Server] No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    console.log(`[Server] File uploaded successfully: ${req.file.filename}`);
    console.log(`[Server] File URL: ${fileUrl}`);

    res.json({
      success: true,
      filename: req.file.filename,
      url: fileUrl,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('[Server] Upload error:', error);
    console.error('[Server] Error stack:', error.stack);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Delete file endpoint
app.delete('/api/upload/:filename', verifyAdmin, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(UPLOADS_DIR, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Server] File deleted: ${filename}`);
      res.json({ success: true, message: 'File deleted' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('[Server] Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ========================================
// IMPORTANT: Specific routes BEFORE parameterized routes!
// ========================================

// Sync endpoint - Get all data (SPECIFIC ROUTE FIRST!)
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

// Get latest data endpoint (PARAMETERIZED ROUTE AFTER!)
app.get('/api/sync/:type', (req, res) => {
  const { type } = req.params;
  
  if (!dataStore.hasOwnProperty(type)) {
    return res.status(404).json({ error: 'Data type not found' });
  }

  res.json(dataStore[type]);
});

// Push data endpoint - Admin updates
app.post('/api/sync/push', verifyAdmin, (req, res) => {
  try {
    const { type, data: newData } = req.body;
    const currentData = loadData();
    
    // Update the specific data type
    if (type && currentData[type]) {
      currentData[type] = newData;
      saveData(currentData);
      
      // Broadcast update to all connected clients
      broadcastUpdate({ type, data: newData });
      
      console.log(`[Server] Data pushed: ${type}`);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid data type' });
    }
  } catch (error) {
    console.error('[Server] Push error:', error);
    res.status(500).json({ error: 'Push failed' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    clients: clients.size,
    timestamp: Date.now()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`[Server] Sync server running on port ${PORT}`);
  console.log(`[Server] SSE endpoint: http://localhost:${PORT}/api/sync/stream`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, closing server...');
  clients.forEach(client => client.end());
  process.exit(0);
});
