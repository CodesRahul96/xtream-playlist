const axios = require('axios');
const config = require('../config');
const { PassThrough } = require('stream');

class StreamManager {
    constructor() {
        this.activeStreams = new Map();
    }

    async handleStreamRequest(req, res, rawStreamId) {
        // Normalize ID: remove .ts extension
        const streamId = rawStreamId.replace(/\.ts$/, '');

        // Extract Client IP (support proxies like Cloudflare/Nginx)
        const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // 1. Check if stream is already active
        if (this.activeStreams.has(streamId)) {
            console.log(`[EXISTING] Client (${clientIP}) joined stream ${streamId}`);
            this.subscribeToStream(streamId, res);
            return;
        }

        // 2. If not, start new stream
        console.log(`[NEW] Starting upstream connection for ${streamId} (Msg IP: ${clientIP})`);
        try {
            await this.startUpstreamConnection(streamId, clientIP);
            this.subscribeToStream(streamId, res);
        } catch (error) {
            console.error(`[ERROR] Failed to start stream ${streamId}:`, error.message);
            res.status(500).send('Stream unavailable');
        }
    }

    async startUpstreamConnection(streamId, clientIP) {
        const { url, username, password } = config.upstream;
        // streamId is already normalized
        const streamUrl = `${url}/${username}/${password}/${streamId}`;

        try {
            const headers = {
                'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18', // Spoof User-Agent as well for better compatibility
                'X-Forwarded-For': clientIP,
                'X-Real-IP': clientIP
            };

            const response = await axios({
                method: 'get',
                url: streamUrl,
                responseType: 'stream',
                headers: headers
            });

            // Create a broadcast stream (PassThrough)
            const broadcaster = new PassThrough();
            
            // Pipe upstream data to broadcaster
            response.data.pipe(broadcaster);

            // Handle upstream errors/close
            response.data.on('error', (err) => {
                console.error(`[UPSTREAM ERROR] ${streamId}:`, err.message);
                this.cleanupStream(streamId);
            });
            
            response.data.on('end', () => {
                console.log(`[UPSTREAM END] ${streamId}`);
                this.cleanupStream(streamId);
            });

            const streamData = {
                broadcaster,
                upstreamResponse: response,
                clients: new Set(),
                lastActivity: Date.now()
            };

            this.activeStreams.set(streamId, streamData);

        } catch (error) {
            throw error;
        }
    }

    subscribeToStream(streamId, clientRes) {
        const streamData = this.activeStreams.get(streamId);
        if (!streamData) return;

        // Add client to set
        streamData.clients.add(clientRes);
        
        // Set headers
        clientRes.setHeader('Content-Type', 'video/mp2t');
        clientRes.setHeader('Connection', 'keep-alive');

        // Pipe broadcaster to client
        streamData.broadcaster.pipe(clientRes);

        // Handle client disconnect
        clientRes.on('close', () => {
            console.log(`[CLIENT DISCONNECT] Stream ${streamId}`);
            streamData.clients.delete(clientRes);
            
            // If no clients left, cleanup after a short delay (debouncing)
            if (streamData.clients.size === 0) {
                setTimeout(() => {
                    if (this.activeStreams.has(streamId) && this.activeStreams.get(streamId).clients.size === 0) {
                         this.cleanupStream(streamId);
                    }
                }, 5000); // 5 seconds wait before closing upstream
            }
        });
    }

    cleanupStream(streamId) {
        if (this.activeStreams.has(streamId)) {
            console.log(`[CLEANUP] Closing upstream for ${streamId}`);
            const streamData = this.activeStreams.get(streamId);
            
            // Destroy upstream connection
            if (streamData.upstreamResponse) {
                streamData.upstreamResponse.data.destroy();
            }
            
            // End broadcaster to close all clients
            streamData.broadcaster.end();
            
            this.activeStreams.delete(streamId);
        }
    }
}

module.exports = new StreamManager();
