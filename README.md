# USDA Organic Verification Tool

Automated verification tool that checks supplier certifications against the USDA Organic Integrity Database. Upload spreadsheets or paste text to verify multiple suppliers instantly.

## Features

- **Bulk Verification**: Check hundreds of suppliers at once
- **Multiple Input Formats**: Upload CSV/XLSX files or paste text directly
- **Real-Time Progress**: Track verification status as it happens
- **Detailed Results**: See matching and missing ingredients for each supplier
- **Material Design**: Professional, accessible interface with dark mode support
- **Export Ready**: Download results as CSV for further processing

## Quick Start

### Deployment (Required)

This application uses Playwright to scrape JavaScript-rendered content and **cannot run in the Replit development environment**. Deploy to a production platform:

```bash
# Recommended platforms: Railway, Render, or Fly.io
# Build command: npm install && bash install-browsers.sh && npm run build
# Start command: npm start
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed platform-specific instructions.

### Testing After Deployment

1. Visit your deployed URL
2. Choose your input method:

**Option A - Text Input (Quickest)**
```
Mountain Rose Herbs|8150001085|cinnamon,ginger
Oregon's Wild Harvest|8150003021|turmeric,ashwagandha
```

**Option B - CSV File**
```csv
Supplier Name,OID Number,Ingredients
Mountain Rose Herbs,8150001085,"cinnamon,ginger"
Oregon's Wild Harvest,8150003021,"turmeric,ashwagandha"
```

3. Click "Process Text Data" or "Upload & Verify"
4. Wait for verification (5-15 seconds per supplier)
5. Review results showing:
   - Operation name and certifier
   - Matching ingredients (certified)
   - Missing ingredients (not certified)

## Input Format

Each supplier requires three pieces of information:

1. **Supplier Name**: Your reference name
2. **OID Number**: 10-digit USDA Organic certification number (format: 8150001085)
3. **Ingredients**: Comma-separated list of products to verify

### Where to Find OID Numbers

- Supplier certification documents
- USDA Organic Integrity Database: https://organic.ams.usda.gov/integrity/
- Product labels (sometimes listed as "NOP ID")

## Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + Node.js
- **Scraper**: Playwright (Chromium headless browser)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Design**: Material Design with Inter font

## Performance

- **Single supplier**: 5-15 seconds
- **10 suppliers**: 30-50 seconds (processes 3 concurrently)
- **100 suppliers**: 5-8 minutes

First request after deployment may take 20-30 seconds while Chromium initializes.

## Limitations

- **No Local Development**: Playwright requires ~400MB browser binaries not available in Replit
- **Production Only**: Must deploy to Railway, Render, Fly.io, or similar platform
- **USDA Dependency**: Scraper may need updates if USDA redesigns their website
- **Rate Limiting**: Processes maximum 3 suppliers concurrently to avoid overwhelming USDA servers

## Troubleshooting

### "Browser executable not found"
Ensure `install-browsers.sh` ran during build. Check deployment logs.

### Timeout Errors
USDA servers may be slow. Reduce concurrent limit in `server/services/verification-service.ts` from 3 to 2.

### Missing Ingredients
Verify the ingredient names match USDA certification scope names. The tool uses fuzzy matching but exact names work best.

### All Suppliers Failing
Test with known good OID: `8150001085` (Mountain Rose Herbs). If this fails, USDA site may have changed.

## Development

```bash
# Install dependencies
npm install

# Install Playwright browsers (requires ~400MB disk space)
npx playwright install chromium --with-deps

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Files

- `client/` - React frontend application
- `server/` - Express backend API
- `shared/` - Shared TypeScript types and schemas
- `DEPLOYMENT.md` - Detailed deployment instructions
- `install-browsers.sh` - Playwright browser installation script

## License

MIT

## Support

For deployment issues, see [DEPLOYMENT.md](./DEPLOYMENT.md). For USDA certification questions, contact your supplier or visit https://organic.ams.usda.gov/
