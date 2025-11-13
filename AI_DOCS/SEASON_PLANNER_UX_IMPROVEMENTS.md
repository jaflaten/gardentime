# Season Planner UX Improvements

**Date**: 2025-11-09

## Overview
Improved the user experience of the season planner by streamlining the crop addition workflow and clarifying when the rotation planner should be used.

## Changes Made

### 1. Simplified Add Crop Modal
**Problem**: The modal was showing rotation recommendations and analysis before the user had even decided where to plant crops, which was confusing since grow area assignments hadn't been made yet.

**Solution**: 
- Removed premature rotation recommendations display
- Removed rotation analysis during crop selection
- Simplified the modal to focus on plant search and basic crop details (quantity, planting date)
- Added informational message explaining that rotation planner runs after all crops are added

**Files Modified**:
- `client-next/components/AddCropToSeasonModal.tsx`
  - Removed `RotationScore` and `PlantRecommendation` state
  - Removed `fetchRecommendations()` and `checkRotation()` functions
  - Removed `useEffect` that was fetching recommendations on modal open
  - Removed rotation analysis UI components
  - Removed unused imports (`useEffect`, rotation types, rotation card components)
  - Set `preferredGrowAreaId` to `null` when adding crops (no assignment yet)

### 2. Added "Run Rotation Planner" Button
**Problem**: There was no clear way for users to trigger the rotation planner after adding their crops.

**Solution**:
- Added prominent "Run Rotation Planner" button that appears when crops exist
- Button navigates to dedicated rotation planner page (to be implemented)
- Added informational callout explaining when and why to use the rotation planner

**Files Modified**:
- `client-next/app/gardens/[id]/season-plan/page.tsx`
  - Added "Run Rotation Planner" button next to "Add Crop" button
  - Button only shows when crops exist in the plan
  - Included icon for visual clarity
  - Added informational message about running the planner

## User Flow

### Before Changes
1. User opens "Add Crop" modal
2. Modal immediately shows rotation recommendations (confusing - for which area?)
3. User searches for and selects a plant
4. Modal shows rotation analysis (still unclear since no grow area assigned)
5. User adds crop with vague grow area preference
6. No clear way to get comprehensive rotation suggestions

### After Changes
1. User opens "Add Crop" modal
2. Modal shows clean search interface
3. User searches for and selects a plant
4. Modal shows simple form: quantity and optional planting date
5. Informational message tells user to run rotation planner after adding all crops
6. User adds crop to season plan list (no grow area assigned yet)
7. User repeats for all crops they want to grow
8. User clicks "Run Rotation Planner" button
9. Rotation planner analyzes all crops and provides optimal placement suggestions

## Benefits

1. **Clearer Intent**: Users understand they're building a list of crops first, then getting placement suggestions
2. **Less Confusion**: No premature analysis showing before context is established
3. **Better UX**: Simplified modal focused on one task at a time
4. **Explicit Action**: Clear button to trigger rotation planning
5. **Educational**: Informational messages guide users on the workflow

## Next Steps

1. Implement rotation planner page at `/gardens/[id]/rotation-planner`
2. This page should:
   - Show all unassigned crops from the season plan
   - Show all available grow areas
   - For each grow area, show recommended crops with rotation scores
   - Allow drag-and-drop or click assignment of crops to areas
   - Show warnings and benefits for each potential placement
   - Save assignments back to the season plan

## Technical Notes

- Modal backdrop transparency issue was already fixed (not part of this change)
- Plant search authorization (401 errors) needs to be fixed separately
- The rotation planner logic and API endpoints are already implemented in the backend
- Frontend just needs to wire up the UI to consume the existing backend functionality
