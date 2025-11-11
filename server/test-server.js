// Minimal test server
const express = require('express');
const app = express();
const cors = require('cors');

// Basic CORS and JSON middleware
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server immediately
const port = 3001;
app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
});