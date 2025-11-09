# Frontend Integration Issues - Resolution Steps

## Issue Summary

Several issues were reported with the season planner frontend integration:
1. ✅ JWT token expired errors - RESOLVED (users need to re-login)
2. ✅ Entity constructor errors (SeasonPlan, GardenClimateInfo) - FIXED
3. ⏳ Plant search authentication (401 errors) - IN PROGRESS
4. ✅ Modal background showing completely black - FIXED (backdrop blur added)
5. ⏳ 404 error on rotation recommendations endpoint - NEEDS INVESTIGATION
6. ⏳ Text contrast issues (dates, hardiness zones too bright) - TO FIX

## Issues Fixed

### 1. ✅ Entity Constructor Issues
**Problem:** JPA/Hibernate requires no-arg constructors for entity classes
**Solution:** Added explicit no-arg constructors to:
- `GardenClimateInfo.kt`
- `SeasonPlan.kt`

**Code Changes:**
```kotlin
// Added to both entities
constructor() : this(
    // ... default values
)
```

### 2. ✅ Kotlin JPA Plugin
**Problem:** User wanted to upgrade Kotlin JPA plugin
**Solution:** Already at version 2.2.21 in `build.gradle.kts`

### 3. Architecture Clarification
**Confirmed Correct Architecture:**
- **plant-data-aggregator** (port 8081): Provides plant data API
- **gardentime** (port 8080): Implements rotation planning logic
- **client-next** (port 3000): Frontend with API proxy for plant search

## Issues Requiring Action

### 1. ❌ plant-data-aggregator Not Running
**Problem:** Frontend getting `ERR_CONNECTION_REFUSED` when searching for plants
**Root Cause:** plant-data-aggregator service is not running on port 8081

**Solution:** Start the plant-data-aggregator service:
```bash
cd plant-data-aggregator
./gradlew bootRun
```

**Verify it's running:**
```bash
curl http://localhost:8081/actuator/health
```

### 2. ❌ JWT Token Expired
**Problem:** Backend logs show JWT expired 376 million milliseconds ago
**Root Cause:** User's authentication token has expired

**Solution:** 
1. Log out from the frontend
2. Log back in to get a fresh JWT token
3. The token is valid for 24 hours (configured in `application.yml`)

### 3. ✅ Modal Background Visibility
**Problem:** Modal background was completely black instead of showing blurred content
**Status:** FIXED

**Solution:** Added backdrop blur effect:
```tsx
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
```

This now provides a professional look with the blurred background visible behind modals.

### 4. ❌ Text Contrast Issues
**Problem:** Dates and hardiness zone text are too bright/hard to read

**Location:** Climate info form in season planner
**Solution:** Update text colors from `text-gray-300` to `text-gray-700` or `text-gray-900`

### 5. ❌ 404 on Rotation Recommendations Endpoint
**Problem:** Frontend getting 404 on `/api/gardens/{id}/grow-areas/{areaId}/rotation/recommendations`

**Root Cause:** Either:
1. gardentime backend not running
2. Grow area with ID 178 doesn't exist
3. Routing issue

**Solution:**
1. Verify gardentime is running: `curl http://localhost:8080/actuator/health`
2. Check if grow area exists in database
3. Check backend logs for routing errors

## Startup Sequence

To run the complete application, start services in this order:

### 1. PostgreSQL Database
Ensure PostgreSQL is running with both databases:
- `plant_data_aggregator`
- `gardentime`

### 2. plant-data-aggregator (Port 8081)
```bash
cd plant-data-aggregator
./gradlew bootRun
```

Wait for: `Started PlantDataAggregatorApplication`

### 3. gardentime (Port 8080)
```bash
cd /path/to/gardentime
./gradlew bootRun
```

Wait for: `Started GardentimeApplication`

### 4. client-next (Port 3000)
```bash
cd client-next
npm run dev
```

## API Architecture Verification

### Plant Data Flow
```
Frontend (3000)
  ↓ Search for plant
Next.js API Route (/api/plants/search)
  ↓ Adds X-API-Key header
plant-data-aggregator (8081)
  ↓ Returns plant data
Frontend
```

### Rotation Planning Flow
```
Frontend (3000)
  ↓ Request recommendations
gardentime API (8080) /api/gardens/{id}/grow-areas/{areaId}/rotation/recommendations
  ↓ Fetches plant data from plant-data-aggregator
  ↓ Analyzes rotation history
  ↓ Scores candidates
  ↓ Returns recommendations
Frontend
```

## Environment Variables

Ensure these are set or use defaults:

### plant-data-aggregator
```bash
PLANT_DATA_API_KEY=dev-key-change-in-production-make-it-very-secure-and-random
DB_USER=gardentime
DB_PASSWORD=gardentime
```

### gardentime
```bash
JWT_SECRET=your-secret-key-change-this-in-production-make-it-very-long-and-secure
PLANT_DATA_API_URL=http://localhost:8081
PLANT_DATA_API_KEY=dev-key-change-in-production-make-it-very-secure-and-random
DB_USER=gardentime
DB_PASSWORD=gardentime
```

### client-next
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
PLANT_DATA_API_URL=http://localhost:8081
PLANT_DATA_API_KEY=dev-key-change-in-production-make-it-very-secure-and-random
```

**Important:** The `PLANT_DATA_API_KEY` must match in all three applications!

## Testing the Integration

### 1. Test plant-data-aggregator
```bash
curl -H "X-API-Key: dev-key-change-in-production-make-it-very-secure-and-random" \
  http://localhost:8081/api/v1/plant-data/plants/search?q=tomato
```

### 2. Test gardentime rotation endpoint
```bash
# First get JWT token by logging in
# Then:
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8080/api/gardens/{gardenId}/grow-areas/{areaId}/rotation/recommendations
```

### 3. Test frontend
1. Open http://localhost:3000
2. Log in (to get fresh JWT)
3. Navigate to a garden
4. Open season planner
5. Click "Add Crop"
6. Try searching for a plant (e.g., "carrot")

## Known Limitations

1. **Seasonal Planning Endpoint:** Not yet implemented in plant-data-aggregator (deferred - needs seasonal data)
2. **Rotation Planning in plant-data-aggregator:** Intentionally moved to gardentime (correct architecture)
3. **API Key Security:** Development key is hardcoded; should be changed in production

## Next Steps

1. Start all three services in order
2. Log in to get fresh JWT token
3. Test plant search functionality
4. Test rotation recommendations
5. Fix any remaining UI issues (text contrast, modal backdrop)

## Documentation

See these files for more details:
- `docs/ROTATION_PLANNER_COMPLETE_ARCHITECTURE.md` - Complete architecture overview
- `docs/API_IMPLEMENTATION_PLAN.md` - API implementation status
- `docs/ROTATION_PLANNER_IMPLEMENTATION.md` - Rotation planner details
- `ROTATION_PLANNER_LOGIC.md` - Rotation scoring logic
