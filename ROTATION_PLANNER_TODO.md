# Crop Rotation Planner - Implementation Checklist

**Status**: Ready to implement  
**Priority**: HIGH - Core differentiating feature  
**Timeline**: 5 weeks

---

## Phase 1: Foundation & API Client ⏳

### API Client to plant-data-aggregator
- [ ] Create `PlantDataApiClient.kt` with methods:
  - [ ] `getPlantDetails(name)` 
  - [ ] `getFamilies()`
  - [ ] `getSoilBorneDiseases()`
  - [ ] `getCompanions(name)`
- [ ] Create mirrored DTOs from plant-data-aggregator
- [ ] Configure RestTemplate with retry logic
- [ ] Add `plantdata.api.url` to application.yml
- [ ] Implement caching (TTL: 1 hour)
- [ ] Write unit tests with WireMock
- [ ] Write integration tests

---

## Phase 2: Planting History Enhancement ⏳

### Database Schema
- [ ] Create migration V10 to add rotation fields to CropRecord:
  - [ ] `plant_family VARCHAR(100)`
  - [ ] `plant_genus VARCHAR(100)`
  - [ ] `feeder_type VARCHAR(20)` (HEAVY/MODERATE/LIGHT)
  - [ ] `is_nitrogen_fixer BOOLEAN`
  - [ ] `root_depth VARCHAR(20)` (SHALLOW/MEDIUM/DEEP)
  - [ ] `had_diseases BOOLEAN DEFAULT false`
  - [ ] `disease_names TEXT`
  - [ ] `disease_notes TEXT`
  - [ ] `yield_rating INTEGER` (1-5 stars)
  - [ ] `soil_quality_after INTEGER` (1-5)
- [ ] Add indexes on `plant_family`, `grow_zone_id`, `planting_date`

### Service Enhancement
- [ ] Update `CropRecordService.createCropRecord()`:
  - [ ] Fetch plant data from API
  - [ ] Cache family, genus, feeder type, etc. in CropRecord
  - [ ] Handle API failures gracefully
- [ ] Add method to update disease information
- [ ] Add method to rate yields

### Repository
- [ ] Add query: `findByGrowZoneIdAndPlantingDateAfter()`
- [ ] Add query: `findByGrowZoneIdAndPlantingDateAfterAndHarvestDateIsNull()`

---

## Phase 3: Rotation Scoring Engine ⏳

### Core Files
- [ ] Create `rotation/RotationRules.kt`:
  - [ ] Define family rotation intervals map
  - [ ] Define scoring weights (35+25+20+10+10=100)
  - [ ] Disease persistence data structure
- [ ] Create `rotation/RotationScoringService.kt`
- [ ] Create `rotation/dto/RotationScore.kt`
- [ ] Create `rotation/dto/ScoreComponent.kt`
- [ ] Create `rotation/dto/RotationIssue.kt`
- [ ] Create `rotation/dto/RotationBenefit.kt`

### Scoring Components
- [ ] **Family Rotation Scoring (35 points)**:
  - [ ] Check years since same family
  - [ ] Apply family-specific intervals
  - [ ] Generate CRITICAL issues for < 1 year
  - [ ] Generate WARNING for < 2 years
- [ ] **Nutrient Balance Scoring (25 points)**:
  - [ ] Nitrogen fixer after heavy = 25 pts
  - [ ] Light after heavy = 20 pts
  - [ ] Heavy after nitrogen fixer = 25 pts
  - [ ] Heavy after heavy = 10 pts
- [ ] **Disease Risk Scoring (20 points)**:
  - [ ] Fetch soil-borne diseases from API
  - [ ] Check disease history in grow area
  - [ ] Calculate years since diseased crop
  - [ ] Penalize if within persistence period
- [ ] **Root Depth Diversity (10 points)**:
  - [ ] Check last 3 crops
  - [ ] Reward depth variation
  - [ ] Penalize same depth repeatedly
