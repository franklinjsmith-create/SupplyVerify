# USDA Organic Verification Tool - Design Guidelines

## Design Approach: Material Design System

**Rationale:** This is a professional, utility-focused application requiring clear data presentation, efficient workflows, and enterprise-grade reliability. Material Design provides robust patterns for data tables, file uploads, and status indicators while maintaining accessibility and cross-platform consistency.

**Core Principles:**
- Clarity over decoration
- Immediate status visibility
- Trust through transparency
- Efficient data scanning

---

## Color Palette

### Light Mode
- **Primary:** 76 59% 45% (Professional teal-blue for actions and headers)
- **Primary Variant:** 76 59% 35% (Darker shade for emphasis)
- **Surface:** 0 0% 100% (Pure white backgrounds)
- **Background:** 210 17% 98% (Subtle gray for page background)
- **On Surface:** 220 13% 18% (Primary text)
- **On Background:** 220 13% 28% (Secondary text)

### Dark Mode
- **Primary:** 76 59% 65% (Lighter teal for dark backgrounds)
- **Primary Variant:** 76 59% 55%
- **Surface:** 220 13% 18% (Card backgrounds)
- **Background:** 220 13% 13% (Page background)
- **On Surface:** 210 17% 98% (Primary text on dark)
- **On Background:** 210 17% 88% (Secondary text)

### Status Colors
- **Success/Certified:** 142 71% 45% (Green)
- **Warning/Missing:** 38 92% 50% (Amber)
- **Error/Failed:** 0 84% 60% (Red)
- **Info:** 207 90% 54% (Blue)

---

## Typography

**Font Families:**
- Primary: 'Inter' via Google Fonts (clean, readable, professional)
- Monospace: 'Roboto Mono' for OID numbers and data fields

**Text Hierarchy:**
- **H1 (Page Title):** 2.5rem / 600 / -0.02em
- **H2 (Section Headers):** 2rem / 600 / -0.01em
- **H3 (Card Headers):** 1.5rem / 600
- **Body Large:** 1.125rem / 400 / 0.5px
- **Body:** 1rem / 400 / 0.15px
- **Caption/Labels:** 0.875rem / 500 / 0.4px
- **Data/Monospace:** 0.875rem / 400 (OID numbers, technical data)

---

## Layout System

**Spacing Primitives:** Tailwind units of 4, 6, 8, 12, 16, 24 (p-4, gap-6, mb-8, py-12, px-16, mt-24)

**Container Strategy:**
- Max width: max-w-7xl for main content area
- Page padding: px-4 md:px-6 lg:px-8
- Section spacing: py-12 md:py-16 between major sections
- Card spacing: p-6 for content cards

**Grid System:**
- Upload area: Full width single column
- Results table: Full width with horizontal scroll on mobile
- Summary cards: grid-cols-1 md:grid-cols-3 gap-6

---

## Component Library

### Navigation Header
- Fixed top bar with logo/title on left
- Dark mode toggle on right
- Height: h-16 with shadow-sm
- Background: Surface color with border-b
- Sticky positioning during scroll

### File Upload Zone
- Large dropzone: min-h-64 with dashed border (border-2 border-dashed)
- Centered icon (document/upload) with primary color
- Clear instructional text: "Drag & drop your CSV/XLSX file or click to browse"
- Active state: Primary background at 10% opacity with solid border
- File format indicators below: CSV and XLSX badges

### Text Input Alternative
- Collapsible section below file upload
- Textarea with monospace font for pipe-delimited input
- min-h-32 with clear example placeholder
- Border transitions to primary on focus

### Results Summary Cards (3-column grid on desktop)
- **Total Suppliers Processed:** Large number with checkmark icon
- **Certified Suppliers:** Success color with percentage
- **Missing Ingredients Found:** Warning color with count
- Each card: Rounded corners (rounded-lg), shadow-md, p-6
- Icon + Number + Label layout

### Data Table
- Sticky header row with surface background
- Alternating row backgrounds for scannability
- Column headers: Supplier | OID | Certifier | Status | Matching | Missing | Link
- Status badges: Pill-shaped with appropriate status colors
- Ingredient lists: Bulleted, text-sm, max-height with scroll
- "View Details" link in primary color
- Responsive: Horizontal scroll on mobile with min-width columns

### Status Badges
- Certified: Success background at 20% opacity, success text, rounded-full px-3 py-1
- Failed: Error background at 20% opacity, error text
- Pending: Info background at 20% opacity
- Small icon + text combination

### Action Buttons
- Primary CTA: "Verify Suppliers" - filled with primary color, px-8 py-3, rounded-md
- Secondary: "Download Results (JSON)" - outline variant with primary border
- Icon buttons: Rounded-full with hover background transition

### Loading States
- Circular progress indicator with primary color
- Loading skeleton for table rows: Animated gradient pulse
- Status message: "Fetching data from USDA database..."

### Empty States
- Icon + Heading + Description centered layout
- "Upload a file to begin verification" with supporting illustration suggestion
- Muted text color with helpful guidance

---

## Interaction Patterns

**No Animations** except:
- Subtle transitions: 150ms ease-in-out for hover states
- Progress indicators during data fetching
- Smooth scrolling to results section after processing

**Micro-interactions:**
- Button hover: Slight opacity change (95%)
- Table row hover: Surface elevation change
- Input focus: Border color transition to primary

---

## Images

**No hero image required** - This is a utility application focused on functionality over visual marketing. The interface should open directly to the upload zone for immediate productivity.

**Icon Usage:**
- Material Icons via CDN for consistent iconography
- Key icons needed: upload_file, verified, warning, error, description, download, dark_mode, light_mode

---

## Accessibility Standards

- WCAG AA contrast ratios maintained across all text/background combinations
- Keyboard navigation: Tab order follows logical workflow (upload → verify → results)
- Screen reader labels on all interactive elements
- Status information communicated through text AND color
- Focus indicators: 2px primary color outline with 2px offset
- Dark mode maintains same contrast standards as light mode