# Frontend Rotation Planner Integration Fixes

## Issues Identified

### 1. Modal Background Issue
The modal backdrop appears fully black instead of showing a blurred background of the page.
**Status:** Styling already correct in code (`bg-black/50 backdrop-blur-sm`), may need CSS verification

### 2. Climate Form Text Visibility  
Date inputs and hardiness zone text are too light/hard to read.
**Status:** Needs darker text colors

### 3. Rotation Recommendations 404 Error
Frontend calls `/api/gardens/{id}/grow-areas/{areaId}/rotation/recommendations` but gets 404.
**Possible causes:**
- Route not registered properly
- Security blocking the request
- Missing grow area in database
- Controller not loaded

### 4. Plant Search Integration
Frontend searches for plants through BFF → gardentime → plant-data-aggregator.
**Status:** Architecture is correct, but need to verify API key is being sent

## Architecture Confirmation

```
Frontend (Next.js :3000)
  ↓ (fetch /api/plants/search)
BFF (Next.js API route)
  ↓ (HTTP GET with session token)
Gardentime Backend (:8080) [PlantDataProxyController]
  ↓ (HTTP GET with X-API-Key header)
Plant-Data-Aggregator (:8081) [PlantDataController]
  ↓ (returns plant data)
```

This is the **correct** architecture:
- BFF only talks to gardentime backend
- Gardentime backend talks to plant-data-aggregator
- Security handled via API keys between backends

## Fix Plan

### Phase 1: Fix Modal Styling
1. ✅ Verify modal backdrop has `backdrop-blur-sm` class
2. Check if Tailwind blur utilities are properly configured
3. Fix climate form text colors to be darker

### Phase 2: Fix Rotation Endpoint 404
1. Add debug logging to RotationController
2. Verify endpoint is being registered
3. Check security configuration
4. Verify growAreaId exists in database

### Phase 3: Test Plant Search Flow
1. Verify API key is configured in gardentime
2. Test plant search end-to-end
3. Add error handling for API failures

### Phase 4: Test Rotation Recommendations
1. Test rotation recommendations with valid grow area
2. Verify response format matches frontend expectations
3. Add proper error messages to user

## Next Steps
1. Fix the immediate issues (styling, 404)
2. Add comprehensive logging for debugging
3. Test the complete user flow
4. Document any remaining gaps
