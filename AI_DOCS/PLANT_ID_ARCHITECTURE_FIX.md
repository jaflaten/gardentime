# Plant ID Architecture Fix

## Problem
When trying to add crops to the season planner, we encountered a foreign key constraint error:
```
ERROR: insert or update on table "planned_crops" violates foreign key constraint "planned_crops_plant_id_fkey"
Detail: Key (plant_id)=(0) is not present in table "plant_entity".
```

## Root Cause
The architecture had a fundamental mismatch:

1. **Plant-data-aggregator** stores plant data with **string IDs** (e.g., "solanum-lycopersicum")
2. **Gardentime** had a `plant_entity` table with **auto-generated Long IDs**
3. **PlannedCrop** tried to reference plants via foreign key to gardentime's local `plant_entity` table
4. The frontend was sending `plantName` instead of `plantId`, and even if it sent an ID, it would be a string ID from plant-data-aggregator

## Solution
Changed the architecture so that **PlannedCrop references plants by their external identifier** from plant-data-aggregator:

### Backend Changes

1. **PlannedCrop.kt** - Changed plantId from Long to String:
   ```kotlin
   @Column(name = "plant_id", nullable = false)
   val plantId: String,  // External plant identifier from plant-data-aggregator
   
   @Column(name = "plant_name")
   val plantName: String,  // Store the name for quick access
   ```

2. **SeasonPlanningDto.kt** - Updated DTOs:
   ```kotlin
   data class PlannedCropDTO(
       ...
       val plantId: String,
       val plantName: String,
       ...
   )
   
   data class CreatePlannedCropDTO(
       val plantId: String,
       val plantName: String,
       ...
   )
   ```

3. **SeasonPlanningService.kt** - Updated to use plant data directly:
   - Removed dependency on PlantRepository for planned crops
   - Store plantName directly in PlannedCrop
   - Updated calendar events to use plantName from PlannedCrop

4. **PlantingDateCalculatorService.kt** - Changed to accept String plantId:
   - Simplified to return empty dates for now
   - TODO: Integrate with plant-data-aggregator API to fetch plant details

5. **Database Migration** (V11) - Changed column type:
   ```sql
   -- Drop foreign key constraint
   ALTER TABLE planned_crops DROP CONSTRAINT IF EXISTS planned_crops_plant_id_fkey;
   
   -- Add plant_name column
   ALTER TABLE planned_crops ADD COLUMN IF NOT EXISTS plant_name VARCHAR(255);
   
   -- Change plant_id to VARCHAR
   ALTER TABLE planned_crops ALTER COLUMN plant_id TYPE VARCHAR(255) USING plant_id::TEXT;
   ```

### Frontend Changes

1. **AddCropToSeasonModal.tsx** - Fixed data sent to backend:
   ```typescript
   {
     plantId: selectedPlant.id,  // String ID from plant-data-aggregator
     plantName: selectedPlant.name,
     quantity,
     preferredGrowAreaId: growAreaId || null,
     phase: null,
     notes: null
   }
   ```

2. **Fixed modal backdrop** - Changed from `bg-black/30` to `bg-black/40` for better visibility

3. **Fixed params await** - Updated rotation recommendations route to properly await params

## Architecture Clarification

The correct architecture is:

```
┌──────────────────────┐
│  plant-data-aggregator│  
│  (Plant Data Source)  │  ← Stores all plant data with string IDs
│  Port: 8081           │
└──────────┬───────────┘
           │ REST API
           │
┌──────────▼───────────┐
│    gardentime        │
│  (Garden Management) │  ← References plants by external string ID
│  Port: 8080          │     Stores PlannedCrops and user data
└──────────┬───────────┘
           │ REST API
           │
┌──────────▼───────────┐
│   Next.js Frontend   │
│  (BFF + UI)          │  ← Only talks to gardentime backend
│  Port: 3000          │
└──────────────────────┘
```

**Key Points:**
- Plant data lives in plant-data-aggregator
- Gardentime references plants by their external identifier (string)
- No foreign key constraint needed
- Frontend only communicates with gardentime backend
- Gardentime backend communicates with plant-data-aggregator when needed

## Benefits

1. **Loose coupling** - No tight coupling between databases
2. **Flexibility** - Can easily switch or add plant data sources
3. **Scalability** - Plant data can be updated independently
4. **Simplicity** - No complex synchronization needed

## What's Left

1. Implement plant data caching in gardentime
2. Integrate PlantingDateCalculatorService with plant-data-aggregator API
3. Add more plant metadata fields as needed
4. Consider adding a local cache table for frequently accessed plant data
