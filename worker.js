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
        // Try get.php first
        const m3uResponse = await fetch(`${config.XTREAM_BASE_URL}/get.php?username=${config.USERNAME}&password=${config.PASSWORD}&type=m3u_plus&output=ts`, {
            headers: config.SPOOF_HEADERS,
            signal: AbortSignal.timeout(config.PLAYLIST_TIMEOUT)
        });

        let m3u = '#EXTM3U\n';
        const m3uContent = await m3uResponse.text();

        if (m3uContent.startsWith('#EXTM3U')) {
            const lines = m3uContent.split('\n');
            for (let line of lines) {
                line = line.trim();
                if (!line) continue;

                if (line.startsWith('#EXTINF')) {
                    m3u += line + '\n';
                } else if (line.startsWith('http')) {
                    const urlParts = line.split('/');
                    const filename = urlParts[urlParts.length - 1];
                    const id = filename.split('.')[0];
                    const type = line.includes('/movie/') ? 'movie' : 'live';
                    m3u += `${baseUrl}/api/stream/${id}/${type}.m3u8\n`;
                }
            }
        } else {
            m3u += '#EXTINF:-1,Error loading playlist\n';
        }

        return new Response(m3u, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'audio/x-mpegurl',
                'Content-Disposition': 'attachment; filename="playlist.m3u"'
            }
        });
    } catch (error) {
        return new Response(`Playlist Error: ${error.message}`, { status: 500, headers: corsHeaders });
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

    // Proxy mode
    try {
        const response = await fetch(upstreamUrl, {
            headers: config.SPOOF_HEADERS,
            signal: AbortSignal.timeout(config.STREAM_TIMEOUT)
        });

        const newHeaders = new Headers(response.headers);
        Object.entries(corsHeaders).forEach(([key, value]) => newHeaders.set(key, value));

        return new Response(response.body, {
            status: response.status,
            headers: newHeaders
        });
    } catch (error) {
        return new Response(`Stream Error: ${error.message}`, { status: 502, headers: corsHeaders });
    }
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
