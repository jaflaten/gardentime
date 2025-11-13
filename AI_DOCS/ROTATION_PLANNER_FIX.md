# Rotation Planner Endpoint Fix

## Problem

The frontend was trying to call a rotation planner endpoint that didn't exist:
```
POST /api/gardens/{gardenId}/season-plans/{seasonPlanId}/run-rotation-planner
```

This resulted in a 404 error with the message:
```
No static resource api/gardens/ffece8d7-65a6-417f-860a-e2a9c211c6a3/season-plans/b86843c7-647e-44db-91a9-1b5dc1240277/run-rotation-planner.
```

## Root Cause

The endpoint existed in the frontend BFF layer (`client-next/app/api/gardens/[id]/season-plans/[seasonPlanId]/run-rotation-planner/route.ts`) but was missing from the Spring Boot backend `SeasonPlanningController`.

## Solution

Added the missing backend implementation:

### 1. Created DTOs (SeasonPlanningDto.kt)
- `CropPlacementPlanDTO` - Overall plan with assignments and summary
- `CropAssignmentDTO` - Individual crop assignment with rotation scores
- `RotationScoreDTO` - Rotation score details
- `AlternativeLocationDTO` - Alternative grow area options
- `PlacementSummaryDTO` - Overall statistics and recommendations

### 2. Added Service Method (SeasonPlanningService.kt)
- `runRotationPlanner()` - Analyzes all planned crops in a season plan
- Scores each crop in all available grow areas
- Recommends best grow area for each crop
- Provides alternative locations
- Calculates summary statistics

### 3. Added Controller Endpoint (SeasonPlanningController.kt)
- `POST /api/gardens/{gardenId}/season-plans/{seasonPlanId}/run-rotation-planner`
- Returns `CropPlacementPlanDTO` with recommendations

## How It Works

1. Frontend calls the endpoint with garden ID and season plan ID
2. Backend fetches all planned crops for that season plan
3. For each crop, it scores all available grow areas using `RotationScoringService`
4. Selects the best grow area based on rotation score
5. Provides up to 3 alternative locations sorted by score
6. Calculates summary statistics (excellent/good/fair/poor placements)
7. Returns complete placement plan to frontend

## Testing

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}' | jq -r '.token')

# Get garden ID
GARDEN_ID=$(curl -s -X GET http://localhost:8080/api/gardens \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')

# Create season plan
SEASON_PLAN_ID=$(curl -s -X POST "http://localhost:8080/api/gardens/$GARDEN_ID/season-plan" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"season":"SPRING","year":2025}' | jq -r '.id')

# Add crops
curl -s -X POST "http://localhost:8080/api/gardens/$GARDEN_ID/season-plans/$SEASON_PLAN_ID/planned-crops" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plantId":"1","plantName":"Tomato","quantity":3,"preferredGrowAreaId":null,"phase":"planning","notes":"Test"}'

# Run rotation planner
curl -s -X POST "http://localhost:8080/api/gardens/$GARDEN_ID/season-plans/$SEASON_PLAN_ID/run-rotation-planner" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

## Dependencies

The rotation planner requires:
- `RotationScoringService` - For scoring crops in grow areas
- `PlantDataApiClient` - For fetching plant details (requires Plant Data Aggregator service on port 8081)
- At least one grow area in the garden
- At least one planned crop in the season plan

## Known Issues

- Requires Plant Data Aggregator service to be running on port 8081
- If no grow areas exist, returns 400 Bad Request
- If no planned crops exist, returns empty assignments array

## Files Changed

1. `src/main/kotlin/no/sogn/gardentime/dto/SeasonPlanningDto.kt` - Added rotation planner DTOs
2. `src/main/kotlin/no/sogn/gardentime/service/SeasonPlanningService.kt` - Added runRotationPlanner method
3. `src/main/kotlin/no/sogn/gardentime/api/SeasonPlanningController.kt` - Added POST endpoint

## Frontend Integration

The frontend BFF layer at `client-next/app/api/gardens/[id]/season-plans/[seasonPlanId]/run-rotation-planner/route.ts` already exists and will now work correctly with the backend endpoint.

The rotation planner page at `client-next/app/gardens/[id]/rotation-planner/page.tsx` expects the response format that is now provided.
