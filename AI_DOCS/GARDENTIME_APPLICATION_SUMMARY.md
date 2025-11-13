# GardenTime - Application Summary

**Last Updated:** November 12, 2025  
**Status:** Active Development - Core Features Complete

---

## What is GardenTime?

GardenTime is a comprehensive garden management system designed to help gardeners practice regenerative agriculture through intelligent crop rotation planning, companion planting, and seasonal planning. The application combines scientific plant data with user-specific garden history to provide personalized recommendations that improve soil health, prevent disease, and increase yields over time.

---

## Architecture Overview

### Three-Tier Architecture

```
┌──────────────────────────────────────────────────────────┐
│         Frontend - Next.js/React (Port 3000)            │
│  • Modern React UI with TypeScript                       │
│  • Server-side rendering (SSR)                           │
│  • Backend-for-Frontend (BFF) pattern                    │
└───────────────────────┬──────────────────────────────────┘
                        │ HTTP/REST
┌───────────────────────▼──────────────────────────────────┐
│     GardenTime Backend - Spring Boot (Port 8080)        │
│  • User garden management                                │
│  • Crop rotation planning engine                         │
│  • Season planning & grow area management                │
│  • Planting history & disease tracking                   │
│  • PostgreSQL database                                   │
└───────────────────────┬──────────────────────────────────┘
                        │ HTTP/REST
┌───────────────────────▼──────────────────────────────────┐
│  Plant Data Aggregator - Spring Boot (Port 8081)        │
│  • 500+ plant reference database                         │
│  • Plant families & characteristics                      │
│  • Companion planting relationships (2,303 pairs)        │
│  • Pest & disease database                               │
│  • Soil-borne disease tracking                           │
│  • PostgreSQL database                                   │
└──────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS
- Axios for API calls
- Server-side session management

**Backend (GardenTime):**
- Spring Boot 3.x (Kotlin)
- Spring Data JPA
- PostgreSQL
- JWT authentication
- RESTful API

**Backend (Plant Data Aggregator):**
- Spring Boot 3.x (Kotlin)
- Spring Data JPA
- PostgreSQL
- API key authentication
- RESTful API

---

## Core Features (Implemented)

### 1. Garden Management ✅
**Purpose:** Manage multiple gardens with custom layouts and grow areas

**Features:**
- Create and manage multiple gardens per user
- Define grow areas (raised beds, containers, in-ground sections)
- Track sun exposure levels per grow area (full sun, part shade, shade)
- Record climate information (hardiness zones, frost dates)
- Visual canvas for garden layout planning

**Database Tables:**
- `gardens` - Garden records per user
- `grow_areas` - Individual planting areas within gardens
- `garden_climate_info` - Climate data for each garden

### 2. Crop Rotation Planner ✅ (Backend Complete)
**Purpose:** Science-based rotation validation and recommendations

**5-Factor Scoring System (0-100 points):**

1. **Family Rotation (35 points)** - CRITICAL
   - Enforces 2-4 year intervals based on plant family
   - Brassicaceae & Solanaceae: 4-year minimum
   - Cucurbitaceae, Fabaceae, Apiaceae: 3-year minimum
   - Prevents disease buildup and soil depletion

2. **Nutrient Balance (25 points)**
   - Tracks heavy/moderate/light feeders
   - Promotes nitrogen-fixing legumes after heavy feeders
   - Prevents consecutive heavy feeders

3. **Disease Risk (20 points)**
   - Considers soil-borne disease persistence (3-20 years)
   - Tracks disease history per grow area
   - Warns about planting susceptible crops

4. **Root Depth Diversity (10 points)**
   - Alternates shallow/medium/deep root systems
   - Prevents soil compaction
   - Improves soil structure

5. **Companion Compatibility (10 points)**
   - Checks currently growing neighbors
   - Promotes beneficial companions
   - Prevents antagonistic pairings

**Grading System:**
- EXCELLENT (85-100): ⭐⭐⭐⭐⭐ Best practices followed
- GOOD (70-84): ⭐⭐⭐⭐ Should perform well
- FAIR (60-69): ⭐⭐⭐ Acceptable but not ideal
- POOR (40-59): ⭐⭐ Several issues present
- AVOID (0-39): ⭐ High risk of disease/failure

**API Endpoints:**
- `POST /api/gardens/{id}/grow-areas/{areaId}/rotation/validate` - Validate a crop choice
- `GET /api/gardens/{id}/grow-areas/{areaId}/rotation/recommendations` - Get recommendations
- `GET /api/gardens/{id}/grow-areas/{areaId}/rotation/recommendations/soil-improvement` - Soil builders
- `GET /api/gardens/{id}/grow-areas/{areaId}/rotation/recommendations/by-family` - Family-grouped
- `GET /api/gardens/{id}/grow-areas/{areaId}/rotation/companions` - Companion-based
- `GET /api/gardens/{id}/grow-areas/{areaId}/rotation/avoid` - Plants to avoid
- `GET /api/gardens/{id}/grow-areas/{areaId}/rotation/history` - Planting history

### 3. Season Planning ✅
**Purpose:** Plan seasonal crops and optimize planting schedules

**Features:**
- Create season plans for each garden
- Add crops to seasonal plan with grow area assignment
- Track planting dates and expected harvest dates
- Visual timeline view of season plan
- Climate information management
- Integration with rotation planner (in progress)

**Database Tables:**
- `season_plans` - Season plan records
- `planned_crops` - Crops planned for each season
- `crop_records` - Historical planting records with 7 rotation-tracking fields

### 4. Plant Data API ✅
**Purpose:** Comprehensive plant reference database

**Data Coverage:**
- 500+ plants with detailed characteristics
- Plant families and taxonomy
- Growing requirements (sun, water, spacing)
- Companion planting relationships (2,303 pairs)
  - 194 beneficial relationships
  - 64 unfavorable relationships
  - 2,045 neutral relationships
- Pest and disease information
- Soil-borne disease persistence data

**API Endpoints (Plant Data Aggregator):**
- `GET /api/v1/plant-data/plants` - List/search plants
- `GET /api/v1/plant-data/plants/{name}` - Get plant details
- `GET /api/v1/plant-data/families` - List plant families
- `GET /api/v1/plant-data/families/{family}/plants` - Plants by family
- `GET /api/v1/plant-data/plants/{name}/companions` - Get companions
- `POST /api/v1/plant-data/companions/check` - Check compatibility
- `GET /api/v1/plant-data/plants/{name}/pests` - Get pests
- `GET /api/v1/plant-data/plants/{name}/diseases` - Get diseases
- `GET /api/v1/plant-data/diseases/soil-borne` - Critical diseases
- `POST /api/v1/plant-data/plants/bulk` - Bulk plant details

**Status:** 12/13 endpoints complete (92%)

### 5. User Authentication & Authorization ✅
**Purpose:** Secure multi-user system

**Features:**
- User registration and login
- JWT-based authentication
- Session management
- User-specific garden data isolation
- API key authentication for service-to-service communication

---

## Core Features (In Progress)

### 1. Rotation Planner Frontend ⏳
**Status:** Backend complete, frontend integration in progress

**Components to Build:**
- RotationScoreGauge - Visual score display
- ScoreBreakdown - 5-factor breakdown
- IssuesAndBenefits - Warning and benefit display
- PlantRecommendations - Recommendation cards
- PlantingHistory - Timeline visualization

**Integration Points:**
- Season planner "Add Crop" flow with auto-validation
- Rotation score badges on planned crops
- New "Rotation" tab in season planner
- Educational tooltips and explanations

**Timeline:** ~3 weeks for full integration

### 2. Enhanced Plant Search ⏳
**Status:** Basic search working, needs UX improvements

**Remaining Tasks:**
- Fix search result display in season planner modal
- Improve search performance and caching
- Add plant filters (family, growing season, difficulty)
- Display plant images
- Better error handling and loading states

---

## Planned Features (Backlog)

### High Priority

1. **Multiple Grow Areas per Plant**
   - Allow users to specify quantity (e.g., "3 boxes of carrots")
   - Track multiple instances of same plant
   - Consider companion planting across all instances

2. **Sun Level Matching**
   - Set sun exposure for each grow area
   - Match plant requirements to grow area conditions
   - Filter recommendations by sun compatibility
   - Warn about mismatches

3. **Enhanced Disease Tracking**
   - User-reported disease occurrences
   - Disease risk heat maps per grow area
   - Historical disease pressure analysis
   - Preventive recommendations

4. **Yield Tracking & Analytics**
   - Record harvest yields
   - Track success rates per plant/area
   - Identify best-performing crops
   - ROI analysis

### Medium Priority

1. **Advanced Rotation Features**
   - Multi-year rotation planning (3-5 years)
   - Rotation plan templates (classic 4-year system)
   - Succession planting suggestions
   - Cover crop recommendations

2. **Educational Content**
   - Tooltips explaining rotation principles
   - Links to regenerative farming resources
   - Video tutorials
   - Seasonal tips and reminders

3. **Reporting Dashboard**
   - Soil health trends
   - Family diversity metrics
   - Yield tracking over time
   - Disease pressure analysis

4. **Mobile Optimization**
   - Responsive design improvements
   - Quick access to care instructions
   - Photo upload for plant tracking
   - Field-friendly UI

### Low Priority

1. **Community Features**
   - Share garden plans
   - Regional best practices
   - Community voting on recommendations
   - Expert reviews

2. **Advanced Planning**
   - Succession planting automation
   - Polyculture combinations
   - Seasonal planting calendars
   - Frost date integration

---

## Technical Improvements Needed

### High Priority
- [ ] Fix TypeScript errors in AddCropToSeasonModal
- [ ] Improve modal backgrounds (transparency/blur)
- [ ] Better error messages throughout UI
- [ ] Add loading states and animations
- [ ] Implement proper caching strategy

### Medium Priority
- [ ] Performance optimization for large datasets
- [ ] Mobile responsiveness improvements
- [ ] Accessibility audit (WCAG AA compliance)
- [ ] Comprehensive test coverage
- [ ] API rate limiting and throttling

### Low Priority
- [ ] Docker containerization
- [ ] CI/CD pipeline setup
- [ ] Monitoring and alerting
- [ ] Database backup automation
- [ ] Performance profiling

---

## Data Model Highlights

### Key Tables (GardenTime)

**User & Garden Management:**
- `users` - User accounts
- `gardens` - User gardens
- `grow_areas` - Planting areas
- `garden_climate_info` - Climate data

**Planning & History:**
- `season_plans` - Seasonal plans
- `planned_crops` - Planned plantings
- `crop_records` - Historical plantings with rotation data:
  - `plant_family` - For rotation rules
  - `feeder_type` - For nutrient balance
  - `is_nitrogen_fixer` - For soil improvement
  - `root_depth` - For root diversity
  - `had_diseases` - For disease tracking
  - `disease_names` - Specific diseases
  - `yield_rating` - Performance tracking

**Authentication:**
- JWT tokens with configurable expiration
- Session-based frontend authentication
- API key authentication for microservices

### Key Tables (Plant Data Aggregator)

**Plant Information:**
- `plants` - Core plant data (500+ plants)
- `plant_families` - Family taxonomy
- `plant_attributes` - Extended characteristics

**Relationships:**
- `companion_relationships` - 2,303 companion pairs
- Relationship types: attracts_beneficial_insects, repels_pests, improves_flavor, provides_shade, provides_support, improves_soil, incompatible, competes_for_resources, allelopathic

**Pests & Diseases:**
- `pests` - Pest database
- `diseases` - Disease database with soil-borne tracking
- `plant_pest_susceptibility` - Pest-plant relationships
- `plant_disease_susceptibility` - Disease-plant relationships

---

## Regenerative Farming Principles

GardenTime is built around core regenerative agriculture principles:

1. **Crop Rotation** - Prevents soil depletion and disease buildup
2. **Companion Planting** - Promotes biodiversity and natural pest control
3. **Nutrient Cycling** - Balances feeders with nitrogen-fixers
4. **Soil Health** - Root depth diversity prevents compaction
5. **Disease Prevention** - Science-based rotation intervals
6. **Education** - Explains WHY, not just WHAT to do
7. **User Control** - Suggestions, not restrictions

---

## Current Development Focus

**Phase 1 (Current):** Rotation Planner Frontend Integration
- Building UI components for rotation scores
- Integrating validation into season planner workflow
- Creating visual feedback for rotation recommendations
- Adding educational tooltips and explanations

**Phase 2 (Next):** UX Polish & Bug Fixes
- Fix remaining frontend issues
- Improve search functionality
- Better error handling and loading states
- Mobile responsiveness improvements

**Phase 3 (Future):** Advanced Features
- Multiple grow areas per plant
- Sun level matching
- Enhanced analytics and reporting
- Community features

---

## Key Metrics

**Data Coverage:**
- 500+ plants in reference database
- 2,303 companion planting relationships
- Supports all major vegetable families
- Tracks 3-20 year disease persistence periods

**Feature Completeness:**
- Backend: 95% complete (rotation planner done)
- Frontend: 70% complete (integration in progress)
- API: 92% complete (12/13 endpoints)

**Code Quality:**
- Kotlin backend with strong typing
- TypeScript frontend
- Comprehensive error handling
- Caching layer for performance
- RESTful API design

---

## Documentation

**Technical Documentation:**
- `ROTATION_PLANNER_IMPLEMENTATION_SUMMARY.md` - Rotation planner details
- `SEASON_PLANNER_IMPLEMENTATION.md` - Season planner architecture
- `COMPREHENSIVE_DATA_MODEL.md` - Database schema
- `API_STATUS_CURRENT.md` - API implementation status
- `FRONTEND_INTEGRATION_SUMMARY.md` - Frontend architecture

**Planning Documents:**
- `TODO.md` - Prioritized task list
- `FEATURE-REQUESTS.md` - Detailed feature requirements
- `ROTATION_PLANNER_DESIGN.md` - Original rotation design

**Process Documents:**
- `CLAUDE.md` - Development guidelines
- `HELP.md` - Setup instructions

---

## Getting Started

**Prerequisites:**
- Java 17+
- Node.js 18+
- PostgreSQL 14+

**Backend Setup:**
```bash
# GardenTime backend
./gradlew bootRun

# Plant Data Aggregator
cd plant-data-aggregator && ./gradlew bootRun
```

**Frontend Setup:**
```bash
cd client-next
npm install
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- GardenTime API: http://localhost:8080
- Plant Data API: http://localhost:8081

---

## Success Vision

GardenTime aims to be the go-to application for gardeners who want to:
- Practice regenerative agriculture
- Improve soil health over time
- Prevent disease through proper rotation
- Increase yields naturally
- Learn WHY practices work, not just follow rules
- Make data-driven decisions
- Track progress and success over multiple seasons

By combining scientific plant data with intelligent rotation planning, GardenTime empowers gardeners to create healthier, more productive gardens that work with nature rather than against it.

---

**Status:** Active Development  
**Priority:** HIGH - Core feature (rotation planner) ready for frontend integration  
**Next Milestone:** Complete rotation planner UI (3 weeks)

🌱 **Building better gardens through better planning** 🌱
