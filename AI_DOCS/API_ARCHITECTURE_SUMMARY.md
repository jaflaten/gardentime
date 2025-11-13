# API Architecture Summary

## Overview

The GardenTime project consists of two applications with clear separation of concerns:

1. **plant-data-aggregator** - Botanical data API service
2. **gardentime** - User garden management application with rotation planning logic

## Architecture

### plant-data-aggregator (Spring Boot + Kotlin)
**Purpose:** Provides REST API with curated plant data from multiple sources

**Database:** PostgreSQL with:
- 76 plants with full botanical data
- 881 companion relationships
- 191 pests, 112 diseases
- 19 plant families

**Responsibilities:**
- Serve plant information (botanical characteristics, growing requirements)
- Provide companion planting relationships
- Supply pest and disease information
- Offer plant family data

**API Base:** `/api/v1/plant-data`

### gardentime (Spring Boot + Kotlin + Next.js Frontend)
**Purpose:** User garden management with intelligent crop rotation planning

**Responsibilities:**
- User authentication and garden management
- Season planning and crop scheduling
- **Crop rotation logic** (uses plant data from aggregator + user's garden history)
- Integration with plant-data-aggregator API

**Why rotation is here:**
- Needs user's garden context (grow areas, past plantings)
- Requires historical analysis of user's crops
- Combines plant data with user-specific decisions

---

## API Status: plant-data-aggregator

### ✅ Implemented Endpoints (12/13)

#### Plant Information (3 endpoints)
- `GET /api/v1/plant-data/plants` - List/filter plants
- `GET /api/v1/plant-data/plants/{name}` - Plant details
- `GET /api/v1/plant-data/plants/search` - Search plants

#### Plant Families (2 endpoints)
- `GET /api/v1/plant-data/families` - List families
- `GET /api/v1/plant-data/families/{familyName}/plants` - Plants by family

#### Companion Planting (2 endpoints)
- `GET /api/v1/plant-data/plants/{name}/companions` - Get companions
- `POST /api/v1/plant-data/companions/check` - Check compatibility

#### Pest & Disease (3 endpoints)
- `GET /api/v1/plant-data/plants/{name}/pests` - Plant pests
- `GET /api/v1/plant-data/plants/{name}/diseases` - Plant diseases
- `GET /api/v1/plant-data/diseases/soil-borne` - Soil-borne diseases

#### Bulk Operations (1 endpoint)
- `POST /api/v1/plant-data/plants/bulk` - Get multiple plants

#### **Rotation Planning**
**NOT HERE** - Correctly implemented in gardentime!

### ⏳ To Be Implemented (1 endpoint)

#### Seasonal Planning (1 endpoint)
- `GET /api/v1/plant-data/plants/seasonal` - Seasonal plant recommendations

---

## API Status: gardentime

### ✅ Implemented

#### Rotation Planning
- `GET /api/gardens/{id}/grow-areas/{areaId}/rotation/recommendations` - Get rotation recommendations
- `POST /api/gardens/{id}/grow-areas/{areaId}/rotation/validate` - Validate rotation choice

**Services:**
- `RotationScoringService` - Scores rotation compatibility
- `RotationRecommendationService` - Generates recommendations
- `PlantDataApiClient` - Fetches data from plant-data-aggregator

---

## Architecture Decision: Why This Way?

### Correct Separation of Concerns

**plant-data-aggregator:**
- ✅ Stateless botanical data
- ✅ No user context needed
- ✅ Can be shared across multiple applications
- ✅ Single source of truth for plant data

**gardentime:**
- ✅ User-specific logic
- ✅ Garden history tracking
- ✅ Combines plant data with user context
- ✅ Rotation decisions based on past plantings

### Why Rotation is in gardentime:

1. **Needs User Context:**
   - What was planted in this grow area last year?
   - What's the soil condition in this specific area?
   - User's climate zone and frost dates

2. **Historical Analysis:**
   - Track planting history per grow area
   - Build rotation sequences over years
   - Learn from user's past decisions

3. **Combines Multiple Data Sources:**
   - Plant data from aggregator
   - User's grow area history
   - Climate data for user's location
   - User preferences and notes

---

## Summary

✅ **Architecture is correct!**
- plant-data-aggregator: Pure plant data API (12/13 endpoints complete)
- gardentime: User application with rotation logic

⏳ **Remaining Work:**
- Implement seasonal planning endpoint in plant-data-aggregator

📈 **Progress:** 92% complete (12/13 endpoints)