- [ ] **Companion Compatibility (10 points)**:
  - [ ] Fetch companions from API
  - [ ] Check against current crops in area
  - [ ] Penalize antagonistic neighbors
  - [ ] Bonus for beneficial neighbors

### Helper Methods
- [ ] `getPlantingHistory(growAreaId, yearsBack)`
- [ ] `getCurrentCrops(growAreaId)`
- [ ] `calculateGrade(score)` → EXCELLENT/GOOD/FAIR/POOR/AVOID
- [ ] `generateRecommendation(score)` → human-readable text
- [ ] `collectIssues()` and `collectBenefits()`

### Testing
- [ ] Unit tests for each scoring component
- [ ] Test edge cases (no history, unknown family)
- [ ] Test critical disease scenarios
- [ ] Test nutrient balance scenarios
- [ ] Integration tests with real data

---

## Phase 4: Recommendation Engine ⏳

### Service
- [ ] Create `rotation/RotationRecommendationService.kt`
- [ ] Create `rotation/dto/PlantRecommendation.kt`
- [ ] Implement `getRecommendations(growAreaId, season, maxResults)`:
  - [ ] Fetch all plants from API
  - [ ] Score each plant for the grow area
  - [ ] Filter score >= 60
  - [ ] Sort by score descending
  - [ ] Return top N recommendations
- [ ] Generate suitability reasons for each recommendation
- [ ] Add seasonal filtering (optional)

### Testing
- [ ] Test recommendation quality
- [ ] Verify top recommendations make agronomic sense
- [ ] Test with different history scenarios
- [ ] Performance test (should be < 2 seconds)

---

## Phase 5: REST API Endpoints ⏳

### Controller
- [ ] Create `api/RotationController.kt`
- [ ] **POST** `/api/gardens/{id}/grow-areas/{id}/rotation/validate`
  - [ ] Request: plantName, plantingDate
  - [ ] Response: RotationScore with issues/benefits
  - [ ] Error handling for unknown plants
- [ ] **GET** `/api/gardens/{id}/grow-areas/{id}/rotation/recommendations`
  - [ ] Query params: season, maxResults
  - [ ] Response: List<PlantRecommendation>
  - [ ] Handle empty history gracefully
- [ ] **GET** `/api/gardens/{id}/grow-areas/{id}/rotation/history`
  - [ ] Query param: yearsBack (default 5)
  - [ ] Response: PlantingHistoryResponse
  - [ ] Sorted by date descending

### Security
- [ ] Verify user owns garden
- [ ] Validate grow area belongs to garden
- [ ] Input validation for all parameters

### Documentation
- [ ] OpenAPI/Swagger docs for all endpoints
- [ ] Example requests and responses
- [ ] Error response documentation

### Testing
- [ ] Integration tests for all endpoints
- [ ] Test authorization
- [ ] Test error cases (404, 400, etc.)

---

## Phase 6: Frontend Integration ⏳

### API Client (TypeScript)
- [ ] Create `lib/api/rotation.ts`:
  - [ ] `validateRotation(gardenId, growAreaId, plantName)`
  - [ ] `getRecommendations(gardenId, growAreaId, filters)`
  - [ ] `getRotationHistory(gardenId, growAreaId, years)`
- [ ] Type definitions for all DTOs
- [ ] Error handling

### React Components
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
  - [ ] Expandable details
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

### UI/UX Features
- [ ] Visual rotation calendar (timeline view)
- [ ] Family color legend
- [ ] Disease risk indicators
- [ ] Interactive tooltips explaining scores
- [ ] Mobile-responsive design
- [ ] Loading states
- [ ] Empty state (no history)

### Routing
- [ ] Add route: `/gardens/[id]/rotation`
- [ ] Add route: `/gardens/[id]/grow-areas/[areaId]/rotation`
- [ ] Navigation from garden dashboard

---

## Phase 7: Enhanced Features ⏳

