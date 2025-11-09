# Crop Rotation Planner - Implementation Checklist

**Status**: Backend Complete ✅ | Frontend Integration In Progress ⏳  
**Priority**: HIGH - Core differentiating feature  
**Last Updated**: 2025-11-06

---

## Phase 1: Foundation & API Client ✅ COMPLETE

### API Client to plant-data-aggregator
- ✅ Created `PlantDataApiClient.kt` with methods:
  - ✅ `getPlantDetails(name)` 
  - ✅ `getFamilies()`
  - ✅ `getSoilBorneDiseases()`
  - ✅ `getCompanions(name)`
- ✅ Created mirrored DTOs from plant-data-aggregator
- ✅ Configured RestTemplate with retry logic
- ✅ Added `plantdata.api.url` to application.yml
- ✅ Implemented caching (TTL: 1 hour)
- ✅ Error handling and resilience

**Commit**: 5faf9d6

---

## Phase 2: Planting History Enhancement ✅ COMPLETE

### Database Schema
- ✅ Created migration V10 with rotation fields in CropRecord:
  - ✅ `plant_family VARCHAR(100)`
  - ✅ `feeder_type VARCHAR(20)` (HEAVY/MODERATE/LIGHT)
  - ✅ `is_nitrogen_fixer BOOLEAN`
  - ✅ `root_depth VARCHAR(20)` (SHALLOW/MEDIUM/DEEP)
  - ✅ `had_diseases BOOLEAN DEFAULT false`
  - ✅ `disease_names TEXT`
  - ✅ `yield_rating INTEGER` (1-5 stars)
- ✅ Added indexes for performance

### Service Enhancement
- ✅ Updated `CropRecordService.createCropRecord()`:
  - ✅ Fetches plant data from API
  - ✅ Caches family, genus, feeder type, etc. in CropRecord
  - ✅ Handles API failures gracefully
- ✅ Added methods to update disease information
- ✅ Added methods to rate yields

### Repository
- ✅ Added custom queries for rotation analysis

**Commit**: 3d89457

---

## Phase 3: Rotation Scoring Engine ✅ COMPLETE

### Core Files
- ✅ Created `rotation/RotationRules.kt`:
  - ✅ Family rotation intervals map (2-4 years by family)
  - ✅ Scoring weights (35+25+20+10+10=100)
  - ✅ Disease persistence data structure
- ✅ Created `rotation/RotationScoringService.kt` (567 lines)
- ✅ Created `rotation/dto/RotationScore.kt`
- ✅ Created `rotation/dto/ScoreComponent.kt`
- ✅ Created `rotation/dto/RotationIssue.kt`
- ✅ Created `rotation/dto/RotationBenefit.kt`

### Scoring Components (0-100 points)
- ✅ **Family Rotation Scoring (35 points)**:
  - ✅ Checks years since same family
  - ✅ Family-specific intervals (2-4 years)
  - ✅ CRITICAL issues for < 1 year
  - ✅ WARNING for < 2 years
- ✅ **Nutrient Balance Scoring (25 points)**:
  - ✅ Nitrogen fixer after heavy = 25 pts
  - ✅ Light after heavy = 20 pts
  - ✅ Heavy after nitrogen fixer = 25 pts
  - ✅ Heavy after heavy = 10 pts
- ✅ **Disease Risk Scoring (20 points)**:
  - ✅ Fetches soil-borne diseases from API
  - ✅ Checks disease history in grow area
  - ✅ Calculates years since diseased crop
  - ✅ Penalizes if within persistence period (3-20 years)
- ✅ **Root Depth Diversity (10 points)**:
  - ✅ Checks last 3 crops
  - ✅ Rewards depth variation
  - ✅ Penalizes same depth repeatedly
- ✅ **Companion Compatibility (10 points)**:
  - ✅ Fetches companions from API
  - ✅ Checks against current crops in area
  - ✅ Penalizes antagonistic neighbors
  - ✅ Bonus for beneficial neighbors

