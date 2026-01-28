const axios = require('axios');
const http = require('http');
const https = require('https');
const config = require('../config');

const { XTREAM_BASE_URL, USERNAME, PASSWORD, SPOOF_HEADERS, STREAM_TIMEOUT } = config;

// Keep-alive agents for better performance
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

module.exports = async (req, res) => {
    // Determine path
    const path = req.customPath || (req.query && req.query.path) || (req.params && `${req.params.streamId}/${req.params.type}`);

    if (!path) {
        return res.status(400).send('Missing stream parameters');
    }

    // path format: "STREAM_ID/TYPE_OR_FILENAME"
    const parts = path.split('/');
    const streamId = parts[0];
    const filename = parts[1]; // "live", "live.m3u8", or "segment.ts"

    // Construct Upstream URL
    let upstreamUrl;
    let isHlsPlaylist = false;

    if (filename === 'live' || filename === 'movie') {
        // Legacy: Direct TS/MP4 Stream
        const extension = filename === 'movie' ? 'mp4' : 'ts';
        const typeDir = filename === 'movie' ? 'movie' : 'live';
        upstreamUrl = `${XTREAM_BASE_URL}/${typeDir}/${USERNAME}/${PASSWORD}/${streamId}.${extension}`;
    } else if (filename.endsWith('.m3u8')) {
        // HLS Playlist
        isHlsPlaylist = true;
        upstreamUrl = `${XTREAM_BASE_URL}/live/${USERNAME}/${PASSWORD}/${streamId}.m3u8`;
    } else if (filename.endsWith('.ts')) {
        // HLS Segment
        upstreamUrl = `${XTREAM_BASE_URL}/live/${USERNAME}/${PASSWORD}/${filename}`;
    } else {
        // Fallback / Default
        upstreamUrl = `${XTREAM_BASE_URL}/live/${USERNAME}/${PASSWORD}/${streamId}.ts`;
    }

    // Handle Redirect Mode (Bypass Proxy)
    if (req.query.mode === 'redirect') {
        return res.redirect(upstreamUrl);
    }

    try {
        // Stream validation headers
        const headers = {
            ...SPOOF_HEADERS,
            // Only set specific headers to avoid conflicts
            'User-Agent': SPOOF_HEADERS['User-Agent']
        };

        const response = await axios({
            method: 'get',
            url: upstreamUrl,
            responseType: 'stream', // Important for memory efficiency
            headers: headers,
            httpAgent,
            httpsAgent,
            timeout: isHlsPlaylist ? 15000 : STREAM_TIMEOUT,
            maxRedirects: 5,
            decompress: false // Let Vercel/Client handle (or pass through) compression
        });

        // Set appropriate content type
        if (isHlsPlaylist) {
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        } else {
            res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp2t');
        }

        // Handle HLS Playlist (M3U8) rewriting or Pass-through Stream
        if (isHlsPlaylist) {
            // For playlists, we need to read the content to rewrite it
            // But since we are using 'stream', we collect it first
            // (M3U8 files are small so this is safe)
            const chunks = [];
            response.data.on('data', chunk => chunks.push(chunk));
            response.data.on('end', () => {
                const m3u8Content = Buffer.concat(chunks).toString();
                const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
                const host = req.headers['x-forwarded-host'] || req.headers.host;
                const proxyBaseUrl = `${protocol}://${host}/api/stream/${streamId}`;

                // Rewrite logic...
                const lines = m3u8Content.split('\n');
                const rewrittenLines = lines.map(line => {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith('#')) return line;
                    if (trimmed.startsWith('http')) return trimmed; // Absolute URLs

                    // Resolve relative URLs
                    // Capture effective URL logic would be needed here, 
                    // but for now we assume relative to upstream base
                    // Note: axios 'responseUrl' might be needed if redirects happened
                    const effectiveUrl = response.request.res.responseUrl || upstreamUrl;
                    const resolvedPath = new URL(trimmed, effectiveUrl).href;
                    const encodedPath = Buffer.from(resolvedPath).toString('base64url');
                    return `${proxyBaseUrl}/${encodedPath}`;
                });

                res.send(rewrittenLines.join('\n'));
            });

            response.data.on('error', err => {
                console.error('[Stream] HLS processing error:', err.message);
                if (!res.headersSent) res.status(502).send('Upstream Error');
            });

        } else {
            // Binary Stream (TS/MP4) - PIPE DIRECTLY!
            // This is crucial for avoiding 502s on large video files
            res.setHeader('Cache-Control', 'no-cache');
            response.data.pipe(res);

            response.data.on('error', (err) => {
                console.error('[Stream] Stream pipe error:', err.message);
                if (!res.headersSent) res.end();
            });
        }


    } catch (error) {
        console.error('[Stream] Fetch error:', error.message);
        if (!res.headersSent) {
            // Only send error if we haven't started streaming
            res.status(502).send(`Stream fetch error: ${error.message}`);
        } else {
            res.end();
        }
    }
};
