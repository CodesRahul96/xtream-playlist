// Vercel Serverless Function Adapter
// This file adapts the Express app for Vercel's serverless environment

const playlistHandler = require('./api/playlist');
const streamHandler = require('./api/stream');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { pathname } = new URL(req.url, `http://${req.headers.host}`);

    try {
        // Route: /api/playlist
        if (pathname === '/api/playlist') {
            return await playlistHandler(req, res);
        }

        // Route: /api/stream/:id/:type
        const streamMatch = pathname.match(/^\/api\/stream\/([^\/]+)\/([^\/]+)$/);
        if (streamMatch) {
            req.params = {
                streamId: streamMatch[1],
                type: streamMatch[2]
            };
            return await streamHandler(req, res);
        }

        // Root endpoint
        if (pathname === '/' || pathname === '') {
            const PORT = 3000;
            return res.status(200).send(`
                <html>
                    <head><title>Xtream Playlist Proxy</title></head>
                    <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px;">
                        <h1>🎬 Xtream Playlist Proxy</h1>
                        <p>Your IPTV proxy server is running on Vercel!</p>
                        <h2>Available Endpoints:</h2>
                        <ul>
                            <li><strong>Playlist:</strong> <a href="/api/playlist">/api/playlist</a></li>
                            <li><strong>Stream:</strong> /api/stream/{id}/{type}.m3u8</li>
                        </ul>
                        <h3>Usage:</h3>
                        <p>Add this URL to your IPTV player:</p>
                        <code style="background: #f4f4f4; padding: 10px; display: block; border-radius: 5px;">
                            https://${req.headers.host}/api/playlist
                        </code>
                    </body>
                </html>
            `);
        }

        return res.status(404).send('Not Found');
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send(`Error: ${error.message}`);
    }
};
