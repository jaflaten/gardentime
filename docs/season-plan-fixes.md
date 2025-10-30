# Season Planning Page Fixes

## Date: October 30, 2025

## Issues Fixed

### 1. Black Background and Missing Header
**Problem:** The season planning page appeared with a black background and no visible header or navigation.

**Root Cause:** The page was missing the main layout components (Navbar, GardenNavigation, Footer) and proper container structure.

**Solution:**
- Added `Navbar` component to show the main site navigation
- Added `GardenNavigation` component to show the garden-specific tabs (Dashboard | Season Plan | Grow Areas | Board)
- Added `Footer` component for consistent page structure
- Wrapped content in proper `min-h-screen bg-gray-50 flex flex-col` container
- Added `flex-1` wrapper around main content to push footer to bottom

### 2. 401 Unauthorized Errors
**Problem:** API calls to `/api/gardens/[id]/climate` and `/api/gardens/[id]/season-plans` were returning 401 errors.

**Root Cause:** The page was using raw `fetch()` calls instead of the authenticated `api` helper from `@/lib/api`.

**Solution:**
- Replaced all `fetch()` calls with `api.get()`, `api.post()`, and `api.put()` from the api helper
- The api helper automatically includes the auth token from localStorage in request headers
- This ensures all requests are authenticated

## Changes Made

### File: `/client-next/app/gardens/[id]/season-plan/page.tsx`

**Key Changes:**
1. Added imports:
   ```typescript
   import { api } from '@/lib/api';
   import Navbar from '@/app/components/Navbar';
   import Footer from '@/app/components/Footer';
   import GardenNavigation from '../components/GardenNavigation';
   ```

2. Added garden name state and fetch:
   ```typescript
   const [gardenName, setGardenName] = useState<string>('');
   
   // Fetch garden info for name
   const gardenRes = await api.get(`/gardens/${gardenId}`);
   if (gardenRes.data) {
     setGardenName(gardenRes.data.name);
   }
   ```

3. Replaced fetch calls with api helper:
   ```typescript
   // Before:
   const climateRes = await fetch(`/api/gardens/${gardenId}/climate`);
   
   // After:
   const climateRes = await api.get(`/gardens/${gardenId}/climate`);
   ```

4. Added proper page structure:
   ```typescript
   return (
     <div className="min-h-screen bg-gray-50 flex flex-col">
       <Navbar />
       <GardenNavigation gardenId={gardenId} gardenName={gardenName} />
       <div className="flex-1">
         <div className="container mx-auto px-4 py-8">
           {/* Content */}
         </div>
       </div>
       <Footer />
     </div>
   );
   ```

## Testing Notes

### What to Test:
1. ✅ Navigate to `/gardens/[id]/season-plan`
2. ✅ Verify Navbar appears at top (shows "RegenGarden" logo and user menu)
3. ✅ Verify GardenNavigation tabs appear below navbar (Dashboard | Season Plan | Grow Areas | Board)
4. ✅ Verify Season Plan tab is highlighted/active
5. ✅ Verify Footer appears at bottom
6. ✅ Verify no 401 errors in browser console
7. ✅ Test climate info setup modal - enter frost dates and save
8. ✅ Test season plan creation modal - create a new season plan
9. ✅ Verify climate info displays correctly after saving
10. ✅ Verify season plan displays correctly after creating

### Expected Behavior:
- Page should have white background with proper spacing
- Header should be clearly visible with garden name
- Navigation tabs should allow switching between views
- No console errors related to authentication
- All API calls should succeed (200 OK responses)

## Related Files

- `/client-next/app/gardens/[id]/season-plan/page.tsx` - Main season planning page
- `/client-next/app/gardens/[id]/components/GardenNavigation.tsx` - Navigation tabs component
- `/client-next/app/components/Navbar.tsx` - Main site navigation
- `/client-next/app/components/Footer.tsx` - Page footer
- `/client-next/lib/api.ts` - API helper with authentication
- `/client-next/app/api/gardens/[id]/climate/route.ts` - Climate info BFF route
- `/client-next/app/api/gardens/[id]/season-plans/route.ts` - Season plans BFF route

## Next Steps

After testing, continue with Phase 2 of Season Planning:
- Implement "Add Planned Crop" modal with plant search
- Add edit/delete functionality for planned crops
- Implement status update buttons (Seeds Started, Transplanted, etc.)
- Add filtering for planned crops by status/phase
- Load placeholder plant data (20 common plants)
- Create full calendar view with events
