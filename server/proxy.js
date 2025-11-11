const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

router.get('/video/*', async (req, res) => {
    try {
        const videoUrl = req.url.replace('/video/', '');
        const decodedUrl = decodeURIComponent(videoUrl);
        
        console.log('[Proxy] Fetching video:', decodedUrl);
        
        const response = await fetch(decodedUrl);
        
        // Forward the response headers
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Range',
            'Content-Type': response.headers.get('content-type'),
            'Content-Length': response.headers.get('content-length'),
            'Content-Range': response.headers.get('content-range'),
            'Accept-Ranges': response.headers.get('accept-ranges')
        });
        
        // Stream the response
        response.body.pipe(res);
    } catch (error) {
        console.error('[Proxy] Error:', error);
        res.status(500).json({ error: 'Failed to proxy video' });
    }
});

module.exports = router;