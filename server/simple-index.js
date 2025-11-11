require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

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

// Simple in-memory store
const dataStore = {
  sermons: [],
  announcements: [],
  events: [],
  siteContent: {},
  prayerRequests: [],
  bibleStudies: [],
  chatMessages: [],
  users: [{
    id: 'admin',
    email: 'admin@church.com',
    role: 'admin'
  }]
};

// Health check endpoint for UptimeRobot
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    clients: io.engine.clientsCount,
    timestamp: Date.now()
  });
});

// Basic endpoints
app.get('/api/sync/data', (req, res) => {
  res.json(dataStore);
});

app.get('/api/site-content', (req, res) => {
  res.json(dataStore.siteContent);
});

app.get('/api/sermons', (req, res) => {
  res.json(dataStore.sermons);
});

app.get('/api/announcements', (req, res) => {
  res.json(dataStore.announcements);
});

app.get('/api/events', (req, res) => {
  res.json(dataStore.events);
});

app.get('/api/prayer-requests', (req, res) => {
  res.json(dataStore.prayerRequests);
});

app.get('/api/bible-studies', (req, res) => {
  res.json(dataStore.bibleStudies);
});

app.get('/api/chat-messages', (req, res) => {
  res.json(dataStore.chatMessages);
});

// POST endpoints for content creation
app.post('/api/sermons', (req, res) => {
  try {
    console.log('[Server] Received sermon data:', req.body);
    const newSermon = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    dataStore.sermons.push(newSermon);
    io.emit('sermon-added', newSermon);
    res.status(201).json({
      success: true,
      message: 'Sermon created successfully',
      data: newSermon
    });
  } catch (error) {
    console.error('[Server] Error creating sermon:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/announcements', (req, res) => {
  try {
    const newAnnouncement = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    dataStore.announcements.push(newAnnouncement);
    io.emit('announcement-added', newAnnouncement);
    res.status(201).json({
      success: true,
      data: newAnnouncement
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/events', (req, res) => {
  try {
    const newEvent = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    dataStore.events.push(newEvent);
    io.emit('event-added', newEvent);
    res.status(201).json({
      success: true,
      data: newEvent
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/prayer-requests', (req, res) => {
  try {
    const newPrayer = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    dataStore.prayerRequests.push(newPrayer);
    io.emit('prayer-added', newPrayer);
    res.status(201).json({
      success: true,
      data: newPrayer
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/bible-studies', (req, res) => {
  try {
    const newStudy = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    dataStore.bibleStudies.push(newStudy);
    io.emit('study-added', newStudy);
    res.status(201).json({
      success: true,
      data: newStudy
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Start server
server.listen(PORT, () => {
  console.log(`[Server] Started at ${new Date().toISOString()}`);
  console.log(`[Server] Running at http://localhost:${PORT}`);
  console.log(`[Server] Socket.io enabled and listening`);
  console.log(`[Server] Available endpoints:`);
  console.log(`  GET  /api/sync/data`);
  console.log(`  GET  /api/site-content`);
  console.log(`  GET  /api/sermons`);
  console.log(`  POST /api/sermons`);
  console.log(`  GET  /api/announcements`);
  console.log(`  POST /api/announcements`);
  console.log(`  GET  /api/events`);
  console.log(`  POST /api/events`);
});