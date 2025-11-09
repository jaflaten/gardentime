# Season Planner & Rotation Integration Fixes

## Issues Identified

### 1. Architecture Issue: BFF Calling Plant-Data-Aggregator Directly
**Problem:** Next.js BFF (client-next/app/api/plants/*) calls plant-data-aggregator API directly
**Required:** BFF should only talk to gardentime backend, which then talks to plant-data-aggregator
**Impact:** Security concern - bypassing backend authentication and business logic

### 2. Missing BFF Routes for Rotation API
**Problem:** Frontend calls rotation endpoints that don't exist in Next.js BFF
**Error:** `GET /api/gardens/{id}/grow-areas/{growAreaId}/rotation/recommendations` returns 404
**Impact:** Cannot fetch rotation recommendations in season planner

### 3. JPA Entity Constructor Issues
**Problem:** `No default constructor for entity` errors for:
- `GardenClimateInfo`
- `SeasonPlan`
**Status:** Already has constructors, might need kotlin-jpa plugin configuration
**Impact:** Cannot save climate info or season plans

### 4. Frontend UX Issues
**Problem:** Modal background is black instead of showing blurred website
**Impact:** Poor user experience
**Files:** AddCropToSeasonModal.tsx and related modal components

### 5. Text Contrast Issues
**Problem:** Dates and hardiness zones text too bright/hard to read
**Impact:** Accessibility and usability problem

## Architecture Clarification

**Correct Data Flow:**
```
Frontend (React/Next.js)
    ↓
Next.js BFF (/api/*)
    ↓
Gardentime Backend (Spring Boot :8080)
    ↓
Plant-Data-Aggregator API (Spring Boot :8081)
```

**Current Incorrect Flow:**
```
Frontend → Next.js BFF → Plant-Data-Aggregator (bypassing gardentime backend)
```

## Implementation Plan

### Phase 1: Fix Backend Entity Issues
- [ ] Ensure kotlin-jpa plugin is properly configured
- [ ] Remove manual constructors and rely on plugin
- [ ] Test entity saving/loading

### Phase 2: Create BFF Routes for Rotation API
- [ ] Create `/api/gardens/[id]/grow-areas/[growAreaId]/rotation/validate/route.ts`
- [ ] Create `/api/gardens/[id]/grow-areas/[growAreaId]/rotation/recommendations/route.ts`
- [ ] All routes proxy to gardentime backend at :8080

### Phase 3: Fix Plant Data Routes in BFF
- [ ] Update `/api/plants/search/route.ts` to call gardentime backend
- [ ] Create gardentime backend proxy endpoints for plant data
- [ ] Ensure all plant data flows through gardentime backend

### Phase 4: Frontend Fixes
- [ ] Fix modal background opacity/blur
- [ ] Fix text contrast for dates and zones
- [ ] Improve error handling and loading states

### Phase 5: Integration Testing
- [ ] Test full flow: search plants → add to season plan
- [ ] Test rotation recommendations display
- [ ] Test climate info save
- [ ] Verify all API calls go through correct architecture

## Files to Modify

### Backend (Gardentime)
- `src/main/kotlin/no/sogn/gardentime/api/PlantDataProxyController.kt` - Add search endpoint
- `build.gradle.kts` - Verify kotlin-jpa configuration
- `src/main/kotlin/no/sogn/gardentime/model/GardenClimateInfo.kt` - Fix constructor
- `src/main/kotlin/no/sogn/gardentime/model/SeasonPlan.kt` - Fix constructor

### BFF (Next.js)
- `client-next/app/api/plants/search/route.ts` - Change to call gardentime backend
- `client-next/app/api/gardens/[id]/grow-areas/[growAreaId]/rotation/validate/route.ts` - Create
- `client-next/app/api/gardens/[id]/grow-areas/[growAreaId]/rotation/recommendations/route.ts` - Create

### Frontend (React)
- `client-next/components/AddCropToSeasonModal.tsx` - Fix background, improve UX
- `client-next/app/(dashboard)/gardens/[id]/season-planner/[seasonPlanId]/page.tsx` - Fix contrast
- Global modal styles - Fix backdrop

## Success Criteria

- [ ] All API calls from BFF go to gardentime backend only
- [ ] Plant search works without errors
- [ ] Rotation recommendations display correctly
- [ ] Can save climate info successfully
- [ ] Can create and update season plans
- [ ] Modal backgrounds show blurred content
- [ ] Text contrast meets accessibility standards
- [ ] No console errors in frontend or backend

## Security Improvements

- [ ] Plant-data-aggregator API key only used by gardentime backend
- [ ] BFF has no direct access to plant-data-aggregator
- [ ] All plant data requests authenticated through gardentime backend
- [ ] User context maintained through entire request chain