### Helper Methods
- ✅ `getPlantingHistory(growAreaId, yearsBack)`
- ✅ `getCurrentCrops(growAreaId)`
- ✅ `calculateGrade(score)` → EXCELLENT/GOOD/FAIR/POOR/AVOID
- ✅ `generateRecommendation(score)` → human-readable text
- ✅ `collectIssues()` and `collectBenefits()`

### Testing
- ✅ Comprehensive unit tests (RotationScoringServiceTest.kt)
- ✅ Edge cases covered (no history, unknown family)
- ✅ Disease scenarios tested
- ✅ Nutrient balance scenarios tested

**Commit**: 8ef6038

---

## Phase 4: Recommendation Engine ✅ COMPLETE

### Service
- ✅ Created `rotation/RotationRecommendationService.kt`
- ✅ Created `rotation/dto/PlantRecommendation.kt`
- ✅ Implemented `getRecommendations(growAreaId, season, maxResults)`:
  - ✅ Fetches all plants from API
  - ✅ Scores each plant for the grow area
  - ✅ Filters score >= 60
  - ✅ Sorts by score descending
  - ✅ Returns top N recommendations
- ✅ Generates suitability reasons for each recommendation
- ✅ Seasonal filtering (optional)

### Features
- ✅ Multiple recommendation modes:
  - ✅ General recommendations
  - ✅ Soil improvement focus
  - ✅ Grouped by family
  - ✅ Companion-based recommendations
- ✅ User-friendly explanations
- ✅ Performance optimized

**Commit**: 3be2f8a

---

## Phase 5: REST API Endpoints ✅ COMPLETE

### Controller
- ✅ Created `api/RotationController.kt`
- ✅ **POST** `/api/gardens/{id}/grow-areas/{areaId}/rotation/validate`
  - ✅ Request: ValidateRotationRequest (plantName, plantingDate)
  - ✅ Response: RotationValidationResponse with score, issues, benefits
  - ✅ Error handling for unknown plants
- ✅ **GET** `/api/gardens/{id}/grow-areas/{areaId}/rotation/recommendations`
  - ✅ Query params: season, maxResults, grouped
  - ✅ Response: List<PlantRecommendation>
  - ✅ Handles empty history gracefully
- ✅ **GET** `/api/gardens/{id}/grow-areas/{areaId}/rotation/recommendations/soil-improvement`
  - ✅ Focuses on nitrogen fixers and soil builders
- ✅ **GET** `/api/gardens/{id}/grow-areas/{areaId}/rotation/recommendations/by-family`
  - ✅ Groups recommendations by plant family
- ✅ **GET** `/api/gardens/{id}/grow-areas/{areaId}/rotation/companions`
  - ✅ Companion-based recommendations
- ✅ **GET** `/api/gardens/{id}/grow-areas/{areaId}/rotation/avoid`
  - ✅ Plants to avoid (score < 40)

### Security
- ✅ Verifies user owns garden
- ✅ Validates grow area belongs to garden
- ✅ Input validation for all parameters

### Testing
- ✅ Integration tests for all endpoints
- ✅ Authorization testing
- ✅ Error case handling (404, 400, etc.)

**Commit**: 3be2f8a

---

## Phase 6: User Feedback Enhancement ✅ COMPLETE

### Enhanced Messaging
- ✅ Created `rotation/RotationMessageService.kt`
- ✅ User-friendly explanations for all issues and benefits
- ✅ Contextual messages based on severity:
  - ✅ CRITICAL: Detailed warnings with agronomic reasoning
  - ✅ WARNING: Cautionary notes with best practices
  - ✅ INFO: Educational tips and suggestions
- ✅ Expanded "read more" content for deeper learning
- ✅ Actionable recommendations

### Message Categories
- ✅ Family rotation violations (too soon, disease risk)
- ✅ Nutrient balance feedback (heavy feeders, nitrogen fixers)
- ✅ Disease risk warnings (soil-borne disease persistence)
- ✅ Root depth benefits
- ✅ Companion compatibility notes

