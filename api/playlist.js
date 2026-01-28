const axios = require('axios');
const config = require('../config');
const { XTREAM_BASE_URL, USERNAME, PASSWORD, SPOOF_HEADERS } = config;

module.exports = async (req, res) => {
    // Determine base URL for rewriting streams
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    // Set headers for streaming response
    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.setHeader('Content-Disposition', 'attachment; filename="playlist.m3u"');

    try {
        console.log('[Stream] Starting playlist fetch...');

        // Fetch upstream M3U as a stream
        const response = await axios({
            method: 'get',
            url: `${XTREAM_BASE_URL}/get.php`,
            params: {
                username: USERNAME,
                password: PASSWORD,
                type: 'm3u_plus',
                output: 'ts'
            },
            headers: config.getRandomHeaders(),
            responseType: 'stream',
            timeout: 60000 // 60s timeout
        });

        // Create a transform logic using a line reader
        const stream = response.data;
        let buffer = '';

        stream.on('data', (chunk) => {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            // Keep the last partial line in the buffer
            buffer = lines.pop();

            let outputChunk = '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                if (trimmed.startsWith('#EXTINF')) {
                    outputChunk += trimmed + '\n';
                }
                else if (trimmed.startsWith('http')) {
                    // This is a stream URL, rewrite it
                    try {
                        // Extract ID and Extension from URL
                        // Format: http://server:port/live/user/pass/1234.ts
                        const parts = trimmed.split('/');
                        const filename = parts[parts.length - 1];

                        // Parse ID (remove extension)
                        const lastDotIndex = filename.lastIndexOf('.');
                        let id = filename;
                        let type = 'live';
                        let ext = 'ts';

                        if (lastDotIndex !== -1) {
                            id = filename.substring(0, lastDotIndex);
                            ext = filename.substring(lastDotIndex + 1).toLowerCase();
                        }

                        // Determine type based on extension or path
                        if (['mp4', 'mkv', 'avi'].includes(ext) || trimmed.includes('/movie/')) {
                            type = 'movie';
                        } else if (trimmed.includes('/series/')) {
                            type = 'series';
                        }

                        // Construct local proxy URL
                        outputChunk += `${baseUrl}/api/stream/${id}/${type}.m3u8\n`;
                    } catch (e) {
                        // Fallback: keep original if parsing fails
                        outputChunk += trimmed + '\n';
                    }
                }
                else {
                    // Pass through other lines (like #EXTM3U)
                    outputChunk += line + '\n';
                }
            }

            // Write the processed chunk to client
            res.write(outputChunk);
        });

        stream.on('end', () => {
            // Process any remaining buffer
            if (buffer.trim()) {
                res.write(buffer);
            }
            res.end();
            console.log('[Stream] Playlist finished.');
        });

        stream.on('error', (err) => {
            console.error('[Stream] Data stream error:', err.message);
            if (!res.headersSent) res.status(502).send('Upstream stream error');
            else res.end();
        });

    } catch (error) {
        console.error('[Playlist] Fetch error:', error.message);
        if (!res.headersSent) {
            res.status(502).send(`Error fetching playlist: ${error.message}`);
        } else {
            res.end();
        }
    }
};
