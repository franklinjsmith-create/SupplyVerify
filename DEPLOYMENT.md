# Deployment Guide

This application uses Playwright to scrape the USDA Organic Integrity Database, which requires browser binaries to be installed. Follow these platform-specific instructions to deploy successfully.

## Important: Docker-Based Deployment

This project includes a **Dockerfile** that handles all system dependencies automatically. Railway, Render, and other platforms will auto-detect the Dockerfile and use it for deployment - no manual configuration needed!

## Prerequisites

The application requires:
- Node.js 18 or higher
- Chromium browser (installed automatically via Playwright)
- 512MB+ RAM recommended

## Platform-Specific Deployment

### Railway (Recommended)

Railway is the easiest deployment option with excellent Playwright support. Railway will automatically detect and use the Dockerfile.

1. **Connect your repository**
   - Go to [railway.app](https://railway.app)
   - Create new project → "Deploy from GitHub repo"
   - Select this repository

2. **Deploy**
   - Railway automatically detects the Dockerfile
   - No build commands needed - Dockerfile handles everything
   - First deploy takes 5-8 minutes (installs system dependencies + Chromium)
   - Your app will be live at `your-app.up.railway.app`

3. **Verify deployment**
   - Check build logs to see "Installing Chromium system dependencies"
   - App should start without errors

**Estimated Cost:** $5/month (Hobby plan)

**Note:** If you need to override build settings, Railway should leave them empty - the Dockerfile handles everything.

---

### Render

Render provides great support for Docker deployments and automatically detects the Dockerfile.

1. **Create new Web Service**
   - Go to [render.com](https://render.com)
   - New → Web Service
   - Connect your repository

2. **Configure settings**
   - Name: `usda-verification-tool`
   - Environment: `Docker`
   - Render will auto-detect the Dockerfile
   - Instance Type: Starter ($7/month) or Free (for testing)

3. **Deploy**
   - Click "Create Web Service"
   - First build takes 5-8 minutes (Docker image build + dependencies)
   - App will be at `usda-verification-tool.onrender.com`

**Estimated Cost:** Free tier available, $7/month for production

---

### Fly.io

Fly.io offers edge deployment with excellent performance.

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login and launch**
   ```bash
   fly auth login
   fly launch
   ```

3. **Configure fly.toml** (auto-generated, verify these settings):
   ```toml
   [build]
     builder = "heroku/buildpacks:20"

   [env]
     PORT = "5000"

   [[services]]
     http_checks = []
     internal_port = 5000
     processes = ["app"]
     protocol = "tcp"
     script_checks = []

     [services.concurrency]
       hard_limit = 25
       soft_limit = 20
       type = "connections"

     [[services.ports]]
       force_https = true
       handlers = ["http"]
       port = 80

     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443
   ```

4. **Add Procfile** (create in root):
   ```
   web: npm start
   release: bash install-browsers.sh
   ```

5. **Deploy**
   ```bash
   fly deploy
   ```

**Estimated Cost:** $0-5/month (depending on usage)

---

## Environment Variables

No environment variables are required for basic functionality. The app will work immediately after deployment.

Optional:
- `PORT` - Server port (defaults to 5000, usually auto-set by platform)
- `NODE_ENV` - Set to "production" (usually auto-set)

---

## Verification After Deployment

1. Visit your deployed URL
2. Test with sample data:
   ```
   Mountain Rose Herbs|8150001085|cinnamon,ginger
   ```
3. Click "Process Text Data"
4. Wait 5-15 seconds for verification
5. Results should show:
   - Operation Name: Mountain Rose Herbs
   - Certifier: Oregon Tilth
   - Status: Certified
   - Both ingredients found in "Matching Ingredients"

---

## Performance Expectations

- **Single supplier:** 5-15 seconds
- **10 suppliers:** 30-50 seconds (processes 3 at a time)
- **100 suppliers:** 5-8 minutes

The first request after deployment may take 20-30 seconds as Chromium initializes.

---

## Troubleshooting

### "libglib-2.0.so.0: cannot open shared object file"
**Error:** Chromium launches but missing system libraries like `libglib-2.0.so.0`, `libnss3.so`, etc.

**Cause:** System dependencies weren't installed during build

**Solution (Recommended - Docker):**
The Dockerfile in this repository automatically installs all required system libraries. Railway and Render will auto-detect it.

1. **Ensure Dockerfile is in your repository** - Check that `Dockerfile` exists in the root
2. **Push to GitHub** - The Dockerfile should be committed
3. **Redeploy** - Platform will detect Dockerfile and rebuild
4. **Check build logs** - Should see "Installing Chromium system dependencies"
5. **First build takes 5-8 minutes** - Docker installs all required libraries

If you still have issues, make sure Railway/Render isn't using custom build commands - leave them empty to let the Dockerfile work.

### "Browser executable not found"
**Solution:** The Dockerfile automatically installs Playwright Chromium. If you still see this error, check build logs to ensure the Dockerfile build completed successfully.

### Timeout errors
**Solution:** Increase server timeout or reduce concurrent limit in `server/services/verification-service.ts` (line 125: change `CONCURRENT_LIMIT` from 3 to 2)

### Memory issues
**Solution:** Upgrade to a plan with more RAM (minimum 512MB recommended, 1GB ideal)

### USDA site changes
**Solution:** The scraper targets specific DOM elements. If USDA redesigns their site, the scraper logic in `server/services/usda-scraper.ts` may need updates.

---

## Local Testing (Without Deployment)

To test Playwright locally (requires browser binaries):

```bash
# Install browsers
npx playwright install chromium --with-deps

# Run the app
npm run dev

# Test verification
# Navigate to http://localhost:5000
# Use the text input with: Mountain Rose Herbs|8150001085|cinnamon,ginger
```

**Note:** Local testing requires significant disk space (~400MB for Chromium) and may not work in all development environments.

---

## Maintenance

- **Regular updates:** Pull latest code and redeploy monthly
- **Monitor errors:** Check platform logs if verifications fail
- **USDA changes:** Test periodically with known NOP IDs to ensure scraper still works

---

## Support

If you encounter issues:
1. Check deployment platform logs
2. Verify Dockerfile is in your repository and being used (check build logs)
3. Ensure instance has sufficient memory (512MB+)
4. Test with known good NOP ID: 8150001085 (Mountain Rose Herbs)
5. Make sure platform isn't using custom build commands - let Dockerfile handle everything
