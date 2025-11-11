require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3001;

// Basic in-memory store
const store = {
  sermons: [],
  announcements: [],
  events: [],
  siteContent: {},
  prayerRequests: [],
  bibleStudies: [],
  chatMessages: [],
  users: [{
    id: 'admin',
    name: 'Admin',
    email: 'admin@church.com',
    password: '$2b$04$LQr0LW1F5nxsWc/IT0PYMOYZvmtTGI8F3urC3Pv2qxSVtQWHI.mIe', // admin123
    role: 'admin'
  }]
};

// Middleware
app.use(cors());
app.use(express.json());

// Quick API endpoints
app.get('/api/sync/data', (_, res) => res.json(store));
app.get('/api/sermons', (_, res) => res.json(store.sermons));
app.get('/api/announcements', (_, res) => res.json(store.announcements));
app.get('/api/events', (_, res) => res.json(store.events));
app.get('/api/site-content', (_, res) => res.json(store.siteContent));
app.get('/api/prayer-requests', (_, res) => res.json(store.prayerRequests));
app.get('/api/bible-studies', (_, res) => res.json(store.bibleStudies));
app.get('/api/chat-messages', (_, res) => res.json(store.chatMessages));

// Basic Socket.io
io.on('connection', socket => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  socket.emit('connected', { message: 'Connected to sync server' });
});

// Start server
server.listen(PORT, () => {
  console.log(`[Server] Dev server running on port ${PORT}`);
});