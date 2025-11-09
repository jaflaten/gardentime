# Climate Info Update Issue - Resolution

## Problem
When trying to update climate information (frost dates, hardiness zone), the frontend was getting a 500 error from the backend.

## Root Cause
The JWT authentication token has expired. The backend logs showed:
```
JWT expired 376681363 milliseconds ago at 2025-11-02T09:58:18.000Z
```

Your token expired on November 2nd, and it's now November 6th.

## Solution
**You need to log out and log in again to get a fresh JWT token.**

## Changes Made

### 1. Improved Error Handling (Backend)
- Added try-catch block around the climate update endpoint
- Added console logging to help debug issues
- File: `src/main/kotlin/no/sogn/gardentime/api/SeasonPlanningController.kt`

### 2. Fixed Date Handling (Frontend)
- Fixed empty string handling for date inputs
- Empty date inputs now properly send `null` instead of empty strings
- File: `client-next/app/gardens/[id]/season-plan/page.tsx`

### 3. Improved UI Styling
- Added `color-scheme: light` to date inputs for better text visibility
- Date input text should now be darker and easier to read

### 4. Better Error Messages
- Added error state to show user-friendly messages
- Automatically redirects to login when session expires
- Shows clear error message: "Your session has expired. Please log in again."

## Next Steps
1. Log out of the application
2. Log back in to get a fresh JWT token
3. Try updating the climate information again
4. The update should now work correctly

## Technical Notes
- JWT tokens expire after 24 hours (86400000 milliseconds as configured in application.yml)
- The backend correctly validates tokens and rejects expired ones
- Frontend now handles 401/403 errors gracefully with user-friendly messages
