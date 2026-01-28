// Vercel Serverless Function Adapter
// This file adapts the Express app for Vercel's serverless environment

const playlistHandler = require('./playlist');
const streamHandler = require('./stream');

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
            try {
                // Fetch real subscription info from Xtream API
                const config = require('../config');
                const authUrl = `${config.XTREAM_BASE_URL}/player_api.php?username=${config.USERNAME}&password=${config.PASSWORD}`;

                let subscriptionInfo = {
                    status: 'Unknown',
                    expiryDate: null,
                    maxConnections: 'N/A',
                    activeConnections: 'N/A',
                    createdAt: null
                };

                try {
                    const authResponse = await fetch(authUrl, {
                        headers: config.SPOOF_HEADERS,
                        signal: AbortSignal.timeout(10000)
                    });

                    if (authResponse.ok) {
                        const data = await authResponse.json();
                        if (data.user_info) {
                            subscriptionInfo = {
                                status: data.user_info.status || 'Unknown',
                                expiryDate: data.user_info.exp_date ? new Date(parseInt(data.user_info.exp_date) * 1000) : null,
                                maxConnections: data.user_info.max_connections || 'N/A',
                                activeConnections: data.user_info.active_cons || '0',
                                createdAt: data.user_info.created_at ? new Date(parseInt(data.user_info.created_at) * 1000) : null
                            };
                        }
                    }
                } catch (apiError) {
                    console.error('Failed to fetch subscription info:', apiError);
                }

                // Calculate days left
                const now = new Date();
                let daysLeft = 0;
                let expiryStatus = '⚠️ Unknown';
                let expiryColor = '#6c757d';
                let statusBadge = 'Unknown';
                let statusBadgeColor = '#6c757d';

                if (subscriptionInfo.expiryDate) {
                    daysLeft = Math.ceil((subscriptionInfo.expiryDate - now) / (1000 * 60 * 60 * 24));

                    if (daysLeft > 0) {
                        expiryStatus = `✅ Active (${daysLeft} days left)`;
                        expiryColor = daysLeft > 7 ? '#28a745' : '#ffc107';
                        statusBadge = 'Active';
                        statusBadgeColor = '#28a745';
                    } else {
                        expiryStatus = '❌ Expired';
                        expiryColor = '#dc3545';
                        statusBadge = 'Expired';
                        statusBadgeColor = '#dc3545';
                    }
                } else if (subscriptionInfo.status === 'Active') {
                    expiryStatus = '✅ Active';
                    expiryColor = '#28a745';
                    statusBadge = 'Active';
                    statusBadgeColor = '#28a745';
                }

                const expiryDateStr = subscriptionInfo.expiryDate
                    ? subscriptionInfo.expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'Not Available';

                const createdDateStr = subscriptionInfo.createdAt
                    ? subscriptionInfo.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : 'N/A';

                return res.status(200).send(`
                    <!DOCTYPE html>
                    <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Xtream Playlist Proxy - Professional IPTV Solution</title>
                            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                            <style>
                                * { margin: 0; padding: 0; box-sizing: border-box; }
                                
                                body {
                                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                    min-height: 100vh;
                                    padding: 20px;
                                    line-height: 1.6;
                                }

                                .dashboard {
                                    max-width: 1200px;
                                    margin: 0 auto;
                                }

                                .header {
                                    text-align: center;
                                    color: white;
                                    margin-bottom: 40px;
                                    animation: fadeInDown 0.6s ease-out;
                                }

                                .header h1 {
                                    font-size: 3em;
                                    font-weight: 700;
                                    margin-bottom: 10px;
                                    text-shadow: 0 2px 10px rgba(0,0,0,0.2);
                                }

                                .header p {
                                    font-size: 1.2em;
                                    opacity: 0.95;
                                    font-weight: 300;
                                }

                                .grid {
                                    display: grid;
                                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                                    gap: 20px;
                                    margin-bottom: 20px;
                                }

                                .card {
                                    background: white;
                                    border-radius: 16px;
                                    padding: 30px;
                                    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                                    animation: fadeInUp 0.6s ease-out;
                                }

                                .card:hover {
                                    transform: translateY(-5px);
                                    box-shadow: 0 15px 50px rgba(0,0,0,0.15);
                                }

                                .card-header {
                                    display: flex;
                                    align-items: center;
                                    justify-content: space-between;
                                    margin-bottom: 20px;
                                    padding-bottom: 15px;
                                    border-bottom: 2px solid #f0f0f0;
                                }

                                .card-title {
                                    font-size: 1.3em;
                                    font-weight: 600;
                                    color: #333;
                                    display: flex;
                                    align-items: center;
                                    gap: 10px;
                                }

                                .status-badge {
                                    display: inline-block;
                                    padding: 6px 16px;
                                    border-radius: 20px;
                                    font-size: 0.85em;
                                    font-weight: 600;
                                    color: white;
                                    background: ${statusBadgeColor};
                                }

                                .subscription-card {
                                    background: linear-gradient(135deg, ${expiryColor}15 0%, ${expiryColor}25 100%);
                                    border-left: 5px solid ${expiryColor};
                                }

                                .stat-row {
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    padding: 15px 0;
                                    border-bottom: 1px solid #f0f0f0;
                                }

                                .stat-row:last-child {
                                    border-bottom: none;
                                }

                                .stat-label {
                                    color: #666;
                                    font-weight: 500;
                                    font-size: 0.95em;
                                }

                                .stat-value {
                                    color: #333;
                                    font-weight: 600;
                                    font-size: 1.1em;
                                }

                                .expiry-display {
                                    text-align: center;
                                    padding: 25px;
                                    background: white;
                                    border-radius: 12px;
                                    margin: 20px 0;
                                }

                                .expiry-date {
                                    font-size: 2em;
                                    font-weight: 700;
                                    color: ${expiryColor};
                                    margin: 10px 0;
                                }

                                .expiry-countdown {
                                    font-size: 1.3em;
                                    color: #666;
                                    margin-top: 10px;
                                }

                                .endpoint-list {
                                    list-style: none;
                                }

                                .endpoint-item {
                                    background: #f8f9fa;
                                    padding: 20px;
                                    margin: 15px 0;
                                    border-radius: 10px;
                                    border-left: 4px solid #667eea;
                                    transition: all 0.3s ease;
                                }

                                .endpoint-item:hover {
                                    background: #e9ecef;
                                    transform: translateX(5px);
                                }

                                .endpoint-label {
                                    font-weight: 600;
                                    color: #667eea;
                                    margin-bottom: 8px;
                                    font-size: 1.1em;
                                }

                                .endpoint-url {
                                    color: #495057;
                                    font-family: 'Courier New', monospace;
                                    word-break: break-all;
                                }

                                .endpoint-url a {
                                    color: #764ba2;
                                    text-decoration: none;
                                    font-weight: 500;
                                }

                                .endpoint-url a:hover {
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
                                    box-shadow: inset 0 2px 10px rgba(0,0,0,0.3);
                                }

                                .feature-grid {
                                    display: grid;
                                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                                    gap: 15px;
                                    margin: 20px 0;
                                }

                                .feature-item {
                                    text-align: center;
                                    padding: 20px;
                                    background: linear-gradient(135deg, #667eea15 0%, #764ba225 100%);
                                    border-radius: 12px;
                                    transition: all 0.3s ease;
                                }

                                .feature-item:hover {
                                    transform: scale(1.05);
                                    background: linear-gradient(135deg, #667eea25 0%, #764ba235 100%);
                                }

                                .feature-icon {
                                    font-size: 2.5em;
                                    margin-bottom: 10px;
                                }

                                .feature-label {
                                    font-weight: 600;
                                    color: #333;
                                    font-size: 0.9em;
                                }

                                .connection-indicator {
                                    display: inline-flex;
                                    align-items: center;
                                    gap: 8px;
                                    padding: 8px 16px;
                                    background: #d4edda;
                                    color: #155724;
                                    border-radius: 20px;
                                    font-weight: 600;
                                    font-size: 0.9em;
                                }

                                .pulse {
                                    width: 10px;
                                    height: 10px;
                                    background: #28a745;
                                    border-radius: 50%;
                                    animation: pulse 2s infinite;
                                }

                                @keyframes pulse {
                                    0%, 100% { opacity: 1; }
                                    50% { opacity: 0.5; }
                                }

                                @keyframes fadeInDown {
                                    from {
                                        opacity: 0;
                                        transform: translateY(-20px);
                                    }
                                    to {
                                        opacity: 1;
                                        transform: translateY(0);
                                    }
                                }

                                @keyframes fadeInUp {
                                    from {
                                        opacity: 0;
                                        transform: translateY(20px);
                                    }
                                    to {
                                        opacity: 1;
                                        transform: translateY(0);
                                    }
                                }

                                @media (max-width: 768px) {
                                    .header h1 { font-size: 2em; }
                                    .grid { grid-template-columns: 1fr; }
                                    .feature-grid { grid-template-columns: repeat(2, 1fr); }
                                }
                            </style>
                        </head>
                        <body>
                            <div class="dashboard">
                                <div class="header">
                                    <h1>🎬 Xtream Playlist Proxy</h1>
                                    <p>Professional IPTV Solution with Advanced Device Bypass</p>
                                </div>

                                <div class="grid">
                                    <!-- Subscription Card -->
                                    <div class="card subscription-card">
                                        <div class="card-header">
                                            <div class="card-title">
                                                📅 Subscription Status
                                            </div>
                                            <span class="status-badge">${statusBadge}</span>
                                        </div>
                                        <div class="expiry-display">
                                            <div style="color: #666; font-size: 0.9em; margin-bottom: 5px;">Expires On</div>
                                            <div class="expiry-date">${expiryDateStr}</div>
                                            <div class="expiry-countdown">${expiryStatus}</div>
                                        </div>
                                        <div class="stat-row">
                                            <span class="stat-label">Account Created</span>
                                            <span class="stat-value">${createdDateStr}</span>
                                        </div>
                                        <div class="stat-row">
                                            <span class="stat-label">Max Connections</span>
                                            <span class="stat-value">${subscriptionInfo.maxConnections}</span>
                                        </div>
                                        <div class="stat-row">
                                            <span class="stat-label">Active Connections</span>
                                            <span class="stat-value">${subscriptionInfo.activeConnections} / ${subscriptionInfo.maxConnections}</span>
                                        </div>
                                    </div>

                                    <!-- Server Info Card -->
                                    <div class="card">
                                        <div class="card-header">
                                            <div class="card-title">🖥️ Server Information</div>
                                            <div class="connection-indicator">
                                                <div class="pulse"></div>
                                                Online
                                            </div>
                                        </div>
                                        <div class="stat-row">
                                            <span class="stat-label">Upstream Server</span>
                                            <span class="stat-value">vipkendrake.top:8080</span>
                                        </div>
                                        <div class="stat-row">
                                            <span class="stat-label">Platform</span>
                                            <span class="stat-value">Vercel Serverless</span>
                                        </div>
                                        <div class="stat-row">
                                            <span class="stat-label">CDN</span>
                                            <span class="stat-value">Global Edge Network</span>
                                        </div>
                                        <div class="stat-row">
                                            <span class="stat-label">Device Profiles</span>
                                            <span class="stat-value">8 Rotating</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Endpoints Card -->
                                <div class="card">
                                    <div class="card-header">
                                        <div class="card-title">🔗 API Endpoints</div>
                                    </div>
                                    <ul class="endpoint-list">
                                        <li class="endpoint-item">
                                            <div class="endpoint-label">📺 M3U Playlist</div>
                                            <div class="endpoint-url"><a href="/api/playlist">/api/playlist</a></div>
                                        </li>
                                        <li class="endpoint-item">
                                            <div class="endpoint-label">🎥 Stream Proxy</div>
                                            <div class="endpoint-url">/api/stream/{id}/{type}.m3u8</div>
                                        </li>
                                    </ul>
                                    <div style="margin-top: 20px;">
                                        <div style="color: #666; font-weight: 600; margin-bottom: 10px;">📱 Add to IPTV Player:</div>
                                        <div class="code-box">https://${req.headers.host}/api/playlist</div>
                                    </div>
                                </div>

                                <!-- Features Card -->
                                <div class="card">
                                    <div class="card-header">
                                        <div class="card-title">✨ Features & Capabilities</div>
                                    </div>
                                    <div class="feature-grid">
                                        <div class="feature-item">
                                            <div class="feature-icon">🛡️</div>
                                            <div class="feature-label">Device Bypass</div>
                                        </div>
                                        <div class="feature-item">
                                            <div class="feature-icon">🔄</div>
                                            <div class="feature-label">User-Agent Rotation</div>
                                        </div>
                                        <div class="feature-item">
                                            <div class="feature-icon">⚡</div>
                                            <div class="feature-label">Fast Streaming</div>
                                        </div>
                                        <div class="feature-item">
                                            <div class="feature-icon">🌍</div>
                                            <div class="feature-label">Global CDN</div>
                                        </div>
                                        <div class="feature-item">
                                            <div class="feature-icon">🔒</div>
                                            <div class="feature-label">Secure Proxy</div>
                                        </div>
                                        <div class="feature-item">
                                            <div class="feature-icon">📊</div>
                                            <div class="feature-label">Real-time Stats</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </body>
                    </html>
                `);
            } catch (error) {
                console.error('Homepage error:', error);
                return res.status(500).send('Error loading dashboard');
            }
        }

        return res.status(404).send('Not Found');
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send(`Error: ${error.message}`);
    }
};
