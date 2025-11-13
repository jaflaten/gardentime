# Architecture Clarification Summary

## Current Architecture (CORRECT)

### Two Separate Applications

#### 1. plant-data-aggregator (Port 8081)
**Purpose:** Botanical plant data API
- **Database:** `plant_data_aggregator` (PostgreSQL)
- **Data:** 76 plants, 881 companion relationships, 191 pests, 112 diseases, 19 families
- **API Base:** `/api/v1/plant-data/*`
- **Endpoints:**
  - `GET /api/v1/plant-data/plants` - List/search plants
  - `GET /api/v1/plant-data/plants/{name}` - Plant details
  - `GET /api/v1/plant-data/plants/search?q=` - Search
  - `GET /api/v1/plant-data/families` - Plant families
  - `GET /api/v1/plant-data/families/{name}/plants` - Plants by family
  - `GET /api/v1/plant-data/plants/{name}/companions` - Companions
  - `POST /api/v1/plant-data/companions/check` - Check compatibility
  - `GET /api/v1/plant-data/plants/{name}/pests` - Plant pests
  - `GET /api/v1/plant-data/plants/{name}/diseases` - Plant diseases
  - `GET /api/v1/plant-data/diseases/soil-borne` - Soil-borne diseases
  - `POST /api/v1/plant-data/plants/bulk` - Bulk plant fetch

#### 2. gardentime (Port 8080)
**Purpose:** Garden management and crop rotation planning
- **Database:** `gardentime` (PostgreSQL)
- **Data:** Users, gardens, grow areas, season plans, planned crops, crop records
- **API Base:** `/api/*`
- **Core Features:**
  - User authentication
  - Garden management
  - Grow area management
  - Season planning
  - **Crop rotation planning (CORRECT LOCATION)**
  - Crop record tracking

**Rotation Planning Endpoints (in gardentime - CORRECT):**
- `POST /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/validate`
- `GET /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/recommendations`

**Why rotation is in gardentime:**
- Requires user's garden history (what was planted where)
- Requires grow area information (sun exposure, soil conditions)
- Fetches botanical data from plant-data-aggregator API
- Applies rotation logic with user context

#### 3. client-next (Port 3000)
**Purpose:** Next.js BFF (Backend-for-Frontend)
- Proxies requests to gardentime backend (Port 8080) ONLY
- Handles authentication with gardentime
- Serves React frontend

## Data Flow

```
Frontend (React)
    ↓
Next.js BFF (Port 3000)
    ↓
gardentime backend (Port 8080)
    ↓ (when needing plant data)
plant-data-aggregator API (Port 8081)
```

## Issues Found & Fixed

### ❌ Wrong: PlantDataProxyController in gardentime
- Created proxy endpoints in gardentime at `/api/plants/*`, `/api/companions/*`, etc.
- This violates architecture separation
- **Should be removed** - frontend should not directly call these

### ❌ Wrong: Old PlantController in plant-data-aggregator
- Has conflicting endpoints at `/api/plants` (old API)
- Should be removed - use PlantDataController instead

### ✅ Correct: PlantDataApiClient in gardentime
- HTTP client to call plant-data-aggregator
- Used by rotation services to fetch plant data
- Proper separation of concerns

## What Needs to Be Done

### Phase 1: Clean up gardentime
1. ❌ Remove `PlantDataProxyController` from gardentime
2. ✅ Keep `PlantDataApiClient` (HTTP client)
3. ✅ Keep rotation endpoints in `RotationController`

### Phase 2: Complete plant-data-aggregator API
According to API_IMPLEMENTATION_PLAN.md:

**Phase 1: Foundation** ⚠️ Partially complete
- ✅ PlantDataController created
- ✅ Basic plant endpoints
- ✅ Family endpoints
- ⏳ Need to complete DTO layer refinements
- ⏳ Need comprehensive testing

**Phase 2: Companion Planting** ✅ Complete
- ✅ CompanionPlantingService
- ✅ Companion endpoints
- ✅ Compatibility checking

**Phase 3: Rotation Planning** ✅ Correctly in gardentime
- Already implemented in gardentime
- Correct architecture

**Phase 4: Pest & Disease** ✅ Complete
- ✅ PestDiseaseService
- ✅ Pest/disease endpoints
- ✅ Soil-borne disease tracking

**Phase 5: Advanced Features** ⏳ Not started
- ⏳ Seasonal planning
- ⏳ Bulk operations
- ⏳ Caching layer
- ⏳ Performance optimizations

**Phase 6: Documentation & Security** ⏳ In progress
- ⏳ API documentation
- ⏳ Security configuration
- ⏳ Comprehensive testing

### Phase 3: Remove old endpoints
1. Remove old `PlantController` from plant-data-aggregator (use PlantDataController)

### Phase 4: Security
- Add API key or service-to-service auth between gardentime and plant-data-aggregator
- Currently open - needs protection

## Summary

The architecture is **fundamentally correct**:
- plant-data-aggregator provides botanical data API
- gardentime implements rotation logic using plant data
- Separation of concerns is proper

The issue was that Claude added a **PlantDataProxyController** in gardentime which creates unnecessary duplication. The BFF should only talk to gardentime, and gardentime should use PlantDataApiClient to fetch from plant-data-aggregator.

## Next Steps

1. Review and confirm this architecture understanding
2. Implement remaining API endpoints in plant-data-aggregator (Phase 5 features)
3. Remove PlantDataProxyController from gardentime
4. Clean up old PlantController in plant-data-aggregator  
5. Add proper security between services
6. Complete testing and documentation
