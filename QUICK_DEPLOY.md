# Quick Deployment Commands

## Cloudflare Workers

```bash
# 1. Install Wrangler globally
npm install -g wrangler

# 2. Login to Cloudflare
wrangler login

# 3. Deploy
npm run deploy
# or
wrangler deploy

# 4. View logs (optional)
wrangler tail

# Your URL: https://xtream-playlist-proxy.YOUR-SUBDOMAIN.workers.dev/api/playlist
```

## Vercel

```bash
# 1. Install Vercel CLI globally
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy (preview)
vercel

# 4. Deploy to production
vercel --prod

# Your URL: https://xtream-playlist-proxy.vercel.app/api/playlist
```

## Environment Variables (Recommended for Production)

### Cloudflare Workers
```bash
wrangler secret put XTREAM_BASE_URL
wrangler secret put USERNAME
wrangler secret put PASSWORD
```

Then update `worker.js` to use environment variables:
```javascript
const config = {
    XTREAM_BASE_URL: env.XTREAM_BASE_URL,
    USERNAME: env.USERNAME,
    PASSWORD: env.PASSWORD,
    // ...
};
```

### Vercel
```bash
vercel env add XTREAM_BASE_URL
vercel env add USERNAME
vercel env add PASSWORD
```

Then update `config.js` to use environment variables:
```javascript
module.exports = {
    XTREAM_BASE_URL: process.env.XTREAM_BASE_URL || 'http://default.com',
    USERNAME: process.env.USERNAME || 'default',
    PASSWORD: process.env.PASSWORD || 'default',
    // ...
};
```

## Testing Your Deployment

### Test Playlist
```bash
# Cloudflare
curl https://xtream-playlist-proxy.YOUR-SUBDOMAIN.workers.dev/api/playlist

# Vercel
curl https://xtream-playlist-proxy.vercel.app/api/playlist
```

### Test in VLC
1. Open VLC Media Player
2. Media → Open Network Stream
3. Enter your deployment URL
4. Click Play

## Troubleshooting

### Cloudflare Workers
- **View logs:** `wrangler tail`
- **Dashboard:** https://dash.cloudflare.com/
- **Docs:** https://developers.cloudflare.com/workers/

### Vercel
- **View logs:** `vercel logs`
- **Dashboard:** https://vercel.com/dashboard
- **Docs:** https://vercel.com/docs

## Which Platform to Choose?

| Feature | Cloudflare Workers | Vercel |
|---------|-------------------|--------|
| **Free Tier** | 100,000 requests/day | 100 GB bandwidth/month |
| **Global CDN** | ✅ 300+ locations | ✅ Edge Network |
| **Cold Start** | ~0ms | ~100-300ms |
| **Best For** | High traffic, low latency | Easy deployment, Node.js |
| **Pricing** | $5/month for unlimited | $20/month Pro |

**Recommendation:** 
- Use **Cloudflare Workers** for production (faster, more reliable)
- Use **Vercel** for quick testing and development
