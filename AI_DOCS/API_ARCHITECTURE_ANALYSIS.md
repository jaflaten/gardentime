# API Architecture Analysis and Status

## Problem Identified ✅

Claude did indeed start implementing API endpoints in the wrong location. However, this has been **corrected**.

## Current Architecture (CORRECT ✅)

### plant-data-aggregator (Botanical Data Service)
**Purpose**: Provides REST API for plant botanical data
**Database**: `plant_data_aggregator` - Contains 76 plants with families, companions, pests, diseases
**API Base Path**: `/api/v1/plant-data`
**Port**: 8081
**Security**: API key authentication via `X-API-Key` header

**Implemented Endpoints:**
- ✅ `GET /api/v1/plant-data/plants` - List plants with filtering
- ✅ `GET /api/v1/plant-data/plants/search?q={query}` - Search plants
- ✅ `GET /api/v1/plant-data/plants/{name}` - Get plant details
- ✅ `POST /api/v1/plant-data/plants/bulk` - Bulk plant lookup
- ✅ `GET /api/v1/plant-data/families` - List families
- ✅ `GET /api/v1/plant-data/families/{name}/plants` - Plants by family
- ✅ `GET /api/v1/plant-data/plants/{name}/companions` - Get companions
- ✅ `POST /api/v1/plant-data/companions/check` - Check compatibility
- ✅ `GET /api/v1/plant-data/plants/{name}/pests` - Plant pests
- ✅ `GET /api/v1/plant-data/plants/{name}/diseases` - Plant diseases  
- ✅ `GET /api/v1/plant-data/diseases/soil-borne` - Soil-borne diseases

**Implementation:**
```
PlantDataController.kt
├── PlantDataService
├── CompanionPlantingService
└── PestDiseaseService
```

### gardentime (User Application)
**Purpose**: Garden planning application with rotation logic
**Database**: `gardentime` - Contains user gardens, season plans, plantings
**API Base Path**: `/api`
**Port**: 8080
**Security**: JWT authentication for user endpoints

**BFF/Proxy Layer:**
- ✅ `PlantDataProxyController` at `/api/plants/*`, `/api/families/*`, etc.
- ✅ `PlantDataApiClient` - HTTP client to call plant-data-aggregator
- ✅ Caching layer (Caffeine) - 1 hour TTL

**Rotation Planning (CORRECT LOCATION):**
- ✅ `RotationController` - `/api/gardens/{id}/grow-areas/{areaId}/rotation/*`
- ✅ `RotationScoringService` - Scoring algorithm
- ✅ `RotationRecommendationService` - Generates recommendations
- Uses botanical data from plant-data-aggregator + user's garden history

## What Was Wrong (FIXED ✅)

### Issue 1: Duplicate Controllers in gardentime
There were TWO controllers with overlapping endpoints:
- `PlantController.kt` - Had `/api/plants/search` ❌ **DELETED**
- `PlantFamiliesController.kt` - Had `/api/families` ❌ **DELETED**  
- `PlantDataProxyController.kt` - Had the same endpoints ✅ **KEPT**

This caused Spring bean mapping conflicts:
```
Ambiguous mapping. Cannot map 'plantDataProxyController' method to {GET [/api/plants/search]}: 
There is already 'plantController' bean method mapped.
```

**Fix Applied**: Deleted duplicate controllers, kept only `PlantDataProxyController`.

## Communication Flow (CORRECT ✅)

```
Frontend (Next.js)
    ↓ HTTP
BFF (Next.js API Routes) → gardentime Backend (Spring Boot :8080)
                              ↓ HTTP + X-API-Key header
                         plant-data-aggregator (Spring Boot :8081)
```

**Key Points:**
1. Frontend → BFF → gardentime backend (JWT auth)
2. gardentime → plant-data-aggregator (API key auth)
3. Frontend NEVER calls plant-data-aggregator directly
4. BFF NEVER calls plant-data-aggregator directly

## API Key Configuration

