# 🚀 Deploy from GitHub to Vercel (Easiest Method!)

## ✅ Yes! You Can Import Directly from GitHub

This is the **recommended way** to deploy on Vercel. It enables:
- 🔄 **Auto-deployment** on every push
- 🔙 **Automatic rollbacks** if something breaks
- 📊 **Preview deployments** for pull requests
- 🎯 **Zero configuration** needed

---

## Step-by-Step: GitHub → Vercel

### 1. Go to Vercel Dashboard
Visit: https://vercel.com/new

### 2. Import Your Repository

**Option A: Direct Link**
Click this link (replace with your repo):
```
https://vercel.com/new/clone?repository-url=https://github.com/CodesRahul96/xtream-playlist
```

**Option B: Manual Import**
1. Click **"Add New..."** → **"Project"**
2. Click **"Import Git Repository"**
3. If not connected, click **"Connect GitHub Account"**
4. Search for: `CodesRahul96/xtream-playlist`
5. Click **"Import"**

### 3. Configure Project (Auto-detected!)

Vercel will automatically detect:
- ✅ Framework: Node.js
- ✅ Build Command: (none needed)
- ✅ Output Directory: (auto)
- ✅ Install Command: `npm install`

**Just click "Deploy"** - no changes needed!

### 4. Add Environment Variables (Important!)

Before clicking Deploy, expand **"Environment Variables"**:

| Key | Value | Environment |
|-----|-------|-------------|
| `XTREAM_BASE_URL` | `http://live.fuxxion.club:8080` | Production, Preview, Development |
| `USERNAME` | `mottamartin1` | Production, Preview, Development |
| `PASSWORD` | `iiQ7uuhbWA` | Production, Preview, Development |

> [!WARNING]
> If you skip this step, your credentials from `config.js` will be used (which is in Git).

### 5. Deploy!

Click **"Deploy"** button.

Wait 30-60 seconds for:
- ✅ Installing dependencies
- ✅ Building project
- ✅ Deploying to edge network

### 6. Get Your URL

You'll see:
```
🎉 Congratulations! Your project has been deployed.

Production: https://xtream-playlist-proxy.vercel.app
```

Your playlist URL:
```
https://xtream-playlist-proxy.vercel.app/api/playlist
```

---

## 🔄 Auto-Deployment Setup

Once imported, **every push to GitHub automatically deploys**:

```bash
# Make changes locally
git add .
git commit -m "Update configuration"
git push

# Vercel automatically:
# 1. Detects the push
# 2. Builds your project
# 3. Deploys to production
# 4. Sends you a notification
```

---

## 🎯 Quick Import Link

**Click here to deploy now:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/CodesRahul96/xtream-playlist)

Or visit:
```
https://vercel.com/new/clone?repository-url=https://github.com/CodesRahul96/xtream-playlist
```

---

## 📊 After Deployment

### View Your Deployment
- Dashboard: https://vercel.com/dashboard
- Project Settings: Click your project → Settings
- Deployments: See all versions and rollback if needed

### Test Your Playlist
```bash
curl https://xtream-playlist-proxy.vercel.app/api/playlist | head -20
```

### View Logs
```bash
vercel logs --prod
```

Or in dashboard: Project → Deployments → Click deployment → Logs

---

## 🔐 Managing Environment Variables

### Add/Update Variables
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Click **"Settings"** → **"Environment Variables"**
4. Add/Edit variables
5. Click **"Save"**
6. Redeploy: Deployments → Click "..." → "Redeploy"

### Using CLI
```bash
vercel env add XTREAM_BASE_URL
vercel env add USERNAME
vercel env add PASSWORD
```

---

## 🌟 Benefits of GitHub Import

| Feature | GitHub Import | CLI Deploy |
|---------|--------------|------------|
| **Auto-deploy on push** | ✅ Yes | ❌ No |
| **Preview deployments** | ✅ Yes | ❌ No |
| **Rollback support** | ✅ Yes | ⚠️ Manual |
| **Team collaboration** | ✅ Yes | ⚠️ Limited |
| **Setup time** | 2 minutes | 5 minutes |

---

## 🆘 Troubleshooting

### Issue: "Repository not found"
**Solution:** Make sure your GitHub repository is public, or connect your GitHub account to Vercel.

### Issue: "Build failed"
**Solution:** Check build logs in Vercel dashboard. Common fixes:
- Ensure `package.json` is in root directory
- Check `vercel.json` syntax
- Verify all dependencies are listed

### Issue: "Environment variables not working"
**Solution:** 
1. Go to Settings → Environment Variables
2. Make sure variables are set for "Production"
3. Redeploy the project

### Issue: "Function timeout"
**Solution:** Add to `vercel.json`:
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

## ✅ You're Done!

Your XtreamPlaylist proxy is now:
- 🌍 Deployed globally on Vercel's edge network
- 🔄 Auto-deploying on every GitHub push
- 📊 Monitored with built-in analytics
- 🔙 Rollback-ready if issues occur

**Playlist URL:** `https://xtream-playlist-proxy.vercel.app/api/playlist`

Use this URL in VLC, TiviMate, or any IPTV player! 🎉
