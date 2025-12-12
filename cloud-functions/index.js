const functions = require('firebase-functions');
const { onObjectFinalized } = require('firebase-functions/v2/storage');
const { onRequest } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');
const os = require('os');
const path = require('path');
const fs = require('fs').promises;

// No Admin SDK needed for this function

const REGION = process.env.FUNCTION_REGION || 'us-central1';

function isVideoObject(object) {
  if (!object || !object.contentType || !object.name) return false;
  if (!object.contentType.startsWith('video/')) return false;
  // avoid re-processing generated HLS
  if (object.name.includes('/hls/')) return false;
  if (object.name.endsWith('.m3u8') || object.name.endsWith('.ts') || object.name.endsWith('.m4s')) return false;
  return true;
}

function buildDownloadUrl(bucket, filePath, token) {
  const base = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(filePath)}`;
  const qp = token ? `?alt=media&token=${token}` : '?alt=media';
  return base + qp;
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true }).catch(() => {});
}

async function listFilesRecursive(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...await listFilesRecursive(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

// Minimal HTTP ping for analyzer and health checks (Gen2)
exports.ping = onRequest((req, res) => {
  res.status(200).send('ok');
});

exports.hlsOnUploadV2 = onObjectFinalized({ region: REGION, timeoutSeconds: 540, memory: '2GiB' }, async (event) => {
  // Defer heavy requires until invocation
  const ffmpeg = require('fluent-ffmpeg');
  const ffmpegBin = require('ffmpeg-static');
  const ffprobeBin = require('ffprobe-static');
  const crypto = require('crypto');
  const { Storage } = require('@google-cloud/storage');
  const storage = new Storage();
  const cfg = (() => { try { return functions.config(); } catch { return {}; } })();
  const SERVER_API_URL = process.env.SERVER_API_URL || (cfg && cfg.app && cfg.app.server_api_url);
  const HLS_CALLBACK_SECRET = process.env.HLS_CALLBACK_SECRET || (cfg && cfg.app && cfg.app.hls_secret);
  const ENV_CRF = process.env.HLS_CRF || (cfg && cfg.app && cfg.app.crf) || '22';
  const ENV_PRESET = process.env.HLS_PRESET || (cfg && cfg.app && cfg.app.preset) || 'veryfast';
  const ENV_SEG = process.env.HLS_SEGMENT_SECONDS || (cfg && cfg.app && cfg.app.segment_seconds) || '6';
  const VBR_360 = process.env.HLS_VBR_360 || (cfg && cfg.app && cfg.app.vbr_360) || '700k';
  const VBR_540 = process.env.HLS_VBR_540 || (cfg && cfg.app && cfg.app.vbr_540) || '1200k';
  const VBR_720 = process.env.HLS_VBR_720 || (cfg && cfg.app && cfg.app.vbr_720) || '2200k';
  const VBR_1080 = process.env.HLS_VBR_1080 || (cfg && cfg.app && cfg.app.vbr_1080) || '4200k';
  const toBps = (s) => {
    try { const n = String(s).trim().toLowerCase(); if (n.endsWith('k')) return parseInt(n)*1000; const v = parseInt(n); return Number.isFinite(v)? v : 0; } catch { return 0; }
  };

  // Configure ffmpeg/ffprobe binary paths
  try {
    if (ffmpegBin) ffmpeg.setFfmpegPath(ffmpegBin);
    const probePath = (ffprobeBin && (ffprobeBin.path || ffprobeBin)) || undefined;
    if (probePath) ffmpeg.setFfprobePath(probePath);
  } catch (e) {
    logger.warn('[HLS] Failed to set ffmpeg/ffprobe paths', e);
  }

  // Helpers that depend on ffmpeg
  const getDurationSec = async (inputPath) => {
    return new Promise((resolve) => {
      try {
        ffmpeg.ffprobe(inputPath, (err, data) => {
          if (err) return resolve(undefined);
          const sec = parseFloat(String(data?.format?.duration || ''));
          resolve(Number.isFinite(sec) ? sec : undefined);
        });
      } catch {
        resolve(undefined);
      }
    });
  };
  const generateThumbnail = async (inputPath, outDir) => {
    try {
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .on('end', resolve)
          .on('error', reject)
          .screenshots({
            count: 1,
            filename: 'thumb.jpg',
            timemarks: ['5'],
            folder: outDir
          });
      });
      return path.join(outDir, 'thumb.jpg');
    } catch (e) {
      logger.warn('[HLS] Thumbnail generation failed', e);
      return undefined;
    }
  };
  const object = event && event.data ? event.data : undefined;
  if (!isVideoObject(object)) {
    logger.log('[HLS] Skipping non-video or already-processed object:', object?.name);
    return;
  }
  if (!SERVER_API_URL || !HLS_CALLBACK_SECRET) {
    logger.error('[HLS] Missing SERVER_API_URL or HLS_CALLBACK_SECRET env vars');
    return;
  }

  const bucketName = object.bucket;
  const srcPath = object.name; // e.g., sermons/123_title.mp4
  const ext = path.extname(srcPath).toLowerCase();
  if (!['.mp4', '.mov', '.mkv', '.webm'].includes(ext)) {
    logger.log('[HLS] Unsupported video ext, skipping:', ext);
    return;
  }

  const workDir = path.join(os.tmpdir(), `hls-${Date.now()}`);
  const outDir = path.join(workDir, 'out');
  await ensureDir(workDir);
  await ensureDir(outDir);

  const srcFileLocal = path.join(workDir, path.basename(srcPath));
  logger.log('[HLS] Downloading source to', srcFileLocal);
  await storage.bucket(bucketName).file(srcPath).download({ destination: srcFileLocal });

  const baseName = path.basename(srcPath, ext);
  const dstPrefix = `sermons/hls/${baseName}/`;

  // Transcode -> HLS (multi-bitrate: 360p/540p/720p)
  const renditions = [
    { name: '360p', size: '?x360', vbr: VBR_360,  abr: '96k',  resolution: '640x360'  },
    { name: '540p', size: '?x540', vbr: VBR_540,  abr: '128k', resolution: '960x540'  },
    { name: '720p', size: '?x720', vbr: VBR_720,  abr: '128k', resolution: '1280x720' },
    { name: '1080p', size: '?x1080', vbr: VBR_1080, abr: '160k', resolution: '1920x1080' },
  ].map(r => ({ ...r, bandwidth: toBps(r.vbr) + toBps(r.abr) + 100000 }));

  logger.log('[HLS] Starting multi-bitrate ffmpeg jobs');
  for (const r of renditions) {
    const varDir = path.join(outDir, r.name);
    await ensureDir(varDir);
    await new Promise((resolve, reject) => {
      ffmpeg(srcFileLocal)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-profile:v', 'main',
          '-crf', String(ENV_CRF),
          '-preset', String(ENV_PRESET),
          '-ac', '2',
          '-ar', '48000',
          '-b:a', r.abr,
          '-maxrate', r.vbr,
          '-bufsize', r.vbr,
          '-sc_threshold', '0',
          '-hls_flags', 'independent_segments',
          '-force_key_frames', `expr:gte(t,n_forced*${String(ENV_SEG)})`,
          '-hls_time', String(ENV_SEG),
          '-hls_playlist_type', 'vod',
          '-hls_segment_filename', path.join(varDir, 'segment_%03d.ts'),
        ])
        .size(r.size)
        .output(path.join(varDir, 'index.m3u8'))
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
    logger.log(`[HLS] Rendition ${r.name} complete`);
  }
  logger.log('[HLS] All renditions finished');

  const durationSec = await getDurationSec(srcFileLocal);
  const thumbLocal = await generateThumbnail(srcFileLocal, outDir);

  // Upload segments, variant playlists, and thumbnail; then create master
  const bucket = storage.bucket(bucketName);
  let thumbUrl = undefined;
  const variantPlaylistUrls = new Map(); // name -> url

  // Upload thumbnail if present later in loop
  for (const r of renditions) {
    const varDir = path.join(outDir, r.name);
    const files = await listFilesRecursive(varDir);
    const segmentUrlMap = new Map();

    for (const localPath of files) {
      const fname = path.basename(localPath);
      if (fname === 'index.m3u8') continue; // defer playlist
      const destPath = `${dstPrefix}${r.name}/${fname}`;

      const isTs = fname.endsWith('.ts');
      const isJpg = fname.toLowerCase().endsWith('.jpg') || fname.toLowerCase().endsWith('.jpeg');
      const contentType = isTs ? 'video/mp2t' : (isJpg ? 'image/jpeg' : 'application/octet-stream');

      const token = crypto.randomUUID();
      await bucket.upload(localPath, {
        destination: destPath,
        metadata: {
          contentType,
          metadata: { firebaseStorageDownloadTokens: token },
          cacheControl: 'public, max-age=31536000'
        }
      });

      const publicUrl = buildDownloadUrl(bucketName, destPath, token);
      if (isTs) segmentUrlMap.set(fname, publicUrl);
      if (!thumbUrl && isJpg && fname.toLowerCase() === 'thumb.jpg') thumbUrl = publicUrl;
    }

    // Rewrite variant playlist with absolute segment URLs
    const plLocal = path.join(varDir, 'index.m3u8');
    let plContent = '';
    try { plContent = (await fs.readFile(plLocal)).toString('utf8'); }
    catch (e) { logger.error(`[HLS] Failed reading ${r.name}/index.m3u8`, e); return; }

    const plRewritten = plContent.split(/\r?\n/).map((line) => {
      const t = line.trim();
      if (!t || t.startsWith('#')) return line;
      if (segmentUrlMap.has(t)) return segmentUrlMap.get(t);
      return line;
    }).join('\n');

    const playlistToken = crypto.randomUUID();
    const variantDest = `${dstPrefix}${r.name}/index.m3u8`;
    await bucket.file(variantDest).save(plRewritten, {
      contentType: 'application/x-mpegURL',
      metadata: { metadata: { firebaseStorageDownloadTokens: playlistToken }, cacheControl: 'public, max-age=3600' },
      resumable: false
    });
    const variantUrl = buildDownloadUrl(bucketName, variantDest, playlistToken);
    variantPlaylistUrls.set(r.name, variantUrl);
  }

  // Upload thumbnail (if generated)
  try {
    const thumbName = 'thumb.jpg';
    const thumbPath = path.join(outDir, thumbName);
    const stat = await fs.stat(thumbPath).catch(() => null);
    if (stat && stat.isFile()) {
      const thumbToken = crypto.randomUUID();
      const dest = `${dstPrefix}${thumbName}`;
      await bucket.upload(thumbPath, {
        destination: dest,
        metadata: {
          contentType: 'image/jpeg',
          metadata: { firebaseStorageDownloadTokens: thumbToken },
          cacheControl: 'public, max-age=31536000'
        }
      });
      thumbUrl = buildDownloadUrl(bucketName, dest, thumbToken);
    }
  } catch (e) {
    logger.warn('[HLS] Failed uploading thumbnail', e);
  }

  // Build master playlist referencing variants
  const masterLines = [
    '#EXTM3U',
    '#EXT-X-VERSION:3',
    '#EXT-X-INDEPENDENT-SEGMENTS',
  ];
  for (const r of renditions) {
    const url = variantPlaylistUrls.get(r.name);
    if (!url) continue;
    masterLines.push(`#EXT-X-STREAM-INF:BANDWIDTH=${r.bandwidth},RESOLUTION=${r.resolution}`);
    masterLines.push(url);
  }
  const masterContent = masterLines.join('\n');

  const masterToken = crypto.randomUUID();
  const m3u8Dest = `${dstPrefix}master.m3u8`;
  await bucket.file(m3u8Dest).save(masterContent, {
    contentType: 'application/x-mpegURL',
    metadata: { metadata: { firebaseStorageDownloadTokens: masterToken }, cacheControl: 'public, max-age=1800' },
    resumable: false
  });

  const hlsUrl = buildDownloadUrl(bucketName, m3u8Dest, masterToken);

  // Find sermon by storagePath; fallback to matching on videoUrl containing encoded path or filename
  const MAX_LOOKUP_RETRIES = 6;
  let sermonId = undefined;
  const encSrcPath = encodeURIComponent(srcPath);
  const fileNameOnly = path.basename(srcPath);
  for (let i = 0; i < MAX_LOOKUP_RETRIES; i++) {
    try {
      const resp = await fetch(`${SERVER_API_URL}/sermons`);
      const list = await resp.json();
      const match = Array.isArray(list) ? list.find((s) => {
        try {
          if (s?.firebaseStoragePath && s.firebaseStoragePath === srcPath) return true;
          const v = s?.videoUrl;
          if (typeof v === 'string') {
            const base = v.split('?')[0] || v;
            if (base.includes(`/o/${encSrcPath}`)) return true;
            if (fileNameOnly && base.toLowerCase().includes(fileNameOnly.toLowerCase())) return true;
          }
        } catch {}
        return false;
      }) : undefined;
      if (match && match.id) { sermonId = String(match.id); break; }
    } catch (e) {
      logger.warn(`[HLS] Lookup attempt ${i+1} failed`, e);
    }
    await new Promise(r => setTimeout(r, 5000));
  }

  if (!sermonId) {
    logger.error('[HLS] Could not find sermonId for storagePath', srcPath);
    return;
  }

  // Callback to server to save hlsUrl
  try {
    const body = { hlsUrl, durationSec, thumbnails: thumbUrl ? { poster: thumbUrl } : undefined };
    const resp = await fetch(`${SERVER_API_URL}/sermons/${encodeURIComponent(sermonId)}/hls-callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-HLS-SECRET': HLS_CALLBACK_SECRET },
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Callback failed ${resp.status}: ${text}`);
    }
    logger.log('[HLS] Callback success for sermon', sermonId);
  } catch (e) {
    logger.error('[HLS] Callback error', e);
  }

  // Cleanup temp workdir
  try {
    await fs.rm(workDir, { recursive: true, force: true });
  } catch {}
});