Both services share the same default API key for development:
```yaml
# gardentime/src/main/resources/application.yml
plantdata:
  api:
    key: dev-key-change-in-production-make-it-very-secure-and-random

# plant-data-aggregator/src/main/resources/application.yml
api:
  key: dev-key-change-in-production-make-it-very-secure-and-random
```

**gardentime sends it:**
```kotlin
// PlantDataApiConfig.kt
private fun apiKeyInterceptor() = ClientHttpRequestInterceptor { request, body, execution ->
    request.headers.set("X-API-Key", apiKey)
    execution.execute(request, body)
}
```

**plant-data-aggregator validates it:**
```kotlin
// ApiKeyAuthenticationFilter.kt  
if (requestApiKey == null || requestApiKey != validApiKey) {
    response.sendError(HttpServletResponse.SC_FORBIDDEN, "Invalid or missing API key")
}
```

## Implementation Status by Phase

### Phase 1: Plant Information ✅ COMPLETE
- ✅ List/search plants
- ✅ Get plant details
- ✅ Full botanical data

### Phase 2: Plant Families ✅ COMPLETE
- ✅ List families
- ✅ Plants by family

### Phase 3: Companion Planting ✅ COMPLETE
- ✅ Get companions
- ✅ Check compatibility
- ✅ Relationship scoring

### Phase 4: Pest & Disease ✅ COMPLETE
- ✅ Plant pests
- ✅ Plant diseases
- ✅ Soil-borne diseases

### Phase 5: Rotation Planning ✅ COMPLETE (in gardentime)
- ✅ Validation endpoint
- ✅ Recommendations endpoint
- ✅ Scoring algorithm
- ✅ Uses plant data from aggregator

### Phase 6: Seasonal Planning ⏳ TODO
- ⏳ Seasonal recommendations endpoint
- ⏳ Planting window calculations
- ⏳ Climate-based filtering

### Phase 7: Documentation ⏳ TODO
- ⏳ OpenAPI/Swagger spec
- ⏳ API usage guide
- ⏳ Client SDK

## Remaining Work

### 1. Implement Seasonal Planning Endpoint (plant-data-aggregator)

```kotlin
// PlantDataController.kt
@GetMapping("/plants/seasonal")
fun getSeasonalPlants(
    @RequestParam season: String,
    @RequestParam(required = false) zone: String?,
    @RequestParam(required = false) climate: String?
): ResponseEntity<SeasonalPlantsResponseDTO>
```

### 2. Add Swagger Documentation

Both services need OpenAPI documentation:
```kotlin
// build.gradle.kts
implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.2.0")
```

### 3. Add Rate Limiting (plant-data-aggregator)

Protect the API from abuse:
```kotlin
// Use bucket4j or similar
implementation("com.giffing.bucket4j.spring.boot.starter:bucket4j-spring-boot-starter:0.10.1")
```

### 4. Improve Error Handling

Standardize error responses across both services.

### 5. Add Monitoring

Add metrics and health checks for both services.

## Testing Checklist

Once services are running:

```bash
# Test plant-data-aggregator directly
curl -H "X-API-Key: dev-key-change-in-production-make-it-very-secure-and-random" \
  "http://localhost:8081/api/v1/plant-data/plants/search?q=tomato"

# Test gardentime proxy (requires JWT)
curl -H "Authorization: Bearer $JWT_TOKEN" \
  "http://localhost:8080/api/plants/search?q=tomato"

# Test rotation recommendations (requires JWT + garden context)
curl -H "Authorization: Bearer $JWT_TOKEN" \
  "http://localhost:8080/api/gardens/{id}/grow-areas/{areaId}/rotation/recommendations"
```

## Conclusion

✅ **Architecture is CORRECT**
✅ **Duplicate controllers REMOVED**
✅ **11 of 13 planned endpoints IMPLEMENTED**
⏳ **Seasonal planning endpoint TO DO**
⏳ **Documentation TO DO**

The separation of concerns is proper:
- plant-data-aggregator = Botanical facts
- gardentime = User context + rotation logic
