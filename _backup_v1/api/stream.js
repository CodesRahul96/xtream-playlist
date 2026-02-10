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
        // Stream validation headers (Use Random Profile)
        const headers = config.getRandomHeaders();

        // 1. Handle HLS Playlist (M3U8) - Fetch as TEXT
        if (isHlsPlaylist) {
            const response = await axios({
                method: 'get',
                url: upstreamUrl,
                responseType: 'text', // Safer for text manipulation
                headers: headers,
                httpAgent,
                httpsAgent,
                timeout: 10000,
                maxRedirects: 5
            });

            const m3u8Content = response.data;
            const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
            const host = req.headers['x-forwarded-host'] || req.headers.host;
            const proxyBaseUrl = `${protocol}://${host}/api/stream/${streamId}`;

            // Rewrite logic...
            const lines = m3u8Content.split('\n');
            const rewrittenLines = lines.map(line => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) return line;
                if (trimmed.startsWith('http')) return trimmed; // Absolute URLs

                // Resolve relative URLs using axios responseURL if available
                const effectiveUrl = response.request?.res?.responseUrl || upstreamUrl;
                try {
                    const resolvedPath = new URL(trimmed, effectiveUrl).href;
                    const encodedPath = Buffer.from(resolvedPath).toString('base64url');
                    return `${proxyBaseUrl}/${encodedPath}`;
                } catch (e) {
                    return line; // Fallback
                }
            });

            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.send(rewrittenLines.join('\n'));
            return;
        }

        // 2. Binary Stream (TS/MP4) - Fetch as STREAM and PIPE
        const response = await axios({
            method: 'get',
            url: upstreamUrl,
            responseType: 'stream', // Crucial for memory efficiency
            headers: headers,
            httpAgent,
            httpsAgent,
            timeout: STREAM_TIMEOUT,
            maxRedirects: 5,
            decompress: false
        });

        res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp2t');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Pipe directly to client response
        response.data.pipe(res);

        response.data.on('error', (err) => {
            console.error('[Stream] Pipe Error:', err.message);
            if (!res.headersSent) res.end();
        });

    } catch (error) {
        // Detailed Error Logging
        const status = error.response ? error.response.status : 502;
        console.error(`[Stream] Error fetching ${filename}:`, error.message);

        if (!res.headersSent) {
            res.status(status).send(`Stream fetch error: ${error.message} (${upstreamUrl})`);
        } else {
            res.end();
        }
    }
};