### Rotation Templates
- [ ] Create pre-configured rotation plans:
  - [ ] Classic 4-year rotation
  - [ ] 3-bed rotation system
  - [ ] Intensive raised bed rotation
  - [ ] Permaculture guild rotation
- [ ] Allow users to apply templates to grow areas
- [ ] Customize template parameters

### Multi-Year Planning
- [ ] Plan rotations 3-5 years ahead
- [ ] Visual multi-year calendar
- [ ] Save planned rotations
- [ ] Track deviations from plan

### Analytics Dashboard
- [ ] Soil health trends over time
- [ ] Family diversity metrics
- [ ] Nutrient balance tracking
- [ ] Disease pressure heat maps
- [ ] Yield tracking by rotation score

### Educational Content
- [ ] Tooltips explaining rotation principles
- [ ] Links to regenerative farming resources
- [ ] Success stories/case studies
- [ ] Seasonal tips

---

## Testing & Quality Assurance ⏳

### Backend Tests
- [ ] Unit tests: 80%+ coverage
- [ ] Integration tests for all services
- [ ] API endpoint tests
- [ ] Performance tests (< 500ms validation)
- [ ] Load testing (concurrent users)

### Frontend Tests
- [ ] Component tests (React Testing Library)
- [ ] E2E tests (Playwright/Cypress)
- [ ] Visual regression tests
- [ ] Accessibility tests (a11y)

### User Testing
- [ ] Beta test with real gardeners
- [ ] Validate rotation rules accuracy
- [ ] Gather feedback on UI/UX
- [ ] Test with different experience levels

### Documentation
- [ ] User guide: How to use rotation planner
- [ ] Developer docs: How scoring works
- [ ] API documentation
- [ ] Troubleshooting guide

---

## Deployment Checklist ⏳

### Prerequisites
- [ ] plant-data-aggregator API running and accessible
- [ ] Database migration V10 applied
- [ ] API client configuration in prod
- [ ] Caching configured
- [ ] Error monitoring (Sentry)

### Performance
- [ ] API client caching enabled
- [ ] Database indexes created
- [ ] Query optimization verified
- [ ] Load testing passed

### Monitoring
- [ ] Logs for rotation validations
- [ ] Metrics: avg score, validation count
- [ ] Alert on API failures
- [ ] Track user engagement

---

## Success Criteria ✅

### Functional
- [ ] Can validate any plant in any grow area
- [ ] Catches critical violations (< 2 year rotation)
- [ ] Disease history properly tracked
- [ ] Recommendations score >= 75 average
- [ ] Handles edge cases gracefully

### Performance
- [ ] Rotation validation < 500ms
- [ ] Recommendations < 2 seconds
- [ ] Handles 50+ crop records per area
- [ ] API failures handled gracefully

### User Experience
- [ ] Intuitive rotation calendar
- [ ] Clear, actionable recommendations
- [ ] Easy to understand scoring
- [ ] Mobile-friendly
- [ ] Helpful error messages

---

## Current Status

**Phase 1**: Not started  
**Phase 2**: Not started  
**Phase 3**: Not started  
**Phase 4**: Not started  
**Phase 5**: Not started  
**Phase 6**: Not started  
**Phase 7**: Not started  

**Dependencies Met**:
- ✅ plant-data-aggregator API complete with all needed endpoints
- ✅ Soil-borne disease data available
- ✅ Plant family data available
- ✅ Companion relationship data available
- ✅ CropRecord model exists
- ✅ GrowArea model exists

**Ready to Start**: YES 🚀

---

## Next Steps

1. **Immediate**: Create API client to plant-data-aggregator
2. **Week 1**: Enhance CropRecord with rotation fields
3. **Week 2**: Build rotation scoring engine
4. **Week 3**: Implement recommendation engine + API
5. **Week 4**: Frontend integration
6. **Week 5**: Polish + testing

This will be a **game-changing feature** for GardenTime! 🌱
