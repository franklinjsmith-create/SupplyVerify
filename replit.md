# USDA Organic Operation Status & Product Verification Tool

## Overview

The USDA Organic Operation Status & Product Verification Tool is a web application that allows users to verify operations and products against the USDA Organic Integrity Database (OID). Users can upload spreadsheets (CSV/XLSX) or manually enter data in a table to check certification statuses in bulk. The application fetches real-time data from the USDA OID website and provides detailed verification results including matching and missing products for each operation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**UI Component Library**: shadcn/ui components built on Radix UI primitives, providing accessible and customizable components with consistent styling.

**Design System**: Material Design principles with a custom color palette focused on professional utility. Supports both light and dark themes with CSS variables for theming.

**State Management**: 
- TanStack Query (React Query) for server state management and API caching
- React hooks for local component state
- Theme context for dark/light mode

**Routing**: Wouter for lightweight client-side routing

**Styling**: Tailwind CSS with custom configuration, utilizing CSS variables for theming and a design token system defined in index.css

### Backend Architecture

**Runtime**: Node.js with TypeScript

**Framework**: Express.js for HTTP server and API routing

**Development**: Vite middleware integration for hot module replacement during development

**File Processing**: 
- Multer for multipart/form-data file uploads with 10MB size limit
- PapaParse for CSV parsing
- XLSX library for Excel file parsing

**Web Scraping**: 
- Playwright for JavaScript-rendered content (USDA uses Blazor framework)
- Chromium headless browser with containerization flags (--no-sandbox, --disable-setuid-sandbox)
- Custom scraper service that normalizes product names and extracts certification scopes
- networkidle wait strategy ensures full page render before data extraction

**Validation**: Zod schemas for runtime type validation of inputs and outputs

**Session Management**: In-memory storage for verification progress tracking during async operations

**API Design**:
- RESTful endpoints for file upload and verification
- Progress polling endpoint for long-running verification jobs
- Structured error handling with appropriate HTTP status codes

### Data Flow

**Input Methods:**
1. **Manual Table Entry**: Users enter NOP ID and products directly in a dynamic table interface with add/remove row functionality
2. **File Upload**: Users upload CSV/XLSX files with operation data (drag & drop or click to browse)

**Processing:**
1. Table input converts to pipe-delimited format: `Operation | {nopId} | {products}`
2. File uploads are parsed and validated
3. Data sent to `/api/verify` or `/api/verify-text` endpoint
4. Backend parses and validates operation data
5. For each operation, backend scrapes USDA OID page using NOP ID
6. Certification data extracted and compared against requested products
7. Operation name populated from USDA scraping results (not user input)
8. Results aggregated and returned with matching/missing product lists
9. Frontend displays summary statistics and detailed table of results

### External Dependencies

**USDA Organic Integrity Database**: 
- External data source accessed via web scraping at `https://organic.ams.usda.gov/Integrity/CP/OPP?nopid={nop_id}`
- No official API available; uses Blazor (client-side JavaScript framework) requiring headless browser
- Playwright with Chromium handles JavaScript execution and DOM rendering
- Rate limiting through concurrent batch processing (max 3 simultaneous requests)
- Timeout configuration: 30s page load, 10s for content selector
- Fallback handling for 404s, timeouts, and server errors

**Third-Party Services**:
- Google Fonts (Inter, Roboto Mono) for typography
- No authentication services required
- No payment processing integrations
- No email services

**Database**: 
- Currently uses in-memory storage only for session tracking
- No persistent database configured (Drizzle ORM and PostgreSQL are configured but not actively used)
- All verification data is fetched in real-time from USDA source

**Development Tools**:
- Replit plugins for development environment integration (cartographer, dev banner, runtime error overlay)
- ESBuild for production bundling

### Key Architectural Decisions

**Real-time Data Fetching**: 
- Chose to scrape USDA website directly rather than maintain a local database
- Rationale: Ensures data freshness and reduces maintenance burden
- Trade-off: Slower verification but always up-to-date

