# Crop Rotation Planner - Complete Architecture Summary

## Architecture Overview

The Gardentime application uses a **microservices architecture** with two main backend applications:

### 1. **plant-data-aggregator** (Port 8081)
**Purpose:** Centralized plant data repository and API

**Responsibilities:**
- Stores plant data (characteristics, families, growth requirements)
- Provides plant information via REST API
- Manages companion planting relationships
- Tracks pest and disease information
- Aggregates data from multiple external sources

**API Endpoints:**
- `GET /api/v1/plant-data/plants` - List/search plants
- `GET /api/v1/plant-data/plants/{name}` - Get plant details
- `GET /api/v1/plant-data/plants/search` - Search plants
- `GET /api/v1/plant-data/families` - List plant families
- `GET /api/v1/plant-data/plants/{name}/companions` - Get companions
- `POST /api/v1/plant-data/companions/check` - Check compatibility
- `GET /api/v1/plant-data/plants/{name}/pests` - Get pests
- `GET /api/v1/plant-data/plants/{name}/diseases` - Get diseases
- `POST /api/v1/plant-data/plants/bulk` - Bulk plant fetch

**Security:** Requires API key authentication via `X-API-Key` header

**Database:** PostgreSQL on port 5432 (`plant_data_aggregator` database)

---

### 2. **gardentime** (Port 8080)
**Purpose:** Main application backend with user gardens and rotation planning logic

**Responsibilities:**
- User authentication and management
- Garden, grow area, and bed management
- Season planning
- **Crop rotation planning logic** (consumes plant-data-aggregator API)
- Crop records and history tracking
- Rotation scoring and recommendations

**Rotation API Endpoints:**
- `POST /api/gardens/{id}/grow-areas/{areaId}/rotation/validate` - Validate a planting
- `GET /api/gardens/{id}/grow-areas/{areaId}/rotation/recommendations` - Get recommendations
- `GET /api/gardens/{id}/grow-areas/{areaId}/rotation/recommendations/soil-improvement` - Soil builders
- `GET /api/gardens/{id}/grow-areas/{areaId}/rotation/recommendations/by-family` - Family-grouped
- `GET /api/gardens/{id}/grow-areas/{areaId}/rotation/companions` - Companion recommendations
- `GET /api/gardens/{id}/grow-areas/{areaId}/rotation/avoid` - Plants to avoid

**Security:** JWT-based authentication for users

**Database:** PostgreSQL on port 5432 (`gardentime` database)

---

### 3. **client-next** (Port 3000)
**Purpose:** Next.js frontend application

**Responsibilities:**
- User interface for garden management
- Season planner UI
- Crop rotation planner UI
- **API proxy layer** - proxies plant search requests to plant-data-aggregator

**Plant Data API Routes (Next.js API Routes):**
- `GET /api/plants/search` - Proxies to plant-data-aggregator with API key

---

## Data Flow for Crop Rotation Planning

```
User → Next.js Frontend (port 3000)
        ↓
        ├─→ Next.js API Route (/api/plants/search)
        │   ↓
        │   Plant-Data-Aggregator API (port 8081)
        │   - Fetches plant data
        │   - Returns plant characteristics
        │
        └─→ Gardentime API (port 8080)
            ↓
            Rotation Controller
            - Analyzes garden history
            - Fetches plant data from plant-data-aggregator
            - Applies rotation logic
            - Scores recommendations
            - Returns recommendations
```

---

## Key Implementation Details

### Rotation Planning Logic (in gardentime)

**Services:**
1. `RotationScoringService` - Scores rotation plans based on:
   - Family rotation (4-year rule for Solanaceae, etc.)
   - Nutrient balance (heavy feeders, light feeders, nitrogen fixers)
   - Disease risk (soil-borne diseases)
   - Root depth diversity
   - Companion compatibility

2. `RotationRecommendationService` - Generates recommendations:
   - Top picks for a grow area
   - Soil-building crops
   - Family-grouped recommendations
   - Plants to avoid

3. `PlantDataClient` - HTTP client to fetch plant data from plant-data-aggregator:
   - Fetches plant details
   - Gets companion relationships
   - Retrieves pest/disease info
   - **Caches data** to minimize API calls

