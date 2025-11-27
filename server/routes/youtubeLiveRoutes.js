'use strict';

// YouTube Live / RTMP bridge router.
// This module defines the backend endpoints used by the GoLive client
// to start/stop a YouTube Live stream and to stream media data
// into an ffmpeg process that pushes RTMP to YouTube.

const express = require('express');
const { spawn } = require('child_process');
const router = express.Router();

// In-memory store for active YouTube streams
// streamId -> { ffmpeg, createdAt, exited }
const activeYouTubeStreams = new Map();

// Helper to read basic config from environment
function getYouTubeConfig() {
  const RTMP_URL = process.env.YOUTUBE_RTMP_URL || 'rtmp://a.rtmp.youtube.com/live2';
  const STREAM_KEY = process.env.YOUTUBE_STREAM_KEY;

  if (!STREAM_KEY) {
    throw new Error('YOUTUBE_STREAM_KEY must be set in server/.env');
  }

  const base = RTMP_URL.replace(/\/+$/, '');
  const TARGET_URL = `${base}/${STREAM_KEY}`;

  return { RTMP_URL: base, STREAM_KEY, TARGET_URL };
}

// POST /api/youtube/live/start
// Expected body (example):
//   {
//     "title": "Church Live Service",
//     "description": "Join us for worship",
//     "privacy": "public" | "private" | "unlisted" (optional)
//   }
router.post('/start', express.json(), (req, res) => {
  try {
    const { TARGET_URL } = getYouTubeConfig();

    // We don't need the title/description for RTMP itself, but accept them
    // so the client can send the same payload shape as other platforms.
    const { title, description, privacy } = req.body || {};

    // Spawn ffmpeg, piping stdin (WebM from MediaRecorder) to YouTube RTMP URL
    const ffmpeg = spawn('ffmpeg', [
      '-loglevel', 'info',
      // Read the WebM input at realtime speed to avoid large bursts
      // that can cause RTMP disconnects.
      '-re',
      // Input: WebM from the browser (video + audio)
      '-f', 'webm',
      '-i', 'pipe:0',
      // Video encoding settings (even lower bitrate for very slow
      // upload connections). Use ultrafast preset and downscale to
      // 360p to reduce CPU load on the streaming PC.
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      // Pass through at camera resolution (480p) to save CPU on scaling
      '-r', '24', // Match camera framerate
      '-g', '48', // Keyframe interval (2x framerate)
      // Bitrate settings for 480p
      '-b:v', '700k',
      '-maxrate', '850k',
      '-bufsize', '1700k',
      '-pix_fmt', 'yuv420p',
      // Audio encoding settings (transcode incoming Opus to AAC)
      '-c:a', 'aac',
      '-b:a', '64k',
      '-ar', '44100',
      '-ac', '2',
      // Output container/target
      '-f', 'flv',
      TARGET_URL,
    ]);

    ffmpeg.stderr.on('data', (data) => {
      console.error('[YouTubeLive][ffmpeg]', data.toString());
    });

    // Prevent ffmpeg stdin errors (e.g. EOF after process exit) from
    // crashing the Node process.
    ffmpeg.stdin.on('error', (err) => {
      if (err.code === 'EPIPE' || err.code === 'EOF') {
        console.warn('[YouTubeLive] ffmpeg.stdin closed:', err.message);
      } else {
        console.error('[YouTubeLive] ffmpeg.stdin error:', err);
      }
    });

    const streamId = `yt-${Date.now().toString(36)}`;
    activeYouTubeStreams.set(streamId, {
      ffmpeg,
      createdAt: new Date().toISOString(),
      exited: false,
    });

    ffmpeg.on('exit', (code, signal) => {
      console.log(`[YouTubeLive][ffmpeg] exited with code=${code} signal=${signal}`);
      const entry = activeYouTubeStreams.get(streamId);
      if (entry) {
        entry.exited = true;
      }
    });

    ffmpeg.on('error', (err) => {
      console.error('[YouTubeLive][ffmpeg] error:', err);
    });

    res.json({
      success: true,
      streamId,
      rtmpUrl: TARGET_URL,
    });
  } catch (error) {
    console.error('[YouTubeLive] /start error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/youtube/live/chunk/:streamId
// Streaming endpoint for browser-side video data.
router.post('/chunk/:streamId', (req, res) => {
  const { streamId } = req.params;
  const entry = activeYouTubeStreams.get(streamId);

  if (!entry) {
    return res.status(404).json({ success: false, error: 'Unknown YouTube streamId' });
  }

  const { ffmpeg, exited } = entry;

  if (!ffmpeg || !ffmpeg.stdin || ffmpeg.killed || exited) {
    console.warn('[YouTubeLive] /chunk rejected:', {
      streamId,
      hasFfmpeg: !!ffmpeg,
      hasStdin: !!(ffmpeg && ffmpeg.stdin),
      killed: !!(ffmpeg && ffmpeg.killed),
      exited,
    });
    return res.status(500).json({ success: false, error: 'Streaming process not ready' });
  }

  // Manually forward chunks into ffmpeg.stdin and swallow write errors
  req.on('data', (chunk) => {
    if (!ffmpeg.stdin.writable) {
      return;
    }

    ffmpeg.stdin.write(chunk, (err) => {
      if (err && err.code !== 'EPIPE' && err.code !== 'EOF') {
        console.warn('[YouTubeLive] Error writing chunk to ffmpeg stdin:', err.message);
      }
    });
  });

  req.on('end', () => {
    res.json({ success: true, received: true });
  });

  req.on('error', (err) => {
    console.warn('[YouTubeLive] Chunk request error:', err.message);
  });
});

// POST /api/youtube/live/stop
// Expected body: { "streamId": "yt-..." }
router.post('/stop', express.json(), async (req, res) => {
  const { streamId } = req.body || {};

  if (!streamId) {
    return res.status(400).json({ success: false, error: 'streamId is required' });
  }

  const entry = activeYouTubeStreams.get(streamId);
  if (!entry) {
    return res.status(404).json({ success: false, error: 'Unknown YouTube streamId' });
  }

  const { ffmpeg } = entry;
  activeYouTubeStreams.delete(streamId);

  try {
    if (ffmpeg && !ffmpeg.killed) {
      try {
        ffmpeg.stdin.end();
      } catch (e) {
        console.warn('[YouTubeLive] Error ending ffmpeg stdin:', e);
      }
      ffmpeg.kill('SIGINT');
    }

    res.json({ success: true, streamId });
  } catch (error) {
    console.error('[YouTubeLive] /stop error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
