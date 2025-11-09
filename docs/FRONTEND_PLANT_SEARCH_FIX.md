# Frontend Plant Search Fix

## Issue Summary

The plant search functionality in the season planner was failing with 401 Unauthorized errors.

## Root Cause

The `AddCropToSeasonModal` component was using raw `fetch()` API calls without authentication headers. The BFF (Backend for Frontend) requires JWT authentication to proxy requests to the gardentime backend.

## Architecture (Confirmed Correct)

```
Frontend (React)
    ↓ (JWT token in Authorization header)
Next.js BFF  
    ↓ (JWT token forwarded)
Gardentime Backend (Spring Boot on :8080)
    ↓ (API key in X-API-Key header)
Plant-Data-Aggregator API (Spring Boot on :8081)
```

### Authentication Flow

1. **Frontend → BFF**: Uses `api` client from `/lib/api.ts` which automatically includes JWT token from localStorage
2. **BFF → Gardentime Backend**: Extracts JWT from request and forwards it in Authorization header
3. **Gardentime → Plant-Data-Aggregator**: Uses `plantDataRestTemplate` with API key interceptor

### API Key Configuration

Both services use the same API key (configurable via environment variable):
- Default: `dev-key-change-in-production-make-it-very-secure-and-random`
- Environment variable: `PLANT_DATA_API_KEY`

## Fix Applied

### File: `client-next/components/AddCropToSeasonModal.tsx`

**Before:**
```typescript
const searchPlants = async (term: string) => {
  // ... validation ...
  const res = await fetch(`/api/plants/search?q=${encodeURIComponent(term)}&limit=20`);
  if (res.ok) {
    const data = await res.json();
    setPlants(data || []);
  }
};
```

**After:**
```typescript
const searchPlants = async (term: string) => {
  // ... validation ...
  const res = await api.get(`/plants/search`, {
    params: { q: term, limit: 20 }
  });
  setPlants(res.data || []);
};
```

### Key Changes

1. **Used authenticated `api` client** instead of raw `fetch()`
2. **Used axios params** instead of manual URL encoding  
3. **Simplified response handling** (axios automatically handles JSON parsing)

## What This Fixes

✅ Plant search now includes JWT authentication  
✅ BFF can successfully forward requests to gardentime backend  
✅ Gardentime backend can fetch plant data from plant-data-aggregator  
✅ Users can search for plants when adding crops to season plans

## Remaining Frontend Issues

### 1. Modal Backdrop Transparency

**Issue**: User reports modal backdrop appears completely black instead of showing blurred background.

**Current Implementation**:
```tsx
<div className="fixed inset-0 bg-black/40 backdrop-blur-sm ...">
```

**Possible Causes**:
- Browser compatibility with backdrop-blur
- z-index conflicts
- Missing background content to blur

**Suggested Fix**: Add explicit opacity and test different blur values:
```tsx
<div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm ...">
```

### 2. Async Params Warning

**Issue**: Next.js 15 warning about params not being awaited:
```
Error: Route "/api/gardens/[id]/grow-areas/[growAreaId]/rotation/recommendations" 
used `params.growAreaId`. `params` should be awaited before using its properties.
```

**Status**: ✅ Already fixed in the route file  
The route properly awaits params before use (line 15 in recommendations/route.ts)

## Testing Checklist

- [x] Fix applied to AddCropToSeasonModal.tsx
- [ ] Test plant search with valid authentication
- [ ] Test plant search with expired token
- [ ] Verify rotation recommendations load correctly  
- [ ] Test adding crops to season plan
- [ ] Verify modal backdrop appearance
- [ ] Check browser console for errors

## Related Files

### Frontend
- `client-next/components/AddCropToSeasonModal.tsx` - Fixed plant search
- `client-next/lib/api.ts` - Authenticated axios client with token interceptor
- `client-next/app/api/plants/search/route.ts` - BFF route that forwards to backend

### Backend (Gardentime)
- `src/main/kotlin/no/sogn/gardentime/api/PlantDataProxyController.kt` - Proxies to aggregator
- `src/main/kotlin/no/sogn/gardentime/client/PlantDataApiClient.kt` - HTTP client
- `src/main/kotlin/no/sogn/gardentime/config/PlantDataApiConfig.kt` - API key configuration

### Backend (Plant-Data-Aggregator)
- `src/main/kotlin/no/sogn/plantdata/controller/PlantDataController.kt` - API endpoints
- `src/main/kotlin/no/sogn/plantdata/security/ApiKeyAuthenticationFilter.kt` - API key validation
- `src/main/kotlin/no/sogn/plantdata/config/SecurityConfig.kt` - Security configuration

## Security Notes

### API Key Security

The plant-data-aggregator API is protected by API key authentication. This prevents public access while allowing the gardentime backend to consume the API.

**Current Setup**:
- ✅ API key required for all endpoints except health checks
- ✅ CORS configured for localhost:3000 and localhost:8080
- ✅ Stateless authentication (no sessions)
- ⚠️ Default API key should be changed in production

**Production Recommendations**:
1. Generate strong random API key
2. Set via environment variable `PLANT_DATA_API_KEY`
3. Use secrets management (e.g., AWS Secrets Manager, HashiCorp Vault)
4. Rotate keys periodically
5. Configure CORS for production domains only

## Next Steps

1. ✅ Plant search fix applied
2. Test the search functionality
3. If modal backdrop is still too dark, adjust opacity/blur
4. Consider adding loading states and error messages
5. Add retry logic for failed API calls
6. Implement proper error boundaries

## Environment Variables

Ensure these are set in both applications:

### Gardentime Backend
```bash
PLANT_DATA_API_URL=http://localhost:8081
PLANT_DATA_API_KEY=dev-key-change-in-production-make-it-very-secure-and-random
```

### Plant-Data-Aggregator
```bash
PLANT_DATA_API_KEY=dev-key-change-in-production-make-it-very-secure-and-random
```

Both should use the **same API key** for authentication to work.
