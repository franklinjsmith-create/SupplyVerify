# USDA Organic Verification Tool

## Overview

The USDA Organic Verification Tool is a web application that allows users to verify suppliers and ingredients against the USDA Organic Integrity Database (OID). Users can upload spreadsheets (CSV/XLSX) or paste text data to check certification statuses in bulk. The application fetches real-time data from the USDA OID website and provides detailed verification results including matching and missing ingredients for each supplier.

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
- Axios for HTTP requests to USDA OID website
- Cheerio for HTML parsing and data extraction
- Custom scraper service that normalizes product names and extracts certification scopes

**Validation**: Zod schemas for runtime type validation of inputs and outputs

**Session Management**: In-memory storage for verification progress tracking during async operations

**API Design**:
- RESTful endpoints for file upload and verification
- Progress polling endpoint for long-running verification jobs
- Structured error handling with appropriate HTTP status codes

### Data Flow

1. User uploads file or pastes text → Frontend validates format
2. Data sent to `/api/verify` endpoint → Backend parses and validates supplier data
3. For each supplier, backend scrapes USDA OID page using OID number
4. Certification data extracted and compared against requested ingredients
5. Results aggregated and returned with matching/missing ingredient lists
6. Frontend displays summary statistics and detailed table of results

### External Dependencies

**USDA Organic Integrity Database**: 
- External data source accessed via web scraping at `https://organic.ams.usda.gov/Integrity/Operations/Details`
- No official API available; relies on HTML structure stability
- Rate limiting handled through timeout configuration (30s per request)
- Fallback handling for 404s and server errors

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

**Fuzzy Ingredient Matching**: 
- Uses substring matching for ingredient comparison
- Rationale: Accounts for variations in product naming conventions
- Normalizes all text (lowercase, punctuation removal) before comparison