### Plant Data Client (HTTP Client)

Located in gardentime at `no.sogn.gardentime.plantdata.PlantDataClient`

**Features:**
- Fetches data from plant-data-aggregator API
- Includes API key authentication
- Caches responses (1 hour TTL)
- Handles errors gracefully

---

## Security Configuration

### plant-data-aggregator Security
```kotlin
// Requires API key via X-API-Key header
// Configured in application.yml:
api.key: ${PLANT_DATA_API_KEY:dev-key-change-in-production...}
```

### gardentime Security  
```kotlin
// JWT-based user authentication
// Public endpoints: /api/auth/**, /error
// Protected: All other endpoints (including rotation API)
```

### Next.js API Key Proxy
```typescript
// client-next/app/api/plants/search/route.ts
// Adds X-API-Key header when calling plant-data-aggregator
const PLANT_DATA_API_KEY = process.env.PLANT_DATA_API_KEY || 'dev-key...';
```

---

## Environment Variables

### plant-data-aggregator
```bash
PLANT_DATA_API_KEY=dev-key-change-in-production-make-it-very-secure-and-random
DB_USER=gardentime
DB_PASSWORD=gardentime
```

### gardentime
```bash
JWT_SECRET=your-secret-key
DB_USER=gardentime
DB_PASSWORD=gardentime
PLANT_DATA_API_URL=http://localhost:8081
PLANT_DATA_API_KEY=dev-key-change-in-production-make-it-very-secure-and-random
```

### client-next
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
PLANT_DATA_API_URL=http://localhost:8081
PLANT_DATA_API_KEY=dev-key-change-in-production-make-it-very-secure-and-random
```

---

## Running the Application

### Prerequisites
1. PostgreSQL running on port 5432
2. Two databases: `plant_data_aggregator` and `gardentime`

### Start Order
1. **plant-data-aggregator** (port 8081)
   ```bash
   cd plant-data-aggregator
   ./gradlew bootRun
   ```

2. **gardentime** (port 8080)
   ```bash
   cd /path/to/gardentime
   ./gradlew bootRun
   ```

3. **client-next** (port 3000)
   ```bash
   cd client-next
   npm run dev
   ```

---

## Current Status

### ✅ Completed
- Plant-data-aggregator API implementation (12/13 endpoints)
- Gardentime rotation planner logic (all 4 phases)
- Rotation controller endpoints
- Plant data client with caching
- Frontend season planner integration
- Rotation validation and scoring
- Recommendation engine
- Detailed feedback system

### ❌ Missing/Issues
1. **plant-data-aggregator not running** - causing ERR_CONNECTION_REFUSED
2. Seasonal planning endpoint (deferred - needs seasonal data in database)
3. Frontend modal background visibility issue
4. Some entity models need no-arg constructors for JPA

---

## Troubleshooting

### Error: ERR_CONNECTION_REFUSED when searching plants
**Cause:** plant-data-aggregator is not running on port 8081  
**Solution:** Start plant-data-aggregator: `cd plant-data-aggregator && ./gradlew bootRun`

### Error: 403 Forbidden from plant-data-aggregator
**Cause:** API key mismatch  
**Solution:** Ensure all three applications use the same PLANT_DATA_API_KEY

### Error: 404 on /api/gardens/{id}/grow-areas/{areaId}/rotation/recommendations
**Cause:** Gardentime backend not running or endpoint not registered  
**Solution:** Start gardentime: `./gradlew bootRun` and verify RotationController is loaded

### Error: No default constructor for entity
**Cause:** Kotlin data classes need explicit no-arg constructors for JPA  
**Solution:** Add kotlin-jpa plugin or add explicit constructors

---

## Documentation References

- Rotation Planner Implementation: `ROTATION_PLANNER_IMPLEMENTATION_SUMMARY.md`
- Rotation Planner Logic: `ROTATION_PLANNER_LOGIC.md`
- API Implementation Plan: `docs/API_IMPLEMENTATION_PLAN.md`
- Frontend Integration: `ROTATION_PLANNER_FRONTEND_INTEGRATION.md`
- Feedback Enhancement: `docs/ROTATION_FEEDBACK_ENHANCEMENT.md`
