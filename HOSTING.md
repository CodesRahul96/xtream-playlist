# 🚀 Complete Hosting Guide for XtreamPlaylist

## Overview

This guide will walk you through hosting your XtreamPlaylist proxy on **Cloudflare Workers** and **Vercel**. Both platforms offer free tiers perfect for IPTV proxying.

---

## 🌐 Option 1: Cloudflare Workers (Recommended)

### Why Cloudflare Workers?
- ⚡ **Ultra-fast**: ~0ms cold start
- 🌍 **Global**: 300+ edge locations worldwide
- 💰 **Free tier**: 100,000 requests/day
- 🔒 **Reliable**: 99.99% uptime
- **Best for**: Production use, high traffic

### Step-by-Step Deployment

#### 1. Install Wrangler CLI
```bash
npm install -g wrangler
```

#### 2. Login to Cloudflare
```bash
wrangler login
```
This opens your browser for authentication. Sign in with your Cloudflare account (create one if needed at https://dash.cloudflare.com/sign-up).

#### 3. Update Credentials (Important!)
Edit `worker.js` and update the config object:
```javascript
const config = {
    XTREAM_BASE_URL: 'http://your-provider.com:8080',
    USERNAME: 'your_username',
    PASSWORD: 'your_password',
    // ... rest stays the same
};
```

#### 4. Deploy
```bash
npm run deploy
```
Or:
```bash
wrangler deploy
```

#### 5. Get Your Playlist URL
After deployment, you'll see:
```
Published xtream-playlist-proxy
  https://xtream-playlist-proxy.YOUR-SUBDOMAIN.workers.dev
```

Your playlist URL:
```
https://xtream-playlist-proxy.YOUR-SUBDOMAIN.workers.dev/api/playlist
```

#### 6. Test Your Deployment
```bash
curl https://xtream-playlist-proxy.YOUR-SUBDOMAIN.workers.dev/api/playlist | head -20
```

### Cloudflare Workers - Advanced Setup

#### Using Environment Variables (Recommended)
```bash
# Set secrets
wrangler secret put XTREAM_BASE_URL
wrangler secret put USERNAME
wrangler secret put PASSWORD
```

Then update `worker.js`:
```javascript
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request, event.env));
});

async function handleRequest(request, env) {
    const config = {
        XTREAM_BASE_URL: env.XTREAM_BASE_URL,
        USERNAME: env.USERNAME,
        PASSWORD: env.PASSWORD,
        // ... rest of config
    };
    // ... rest of code
}
```

#### View Logs
```bash
wrangler tail
```

#### Custom Domain (Optional)
1. Go to https://dash.cloudflare.com/
2. Select your worker
3. Click "Triggers" → "Custom Domains"
4. Add your domain

---

## ▲ Option 2: Vercel (Easiest Setup)

### Why Vercel?
- 🚀 **Easy**: One-command deployment
- 🔄 **Auto-scaling**: Serverless functions
- 💰 **Free tier**: 100 GB bandwidth/month
- 🔗 **Git integration**: Auto-deploy on push
- **Best for**: Quick testing, development

### Step-by-Step Deployment

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Login to Vercel
```bash
vercel login
```
Choose your login method (GitHub, GitLab, Bitbucket, or Email).

#### 3. Deploy (First Time)
```bash
vercel
```

You'll be asked:
```
? Set up and deploy "d:\Projects\XtreamPlaylist"? [Y/n] Y
? Which scope do you want to deploy to? Your Account
? Link to existing project? [y/N] N
? What's your project's name? xtream-playlist-proxy
? In which directory is your code located? ./
? Want to override the settings? [y/N] N
```

#### 4. Deploy to Production
```bash
vercel --prod
```

#### 5. Get Your Playlist URL
After deployment:
```
✅ Production: https://xtream-playlist-proxy.vercel.app
```

Your playlist URL:
```
https://xtream-playlist-proxy.vercel.app/api/playlist
```

#### 6. Test Your Deployment
```bash
curl https://xtream-playlist-proxy.vercel.app/api/playlist | head -20
```

### Vercel - Advanced Setup

#### Using Environment Variables (Recommended)
```bash
# Add environment variables
vercel env add XTREAM_BASE_URL
vercel env add USERNAME
vercel env add PASSWORD
```

For each variable, choose:
- Environment: **Production, Preview, Development**
- Value: Enter your actual value

Then update `config.js`:
```javascript
module.exports = {
    XTREAM_BASE_URL: process.env.XTREAM_BASE_URL || 'http://live.fuxxion.club:8080',
    USERNAME: process.env.USERNAME || 'mottamartin1',
    PASSWORD: process.env.PASSWORD || 'iiQ7uuhbWA',
    // ... rest stays the same
};
```

Redeploy:
```bash
vercel --prod
```

#### View Logs
```bash
vercel logs
```

#### Custom Domain (Optional)
```bash
vercel domains add yourdomain.com
```

#### Auto-Deploy from GitHub
1. Go to https://vercel.com/dashboard
2. Click "Import Project"
3. Connect your GitHub repository
4. Every push to `main` will auto-deploy!

---

## 🎯 Quick Comparison

| Feature | Cloudflare Workers | Vercel |
|---------|-------------------|--------|
| **Setup Time** | 5 minutes | 3 minutes |
| **Cold Start** | ~0ms | ~100-300ms |
| **Free Requests** | 100,000/day | Unlimited |
| **Free Bandwidth** | Unlimited | 100 GB/month |
| **Global CDN** | 300+ locations | Edge Network |
| **Best For** | Production | Testing/Dev |
| **Deploy Command** | `wrangler deploy` | `vercel --prod` |

---

## 📱 Testing Your Deployment

### Method 1: Browser
Open your playlist URL in a browser:
- Cloudflare: `https://xtream-playlist-proxy.YOUR-SUBDOMAIN.workers.dev/api/playlist`
- Vercel: `https://xtream-playlist-proxy.vercel.app/api/playlist`

You should see M3U playlist content starting with `#EXTM3U`.

### Method 2: VLC Media Player
1. Open VLC
2. **Media** → **Open Network Stream**
3. Paste your playlist URL
4. Click **Play**

### Method 3: IPTV Apps (TiviMate, etc.)
1. Open your IPTV app
2. Add new playlist
3. Enter your playlist URL
4. Save and enjoy!

### Method 4: Command Line
```bash
# Test playlist
curl YOUR_DEPLOYMENT_URL/api/playlist | head -20

# Test stream (replace with actual stream ID)
curl -I YOUR_DEPLOYMENT_URL/api/stream/12345/live.m3u8
```

---

## 🔐 Security Best Practices

### 1. Remove Credentials from Git
```bash
# Backup your config
cp config.js config.local.js

# Create example config
cat > config.example.js << 'EOF'
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
EOF

# Add to .gitignore
echo "config.js" >> .gitignore
echo "config.local.js" >> .gitignore

# Commit changes
git add .gitignore config.example.js
git commit -m "Add config example and ignore real config"
git push
```

### 2. Use Environment Variables
Always use environment variables for production deployments (see Advanced Setup sections above).

---

## 🆘 Troubleshooting

### Cloudflare Workers

**Issue: "Error: Not authenticated"**
```bash
wrangler logout
wrangler login
```

**Issue: "Error: No such command 'deploy'"**
```bash
npm install -g wrangler@latest
```

**Issue: Streams not working**
```bash
# View live logs
wrangler tail

# Check for errors in the output
```

### Vercel

**Issue: "Error: No token found"**
```bash
vercel logout
vercel login
```

**Issue: "Error: Build failed"**
```bash
# Check logs
vercel logs

# Force redeploy
vercel --prod --force
```

**Issue: Function timeout**
Edit `vercel.json`:
```json
{
  "functions": {
    "api/index.js": {
      "maxDuration": 60
    }
  }
}
```

---

## 🎉 You're Live!

Once deployed, share your playlist URL with any IPTV player:
```
Cloudflare: https://xtream-playlist-proxy.YOUR-SUBDOMAIN.workers.dev/api/playlist
Vercel: https://xtream-playlist-proxy.vercel.app/api/playlist
```

**Enjoy your globally distributed IPTV proxy!** 🚀