**Material Design System**: 
- Professional utility-focused design over decorative elements
- Rationale: Enterprise users need clarity and efficiency for data-heavy workflows
- Supports accessibility through Radix UI primitives

**Progress Tracking**: 
- Implemented async verification with polling-based progress updates
- Rationale: Better UX for batch processing multiple suppliers
- Allows users to see real-time progress for long-running operations

**File Format Support**: 
- Accepts both CSV and XLSX formats plus text input
- Rationale: Maximum flexibility for different user workflows
- Text input provides quick ad-hoc verification without file creation

**Fuzzy Product Matching**: 
- Uses substring matching for product comparison
- Rationale: Accounts for variations in product naming conventions
- Normalizes all text (lowercase, punctuation removal) before comparison

**Side-by-Side Input Layout**:
- Split-screen design: Manual table entry (~65% width) on left, file upload (~35% width) on right
- Vertical "OR" divider separates the two input methods
- Rationale: Provides clear visual separation while maintaining easy access to both input methods
- Responsive: Stacks vertically on mobile devices (<1024px)
- Main card is centered (max-width: 5xl) for better visual balance

**Dynamic Table Input**:
- Two-column table with NOP ID (10-digit numeric) and Products (comma-separated)
- Add/Remove row functionality for batch entry
- Input validation: NOP ID limited to digits only, max 10 characters
- "Verify Operations" button centered at bottom of input card
- Rationale: Streamlined manual entry for users with small datasets
- Operation names automatically populated from USDA scraping (not manual input)

## SEO and Branding

**Production URL**: https://verifier.askorganicbot.com/

**Page Title**: "USDA Organic Certification Verifier | AskOrganicBot"

**Favicon**: AskOrganicBot leaf logo (green leaf in speech bubble with transparent background)
- Currently uses single source image (`/favicon.png`) with multiple size declarations
- Browsers automatically resize for 16x16, 32x32, 192x192, and 180x180 Apple touch icon
- **Future optimization**: For best quality across all devices, generate separate optimized files for each size using a tool like RealFaviconGenerator (realfavicongenerator.net)

**SEO Implementation**:
- Comprehensive meta tags including description, keywords, and author
- Open Graph tags for rich social media previews (Facebook, LinkedIn)
- Twitter Card metadata for Twitter sharing
- Canonical URL pointing to https://verifier.askorganicbot.com/
- JSON-LD structured data (Schema.org WebApplication type) for Google rich snippets
- Google Analytics tracking (GA4: G-TGQSKF1B9G)

**Meta Description**: "Verify USDA organic certification status in real-time. Upload operation NOP IDs and product lists to check against the USDA Organic Integrity Database instantly. Free tool by AskOrganicBot."

**Target Keywords**: USDA organic, NOP verification, organic certification, USDA OID, organic integrity database, certification verification tool, organic operations, NOP ID lookup

**Future Migration**: Planned migration from verifier.askorganicbot.com to askorganicbot.com/verifier will require updating the canonical URL in index.html

## Deployment

This application requires Playwright browser binaries to function in production. See **DEPLOYMENT.md** for comprehensive deployment instructions.

**Quick Start:**
1. Deploy to Railway, Render, or Fly.io (recommended platforms)
2. Set build command: `npm install && bash install-browsers.sh && npm run build`
3. Set start command: `npm start`
4. No environment variables required

**Performance in Production:**
- Single operation: 5-15 seconds
- 10 operations: 30-50 seconds (concurrent processing)
- 100 operations: 5-8 minutes

**Requirements:**
- Node.js 18+
- 512MB+ RAM recommended
- Chromium browser (auto-installed via install-browsers.sh)

**Known Limitations:**
- Cannot run in Replit development environment (Playwright binaries not supported)
- Requires deployment to cloud platform with headless browser support
- First request after deployment may take 20-30 seconds (Chromium initialization)