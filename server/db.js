// MongoDB connection for persistent data storage (100% FREE)
// Use MongoDB Atlas free tier: https://www.mongodb.com/cloud/atlas/register

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-app';
let db = null;
let client = null;

async function connectDB() {
  if (db) return db;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db();
    console.log('[MongoDB] ✅ Connected successfully');
    return db;
  } catch (error) {
    console.error('[MongoDB] ❌ Connection failed:', error.message);
    console.log('[MongoDB] Falling back to local data.json');
    return null;
  }
}

async function getCollection(name) {
  const database = await connectDB();
  if (!database) return null;
  return database.collection(name);
}

// Graceful shutdown
process.on('SIGINT', async () => {
  if (client) {
    await client.close();
    console.log('[MongoDB] Connection closed');
  }
  process.exit(0);
});

module.exports = { connectDB, getCollection };
