# Feature Specifications Summary

## Overview

I've created comprehensive specifications for three major feature areas that will significantly enhance GardenTime:

1. **Crop Record Management** (Steps 60-63)
2. **Garden Management Dashboard** (Steps 64-68)
3. **Plant Information View** (New Feature Set)

These specifications provide detailed requirements, user stories, backend/frontend needs, and implementation guidance.

---

## 1. Crop Record Management (Steps 60-63)

**File:** `/docs/crop-record-management-spec.md`

### What It Solves
Currently, users can only view crops within individual grow areas. This feature set creates a centralized crop management system.

### Key Features

#### Step 60: Crop Records List View
- **Backend:** New API endpoint `GET /api/crop-records` with advanced filtering
  - Filter by status, plant type, garden, date range
  - Pagination and sorting
  - Includes garden name and grow area name for context
  - Calculates days growing and expected harvest dates

- **Frontend:** New page `/crops` showing ALL user's crops
  - Table/card view with filtering sidebar
  - Status badges, quick actions
  - Statistics summary (total crops, active, harvested, success rate)
  - Click row to navigate to grow area details

#### Step 61: Timeline View
- Visual Gantt-chart showing crop lifecycles across the year
- Helps with succession planting and gap identification
- Group by garden/grow area or by plant type
- Libraries to consider: react-gantt-chart, vis-timeline, or custom D3.js

#### Step 62: Batch Operations
- **Backend:** Batch update and delete endpoints
- **Frontend:** Multi-select with checkboxes
  - Bulk harvest modal (set date, outcome, quantity for multiple crops)
  - Bulk delete with confirmation
  - Bulk status changes

#### Step 63: Export
- **Backend:** Export endpoint supporting CSV and Excel formats
- **Frontend:** Export modal with format selection, field selection
- Respects current filters for targeted exports
- Rate limiting to prevent abuse

### Implementation Priority
1. **High:** Step 60 (list view) - Most useful immediately
2. **Medium:** Steps 62-63 (batch ops, export) - Efficiency gains
3. **Lower:** Step 61 (timeline) - Nice to have, more complex

### Questions Answered in Spec
- Data retention: Soft delete recommended
- Performance: Pagination, virtual scrolling for 1000+ crops
- Timeline: Read-only initially, editing in future
- Export limits: Max 1000 records per export
- Batch operations: Keep simple (no moving crops between areas)

---

## 2. Garden Management Dashboard (Steps 64-68)

**File:** `/docs/garden-management-dashboard-spec.md`

### What It Solves
Currently no overview/analytics. This transforms GardenTime from a tracker into an insights platform.

### Key Features

#### Step 64: Garden Overview Dashboard (`/gardens/[id]/dashboard`)
Seven key widgets:
1. **Garden Summary Card** - Total grow areas, active/inactive, last activity
2. **Active Crops Widget** - Breakdown by status (planted, growing, ready to harvest)
3. **Recent Harvests Widget** - Last 5 harvests with outcomes
4. **Upcoming Tasks Widget** - Ready to harvest, needs attention, empty areas
5. **Garden Capacity Widget** - Space utilization %, recommendations
6. **Planting Calendar Widget** - Mini calendar with planting/harvest events
7. **Weather Widget** - Future enhancement with API integration

**Backend:** Single endpoint `GET /api/gardens/{gardenId}/dashboard` 
- Returns all dashboard data in one request
- Caching (5-15 min TTL) to reduce database load

#### Step 65: Statistics & Analytics
Six analytical widgets:
1. **Productivity Over Time** - Line/bar chart of monthly harvests
2. **Plant Performance Leaderboard** - Top 10 plants by yield, success rate
3. **Success Rate by Plant Type** - Pie chart comparing categories
4. **Seasonal Performance** - Which seasons produce most
5. **Grow Area Efficiency** - Comparing productivity of different areas
6. **Crop Rotation Compliance** - Score measuring rotation best practices

**Backend:** `GET /api/gardens/{gardenId}/statistics`
- Complex aggregation queries
- Pre-calculation in background jobs recommended
- Materialized views for performance

#### Step 66: Multi-Garden Management
- **Garden Switcher** in navigation (dropdown)
- **Gardens Management Page** (`/gardens`) - Grid of all user's gardens
- **Multi-Garden Dashboard** (`/dashboard/all`) - Statistics across ALL gardens
- Use case: User with home garden + community plot + greenhouse

