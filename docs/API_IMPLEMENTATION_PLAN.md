# Plant Data API - Implementation Checklist

## Overview

Building a comprehensive REST API in **plant-data-aggregator** to serve plant data for intelligent crop rotation planning in **gardentime**.

**Architecture:**
- **plant-data-aggregator**: Provides REST API with plant data (characteristics, families, companions, pests, diseases)
- **gardentime**: Consumes the plant data API and implements rotation planning logic based on user's garden history

**Important:** Rotation planning logic lives in gardentime, NOT in plant-data-aggregator. This service only provides the plant data that gardentime needs to make intelligent rotation decisions.

---

## API Endpoint Summary

### 7 Core Endpoint Groups

1. **Plant Information** (2 endpoints)
   - `GET /api/v1/plant-data/plants` - List/search plants
   - `GET /api/v1/plant-data/plants/{slug}` - Get plant details

2. **Plant Families** (2 endpoints)
   - `GET /api/v1/plant-data/families` - List all families
   - `GET /api/v1/plant-data/families/{name}/plants` - Plants by family

3. **Companion Planting** (2 endpoints)
   - `GET /api/v1/plant-data/plants/{slug}/companions` - Get companions
   - `POST /api/v1/plant-data/companions/check` - Check compatibility

4. **Rotation Planning** ✅ (IMPLEMENTED IN GARDENTIME - CORRECT LOCATION)
   - Rotation endpoints are in gardentime, NOT plant-data-aggregator
   - `POST /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/validate`
   - `GET /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/recommendations`

5. **Pest & Disease** (3 endpoints)
   - `GET /api/v1/plant-data/plants/{slug}/pests` - Plant pests
   - `GET /api/v1/plant-data/plants/{slug}/diseases` - Plant diseases
   - `GET /api/v1/plant-data/diseases/soil-borne` - Critical diseases

6. **Seasonal Planning** (1 endpoint)
   - `GET /api/v1/plant-data/plants/seasonal` - Seasonal recommendations

7. **Bulk Operations** (1 endpoint)
   - `POST /api/v1/plant-data/plants/bulk` - Multiple plant details

**Total:** 11 endpoints in plant-data-aggregator (2 rotation endpoints correctly in gardentime)

---

## Implementation Phases

### Phase 1: Foundation (Priority 1)
**Goal:** Basic plant data access

#### Repository Layer
- [ ] Create `PlantDataRepository` interface
- [ ] Extend existing `PlantRepository` with new methods
  - [ ] `findBySlug(slug: String)`
  - [ ] `findByFamily(familyId: Long)`
  - [ ] `findByFeederType(type: String)`
  - [ ] `searchByNameOrScientific(query: String)`
- [ ] Create `PlantFamilyRepository`
- [ ] Create `PlantCompanionRepository`
- [ ] Create `PlantPestRepository`
- [ ] Create `PlantDiseaseRepository`

#### DTO Layer
- [ ] Create `PlantSummaryDTO`
- [ ] Create `PlantDetailDTO`
- [ ] Create `FamilyDTO`
- [ ] Create `CompanionDTO`
- [ ] Create `PaginationDTO`
- [ ] Create `GrowthRequirementsDTO`
- [ ] Create `PlantingDetailsDTO`
- [ ] Create `CareRequirementsDTO`
- [ ] Create `HarvestDTO`
- [ ] Create `RotationDataDTO`

#### Service Layer
- [ ] Create `PlantDataService`
  - [ ] `getPlants(filters, pagination)` - List with filtering
  - [ ] `getPlantBySlug(slug)` - Single plant details
  - [ ] `searchPlants(query)` - Text search
  - [ ] `getPlantsByFamily(familyId)` - Family filtering

#### Controller Layer
- [ ] Create `PlantDataController`
  - [ ] `GET /plants` endpoint
  - [ ] `GET /plants/{slug}` endpoint
  - [ ] `GET /families` endpoint
  - [ ] `GET /families/{name}/plants` endpoint

#### Testing
- [ ] Repository tests
- [ ] Service tests
- [ ] Controller integration tests
- [ ] API documentation (Swagger)

**Estimated:** 3-5 days

---

### Phase 2: Companion Planting (Priority 2)
**Goal:** Companion planting suggestions

#### Service Layer
- [ ] Create `CompanionPlantingService`
  - [ ] `getCompanions(plantSlug, relationship?)` - Get companions
  - [ ] `checkCompatibility(plantSlugs[])` - Multi-plant check
  - [ ] `scoreCompatibility(plantSlugs[])` - Compatibility score
  - [ ] `getSuggestions(plantSlugs[])` - Improvement suggestions

#### DTOs
- [ ] Create `CompanionListDTO`
- [ ] Create `CompatibilityCheckDTO`
- [ ] Create `CompatibilityWarningDTO`
- [ ] Create `CompanionSuggestionDTO`

