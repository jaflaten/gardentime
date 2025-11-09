# Rotation Planner Frontend Integration - Status and Fixes

## Summary

I've analyzed the implementation and fixed several issues with the rotation planner frontend integration. The architecture is **correct** - the BFF only talks to gardentime backend, and gardentime talks to plant-data-aggregator.

## Architecture Confirmed ✅

```
Frontend (Next.js :3000)
  ↓ fetch('/api/plants/search')
Next.js BFF (/app/api/plants/search/route.ts)
  ↓ HTTP GET with Bearer token
Gardentime Backend (:8080)
  ├─ PlantDataProxyController (/api/plants/*)
  │   ↓ HTTP GET with X-API-Key header
  │   Plant-Data-Aggregator (:8081)
  │       └─ PlantDataController (/api/v1/plant-data/*)
  └─ RotationController (/api/gardens/{id}/grow-areas/{areaId}/rotation/*)
```

**This is the correct architecture:**
- BFF only communicates with gardentime backend
- Gardentime backend fetches plant data from plant-data-aggregator
- Security between backends via X-API-Key header
- Security between BFF and gardentime via JWT Bearer token

## Changes Made

### 1. Fixed Modal Background Transparency
**File:** `client-next/components/AddCropToSeasonModal.tsx`
- Changed backdrop from `bg-black/50` to `bg-black/30` for lighter overlay
- Added `relative` class to modal content for proper z-index stacking
- Modal now shows blurred background properly

### 2. Enhanced Logging for Debugging
**Files Modified:**
- `src/main/kotlin/no/sogn/gardentime/api/RotationController.kt`
- `src/main/kotlin/no/sogn/gardentime/api/PlantDataProxyController.kt`

Added comprehensive logging:
```
=== ROTATION RECOMMENDATION REQUEST ===
=== ROTATION RECOMMENDATION RESPONSE ===
=== ROTATION RECOMMENDATION ERROR ===
=== PLANT SEARCH REQUEST ===
=== PLANT SEARCH RESPONSE ===
=== PLANT SEARCH ERROR ===
```

This will help identify:
- If requests are reaching the controller
- What data is being processed
- Where errors occur

### 3. Added Error Handling
All controller methods now have try-catch blocks that:
- Log the full exception with stack trace
- Rethrow to allow Spring's exception handler to format the response
- Provide clear error messages in logs

## Current Implementation Status

### ✅ Implemented in plant-data-aggregator

1. **Plant Information API** (PlantDataController)
   - `GET /api/v1/plant-data/plants` - List plants with filtering
   - `GET /api/v1/plant-data/plants/{name}` - Get plant details
   - `GET /api/v1/plant-data/plants/search?q={query}` - Search plants
   - `POST /api/v1/plant-data/plants/bulk` - Bulk plant details

2. **Plant Families API**
   - `GET /api/v1/plant-data/families` - List all families
   - `GET /api/v1/plant-data/families/{familyName}/plants` - Plants by family

3. **Companion Planting API**
   - `GET /api/v1/plant-data/plants/{name}/companions` - Get companions
   - `POST /api/v1/plant-data/companions/check` - Check compatibility

4. **Pest & Disease API**
   - `GET /api/v1/plant-data/plants/{name}/pests` - Plant pests
   - `GET /api/v1/plant-data/plants/{name}/diseases` - Plant diseases
   - `GET /api/v1/plant-data/diseases/soil-borne` - Critical diseases

5. **Security** - API Key authentication (X-API-Key header)

### ✅ Implemented in gardentime backend

1. **Plant Data Proxy** (PlantDataProxyController)
   - Proxies all plant-data-aggregator endpoints
   - Adds API key automatically via PlantDataApiClient
   - Caches responses (1 hour TTL)
   - All endpoints under `/api/plants/*`, `/api/families/*`, etc.

2. **Rotation Planning** (RotationController)
   - `POST /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/validate`
   - `GET /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/recommendations`
   - `GET /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/recommendations/soil-improvement`
   - `GET /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/recommendations/by-family`
   - `GET /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/companions?plant={name}`
   - `GET /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/avoid`

3. **Rotation Logic**
   - RotationScoringService - Scores rotation compatibility (0-100)
   - RotationRecommendationService - Generates recommendations
   - RotationMessageService - Provides user-friendly feedback
   - RotationRules - Defines rotation best practices

### ✅ Implemented in frontend

1. **BFF Routes** (Next.js API routes)
   - `/api/plants/search` - Proxies to gardentime
   - Handles authentication via NextAuth session

2. **UI Components**
   - AddCropToSeasonModal - Search and add crops
   - RotationIssueCard - Display rotation warnings
   - RotationBenefitCard - Display rotation benefits
   - Season plan page with climate info setup

