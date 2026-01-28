# Deployment Guide

## Cloudflare Workers Deployment

### Prerequisites
- Cloudflare account (free tier works)
- Wrangler CLI installed

### Step 1: Install Wrangler
```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare
```bash
wrangler login
```
This will open a browser window for authentication.

### Step 3: Update Credentials in worker.js
Edit `worker.js` and update the config object with your credentials:
```javascript
const config = {
    XTREAM_BASE_URL: 'http://your-provider.com:8080',
    USERNAME: 'your_username',
    PASSWORD: 'your_password',
    // ... rest of config
};
```

### Step 4: Deploy
```bash
npm run deploy
# or
wrangler deploy
```

### Step 5: Access Your Playlist
Your playlist will be available at:
```
https://xtream-playlist-proxy.your-subdomain.workers.dev/api/playlist
```

---

## Vercel Deployment

### Prerequisites
- Vercel account (free tier works)
- Vercel CLI installed

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Create vercel.json Configuration
This file tells Vercel how to route your API endpoints.

### Step 3: Login to Vercel
```bash
vercel login
```

### Step 4: Deploy
```bash
vercel
```
Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? **xtream-playlist-proxy**
- Directory? **./** (press Enter)
- Override settings? **N**

### Step 5: Production Deployment
```bash
vercel --prod
```

### Step 6: Access Your Playlist
Your playlist will be available at:
```
https://xtream-playlist-proxy.vercel.app/api/playlist
```

---

## Important Notes

### Security Considerations
⚠️ **Never commit credentials to Git!**

For production deployments, use environment variables:

**Cloudflare Workers:**
```bash
wrangler secret put XTREAM_BASE_URL
wrangler secret put USERNAME
wrangler secret put PASSWORD
```

**Vercel:**
```bash
vercel env add XTREAM_BASE_URL
vercel env add USERNAME
vercel env add PASSWORD
```

### Performance Tips
- **Cloudflare Workers**: Best for global CDN distribution, edge computing
- **Vercel**: Best for serverless functions with automatic scaling

### Troubleshooting

**Cloudflare Workers:**
- Check logs: `wrangler tail`
- View dashboard: https://dash.cloudflare.com/

**Vercel:**
- Check logs: `vercel logs`
- View dashboard: https://vercel.com/dashboard
