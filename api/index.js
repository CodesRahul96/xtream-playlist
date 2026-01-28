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
            // Set expiry date (example: 30 days from now, adjust as needed)
            const expiryDate = new Date('2026-02-28T23:59:59'); // Set your actual expiry date here
            const now = new Date();
            const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
            const expiryStatus = daysLeft > 0 ? `✅ Active (${daysLeft} days left)` : '❌ Expired';
            const expiryColor = daysLeft > 7 ? '#28a745' : daysLeft > 0 ? '#ffc107' : '#dc3545';

            return res.status(200).send(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>Xtream Playlist Proxy</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                            * { margin: 0; padding: 0; box-sizing: border-box; }
                            body {
                                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                min-height: 100vh;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                padding: 20px;
                            }
                            .container {
                                background: white;
                                border-radius: 20px;
                                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                                max-width: 800px;
                                width: 100%;
                                padding: 40px;
                            }
                            h1 {
                                color: #333;
                                margin-bottom: 10px;
                                font-size: 2.5em;
                            }
                            .subtitle {
                                color: #666;
                                margin-bottom: 30px;
                                font-size: 1.1em;
                            }
                            .expiry-box {
                                background: linear-gradient(135deg, ${expiryColor}15 0%, ${expiryColor}25 100%);
                                border-left: 4px solid ${expiryColor};
                                padding: 20px;
                                border-radius: 10px;
                                margin-bottom: 30px;
                            }
                            .expiry-box h3 {
                                color: ${expiryColor};
                                margin-bottom: 10px;
                                font-size: 1.3em;
                            }
                            .expiry-date {
                                font-size: 1.5em;
                                font-weight: bold;
                                color: #333;
                                margin: 10px 0;
                            }
                            .expiry-status {
                                font-size: 1.2em;
                                color: ${expiryColor};
                                font-weight: 600;
                            }
                            .section {
                                margin: 30px 0;
                            }
                            .section h2 {
                                color: #667eea;
                                margin-bottom: 15px;
                                font-size: 1.5em;
                            }
                            .endpoint-list {
                                list-style: none;
                                padding: 0;
                            }
                            .endpoint-list li {
                                background: #f8f9fa;
                                padding: 15px;
                                margin: 10px 0;
                                border-radius: 8px;
                                border-left: 3px solid #667eea;
                            }
                            .endpoint-list strong {
                                color: #667eea;
                                display: block;
                                margin-bottom: 5px;
                            }
                            .endpoint-list a {
                                color: #764ba2;
                                text-decoration: none;
                                font-weight: 500;
                            }
                            .endpoint-list a:hover {
                                text-decoration: underline;
                            }
                            .code-box {
                                background: #2d3748;
                                color: #68d391;
                                padding: 20px;
                                border-radius: 10px;
                                font-family: 'Courier New', monospace;
                                font-size: 0.95em;
                                overflow-x: auto;
                                margin: 15px 0;
                            }
                            .server-info {
                                background: #e3f2fd;
                                padding: 15px;
                                border-radius: 8px;
                                margin-top: 20px;
                                border-left: 3px solid #2196f3;
                            }
                            .server-info p {
                                margin: 5px 0;
                                color: #555;
                            }
                            .feature-badge {
                                display: inline-block;
                                background: #667eea;
                                color: white;
                                padding: 5px 12px;
                                border-radius: 20px;
                                font-size: 0.85em;
                                margin: 5px 5px 5px 0;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>🎬 Xtream Playlist Proxy</h1>
                            <p class="subtitle">Professional IPTV Proxy with Device Bypass</p>
                            
                            <div class="expiry-box">
                                <h3>📅 Subscription Status</h3>
                                <div class="expiry-date">Expires: ${expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                <div class="expiry-status">${expiryStatus}</div>
                            </div>

                            <div class="section">
                                <h2>🔗 Available Endpoints</h2>
                                <ul class="endpoint-list">
                                    <li>
                                        <strong>📺 Playlist</strong>
                                        <a href="/api/playlist">/api/playlist</a>
                                    </li>
                                    <li>
                                        <strong>🎥 Stream</strong>
                                        /api/stream/{id}/{type}.m3u8
                                    </li>
                                </ul>
                            </div>

                            <div class="section">
                                <h2>📱 Usage</h2>
                                <p>Add this URL to your IPTV player:</p>
                                <div class="code-box">https://${req.headers.host}/api/playlist</div>
                            </div>

                            <div class="section">
                                <h2>✨ Features</h2>
                                <span class="feature-badge">🛡️ Device Bypass</span>
                                <span class="feature-badge">🔄 8 User-Agent Profiles</span>
                                <span class="feature-badge">⚡ Fast Streaming</span>
                                <span class="feature-badge">🌍 Global CDN</span>
                                <span class="feature-badge">🔒 Secure</span>
                            </div>

                            <div class="server-info">
                                <p><strong>🖥️ Server:</strong> vipkendrake.top:8080</p>
                                <p><strong>🔧 Platform:</strong> Vercel Serverless</p>
                                <p><strong>📊 Status:</strong> Online</p>
                            </div>
                        </div>
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
