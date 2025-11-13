# Architecture Review and Fixes

## Issue Discovery

Claude had indeed started adding API endpoints in the wrong location. The architecture should be:

**plant-data-aggregator**: 
- Provides REST API with plant botanical data
- Endpoints at `/api/v1/plant-data/*`
- Has its own database with plant reference data

**gardentime**:
- Consumes plant-data-aggregator API via `PlantDataApiClient`  
- Has proxy/BFF layer (`PlantDataProxyController`) at `/api/*`
- Implements rotation planning logic with user's garden context
- Has its own database with user data (gardens, season plans, etc.)

## Fixes Applied

### 1. Removed Duplicate Controllers in gardentime ✅

Removed two controllers that were duplicating functionality already in `PlantDataProxyController`:
- `PlantController.kt` - Had duplicate `/api/plants/*` endpoints
- `PlantFamiliesController.kt` - Had duplicate `/api/families/*` endpoints

This fixed the Spring bean mapping conflict error:
```
Ambiguous mapping. Cannot map 'plantDataProxyController' method to {GET [/api/plants/search]}: 
There is already 'plantController' bean method mapped.
```

### 2. Verified Architecture is Correct ✅

**plant-data-aggregator has:**
- ✅ `PlantDataController` at `/api/v1/plant-data/*`
- ✅ `PlantDataService` for business logic
- ✅ Security with API key authentication (`X-API-Key` header)
- ✅ Database with 76 plants, families, companions, pests, diseases

**gardentime has:**
- ✅ `PlantDataProxyController` at `/api/*` (BFF layer)
- ✅ `PlantDataApiClient` with proper API key configuration
- ✅ Caching layer for plant data
- ✅ Rotation planning logic (NOT in plant-data-aggregator)

### 3. Security Configuration ✅

Both apps share the same default API key: `dev-key-change-in-production-make-it-very-secure-and-random`

**gardentime** sends it via interceptor in `PlantDataApiConfig`:
```kotlin
private fun apiKeyInterceptor() = ClientHttpRequestInterceptor { request, body, execution ->
    request.headers.set("X-API-Key", apiKey)
    execution.execute(request, body)
}
```

**plant-data-aggregator** validates it in `ApiKeyAuthenticationFilter`:
```kotlin
if (requestApiKey == null || requestApiKey != validApiKey) {
    response.sendError(HttpServletResponse.SC_FORBIDDEN, "Invalid or missing API key")
    return
}
```

## Implementation Status

### Phase 1: Plant Information (COMPLETE ✅)
- ✅ `GET /api/v1/plant-data/plants` - List/search plants
- ✅ `GET /api/v1/plant-data/plants/{name}` - Get plant details
- ✅ `GET /api/v1/plant-data/plants/search?q={query}` - Search plants

### Phase 2: Plant Families (COMPLETE ✅)
- ✅ `GET /api/v1/plant-data/families` - List all families
- ✅ `GET /api/v1/plant-data/families/{familyName}/plants` - Plants by family

### Phase 3: Companion Planting (COMPLETE ✅)
- ✅ `GET /api/v1/plant-data/plants/{name}/companions` - Get companions
- ✅ `POST /api/v1/plant-data/companions/check` - Check compatibility

### Phase 4: Pest & Disease (COMPLETE ✅)
- ✅ `GET /api/v1/plant-data/plants/{name}/pests` - Plant pests
- ✅ `GET /api/v1/plant-data/plants/{name}/diseases` - Plant diseases
- ✅ `GET /api/v1/plant-data/diseases/soil-borne` - Critical diseases

### Phase 5: Bulk Operations (COMPLETE ✅)
- ✅ `POST /api/v1/plant-data/plants/bulk` - Multiple plant details

### Phase 6: Seasonal Planning (TODO ⏳)
- ⏳ `GET /api/v1/plant-data/plants/seasonal` - Seasonal recommendations

## What's Left to Implement in plant-data-aggregator

### 1. Seasonal Planning Endpoint
```kotlin
GET /api/v1/plant-data/plants/seasonal?season={season}&zone={zone}
```

This endpoint should return plants suitable for planting in a given season and hardiness zone.

### 2. Additional Filtering Options
Consider adding more query parameters to existing endpoints:
- Hardiness zone filtering
- Climate-based filtering
- Planting method (direct sow vs transplant)

## Rotation Planning (CORRECTLY IN GARDENTIME)

The rotation planning logic is **correctly implemented in gardentime**, NOT in plant-data-aggregator.

**Why this is correct:**
- Rotation planning requires user's garden history (previous plantings, grow area conditions)
- plant-data-aggregator only knows botanical facts, not user context
- gardentime fetches plant data from aggregator and applies rotation logic with user's specific garden data

**Implemented in gardentime:**
- `RotationController` - REST API at `/api/gardens/{id}/grow-areas/{areaId}/rotation/*`
- `RotationScoringService` - Scoring algorithm
- `RotationRecommendationService` - Recommendation engine
- Uses `PlantDataApiClient` to fetch plant botanical data

This architecture follows proper separation of concerns!

## Next Steps

1. ✅ **DONE** - Fix duplicate controller issue
2. ✅ **DONE** - Verify security configuration
3. ⏳ **TODO** - Implement seasonal planning endpoint
4. ⏳ **TODO** - Add comprehensive API documentation with Swagger
5. ⏳ **TODO** - Add rate limiting to plant-data-aggregator
6. ⏳ **TODO** - Performance testing and optimization

## Testing Checklist

- [ ] Test gardentime can call plant-data-aggregator APIs
- [ ] Test API key authentication works
- [ ] Test all proxy endpoints in gardentime return correct data
- [ ] Test rotation planner uses plant data correctly
- [ ] Test caching is working properly
- [ ] Test error handling when plant-data-aggregator is down

## Documentation Updates Needed

- [ ] Update README with architecture diagram
- [ ] Document API endpoints in both services
- [ ] Add setup instructions for running both services
- [ ] Document the API key configuration
