const express = require('express');
const playlistHandler = require('./api/playlist');
const streamHandler = require('./api/stream');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Routes
app.get('/api/playlist', playlistHandler);
app.get('/api/stream/:streamId/:type', streamHandler);

// Root endpoint
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head><title>Xtream Playlist Proxy</title></head>
            <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px;">
                <h1>🎬 Xtream Playlist Proxy</h1>
                <p>Your IPTV proxy server is running!</p>
                <h2>Available Endpoints:</h2>
                <ul>
                    <li><strong>Playlist:</strong> <a href="/api/playlist">/api/playlist</a></li>
                    <li><strong>Stream:</strong> /api/stream/{id}/{type}.m3u8</li>
                </ul>
                <h3>Usage:</h3>
                <p>Add this URL to your IPTV player:</p>
                <code style="background: #f4f4f4; padding: 10px; display: block; border-radius: 5px;">
                    http://localhost:${PORT}/api/playlist
                </code>
            </body>
        </html>
    `);
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Xtream Playlist Proxy Server`);
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`📋 Playlist URL: http://localhost:${PORT}/api/playlist`);
    console.log(`\nPress Ctrl+C to stop\n`);
});
