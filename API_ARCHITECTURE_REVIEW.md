# API Architecture Review

## Current State Analysis

### Architecture Overview

We have **two separate applications** with clear separation of concerns:

1. **plant-data-aggregator** - Static plant knowledge database
   - Purpose: Aggregate and serve general plant information
   - Database: Contains ~76 plants with companion planting, pests, diseases
   - Port: 8081
   - Role: Reference data API (read-only plant encyclopedia)

2. **gardentime** - User garden management application  
   - Purpose: Manage user's gardens, seasonal plans, and crop rotations
   - Database: User gardens, grow areas, planting history, crop records
   - Port: 8080
   - Role: User data and business logic

### Current API Implementation Status

#### plant-data-aggregator ✅ (CORRECTLY IMPLEMENTED)

**Implemented Endpoints:**
1. ✅ `GET /api/v1/plant-data/plants` - List/search plants
2. ✅ `GET /api/v1/plant-data/plants/{name}` - Get plant details
3. ✅ `GET /api/v1/plant-data/plants/search` - Search plants
4. ✅ `POST /api/v1/plant-data/plants/bulk` - Get multiple plants
5. ✅ `GET /api/v1/plant-data/families` - List plant families
6. ✅ `GET /api/v1/plant-data/families/{familyName}/plants` - Plants by family
7. ✅ `GET /api/v1/plant-data/plants/{name}/companions` - Get companions
8. ✅ `POST /api/v1/plant-data/companions/check` - Check compatibility
9. ✅ `GET /api/v1/plant-data/plants/{name}/pests` - Plant pests
10. ✅ `GET /api/v1/plant-data/plants/{name}/diseases` - Plant diseases
11. ✅ `GET /api/v1/plant-data/diseases/soil-borne` - Soil-borne diseases

**Missing from Original Plan:**
- ❌ `GET /api/v1/plant-data/plants/seasonal` - Seasonal recommendations
  - **Status**: Should NOT be in plant-data-aggregator (needs climate/zone info)
  - **Reason**: Requires user's garden climate data from gardentime

- ❌ `POST /api/v1/plant-data/rotation/validate` - Validate rotation
  - **Status**: ✅ ALREADY CORRECTLY IMPLEMENTED IN GARDENTIME
  - **Location**: `/api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/validate`
  - **Reason**: Needs access to garden history (user data)

- ❌ `GET /api/v1/plant-data/rotation/recommendations` - Get recommendations  
  - **Status**: ✅ ALREADY CORRECTLY IMPLEMENTED IN GARDENTIME
  - **Location**: `/api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/recommendations`
  - **Reason**: Needs access to garden history (user data)

#### gardentime ✅ (CORRECTLY IMPLEMENTED)

**Rotation Planning Endpoints** (properly located here):
1. ✅ `POST /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/validate`
2. ✅ `GET /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/recommendations`
3. ✅ `GET /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/recommendations/soil-improvement`
4. ✅ `GET /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/recommendations/by-family`
5. ✅ `GET /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/companions`
6. ✅ `GET /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/avoid`

**Plant Data Proxy Endpoints** (needs HTTP client to plant-data-aggregator):
- ❌ **MISSING**: HTTP client to fetch plant data from plant-data-aggregator
- ❌ **MISSING**: Caching layer for plant data

## Architectural Decision: Why Rotation Logic is in GardenTime

The rotation planning logic is **correctly** implemented in gardentime, not plant-data-aggregator, because:

1. **Requires User Data**: Rotation validation needs planting history from the user's specific grow area
2. **Context-Specific**: Scoring depends on what was planted where and when (user's garden state)
3. **Business Logic**: The scoring algorithm combines plant data with user's garden history
4. **Stateful**: Recommendations change based on each garden's unique rotation history

The plant-data-aggregator provides the **base plant knowledge** (family, feeder type, companions, diseases) that the rotation logic in gardentime **consumes** to make intelligent recommendations.

## What Still Needs to be Done

### Priority 1: HTTP Client in GardenTime ⚠️

Gardentime currently has a simple `PlantController` that likely uses a local database. It needs to:

1. **Create HTTP Client Service** to call plant-data-aggregator API
   - Service: `PlantDataClient.kt`
   - Methods to call all plant-data-aggregator endpoints
   - Error handling and retries
   - Timeout configuration

2. **Add Caching Layer**
   - Cache plant details (1 hour TTL)
   - Cache companion relationships (1 hour TTL)
   - Cache family data (1 hour TTL)
   - Use Spring Cache abstraction with Caffeine

3. **Update RotationScoringService**
   - Use `PlantDataClient` instead of local plant repository
   - Fetch plant data from plant-data-aggregator
   - Cache frequently accessed plants

### Priority 2: Frontend Integration

The frontend needs to know which API to call:

- **Plant Data**: Call plant-data-aggregator at `http://localhost:8081`
- **Garden/Rotation Logic**: Call gardentime at `http://localhost:8080`

### Priority 3: Optional Seasonal Endpoint

If we want seasonal filtering, it should be in **gardentime**, not plant-data-aggregator:

- Endpoint: `GET /api/gardens/{gardenId}/plants/seasonal`
- Logic: Fetch plants from plant-data-aggregator, filter by garden's climate/zone
- Reason: Needs garden's climate information (hardiness zone, frost dates, etc.)

## Conclusion

The current architecture is **CORRECT**. The original API_IMPLEMENTATION_PLAN.md incorrectly suggested putting rotation endpoints in plant-data-aggregator, but the actual implementation properly separated concerns:

- ✅ **plant-data-aggregator**: Static plant knowledge (read-only reference)
- ✅ **gardentime**: User gardens, rotation logic, seasonal planning (stateful business logic)

**Main Missing Piece**: HTTP client in gardentime to fetch plant data from plant-data-aggregator with caching.