#### Controller
- [ ] Add companion endpoints to `PlantDataController`
  - [ ] `GET /plants/{slug}/companions`
  - [ ] `POST /companions/check`

#### Testing
- [ ] Unit tests for compatibility logic
- [ ] Integration tests for companion queries
- [ ] Test edge cases (circular relationships, etc.)

**Estimated:** 2-3 days

---

### Phase 3: Rotation Planning ✅ (CORRECTLY IN GARDENTIME)
**Status:** IMPLEMENTED IN GARDENTIME (correct location!)

Rotation planning logic is correctly implemented in the gardentime application, NOT in plant-data-aggregator.

**Why this is correct:**
- Rotation planning requires user's garden history (grow areas, past plantings)
- plant-data-aggregator only provides botanical data (characteristics, families, companions)
- gardentime fetches plant data from aggregator and applies rotation logic with user context

**Implemented in gardentime:**
- `RotationController` - REST API endpoints
- `RotationScoringService` - Scoring algorithm
- `RotationRecommendationService` - Recommendation engine
- `PlantDataApiClient` - Client to fetch data from aggregator

This architecture is correct and follows separation of concerns!

---

### Phase 4: Pest & Disease Management (Priority 4)
**Goal:** Pest/disease information for preventive planning

#### Service Layer
- [ ] Create `PestDiseaseService`
  - [ ] `getPestsForPlant(plantSlug)` - Plant pests
  - [ ] `getDiseasesForPlant(plantSlug)` - Plant diseases
  - [ ] `getSoilBorneDiseases()` - Critical rotation diseases
  - [ ] `getPlantsAffectedByPest(pestId)` - Reverse lookup
  - [ ] `getPlantsAffectedByDisease(diseaseId)` - Reverse lookup

#### DTOs
- [ ] Create `PestDTO`
- [ ] Create `DiseaseDTO`
- [ ] Create `PestListDTO`
- [ ] Create `DiseaseListDTO`

#### Controller
- [ ] Add pest/disease endpoints
  - [ ] `GET /plants/{slug}/pests`
  - [ ] `GET /plants/{slug}/diseases`
  - [ ] `GET /diseases/soil-borne`

#### Testing
- [ ] Test pest/disease queries
- [ ] Test reverse lookups
- [ ] Verify soil-borne filtering

**Estimated:** 2-3 days

---

### Phase 5: Advanced Features (Priority 5)
**Goal:** Seasonal planning and optimizations

#### Service Layer
- [ ] Create `SeasonalPlanningService`
  - [ ] `getSeasonalPlants(season, zone, climate)` - Seasonal filter
  - [ ] `calculatePlantingWindows(plant, climate)` - Date ranges
  - [ ] `getDirectSowPlants(season)` - Direct sow candidates
  - [ ] `getIndoorStartPlants(season)` - Indoor start plants

- [ ] Create `BulkPlantService`
  - [ ] `getPlantsBySlugsBulk(slugs[])` - Efficient bulk fetch

#### Performance Optimizations
- [ ] Add caching layer (Caffeine/Redis)
  - [ ] Cache plant details (TTL: 1 hour)
  - [ ] Cache companion relationships (TTL: 1 hour)
  - [ ] Cache rotation recommendations (TTL: 30 min)
- [ ] Add response compression (gzip)
- [ ] Optimize database queries with projections
- [ ] Add query result pagination

#### DTOs
- [ ] Create `SeasonalPlantDTO`
- [ ] Create `PlantingWindowDTO`
- [ ] Create `BulkPlantResponseDTO`

#### Controller
- [ ] Add seasonal endpoint
  - [ ] `GET /plants/seasonal`
- [ ] Add bulk endpoint
  - [ ] `POST /plants/bulk`

#### Testing
- [ ] Test seasonal filtering logic
- [ ] Test bulk operations performance
- [ ] Test caching behavior
- [ ] Load testing

**Estimated:** 3-4 days

---

### Phase 6: Documentation & Testing (Priority 6)
**Goal:** Production-ready API with docs

#### Documentation
- [ ] Generate OpenAPI/Swagger specification
- [ ] Add Swagger UI endpoint (`/swagger-ui`)
- [ ] Write API usage guide
- [ ] Create example requests/responses
- [ ] Document error responses
- [ ] Add rate limiting docs

#### Testing
- [ ] Achieve 80%+ code coverage
- [ ] Add end-to-end integration tests
- [ ] Performance benchmarking
- [ ] API contract tests
- [ ] Mock data for testing

#### Error Handling
- [ ] Implement global exception handler
- [ ] Standardize error response format
- [ ] Add validation error details
- [ ] Log errors appropriately

#### Security
- [ ] Add API versioning headers
- [ ] Implement rate limiting
- [ ] Add CORS configuration
- [ ] API key authentication (if needed)

**Estimated:** 2-3 days

---

## Technology Stack

