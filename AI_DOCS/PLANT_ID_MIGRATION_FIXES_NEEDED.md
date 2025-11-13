# Plant ID Migration - Compilation Fixes Needed

## CRITICAL: 3 Files Need Fixes

### 1. GardenDashboardService.kt

**File**: `src/main/kotlin/no/sogn/gardentime/service/GardenDashboardService.kt`

**Line 125**: 
```kotlin
// BEFORE
plantName = crop.plant.name,

// AFTER
plantName = crop.plantName,
```

**Line 150**:
```kotlin
// BEFORE
plantName = crop.plant.name,

// AFTER
plantName = crop.plantName,
```

**Line 170**:
```kotlin
// BEFORE
plantName = crop.plant.name,

// AFTER
plantName = crop.plantName,
```

**Line 183**:
```kotlin
// BEFORE
plantName = crop.plant.name,

// AFTER
plantName = crop.plantName,
```

**Line 280** (approximately):
```kotlin
// BEFORE  
plantName = crops.first().plant.name,

// AFTER
plantName = crops.first().plantName,
```

**Line 299** (approximately):
```kotlin
// BEFORE
plantName = crops.first().plant.name,

// AFTER
plantName = crops.first().plantName,
```

---

### 2. SeasonPlanningService.kt

**File**: `src/main/kotlin/no/sogn/gardentime/service/SeasonPlanningService.kt`

**Line 230**:
```kotlin
// BEFORE
plantName = cropRecord.plant.name ?: "Unknown",

// AFTER
plantName = cropRecord.plantName,
```

**Line 231**:
```kotlin
// BEFORE
plantId = cropRecord.plant.id?.toString() ?: "0",

// AFTER
plantId = cropRecord.plantId,
```

**Line 247**:
```kotlin
// BEFORE
plantName = cropRecord.plant.name ?: "Unknown",

// AFTER
plantName = cropRecord.plantName,
```

**Line 248**:
```kotlin
// BEFORE
plantId = cropRecord.plant.id?.toString() ?: "0",

// AFTER
plantId = cropRecord.plantId,
```

---

### 3. Test File (Likely Needs Updates)

**File**: `src/test/kotlin/no/sogn/gardentime/service/CropRecordServiceTest.kt`

**Check for**:
- Any creation of `CropRecordEntity` with `plant` parameter
- Should be changed to use `plantId` and `plantName` parameters
- Mock PlantEntity lookups should be removed/updated

---

## AUTOMATED FIX COMMANDS

You can run these commands to fix the issues:

```bash
# 1. Fix GardenDashboardService
sed -i '' 's/crop\.plant\.name/crop.plantName/g' \
  src/main/kotlin/no/sogn/gardentime/service/GardenDashboardService.kt

sed -i '' 's/crops\.first()\.plant\.name/crops.first().plantName/g' \
  src/main/kotlin/no/sogn/gardentime/service/GardenDashboardService.kt

# 2. Fix SeasonPlanningService
sed -i '' 's/cropRecord\.plant\.name ?: "Unknown"/cropRecord.plantName/g' \
  src/main/kotlin/no/sogn/gardentime/service/SeasonPlanningService.kt

sed -i '' 's/cropRecord\.plant\.id?\.toString() ?: "0"/cropRecord.plantId/g' \
  src/main/kotlin/no/sogn/gardentime/service/SeasonPlanningService.kt
```

---

## VERIFICATION

After fixes, run:

```bash
# Verify no more references
grep -r "crop\.plant\|cropRecord\.plant" src/main/kotlin --include="*.kt"

# Should only find false positives like:
# - crop.plantingDate (OK)
# - crop.plantFamily (OK)  
# - crop.plantGenus (OK)

# Try to compile
./gradlew compileKotlin
```

---

## FILES STATUS

✅ **NO ISSUES**:
- CropRecordService.kt (fixed)
- CropRecordController.kt (fixed)
- CropRecord.kt model (fixed)
- RotationScoringService.kt (uses plantFamily, not plant.name)

❌ **NEEDS FIX**:
- GardenDashboardService.kt (6 occurrences)
- SeasonPlanningService.kt (4 occurrences)
- CropRecordServiceTest.kt (unknown, need to check)

---

**Total Fixes Required**: ~10 simple find-replace operations
**Estimated Time**: 5-10 minutes

