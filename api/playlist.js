const axios = require('axios');
const config = require('../config');

const { XTREAM_BASE_URL, USERNAME, PASSWORD, SPOOF_HEADERS, PLAYLIST_TIMEOUT } = config;

module.exports = async (req, res) => {
    console.log('[Playlist] Request received');
    try {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const baseUrl = `${protocol}://${host}`;

        let m3uContent = '';
        let usingM3uFallback = false;
        let liveStreams = [];

        // 1. Try /get.php (M3U Export)
        try {
            console.log('[Playlist] Attempting fetch via get.php...');
            const m3uResponse = await axios.get(`${XTREAM_BASE_URL}/get.php`, {
                params: {
                    username: USERNAME,
                    password: PASSWORD,
                    type: 'm3u_plus',
                    output: 'ts'
                },
                headers: { ...SPOOF_HEADERS },
                timeout: PLAYLIST_TIMEOUT
            });

            if (typeof m3uResponse.data === 'string' && m3uResponse.data.startsWith('#EXTM3U')) {
                m3uContent = m3uResponse.data;
                usingM3uFallback = true;
                console.log('[Playlist] Successfully retrieved M3U via get.php');
            }
        } catch (m3uError) {
            console.log('[Playlist] get.php failed:', m3uError.message);
        }

        // 2. Fallback to /player_api.php (JSON API)
        if (!usingM3uFallback) {
            console.log('[Playlist] Falling back to player_api.php...');
            try {
                const liveResponse = await axios.get(`${XTREAM_BASE_URL}/player_api.php`, {
                    params: {
                        username: USERNAME,
                        password: PASSWORD,
                        action: 'get_live_streams'
                    },
                    headers: { ...SPOOF_HEADERS },
                    timeout: PLAYLIST_TIMEOUT
                });

                if (Array.isArray(liveResponse.data)) {
                    liveStreams = liveResponse.data;
                    console.log(`[Playlist] Retrieved ${liveStreams.length} streams from API`);
                }
            } catch (apiError) {
                console.log('[Playlist] player_api.php failed:', apiError.message);
            }
        }

        let m3u = '#EXTM3U\n';

        if (usingM3uFallback) {
            console.log('[Playlist] Parsing and rewriting M3U content...');
            const lines = m3uContent.split('\n');

            for (let i = 0; i < lines.length; i++) {
                let line = lines[i].trim();
                if (!line) continue;

                if (line.startsWith('#EXTINF')) {
                    m3u += line + '\n';
                } else if (line.startsWith('http')) {
                    try {
                        const urlParts = line.split('/');
                        const filename = urlParts[urlParts.length - 1];
                        const dotIndex = filename.lastIndexOf('.');

                        let id = filename;
                        let type = 'live';

                        if (dotIndex !== -1) {
                            id = filename.substring(0, dotIndex);
                            const ext = filename.substring(dotIndex + 1).toLowerCase();
                            if (['mp4', 'mkv', 'avi'].includes(ext)) type = 'movie';
                        }

                        if (line.includes('/movie/')) type = 'movie';
                        if (line.includes('/series/')) type = 'series';

                        m3u += `${baseUrl}/api/stream/${id}/${type}.m3u8\n`;
                    } catch (e) {
                        m3u += line + '\n';
                    }
                }
            }
        } else if (Array.isArray(liveStreams) && liveStreams.length > 0) {
            console.log(`[Playlist] Generating M3U from ${liveStreams.length} API items...`);
            liveStreams.forEach(stream => {
                const type = (stream.stream_type || 'live').toLowerCase();
                const streamUrl = `${baseUrl}/api/stream/${stream.stream_id}/${type}.m3u8`;

                m3u += `#EXTINF:-1 tvg-id="${stream.epg_channel_id || ''}" tvg-name="${stream.name}" tvg-logo="${stream.stream_icon || ''}" group-title="${stream.category_name || 'General'}",${stream.name}\n`;
                m3u += `${streamUrl}\n`;
            });
        } else {
            m3u += `#EXTINF:-1,No streams found\n`;
            m3u += `#REM Check your credentials in config.js\n`;
        }

        // Check if user requested redirect mode
        if (req.query.mode === 'redirect') {
            m3u = m3u.replace(/\/stream\/([^\/\n]+)\/([^\/\n\s]+)/g, '/stream/$1/$2?mode=redirect');
        }

        res.setHeader('Content-Type', 'audio/x-mpegurl');
        res.setHeader('Content-Disposition', 'attachment; filename="playlist.m3u"');
        res.status(200).send(m3u);

    } catch (error) {
        console.error('[Playlist] Error:', error.message);
        res.status(500).send('Error generating playlist');
    }
};
