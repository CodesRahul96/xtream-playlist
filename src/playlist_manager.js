const axios = require('axios');
const config = require('../config');
const readline = require('readline');
const { PassThrough } = require('stream');

async function fetchAndRewritePlaylist(reqHost) {
    const { url, username, password } = config.upstream;
    const upstreamUrl = `${url}/get.php?username=${username}&password=${password}&type=m3u_plus`;

    try {
        const response = await axios({
            method: 'get',
            url: upstreamUrl,
            responseType: 'stream'
        });

        const rl = readline.createInterface({
            input: response.data,
            crlfDelay: Infinity
        });

        const passThrough = new PassThrough();

        rl.on('line', (line) => {
            if (line.startsWith('http') && line.includes(username) && line.includes(password)) {
                 // Replace upstream URL with proxy URL
                 // Pattern: http://host:port/username/password/streamID.ts
                 // We want: http://reqHost/stream/streamID.ts
                 const parts = line.split('/');
                 const idWithExt = parts[parts.length - 1]; // e.g. 12345.ts
                 passThrough.write(`http://${reqHost}/stream/${idWithExt}\n`);
            } else {
                passThrough.write(line + '\n');
            }
        });

        rl.on('close', () => {
            passThrough.end();
        });

        rl.on('error', (err) => {
             console.error('Stream Error:', err);
             passThrough.end();
        });

        return passThrough;

    } catch (error) {
        console.error('Error fetching playlist:', error.message);
        throw error;
    }
}

module.exports = { fetchAndRewritePlaylist };