**Commit**: ab5c2d1

---

## Phase 7: Frontend Integration ⏳ IN PROGRESS

### API Client (TypeScript) ⏳
- [ ] Create `lib/api/rotation.ts`:
  - [ ] `validateRotation(gardenId, growAreaId, plantName)`
  - [ ] `getRecommendations(gardenId, growAreaId, filters)`
  - [ ] `getRotationHistory(gardenId, growAreaId, years)`
- [ ] Type definitions for all DTOs
- [ ] Error handling

### React Components ⏳
- [ ] `components/rotation/RotationPlanner.tsx`:
  - [ ] Main container component
  - [ ] Grow area selector
  - [ ] Plant search/selector
  - [ ] Trigger validation on selection
- [ ] `components/rotation/RotationScore.tsx`:
  - [ ] Score visualization (0-100 gauge)
  - [ ] Grade badge (EXCELLENT/GOOD/FAIR/POOR/AVOID)
  - [ ] Breakdown by component (5 categories)
  - [ ] Color coding (green/yellow/red)
- [ ] `components/rotation/RotationIssues.tsx`:
  - [ ] List of issues with severity icons
  - [ ] Expandable "read more" sections
  - [ ] Actionable suggestions
- [ ] `components/rotation/RotationBenefits.tsx`:
  - [ ] List of benefits
  - [ ] Educational tooltips
- [ ] `components/rotation/PlantRecommendations.tsx`:
  - [ ] Grid/list of recommended plants
  - [ ] Scores for each plant
  - [ ] Quick "plant this" action
  - [ ] Filter by season, family
- [ ] `components/rotation/PlantingHistory.tsx`:
  - [ ] Timeline visualization
  - [ ] Family color coding
  - [ ] Clickable crops for details
  - [ ] Years displayed horizontally

### UI/UX Features ⏳
- [ ] Visual rotation calendar (timeline view)
- [ ] Family color legend
- [ ] Disease risk indicators
- [ ] Interactive tooltips explaining scores
- [ ] "Read more" expandable sections
- [ ] Mobile-responsive design
- [ ] Loading states
- [ ] Empty state (no history)

### Routing ⏳
- [ ] Add route: `/gardens/[id]/rotation`
- [ ] Add route: `/gardens/[id]/grow-areas/[areaId]/rotation`
- [ ] Navigation from garden dashboard

---

## Phase 7: Frontend Integration ⏳ NEXT STEPS

### Season Planner Integration ⏳
- [ ] **Integrate into existing Season Planner UI**:
  - [ ] Add rotation recommendations to "Add Crop" modal
  - [ ] Show rotation score when selecting plants
  - [ ] Display warnings for poor rotation choices
  - [ ] Surface recommendations in plant search

### API Client (TypeScript) ⏳
- [ ] Create `lib/clients/plantDataApiClient.ts`:
  - [ ] `searchPlants(query)` - Search plant database
  - [ ] `getPlantDetails(name)` - Get plant characteristics
  - [ ] Type definitions for all DTOs
  - [ ] Error handling
  - [ ] Caching layer
- [ ] Create `lib/api/rotation.ts`:
  - [ ] `getRecommendations(gardenId, growAreaId, filters)` - Get rotation recommendations
  - [ ] `validateRotation(gardenId, growAreaId, plantName)` - Validate a crop choice
  - [ ] Type definitions for all DTOs
  - [ ] Error handling

### Season Planner Enhancements ⏳
- [ ] **AddCropToSeasonModal improvements**:
  - [ ] Fetch rotation recommendations when modal opens
  - [ ] Display recommended plants with scores
  - [ ] Add visual indicators (✅ EXCELLENT, ⚠️ WARNING, ❌ AVOID)
  - [ ] Show "why this is recommended" tooltips
  - [ ] Filter search results by rotation score
  - [ ] Add "Read more" expandable sections

### Rotation Feedback Components ⏳
- [ ] `components/rotation/RotationScore.tsx`:
  - [ ] Score badge (0-100 with color)
  - [ ] Grade display (EXCELLENT/GOOD/FAIR/POOR/AVOID)
  - [ ] Compact visualization for modals
