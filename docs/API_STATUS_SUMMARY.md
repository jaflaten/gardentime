# Plant Data API - Implementation Status

## Overview

This document clarifies the architecture and tracks implementation status of the Plant Data API.

## Architecture Clarification

### Two Separate Applications

1. **plant-data-aggregator** (Port 8081)
   - Database: `plant_data_aggregator`
   - Purpose: Aggregates and serves READ-ONLY plant data
   - Contains: Plant database, companion relationships, pests, diseases
   - Role: Data provider/API service

2. **gardentime** (Port 8080)
   - Database: `gardentime`
   - Purpose: User garden management, season planning, rotation planning
   - Contains: User data, gardens, plantings, crop records
   - Role: Main application that CONSUMES plant-data-aggregator API

### Data Flow
```
Frontend (Next.js)
    ↓
gardentime API (8080)
    ↓ (calls when needed)
plant-data-aggregator API (8081)
    ↓
plant_data_aggregator DB
```

---

## Implementation Status

### Phase 1: Foundation ✅ COMPLETE

#### plant-data-aggregator
- ✅ PlantDataController with endpoints:
  - ✅ GET `/api/v1/plant-data/plants` - List/search plants with pagination
  - ✅ GET `/api/v1/plant-data/plants/{name}` - Get plant details
  - ✅ GET `/api/v1/plant-data/plants/search` - Search plants
  - ✅ POST `/api/v1/plant-data/plants/bulk` - Bulk plant details
  - ✅ GET `/api/v1/plant-data/families` - List families
  - ✅ GET `/api/v1/plant-data/families/{familyName}/plants` - Plants by family

- ✅ PlantDataService with full functionality
- ✅ DTOs: PlantSummaryDTO, PlantDetailDTO, FamilyDTO, PaginationDTO, etc.
- ✅ Repository layer complete

### Phase 2: Companion Planting ✅ COMPLETE

#### plant-data-aggregator
- ✅ CompanionPlantingService
- ✅ Endpoints:
  - ✅ GET `/api/v1/plant-data/plants/{name}/companions` - Get companions
  - ✅ POST `/api/v1/plant-data/companions/check` - Check compatibility
- ✅ DTOs: CompanionListDTO, CompatibilityCheckDTO, etc.

### Phase 3: Pest & Disease ✅ COMPLETE

#### plant-data-aggregator
- ✅ PestDiseaseService
- ✅ Endpoints:
  - ✅ GET `/api/v1/plant-data/plants/{name}/pests` - Plant pests
  - ✅ GET `/api/v1/plant-data/plants/{name}/diseases` - Plant diseases
  - ✅ GET `/api/v1/plant-data/diseases/soil-borne` - Soil-borne diseases
- ✅ DTOs: PestDTO, DiseaseDTO, PlantPestsResponseDTO, etc.

### Phase 4: Rotation Planning - In Progress ⚠️

**NOTE:** This is where confusion occurred. Rotation planning belongs in BOTH apps:

#### plant-data-aggregator - MISSING ❌
The plant-data-aggregator should provide DATA for rotation decisions, but NOT make rotation decisions itself:

**Still Needed:**
- ❌ Endpoint: GET `/api/v1/plant-data/rotation/family-rules`
  - Returns family rotation guidelines (e.g., "Solanaceae: 3-4 years")
  - Returns soil-borne disease persistence data
- ❌ Endpoint: GET `/api/v1/plant-data/rotation/nutrient-cycles`
  - Returns feeder types, nitrogen fixers, nutrient contributions
- ❌ Endpoint: GET `/api/v1/plant-data/rotation/disease-families`
  - Returns which families are affected by which diseases

**These endpoints should provide REFERENCE DATA only.**

#### gardentime - ✅ IMPLEMENTED CORRECTLY

The gardentime app CORRECTLY implements rotation PLANNING logic:

- ✅ RotationController with intelligent validation
- ✅ RotationScoringService - scoring algorithm
- ✅ RotationRecommendationService - recommendations
- ✅ Endpoints:
  - ✅ POST `/api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/validate`
  - ✅ GET `/api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/recommendations`
  - ✅ GET `/api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/recommendations/soil-improvement`
  - ✅ GET `/api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/recommendations/by-family`
  - ✅ GET `/api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/companions`
  - ✅ GET `/api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/avoid`

**gardentime should call plant-data-aggregator APIs to get plant data it needs for rotation logic.**

---

## What Still Needs to be Done

### 1. plant-data-aggregator - Reference Data Endpoints ❌

Add endpoints for rotation REFERENCE data (not planning logic):

```kotlin
// New endpoint ideas for plant-data-aggregator
GET /api/v1/plant-data/rotation/reference
  Returns:
  - Family rotation guidelines
  - Soil-borne disease persistence
  - Nutrient cycling data
  
GET /api/v1/plant-data/plants/{name}/rotation-characteristics
  Returns all rotation-relevant attributes for a plant:
  - Family
  - Feeder type
  - Root depth
  - Nitrogen fixer status
  - Associated diseases
  - Growth characteristics
```

### 2. gardentime - Client for plant-data-aggregator ❌

The gardentime backend needs HTTP clients to call plant-data-aggregator:

**Create:**
```kotlin
// gardentime/src/main/kotlin/no/sogn/gardentime/client/PlantDataApiClient.kt
class PlantDataApiClient {
    fun getPlantByName(name: String): PlantDetailDTO?
    fun getCompanions(plantName: String): CompanionListDTO?
    fun getPlantPests(plantName: String): PlantPestsResponseDTO?
    fun getPlantDiseases(plantName: String): PlantDiseasesResponseDTO?
    fun searchPlants(query: String): List<PlantSummaryDTO>
    // etc.
}
```

**Configure in application.yml:**
```yaml
plant-data-api:
  base-url: http://localhost:8081
```

### 3. Update gardentime Rotation Services to Use API Client ⚠️

Currently, the rotation services in gardentime might be using hardcoded data or making assumptions. They should:

- Call PlantDataApiClient to get plant families
- Call PlantDataApiClient to get feeder types
- Call PlantDataApiClient to get disease information
- Cache responses appropriately

### 4. Frontend Integration ⚠️

The Next.js frontend should:
- Call gardentime API (8080) for user-specific data and planning
- Could call plant-data-aggregator API (8081) directly for browsing plant catalog
- Use gardentime's rotation endpoints for recommendations

---

## Summary

### What's Working ✅
- Plant data aggregation and storage
- Basic plant CRUD in plant-data-aggregator
- Companion planting data and compatibility checking
- Pest and disease information
- Rotation planning logic in gardentime

### What Needs Work ❌
1. Add rotation reference data endpoints to plant-data-aggregator
2. Create HTTP client in gardentime to call plant-data-aggregator
3. Update gardentime rotation services to use the API client
4. Ensure frontend calls the right service for each feature

### Architecture is CORRECT ✅
The separation is good:
- **plant-data-aggregator** = Plant encyclopedia/reference data (stateless, cacheable)
- **gardentime** = User gardens, planning, recommendations (stateful, user-specific)

The rotation planning logic SHOULD be in gardentime because it's user-specific and context-dependent.
