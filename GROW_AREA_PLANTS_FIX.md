# Grow Area Plants Endpoint Fix

## Issue
When opening the grow area details page at `/gardens/{id}/grow-areas/{growAreaId}`, the page failed to load plant data with the error:
```
No static resource api/plants.
```

This occurred when accessing: `http://localhost:3000/gardens/ffece8d7-65a6-417f-860a-e2a9c211c6a3/grow-areas/173`

## Root Cause Analysis

The issue had two parts:

### 1. Build Error Preventing Route Registration
The Next.js build was failing due to a TypeScript error in the rotation validation route, which prevented proper route registration:

**File**: `client-next/app/api/gardens/[id]/grow-areas/[growAreaId]/rotation/validate/route.ts`

**Error**:
```
Type "{ params: { id: string; growAreaId: string; }; }" is not a valid type for the function's second argument.
```

**Cause**: Next.js 15 changed the params type from a direct object to a Promise that needs to be awaited.

### 2. Trailing Slash in API Call
The BFF (Backend-for-Frontend) route was calling the Spring Boot backend with a trailing slash `/api/plants/` instead of `/api/plants`, causing a 500 error.

**File**: `client-next/app/api/plants/route.ts`

**Issue**: Line 15 had:
```typescript
const response = await springApi.get('/api/plants/', {
```

The Spring Boot controller endpoint is defined as `/api/plants` (without trailing slash).

## Changes Made

### 1. Fixed Rotation Validation Route Type
**File**: `client-next/app/api/gardens/[id]/grow-areas/[growAreaId]/rotation/validate/route.ts`

```typescript
// Before
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; growAreaId: string } }
) {
  const url = `/api/gardens/${params.id}/grow-areas/${params.growAreaId}/rotation/validate`;

// After
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; growAreaId: string }> }
) {
  const resolvedParams = await params;
  const url = `/api/gardens/${resolvedParams.id}/grow-areas/${resolvedParams.growAreaId}/rotation/validate`;
```

### 2. Removed Trailing Slash from Plants API Call
**File**: `client-next/app/api/plants/route.ts`

```typescript
// Before
const response = await springApi.get('/api/plants/', {

// After
const response = await springApi.get('/api/plants', {
```

## Verification

### Backend Endpoint Works
```bash
curl http://localhost:8080/api/plants -H "Authorization: Bearer {token}"
# Returns: 200 OK with plant data (15 plants)
```

### Frontend BFF Works
```bash
curl http://localhost:3000/api/plants -H "Authorization: Bearer {token}"
# Returns: 200 OK with plant data (15 plants)
```

### Build Success
```bash
npm run build
# ✓ Compiled successfully
# All routes properly registered including /api/plants
```

## Impact

✅ **Fixed**: Grow area details page can now load and display plant data  
✅ **Fixed**: Next.js build completes successfully  
✅ **Fixed**: All API routes properly registered  
✅ **Fixed**: Users can now create crop records with plant selection dropdown  

## Related Files

**Frontend Routes**:
- `client-next/app/gardens/[id]/grow-areas/[growAreaId]/page.tsx` - Grow area details page
- `client-next/app/api/plants/route.ts` - BFF plants endpoint
- `client-next/app/api/gardens/[id]/grow-areas/[growAreaId]/rotation/validate/route.ts` - Rotation validation BFF

**Backend Controllers**:
- `src/main/kotlin/no/sogn/gardentime/api/PlantDataProxyController.kt` - Plants proxy controller

**Frontend Services**:
- `client-next/lib/api.ts` - Contains `plantService.getAll()` which calls `/api/plants`

## Date
November 13, 2025
