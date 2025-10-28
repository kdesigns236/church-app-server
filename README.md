# COGEL Sync Server

Real-time synchronization server for Church of God Evening Light app.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

Server will run on `http://localhost:3000`

## Endpoints

### Health Check
```
GET /api/health
```

### Real-Time Stream (SSE)
```
GET /api/sync/stream
```
Keeps connection open and pushes updates to clients.

### Push Update (Admin only)
```
POST /api/sync/push
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "sermons",
  "action": "add",
  "data": { ... },
  "timestamp": 1234567890
}
```

### Get Latest Data
```
GET /api/sync/:type
```
Where `:type` is one of: sermons, announcements, events, siteContent, prayerRequests

## Environment Variables

```env
PORT=3000
JWT_SECRET=your-secret-key
```

## Testing

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test SSE stream
curl http://localhost:3000/api/sync/stream

# Test push update
curl -X POST http://localhost:3000/api/sync/push \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"type":"sermons","action":"add","data":{"title":"Test"},"timestamp":1234567890}'
```

## Deployment

See [REALTIME_SYNC_SETUP.md](../REALTIME_SYNC_SETUP.md) for detailed deployment instructions.