#### Step 67: Garden Templates
Pre-configured layouts to help beginners:
- **Template Categories:** By size, climate, type, goal
- **Template Gallery** (`/templates`) - Browse and filter templates
- **Apply Template Flow:** Create new garden from template with one click
- **Create Custom Template:** Save your garden as template, share publicly

**Backend:** New `garden_templates` table and API endpoints
- System templates (curated)
- User-created templates (with public/private flag)

#### Step 68: Activity Feed
Chronological log of all garden activities:
- Crop planted/harvested/status changed
- Grow area created/modified/deleted
- Future: Watered, fertilized, pruned

**Backend:** New `garden_activities` table
- Event tracking using Spring ApplicationEventPublisher
- Activity feed API with filtering

### Implementation Roadmap
1. **Phase 1:** Step 64 (core dashboard) - 2-3 days
2. **Phase 2:** Step 65 (analytics) - 2-3 days
3. **Phase 3:** Step 66 (multi-garden) - 1-2 days
4. **Phase 4:** Step 67 (templates) - 3-4 days
5. **Phase 5:** Step 68 (activity feed) - 1-2 days

**Total: ~10-14 days for complete implementation**

### Design Considerations Addressed
- Performance: Caching, materialized views, background jobs
- Scalability: Design for 100+ crops, 50+ grow areas
- UX: Color coding, drill-down capabilities, mobile responsive
- Accessibility: Semantic HTML, ARIA labels, keyboard navigation

---

## 3. Plant Information View

**File:** `/docs/plant-information-view-spec.md`

### What It Solves
Currently plants are just names in a database. This transforms GardenTime into an educational platform with comprehensive growing guides.

### Vision
- Browse library of plants (vegetables, herbs, flowers)
- Detailed growing guides and care instructions
- Personal historical data (your success rate with each plant)
- Community insights (what works in similar climates)
- AI-powered recommendations

### Key Features

#### Plant Detail Page (`/plants/[plantId]`)
Seven major sections:

1. **Plant Header**
   - Common name, scientific name, plant type, family
   - Hero image, difficulty rating
   - "Add to My Garden" quick action

2. **Quick Facts Card**
   - Growing season, days to maturity, hardiness zones
   - Sun/water requirements, spacing, soil pH
   - Icon-based grid layout for quick scanning

3. **Growing Guide (Tabbed Content)**
   - Tab 1: Overview (description, history, varieties)
   - Tab 2: Planting Guide (when, soil prep, technique, transplanting)
   - Tab 3: Care & Maintenance (watering, fertilizing, pruning, pests)
   - Tab 4: Harvesting (signs of readiness, technique, storage)
   - Tab 5: Varieties (different cultivars with characteristics)
   - Tab 6: Companion Planting (good/bad companions with reasons)

4. **Your Growing History** (Personalized)
   - Times planted, success rate, average yield
   - Charts showing yield over time
   - Notes from past crops
   - "Plant Again" quick action

5. **Community Insights**
   - Aggregated stats (times grown by users, average success rate)
   - Top-rated tips from community
   - Common problems and solutions

6. **Recipes & Uses** (Future)
   - Culinary uses, recipes, preservation methods

7. **Related Resources**
   - Links to extension office guides, YouTube videos, seed suppliers

#### Plant Browse Page (`/plants`)
- Grid of plant cards with photos
- Filters: plant type, season, difficulty, sun requirements
- Search with autocomplete
- Sort: alphabetical, popularity, difficulty, your success rate
- Personalized recommendations based on location and history

### Backend Enhancement

#### Extended Data Model
Six new tables to support rich plant information:

1. **plant_details** - Extended attributes (family, difficulty, hardiness, dimensions, pH, spacing, etc.)
2. **plant_care_guides** - Step-by-step instructions (Markdown formatted)
3. **plant_varieties** - Different cultivars with characteristics
4. **plant_companions** - Beneficial/harmful companion relationships
5. **plant_images** - Photos at different growth stages
6. **plant_resources** - Links to videos, articles, guides

#### New API Endpoints
- `GET /api/plants/{plantId}/full` - Complete plant information
- `GET /api/plants/{plantId}/my-history` - User's historical data
- `GET /api/plants/{plantId}/community-stats` - Aggregated community data
- `GET /api/plants/recommendations` - Personalized suggestions

### plant-data-aggregator Service

The separate **plant-data-aggregator** service collects and maintains plant data from:

**Data Sources:**
1. USDA Plants Database (scientific names, families, hardiness zones)
2. Open Food Facts API (nutritional information)
3. Growstuff API (growing guides, user experiences)
4. Wikipedia/Wikidata (general info, images, taxonomy)
5. Extension Office Publications (regional guides, pest info)
6. Seed Company Data (varieties, maturity times)
7. Manual Curation (expert-written guides, curated photos)

**Key Tasks:**
- Data collection scripts
- Data enrichment pipeline (normalization, image processing)
- Data quality (deduplication, validation, conflict resolution)
- Content management (admin UI, bulk import, review workflow)
- Image library (stock photos, user submissions, AI tagging)
- Regional customization (guides by USDA zone, planting calendars)

### Implementation Plan
1. **Phase 1:** Basic plant view (2-3 days) - Header, quick facts, static guides
2. **Phase 2:** Enhanced data (3-4 days) - New tables, varieties, companions, images
3. **Phase 3:** Personal history (2 days) - Stats, charts, notes
4. **Phase 4:** Browse & search (2-3 days) - Grid view, filters, search
5. **Phase 5:** Recommendations (2 days) - Algorithm, location-based filtering
6. **Phase 6:** Community features (future) - User tips, photo gallery, recipes

**Total: ~11-14 days for core implementation**

### Content Creation Strategy
- **Immediate:** 20 common vegetables + 10 herbs with basic info
- **Phase 1 (1-2 months):** 100 plants, full guides for top 50
- **Phase 2 (3-6 months):** 300+ plants, regional customization, photo library
- **Ongoing:** Seasonal updates, new varieties, user feedback

### Enables Future Features
This foundational system enables:
- Better crop recommendations (Step 41-44: Crop Rotation Intelligence)
- Plant-specific alerts (Step 85: Notifications)
- Yield prediction (Step 91: Yield Analytics)
- Personalized planting calendar (Step 86: Calendar Integration)
- AI chat for plant care questions

---

## Common Themes Across All Specs

### User-Centric Design
- Clear user stories for each feature
- Focus on solving real gardener problems
- Progressive disclosure (simple → detailed)

### Performance Considerations
- Pagination everywhere
- Caching strategies
- Background jobs for expensive calculations
- Materialized views for complex queries

### Scalability
- Design for power users (100+ crops, multiple gardens)
- Database indexes
- Data retention policies
- Rate limiting on exports/API calls

### Privacy & Security
- User-scoped queries (can only see own data)
- Anonymized community data
- Opt-in for data sharing
- Secure authentication on all endpoints

### Mobile-First
- Responsive layouts
- Touch-friendly interfaces
- Mobile-specific widget ordering
- PWA support for offline access

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support
- Color-blind friendly palettes

---

## Questions for You

### Priority
Which feature set should we tackle first?
1. **Crop Record Management** - More immediate utility for existing users
2. **Garden Dashboard** - Better insights and motivation to keep using app
3. **Plant Information View** - Educational value, attracts new users

My recommendation: **Dashboard (Steps 64-65)** first, then **Crop Management (Steps 60, 62-63)**, then **Plant Info View**.

### Scope
Should we implement all sub-steps or prioritize certain widgets/features?
- For dashboard: Core widgets first (summary, active crops, tasks), analytics later?
- For crop management: List view essential, timeline can wait?
- For plant info: Basic view first, community features later?

### Data
For plant information view:
- Should we start populating plant data now or wait until frontend is ready?
- Do you have preferred data sources or seed companies to partner with?
- Should we hire a horticulture expert for content creation?

### Monetization
You mentioned monetizing later. These features could support:
- Premium templates (Step 67)
- Advanced analytics (Step 65)
- AI-powered recommendations (Plant Info)
- Seed supplier affiliate links (Plant Info)

Should we design with freemium model in mind (basic free, advanced paid)?

---

## Next Steps

1. **Review specifications** - Read the three detailed spec documents
2. **Ask questions** - Clarify anything unclear or discuss changes
3. **Prioritize features** - Decide which to implement first
4. **Create implementation tickets** - Break down into developer tasks
5. **Start building** - Begin with highest-priority feature

All three specs are comprehensive and ready for implementation. They include:
- User stories
- Technical requirements (backend + frontend)
- API endpoint designs
- Database schemas
- UI descriptions and layouts
- Testing checklists
- Implementation roadmaps
- Open questions and recommendations

Let me know which direction you'd like to go!
