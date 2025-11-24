'use strict';

// Facebook Live / RTMP bridge router.
// This module defines the backend endpoints used by the GoLive client
// to start/stop a Facebook Live broadcast and to stream media data
// into an ffmpeg process that pushes RTMP to Facebook.

const express = require('express');
const { spawn } = require('child_process');
const router = express.Router();

// In-memory store for active live streams
// streamId -> { ffmpeg, liveVideoId, createdAt }
const activeFacebookStreams = new Map();

// Lazy fetch helper (supports Node 18+ global fetch or node-fetch fallback)
let cachedFetch = null;
async function getFetch() {
  if (cachedFetch) return cachedFetch;
  if (typeof fetch === 'function') {
    cachedFetch = fetch;
    return cachedFetch;
  }

  // Dynamic import for CommonJS
  const mod = await import('node-fetch');
  cachedFetch = mod.default;
  return cachedFetch;
}

// Helper to read basic config from environment
function getFacebookConfig() {
  const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
  const PAGE_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const API_VERSION = process.env.FACEBOOK_API_VERSION || 'v18.0';

  if (!PAGE_ID || !PAGE_TOKEN) {
    throw new Error('FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN must be set in server/.env');
  }

  return { PAGE_ID, PAGE_TOKEN, API_VERSION };
}

// Helper for RTMP target using a persistent Facebook stream key.
// This mirrors the working CLI command the user tested:
//   ffmpeg ... -f flv "rtmps://live-api-s.facebook.com:443/rtmp/FB-..."
function getFacebookRtmpConfig() {
  const RTMP_URL = process.env.FACEBOOK_RTMP_URL || 'rtmps://live-api-s.facebook.com:443/rtmp';
  const STREAM_KEY = process.env.FACEBOOK_STREAM_KEY;

  if (!STREAM_KEY) {
    throw new Error('FACEBOOK_STREAM_KEY must be set in server/.env');
  }

  const base = RTMP_URL.replace(/\/+$/, '');
  const TARGET_URL = `${base}/${STREAM_KEY}`;

  return { RTMP_URL: base, STREAM_KEY, TARGET_URL };
}

// POST /api/facebook/live/start
// Expected body (example):
//   {
//     "title": "Church Live Service",
//     "description": "Join us for worship",
//     "privacy": "public" // optional, map to Facebook privacy if needed
//   }
router.post('/start', express.json(), async (req, res) => {
  try {
    const { TARGET_URL } = getFacebookRtmpConfig();

    const { title, description, privacy } = req.body || {};

    // Spawn ffmpeg, piping stdin (WebM from MediaRecorder) to Facebook RTMP URL
    const ffmpeg = spawn('ffmpeg', [
      '-loglevel', 'error',
      // Read the WebM input at realtime speed to avoid large bursts
      // that can cause RTMP disconnects.
      '-re',
      '-f', 'webm',
      '-i', 'pipe:0',
      // Video encoding (match YouTube bridge: 24fps, 2s keyframes,
      // with low bitrate for slow upload connections). Use
      // ultrafast preset and downscale to 480p to reduce CPU load.
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-vf', 'scale=-2:480',
      '-b:v', '800k',
      '-maxrate', '900k',
      '-bufsize', '1800k',
      '-pix_fmt', 'yuv420p',
      '-r', '24',
      '-g', '48',
      // Audio encoding
      '-c:a', 'aac',
      '-b:a', '64k',
      '-ar', '44100',
      '-ac', '2',
      '-f', 'flv',
      TARGET_URL,
    ]);

    ffmpeg.stderr.on('data', (data) => {
      console.error('[FacebookLive][ffmpeg]', data.toString());
    });

    // Prevent ffmpeg stdin errors (e.g. EOF after process exit) from
    // crashing the Node process.
    ffmpeg.stdin.on('error', (err) => {
      if (err.code === 'EPIPE' || err.code === 'EOF') {
        console.warn('[FacebookLive] ffmpeg.stdin closed:', err.message);
      } else {
        console.error('[FacebookLive] ffmpeg.stdin error:', err);
      }
    });

    // Allocate a streamId and store the ffmpeg process reference
    const streamId = `fb-${Date.now().toString(36)}`;
    activeFacebookStreams.set(streamId, {
      ffmpeg,
      liveVideoId: null,
      createdAt: new Date().toISOString(),
      exited: false,
    });

    ffmpeg.on('exit', (code, signal) => {
      console.log(`[FacebookLive][ffmpeg] exited with code=${code} signal=${signal}`);
      const entry = activeFacebookStreams.get(streamId);
      if (entry) {
        entry.exited = true;
      }
    });

    ffmpeg.on('error', (err) => {
      console.error('[FacebookLive][ffmpeg] error:', err);
    });

    res.json({
      success: true,
      streamId,
      liveVideoId: null,
      // NOTE: Do not expose stream URLs to untrusted clients in production.
      streamUrl: TARGET_URL,
    });
  } catch (error) {
    console.error('[FacebookLive] /start error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/facebook/live/chunk/:streamId
// Streaming endpoint for browser-side video data.
// A backend dev should:
//   - Look up activeFacebookStreams.get(streamId)
//   - Pipe req (or a transformed stream) into ffmpeg.stdin
//   - Handle end / error events appropriately.
router.post('/chunk/:streamId', (req, res) => {
  const { streamId } = req.params;
  const entry = activeFacebookStreams.get(streamId);

  if (!entry) {
    return res.status(404).json({ success: false, error: 'Unknown Facebook streamId' });
  }

  const { ffmpeg, exited } = entry;

  if (!ffmpeg || !ffmpeg.stdin || ffmpeg.killed || exited) {
    return res.status(500).json({ success: false, error: 'Streaming process not ready' });
  }

  // Manually forward chunks into ffmpeg.stdin and swallow write errors
  req.on('data', (chunk) => {
    if (!ffmpeg.stdin.writable) {
      return;
    }

    ffmpeg.stdin.write(chunk, (err) => {
      if (err && err.code !== 'EPIPE') {
        console.warn('[FacebookLive] Error writing chunk to ffmpeg stdin:', err.message);
      }
    });
  });

  req.on('end', () => {
    res.json({ success: true, received: true });
  });

  req.on('error', (err) => {
    console.warn('[FacebookLive] Chunk request error:', err.message);
  });
});

// POST /api/facebook/live/stop
// Expected body: { "streamId": "fb-..." }
router.post('/stop', express.json(), async (req, res) => {
  const { streamId } = req.body || {};

  if (!streamId) {
    return res.status(400).json({ success: false, error: 'streamId is required' });
  }

  const entry = activeFacebookStreams.get(streamId);
  if (!entry) {
    return res.status(404).json({ success: false, error: 'Unknown Facebook streamId' });
  }

  const { ffmpeg } = entry;
  activeFacebookStreams.delete(streamId);

  try {
    // Close stdin and terminate ffmpeg gracefully
    if (ffmpeg && !ffmpeg.killed) {
      try {
        ffmpeg.stdin.end();
      } catch (e) {
        console.warn('[FacebookLive] Error ending ffmpeg stdin:', e);
      }
      ffmpeg.kill('SIGINT');
    }

    res.json({ success: true, streamId });
  } catch (error) {
    console.error('[FacebookLive] /stop error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
