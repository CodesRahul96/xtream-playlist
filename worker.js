// Cloudflare Workers Entry Point
// This file adapts the Express-style handlers for Cloudflare Workers runtime

const config = {
    XTREAM_BASE_URL: 'http://starshare.st:80',
    USERNAME: '758811',
    PASSWORD: '854100',
    SPOOF_HEADERS: {
        'User-Agent': 'TiviMate/5.1.0 (Linux; Android 11; TV)',
        'X-Requested-With': 'ar.tvplayer.tv',
        'Accept': '*/*',
        'Connection': 'keep-alive'
    },
    STREAM_TIMEOUT: 30000,
    PLAYLIST_TIMEOUT: 15000
};

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Route: /api/playlist
        if (path === '/api/playlist') {
            return await handlePlaylist(request, corsHeaders);
        }

        // Route: /api/stream/:id/:type
        const streamMatch = path.match(/^\/api\/stream\/([^\/]+)\/([^\/]+)$/);
        if (streamMatch) {
            const [, streamId, type] = streamMatch;
            return await handleStream(request, streamId, type, corsHeaders);
        }

        // Root endpoint
        if (path === '/' || path === '') {
            return new Response(getHomePage(request.url), {
                headers: { ...corsHeaders, 'Content-Type': 'text/html' }
            });
        }

        return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
        return new Response(`Error: ${error.message}`, { status: 500, headers: corsHeaders });
    }
}

async function handlePlaylist(request, corsHeaders) {
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    try {
        // Try get.php first with streaming to avoid memory limits
        const m3uResponse = await fetch(`${config.XTREAM_BASE_URL}/get.php?username=${config.USERNAME}&password=${config.PASSWORD}&type=m3u_plus&output=ts`, {
            headers: config.SPOOF_HEADERS,
            signal: AbortSignal.timeout(30000) // Increased timeout
        });

        if (!m3uResponse.ok) {
            throw new Error(`Upstream returned ${m3uResponse.status}`);
        }

        // Stream and process the response to avoid memory limits
        const reader = m3uResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let m3u = '#EXTM3U\n';
        let currentExtinf = '';
        let processedLines = 0;
        const maxLines = 10000; // Limit to prevent memory issues

        while (processedLines < maxLines) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
                processedLines++;
                if (processedLines > maxLines) break;

                const trimmed = line.trim();
                if (!trimmed) continue;

                if (trimmed.startsWith('#EXTINF')) {
                    currentExtinf = trimmed;
                } else if (trimmed.startsWith('http') && currentExtinf) {
                    try {
                        const urlParts = trimmed.split('/');
                        const filename = urlParts[urlParts.length - 1];
                        const id = filename.split('.')[0];
                        const type = trimmed.includes('/movie/') ? 'movie' : 'live';

                        m3u += currentExtinf + '\n';
                        m3u += `${baseUrl}/api/stream/${id}/${type}.m3u8\n`;
                        currentExtinf = '';
                    } catch (e) {
                        // Skip malformed URLs
                    }
                }
            }
        }

        return new Response(m3u, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'audio/x-mpegurl',
                'Content-Disposition': 'attachment; filename="playlist.m3u"',
                'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
            }
        });
    } catch (error) {
        return new Response(`Playlist Error: ${error.message}`, {
            status: 500,
            headers: corsHeaders
        });
    }
}

async function handleStream(request, streamId, type, corsHeaders) {
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode');

    const filename = type;
    let upstreamUrl;

    if (filename.endsWith('.m3u8')) {
        upstreamUrl = `${config.XTREAM_BASE_URL}/live/${config.USERNAME}/${config.PASSWORD}/${streamId}.m3u8`;
    } else if (filename === 'live' || filename === 'movie') {
        const ext = filename === 'movie' ? 'mp4' : 'ts';
        const typeDir = filename === 'movie' ? 'movie' : 'live';
        upstreamUrl = `${config.XTREAM_BASE_URL}/${typeDir}/${config.USERNAME}/${config.PASSWORD}/${streamId}.${ext}`;
    } else {
        upstreamUrl = `${config.XTREAM_BASE_URL}/live/${config.USERNAME}/${config.PASSWORD}/${streamId}.ts`;
    }

    // Redirect mode
    if (mode === 'redirect') {
        return Response.redirect(upstreamUrl, 302);
    }

    // Proxy mode with retry logic
    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const response = await fetch(upstreamUrl, {
                headers: config.SPOOF_HEADERS,
                signal: AbortSignal.timeout(60000) // 60 second timeout for streams
            });

            if (!response.ok && attempt < 2) {
                // Retry on error
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                continue;
            }

            const newHeaders = new Headers(response.headers);
            Object.entries(corsHeaders).forEach(([key, value]) => newHeaders.set(key, value));
            newHeaders.set('Cache-Control', 'public, max-age=3600'); // Cache streams for 1 hour

            return new Response(response.body, {
                status: response.status,
                headers: newHeaders
            });
        } catch (error) {
            lastError = error;
            if (attempt < 2) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            }
        }
    }

    return new Response(`Stream Error: ${lastError.message}`, { status: 502, headers: corsHeaders });
}

function getHomePage(baseUrl) {
    return `
        <html>
            <head><title>Xtream Playlist Proxy</title></head>
            <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px;">
                <h1>🎬 Xtream Playlist Proxy</h1>
                <p>Your IPTV proxy server is running on Cloudflare Workers!</p>
                <h2>Available Endpoints:</h2>
                <ul>
                    <li><strong>Playlist:</strong> <a href="/api/playlist">/api/playlist</a></li>
                    <li><strong>Stream:</strong> /api/stream/{id}/{type}.m3u8</li>
                </ul>
                <h3>Usage:</h3>
                <p>Add this URL to your IPTV player:</p>
                <code style="background: #f4f4f4; padding: 10px; display: block; border-radius: 5px;">
                    ${baseUrl}/api/playlist
                </code>
            </body>
        </html>
    `;
}
