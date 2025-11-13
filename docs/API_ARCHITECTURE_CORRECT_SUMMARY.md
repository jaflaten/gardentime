# API Architecture - Current Status

## Architecture ✅ CORRECT

The architecture is correctly implemented:

1. **plant-data-aggregator**: Provides REST API with botanical plant data
   - Plant information (characteristics, families, growth requirements)
   - Companion planting relationships
   - Pests and diseases
   - NO rotation planning logic (correct!)

2. **gardentime**: Main application with user context
   - Consumes plant-data-aggregator API via `PlantDataApiClient`
   - Implements rotation planning logic with user's garden history
   - Has `PlantDataProxyController` to expose plant data to frontend
   - Rotation planning in `RotationController`, `RotationScoringService`, `RotationRecommendationService`

3. **Frontend (Next.js BFF)**: 
   - Calls gardentime backend only
   - Does NOT call plant-data-aggregator directly
   - Gets plant data through gardentime's proxy endpoints

This separation is correct because:
- Rotation planning requires user's garden history (grow areas, past crops)
- plant-data-aggregator only knows botanical facts, not user context
- gardentime combines plant data with user data to make rotation decisions

---

## Plant-Data-Aggregator API Status

### ✅ Implemented Endpoints (10/11)

#### 1. Plant Information (2/2)
- ✅ `GET /api/v1/plant-data/plants` - List/search plants with filters
- ✅ `GET /api/v1/plant-data/plants/{name}` - Get plant details
- ✅ `GET /api/v1/plant-data/plants/search` - Search by name

#### 2. Plant Families (2/2)
- ✅ `GET /api/v1/plant-data/families` - List all families
- ✅ `GET /api/v1/plant-data/families/{familyName}/plants` - Plants by family

#### 3. Companion Planting (2/2)
- ✅ `GET /api/v1/plant-data/plants/{name}/companions` - Get companions
- ✅ `POST /api/v1/plant-data/companions/check` - Check compatibility

#### 4. Pest & Disease (3/3)
- ✅ `GET /api/v1/plant-data/plants/{name}/pests` - Plant pests
- ✅ `GET /api/v1/plant-data/plants/{name}/diseases` - Plant diseases
- ✅ `GET /api/v1/plant-data/diseases/soil-borne` - Soil-borne diseases

#### 5. Bulk Operations (1/1)
- ✅ `POST /api/v1/plant-data/plants/bulk` - Multiple plant details

### ❌ Missing Endpoints (1/11)

#### 6. Seasonal Planning (0/1)
- ❌ `GET /api/v1/plant-data/plants/seasonal` - Seasonal recommendations
  - Filter by hardiness zone, frost dates, season
  - Return plants suitable for planting in given timeframe

---

## Gardentime API Status

### ✅ Rotation Planning (Correctly Located)

The rotation planning API is correctly implemented in gardentime:

- ✅ `POST /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/validate` - Validate rotation
- ✅ `GET /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/recommendations` - Get recommendations

### ✅ Plant Data Proxy

Gardentime correctly proxies plant-data-aggregator endpoints:

- ✅ `GET /api/plants/search` → plant-data-aggregator
- ✅ `GET /api/plants/{name}` → plant-data-aggregator
- ✅ `GET /api/plants` → plant-data-aggregator
- ✅ `GET /api/families` → plant-data-aggregator
- ✅ `GET /api/families/{familyName}/plants` → plant-data-aggregator
- ✅ `GET /api/plants/{name}/companions` → plant-data-aggregator
- ✅ `POST /api/companions/check` → plant-data-aggregator
- ✅ `GET /api/plants/{name}/pests` → plant-data-aggregator
- ✅ `GET /api/plants/{name}/diseases` → plant-data-aggregator
- ✅ `GET /api/diseases/soil-borne` → plant-data-aggregator

---

## What Still Needs Implementation

### Priority 1: Seasonal Planning Endpoint

**Location:** plant-data-aggregator

**Endpoint:** `GET /api/v1/plant-data/plants/seasonal`

**Query Parameters:**
- `zone` - USDA hardiness zone (e.g., "7a", "8b")
- `season` - Season filter ("spring", "summer", "fall", "winter")
- `month` - Current month (1-12)
- `directSow` - Filter for direct sow plants (boolean)
- `indoorStart` - Filter for indoor start plants (boolean)

**Response:** List of plants suitable for the given timeframe and zone

**Implementation needed:**
1. Create `SeasonalPlanningService`
2. Add filtering logic based on:
   - Plant hardiness zones
   - Planting season (spring/summer/fall/winter)
   - Days to maturity
   - Frost tolerance
3. Add endpoint to `PlantDataController`
4. Expose through gardentime proxy

---

## Summary

**Architecture Status:** ✅ CORRECT - No changes needed

**Implementation Status:** 10/11 endpoints complete (91%)

**Remaining Work:** Implement seasonal planning endpoint (~1-2 days)

**No Mistakes Found:** The rotation planning is correctly in gardentime, not plant-data-aggregator. This is the proper separation of concerns.
