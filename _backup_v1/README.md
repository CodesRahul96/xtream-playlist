# Xtream Playlist Proxy

A robust Node.js-based proxy for Xtream Codes IPTV services. This application fetches playlists from an upstream provider, reformats them into a standard M3U playlist, and proxies the stream traffic through your server to handle device restrictions, improve headers, and fix buffering.

## Features

- **Playlist Generation**: Fetches channels via `get.php` (M3U Plus export) or `player_api.php`
- **Stream Proxying**: Rewrites all stream URLs to route through this proxy
- **Device Spoofing**: Masquerades requests using specific headers (User-Agent, Device-ID, etc.) to mimic legitimate IPTV boxes (e.g., TiviMate)
- **HLS Support**: Handles HLS playlists (.m3u8) and segments (.ts)
- **Buffering Optimization**: Uses persistent HTTP/HTTPS agents (keepAlive) for improved stability
- **Redirect Mode**: Optional direct streaming bypass
- **Cloudflare Workers**: Deploy to edge network for global CDN distribution

## Installation

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/CodesRahul96/XtreamPlaylist.git
   cd XtreamPlaylist
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure credentials:**
   Edit `config.js` and update your Xtream Codes credentials:
   ```javascript
   XTREAM_BASE_URL: 'http://your-provider.com:8080',
   USERNAME: 'your_username',
   PASSWORD: 'your_password'
   ```

4. **Run the server:**
   ```bash
   npm start
   ```
   The server will start on `http://localhost:3000`

5. **Access the Playlist:**
   Use `http://localhost:3000/api/playlist` in your IPTV Player (VLC, TiviMate, etc.)

## Deployment

### Quick Deploy

**Cloudflare Workers (Recommended for Production):**
```bash
npm install -g wrangler
wrangler login
npm run deploy
```
Your URL: `https://xtream-playlist-proxy.YOUR-SUBDOMAIN.workers.dev/api/playlist`

**Vercel (Easy Deployment):**
```bash
npm install -g vercel
vercel login
vercel --prod
```
Your URL: `https://xtream-playlist-proxy.vercel.app/api/playlist`

📖 **See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions**  
⚡ **See [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) for quick reference commands**

### Deployment (Cloudflare Workers)

1. **Install Wrangler:**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare:**
   ```bash
   wrangler login
   ```

3. **Update credentials in worker.js:**
   Edit the `config` object in `worker.js` with your credentials

4. **Deploy:**
   ```bash
   npm run deploy
   ```
   Your playlist URL will be: `https://xtream-playlist-proxy.your-subdomain.workers.dev/api/playlist`

## Configuration

The credentials and upstream URL are centralized in `config.js`:

```javascript
module.exports = {
    XTREAM_BASE_URL: 'http://your-provider.com:8080',
    USERNAME: 'your_username',
    PASSWORD: 'your_password',
    
    SPOOF_HEADERS: {
        'User-Agent': 'TiviMate/5.1.0 (Linux; Android 11; TV)',
        'X-Requested-With': 'ar.tvplayer.tv',
        'Accept': '*/*',
        'Connection': 'keep-alive'
    },
    
    STREAM_TIMEOUT: 30000,
    PLAYLIST_TIMEOUT: 15000
};
```

> **⚠️ IMPORTANT**  
> Be careful not to commit your private credentials to public repositories. Consider using environment variables for production deployments.

## API Endpoints

### `GET /api/playlist`
Generates and downloads the `playlist.m3u` file.

**Query Parameters:**
- `mode=redirect` - Generate playlist with direct stream URLs (bypass proxy)

**Example:**
```
http://localhost:3000/api/playlist
```

### `GET /api/stream/:id/:type`
Proxies the actual video stream.

**Parameters:**
- `:id` - Stream ID from the provider
- `:type` - Stream type: `live.m3u8`, `movie.m3u8`, or segment filename

**Query Parameters:**
- `mode=redirect` - Redirect to upstream URL instead of proxying

**Examples:**
```
http://localhost:3000/api/stream/12345/live.m3u8
http://localhost:3000/api/stream/67890/movie.m3u8
```

## How It Works

1. **Playlist Request**: Client requests `/api/playlist`
2. **Fetch Upstream**: Server fetches channel list from Xtream Codes API
3. **URL Rewriting**: All stream URLs are rewritten to point to `/api/stream/:id/:type`
4. **Stream Request**: When client plays a channel, it requests the rewritten URL
5. **Proxy Stream**: Server fetches the actual stream from upstream and pipes it to client
6. **Header Spoofing**: All upstream requests include spoofed device headers

## Usage Examples

### VLC Media Player
1. Open VLC
2. Go to **Media** → **Open Network Stream**
3. Enter: `http://localhost:3000/api/playlist`
4. Click **Play**

### TiviMate / IPTV Apps
1. Add new playlist
2. Enter URL: `http://localhost:3000/api/playlist`
3. Save and enjoy

### Direct Stream (Bypass Proxy)
Add `?mode=redirect` to use direct streaming:
```
http://localhost:3000/api/playlist?mode=redirect
```

## Troubleshooting

**No channels showing:**
- Check your credentials in `config.js`
- Verify the upstream server is accessible
- Check console logs for error messages

**Buffering issues:**
- Try redirect mode: `?mode=redirect`
- Increase `STREAM_TIMEOUT` in `config.js`
- Check your internet connection

**403/401 errors:**
- Update `SPOOF_HEADERS` to match your provider's requirements
- Verify your account is active

## Disclaimer

This project is for educational purposes only. Providing proxies for copyrighted content may be against the terms of service of your provider or local laws. Use responsibly.

## License

MIT License - See LICENSE file for details