- [ ] `components/rotation/RotationIssues.tsx`:
  - [ ] List of issues with severity icons
  - [ ] Expandable "read more" sections
  - [ ] Actionable suggestions
  - [ ] Educational content
- [ ] `components/rotation/RotationBenefits.tsx`:
  - [ ] List of benefits
  - [ ] Icons for benefit types
  - [ ] Educational tooltips

### UI/UX Improvements ⏳
- [ ] Rotation score indicators in plant cards
- [ ] Color coding for rotation compatibility
- [ ] Interactive tooltips explaining scores
- [ ] "Read more" expandable sections for education
- [ ] Loading states for API calls
- [ ] Error states with helpful messages
- [ ] Mobile-responsive design

### Advanced Features (Future) 📋
- [ ] Full rotation planner page
- [ ] Visual rotation calendar (timeline view)
- [ ] Multi-year rotation planning
- [ ] Planting history visualization
- [ ] Family color legend
- [ ] Disease risk indicators

---

## Current Status Summary

### Backend (Gardentime)
**Status**: ✅ **PRODUCTION READY**

- ✅ Phase 1: Plant Data API Client (COMPLETE)
- ✅ Phase 2: Planting History Enhancement (COMPLETE)
- ✅ Phase 3: Rotation Scoring Engine (COMPLETE)
- ✅ Phase 4: Recommendation Engine (COMPLETE)
- ✅ Phase 5: REST API Endpoints (COMPLETE)
- ✅ Phase 6: User Feedback Enhancement (COMPLETE)

**Backend Features**:
- ✅ Intelligent 5-factor rotation scoring (0-100 points)
- ✅ Family rotation validation (2-4 year intervals)
- ✅ Nutrient balance analysis
- ✅ Disease risk assessment (soil-borne disease tracking)
- ✅ Root depth diversity scoring
- ✅ Companion compatibility checking
- ✅ Multiple recommendation modes
- ✅ User-friendly explanations with "read more" content
- ✅ 6 REST API endpoints

### Plant Data Aggregator
**Status**: ✅ **COMPLETE**

- ✅ Plant information API
- ✅ Plant families API
- ✅ Companion planting API
- ✅ Pest & disease API
- ✅ Bulk operations API
- ✅ 12/13 endpoints implemented (92%)
- ⏳ Seasonal planning endpoint (remaining)

### Frontend (Next.js)
**Status**: ⏳ **IN PROGRESS**

- ⏳ Phase 7: Season Planner Integration (NEXT)
- 📋 Future: Full rotation planner UI

**Next Immediate Steps**:
1. Create plant data API client in Next.js
2. Integrate rotation recommendations into Season Planner
3. Add rotation feedback to "Add Crop" modal
4. Implement visual indicators for rotation quality

---

## Dependencies Met

- ✅ plant-data-aggregator API complete
- ✅ Soil-borne disease data available
- ✅ Plant family data available
- ✅ Companion relationship data available
- ✅ CropRecord model with rotation fields
- ✅ GrowArea model exists
- ✅ Season Planner UI exists
- ✅ All backend APIs tested and working

**Ready for Frontend Integration**: YES 🚀

---

## Success Metrics

### Backend ✅ ACHIEVED
- ✅ Rotation validation < 500ms
- ✅ Recommendations < 2 seconds
- ✅ Comprehensive test coverage
- ✅ Handles edge cases gracefully
- ✅ User-friendly error messages
- ✅ Educational content in responses

### Frontend ⏳ TARGET
- [ ] Rotation scores visible in UI
- [ ] Recommendations integrated into season planner
- [ ] Users can see why plants are recommended
- [ ] Mobile-friendly interface
- [ ] Clear visual indicators for rotation quality
- [ ] "Read more" sections for education

This is a **game-changing feature** for GardenTime! The backend is production-ready, now we need to surface it in the UI. 🌱✨