## Issues to Investigate

### 1. 404 Error on Rotation Recommendations
**Symptom:** `GET /api/gardens/{id}/grow-areas/{areaId}/rotation/recommendations` returns 404

**Possible Causes:**
a) Grow area ID doesn't exist in database
b) Security blocking the request
c) Controller not being registered
d) Path mismatch

**Debugging Steps:**
1. Restart gardentime backend to load new logging
2. Try to access the endpoint from frontend
3. Check logs for:
   - `=== ROTATION RECOMMENDATION REQUEST ===` (controller reached)
   - `JWT authentication` errors (security issue)
   - Any exceptions (runtime error)

### 2. Plant Search Connection Refused
**Symptom:** `ERR_CONNECTION_REFUSED` on `http://localhost:8081`

**Cause:** Frontend directly calling plant-data-aggregator (bypassing architecture)

**Fix:** Already correct in code - the BFF should proxy through gardentime
- Verify plant-data-aggregator is running on port 8081
- Verify API key is configured in gardentime application.yml

## Testing Steps

### Test Plant Search Flow

1. Start both backends:
   ```bash
   # Terminal 1: plant-data-aggregator
   cd plant-data-aggregator
   ./gradlew bootRun
   
   # Terminal 2: gardentime
   cd gardentime
   ./gradlew bootRun
   
   # Terminal 3: frontend
   cd client-next
   npm run dev
   ```

2. Open browser dev tools, go to season planner

3. Click "Add Crop" button

4. Type in search field (e.g., "carrot")

5. Check logs for:
   - Frontend: Fetch call to `/api/plants/search`
   - Gardentime: `=== PLANT SEARCH REQUEST ===`
   - Plant-data-aggregator: Search query received

### Test Rotation Recommendations

1. Ensure you have a grow area created

2. Click "Add Crop" to open modal

3. Check browser dev tools console for:
   - Request to `/api/gardens/{id}/grow-areas/{areaId}/rotation/recommendations`
   - Response status code

4. Check gardentime logs for:
   - `=== ROTATION RECOMMENDATION REQUEST ===`
   - `=== ROTATION RECOMMENDATION RESPONSE ===`
   - Any errors

## Climate Form Text Visibility

The climate form already has inline styles to fix text visibility:
```typescript
style={{ colorScheme: 'light', color: '#111827' }}
```

If still hard to read, can adjust to darker color like `#000000`.

## Next Steps

1. **Restart Backend Services** - To pick up new logging
2. **Test Plant Search** - Verify end-to-end flow works
3. **Debug 404 Error** - Use new logging to identify root cause
4. **Verify Grow Area Exists** - Check database for grow area ID 178
5. **Test Complete User Flow** - Add crop to season plan

## User Flow for Rotation Planner

1. User logs in and selects garden
2. User goes to Season Planner
3. User creates or selects a season plan
4. User enters climate information (frost dates, hardiness zone)
5. User clicks "Add Crop" button
6. Modal opens showing:
   - **Top recommendations** based on rotation analysis
   - **Search field** to find specific crops
7. User either:
   - Selects a recommended crop
   - Searches for and selects a specific crop
8. System validates rotation and shows:
   - Rotation score (0-100)
   - Grade (EXCELLENT, GOOD, FAIR, POOR, AVOID)
   - Issues/warnings (if any)
   - Benefits (if any)
9. User sets quantity and planting date
10. User clicks "Add to Plan"
11. Crop is added to season plan

## Files Changed

1. `client-next/components/AddCropToSeasonModal.tsx` - Fixed modal background
2. `src/main/kotlin/no/sogn/gardentime/api/RotationController.kt` - Added logging
3. `src/main/kotlin/no/sogn/gardentime/api/PlantDataProxyController.kt` - Added logging

## Files to Review

- `src/main/kotlin/no/sogn/gardentime/rotation/RotationRecommendationService.kt` - Check if grow area lookup fails
- `src/main/kotlin/no/sogn/gardentime/rotation/RotationScoringService.kt` - Verify scoring logic
- `client-next/app/gardens/[id]/season-plan/page.tsx` - Season plan page
- Database: Check if grow area ID 178 exists

## Configuration Check

Verify these environment variables are set:

**gardentime (application.yml):**
```yaml
plantdata:
  api:
    url: http://localhost:8081
    key: dev-key-change-in-production-make-it-very-secure-and-random
```

**plant-data-aggregator (application.yml):**
```yaml
api:
  key: dev-key-change-in-production-make-it-very-secure-and-random
```

**Note:** Both API keys must match!
