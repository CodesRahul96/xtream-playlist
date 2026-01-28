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
        const response = await axios({
            method: 'get',
            url: upstreamUrl,
            responseType: isHlsPlaylist ? 'text' : 'stream',
            headers: { ...SPOOF_HEADERS },
            httpAgent,
            httpsAgent,
            timeout: isHlsPlaylist ? 10000 : STREAM_TIMEOUT,
            maxRedirects: 5
        });

        // Capture the effective URL (after redirects)
        const effectiveUrl = response.request.res.responseUrl || upstreamUrl;

        // 1. Handle HLS Playlist (M3U8)
        if (isHlsPlaylist) {
            let m3u8Content = response.data;
            const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
            const host = req.headers['x-forwarded-host'] || req.headers.host;
            const proxyBaseUrl = `${protocol}://${host}/api/stream/${streamId}`;

            // Robust M3U8 Rewrite Logic
            const lines = m3u8Content.split('\n');
            const rewrittenLines = lines.map(line => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) return line;

                // Absolute URL
                if (trimmed.startsWith('http')) return trimmed;

                // Resolve against effective URL and encode for proxy
                const resolvedPath = new URL(trimmed, effectiveUrl).href;
                const encodedPath = Buffer.from(resolvedPath).toString('base64url');
                return `${proxyBaseUrl}/${encodedPath}`;
            });

            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.send(rewrittenLines.join('\n'));
            return;
        }

        // 2. Handle Binary Stream or Segments
        // Check if filename is actually an encoded URL from our HLS rewrite
        if (filename.length > 30 && !filename.includes('.')) {
            try {
                const decodedUrl = Buffer.from(filename, 'base64url').toString('utf8');
                if (decodedUrl.startsWith('http')) {
                    const segmentResponse = await axios({
                        method: 'get',
                        url: decodedUrl,
                        responseType: 'stream',
                        headers: { ...SPOOF_HEADERS },
                        httpAgent,
                        httpsAgent,
                        timeout: STREAM_TIMEOUT
                    });

                    res.setHeader('Content-Type', segmentResponse.headers['content-type'] || 'video/mp2t');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    segmentResponse.data.pipe(res);
                    return;
                }
            } catch (e) { /* ignore and proceed */ }
        }

        // Default direct stream pipe
        if (response.headers['content-type']) res.setHeader('Content-Type', response.headers['content-type']);
        res.setHeader('Access-Control-Allow-Origin', '*');
        response.data.pipe(res);

    } catch (error) {
        console.error(`[Stream] Error proxying ${filename}:`, error.message);
        if (!res.headersSent) res.status(502).send('Upstream Error');
    }
};