### Backend (Kotlin/Spring Boot)
- **Framework:** Spring Boot 3.x
- **Database:** PostgreSQL 16
- **ORM:** Spring Data JPA / Hibernate
- **API Docs:** SpringDoc OpenAPI (Swagger)
- **Caching:** Caffeine (local) or Redis (distributed)
- **Testing:** JUnit 5, MockK, Spring Test

### Database
- ✅ PostgreSQL with optimized indexes
- ✅ 76 plants with full data
- ✅ 881 companion relationships
- ✅ 191 pests, 112 diseases
- ✅ 19 plant families

---

## Milestones

### Milestone 1: MVP (Week 1-2)
- ✅ Database schema complete
- ✅ Data imported
- ⏳ Basic plant CRUD endpoints
- ⏳ Family endpoints
- ⏳ Simple companion lookup

**Deliverable:** Can list plants, get details, view families

### Milestone 2: Companion Features (Week 2-3)
- ⏳ Companion planting endpoints
- ⏳ Compatibility checking
- ⏳ Basic recommendations

**Deliverable:** Can check plant compatibility

### Milestone 3: Rotation Planning (Week 3-4)
- ⏳ Rotation validation
- ⏳ Scoring algorithm
- ⏳ Recommendation engine

**Deliverable:** Can validate rotation plans and get suggestions

### Milestone 4: Production Ready (Week 4-5)
- ⏳ Pest/disease endpoints
- ⏳ Seasonal planning
- ⏳ Performance optimization
- ⏳ Complete documentation
- ⏳ Testing suite

**Deliverable:** Production-ready API with docs

---

## Success Metrics

### Functional
- [ ] All 13 endpoints implemented
- [ ] All plant data accessible via API
- [ ] Rotation validation working with scoring
- [ ] Companion checking accurate

### Performance
- [ ] <100ms response time for simple queries
- [ ] <500ms for complex rotation analysis
- [ ] Support 100 concurrent requests
- [ ] Efficient pagination for large result sets

### Quality
- [ ] 80%+ test coverage
- [ ] Zero critical bugs
- [ ] Complete API documentation
- [ ] All error cases handled

### Documentation
- [ ] OpenAPI spec complete
- [ ] Interactive Swagger UI
- [ ] Usage examples for all endpoints
- [ ] Client SDK (TypeScript)

---

## Resource Requirements

### Development
- **Backend Developer:** 4-5 weeks
- **Code Review:** Ongoing
- **Testing:** Ongoing

### Infrastructure
- **Database:** Existing PostgreSQL
- **Cache:** Redis (optional, can use Caffeine)
- **API Server:** Spring Boot app

---

## Risks & Mitigation

### Risk 1: Complex Rotation Logic
**Mitigation:** Break into smaller scoring components, extensive testing

### Risk 2: Performance with Large Datasets
**Mitigation:** Database indexes ✅, caching layer, query optimization

### Risk 3: Incomplete Plant Data
**Mitigation:** 47% have companion data, identify gaps, progressive enhancement

### Risk 4: API Changes Breaking Clients
**Mitigation:** API versioning, backward compatibility, deprecation notices

---

## Next Actions

### Immediate (This Week)
1. ✅ Review and approve API design
2. ⏳ Start Phase 1: Repository layer
3. ⏳ Create base DTOs
4. ⏳ Implement first 2 endpoints

### Short Term (Next 2 Weeks)
1. Complete Phase 1-2
2. Start rotation planning logic
3. Begin test coverage

### Long Term (Month 2)
1. Complete all phases
2. Production deployment
3. Client integration
4. Monitor and optimize

---

## Files to Create

### Repository Layer
- `PlantFamilyRepository.kt`
- `CompanionPlantingRepository.kt` (extend existing)
- `PestRepository.kt` (extend existing)
- `DiseaseRepository.kt` (extend existing)

### Service Layer
- `PlantDataService.kt`
- `CompanionPlantingService.kt`
- `RotationPlanningService.kt`
- `PestDiseaseService.kt`
- `SeasonalPlanningService.kt`

### DTO Layer (in `dto/plantdata/`)
- `PlantSummaryDTO.kt`
- `PlantDetailDTO.kt`
- `FamilyDTO.kt`
- `CompanionDTO.kt`
- `RotationValidationDTO.kt`
- `PestDTO.kt`
- `DiseaseDTO.kt`

### Controller
- `PlantDataController.kt` (new v1 API)

### Tests
- `PlantDataServiceTest.kt`
- `RotationPlanningServiceTest.kt`
- `CompanionPlantingServiceTest.kt`
- `PlantDataControllerTest.kt`

---

## Estimated Timeline

**Phase 1-2:** 5-8 days  
**Phase 3:** 4-6 days  
**Phase 4:** 2-3 days  
**Phase 5:** 3-4 days  
**Phase 6:** 2-3 days  

**Total:** 16-24 days (3-5 weeks)

With proper prioritization and parallel work on tests/docs, **could be production-ready in 3-4 weeks**.
