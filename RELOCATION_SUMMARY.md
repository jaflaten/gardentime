# Plant Data API - Relocation Summary

## What Happened

Claude previously implemented the Plant Data API in the wrong application. The API was added to the main **gardentime** app, but it should have been in **plant-data-aggregator**.

## Why It Was Wrong

### Database Mismatch
- **gardentime** uses database `gardentime` with `plant_entity` table (BIGINT IDs)
- **plant-data-aggregator** uses database `plant_data_aggregator` with `plants` table (UUID IDs)
- All plant data was imported into the `plant_data_aggregator` database

### Schema Differences
- **gardentime**: `plant_entity` with extended rotation fields, user-specific instances
- **plant-data-aggregator**: Normalized schema with `plants`, `plant_attributes`, `companion_relationships`

### Architecture Intent
- **plant-data-aggregator**: Should aggregate data from multiple sources and provide an API
- **gardentime**: Should consume the API to display plant data in user gardens

## What Was Fixed

### Files Relocated ✅

**Added to plant-data-aggregator:**
```
plant-data-aggregator/src/main/kotlin/no/sogn/plantdata/
├── controller/
│   └── PlantDataController.kt        (93 lines)
├── dto/
│   ├── PlantDataDTOs.kt              (101 lines)
│   └── CompanionDTOs.kt              (82 lines)
└── service/
    ├── PlantDataService.kt           (189 lines)
    └── CompanionPlantingService.kt   (179 lines)
```

**Removed from gardentime:**
```
src/main/kotlin/no/sogn/gardentime/
├── api/v1/PlantDataController.kt      ❌ DELETED
├── service/plantdata/
│   ├── PlantDataService.kt            ❌ DELETED
│   └── CompanionPlantingService.kt    ❌ DELETED
└── dto/plantdata/
    ├── PlantDataDTOs.kt               ❌ DELETED
    └── CompanionDTOs.kt               ❌ DELETED
```

## API Endpoints Available

The plant-data-aggregator now exposes (port **8081**):

### Plant Information
```
GET  /api/v1/plant-data/plants
     ?family=Solanaceae
     &feederType=HEAVY
     &cycle=ANNUAL
     &sunNeeds=FULL_SUN
     &search=tomato
     &page=0
     &size=50
```

```
GET  /api/v1/plant-data/plants/{name}
```

```
GET  /api/v1/plant-data/plants/search?q={query}
```

### Companion Planting
```
GET  /api/v1/plant-data/plants/{name}/companions
     ?relationship=BENEFICIAL
```

```
POST /api/v1/plant-data/companions/check
Content-Type: application/json

{
  "plantNames": ["Tomato", "Basil", "Carrot"]
}
```

## Key Implementation Details

### Adapted for plant-data-aggregator Schema

1. **UUID-based IDs** instead of Long/BIGINT
2. **Lookup by name** (common or scientific) instead of slug
3. **Separate attributes table** - Data split between `plants` and `plant_attributes`
4. **Different enums**:
   - `BENEFICIAL`, `ANTAGONISTIC`, `NEUTRAL` (not `UNFAVORABLE`)
5. **Verified relationships only** - Only returns verified companion data
6. **Confidence and evidence** - Includes `confidenceLevel` and `evidenceType`

### Current Limitations

- Uses `findAll()` with in-memory filtering (should use JPA Specifications)
- No family-specific endpoints yet
- No rotation planning endpoints yet
- Synonym lookup not yet implemented

## Testing

### Start the API
```bash
cd plant-data-aggregator
./gradlew bootRun
```

### Test Endpoints
```bash
# Run the test script
./test-plant-api.sh
```

Or manually:
```bash
# List plants
curl http://localhost:8081/api/v1/plant-data/plants?page=0&size=10

# Search
curl http://localhost:8081/api/v1/plant-data/plants/search?q=tomato

# Get plant details
curl http://localhost:8081/api/v1/plant-data/plants/Tomato

# Get companions
curl http://localhost:8081/api/v1/plant-data/plants/Tomato/companions

# Check compatibility
curl -X POST http://localhost:8081/api/v1/plant-data/companions/check \
  -H "Content-Type: application/json" \
  -d '{"plantNames": ["Tomato", "Basil"]}'
```

## Next Steps

### For gardentime App

1. **Create API client service** to call plant-data-aggregator
2. **Configure RestTemplate** or WebClient for `http://localhost:8081`
3. **Remove direct plant data queries** from gardentime
4. **Use API for plant lookups** in garden planning features

### For plant-data-aggregator

**Phase 2: Family Endpoints**
- `GET /api/v1/plant-data/families` - List all families
- `GET /api/v1/plant-data/families/{name}/plants` - Plants by family

**Phase 3: Rotation Planning**
- `POST /api/v1/plant-data/rotation/validate` - Validate rotation
- `GET /api/v1/plant-data/rotation/recommendations` - Get recommendations

**Optimization**
- Implement JPA Specifications for filtering
- Add caching layer (Caffeine already configured)
- Create database indexes for common queries
- Add pagination support for companions

## Architecture Overview

```
┌──────────────────────────────────────────────┐
│           GardenTime (port 5000)             │
│  Database: gardentime                        │
│  - User management                           │
│  - Garden layouts                            │
│  - Planting schedules                        │
│  - Canvas objects                            │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Calls API for plant data             │  │
│  │  HTTP Client → localhost:8081          │  │
│  └──────────────────┬─────────────────────┘  │
└─────────────────────┼────────────────────────┘
                      │
                      │ HTTP REST API
                      │
                      ▼
┌──────────────────────────────────────────────┐
│     Plant Data Aggregator (port 8081)        │
│  Database: plant_data_aggregator             │
│  - 800+ plants with attributes               │
│  - 3,400+ companion relationships            │
│  - Plant families                            │
│  - Edible parts                              │
│                                              │
│  Exposes REST API:                           │
│  ✅ /api/v1/plant-data/plants               │
│  ✅ /api/v1/plant-data/plants/{name}        │
│  ✅ /api/v1/plant-data/companions/check     │
│  ⏳ /api/v1/plant-data/families             │
│  ⏳ /api/v1/plant-data/rotation/*           │
└──────────────────────────────────────────────┘
```

## Build Status

✅ plant-data-aggregator compiles successfully  
✅ gardentime compiles successfully  
✅ No breaking changes to existing functionality  
✅ API follows design in `docs/API_IMPLEMENTATION_PLAN.md`

## Git Status

```
Committed: d42b7e6
Message: Move Plant Data API to plant-data-aggregator
Files: 6 files changed, 786 insertions(+)
```

## References

- Full details: `docs/API_RELOCATION_COMPLETE.md`
- API design: `docs/API_IMPLEMENTATION_PLAN.md`
- Test script: `test-plant-api.sh`
