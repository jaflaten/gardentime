# V12 Migration Fix - View Dependency Issue

**Date**: November 13, 2025, 8:17 PM  
**Status**: ✅ RESOLVED

## Problem

The V12 migration was failing with:
```
ERROR: cannot alter type of a column used by a view or rule
Detail: rule _RETURN on view rotation_history depends on column "plant_id"
```

## Root Cause

The `rotation_history` view (created in V9) was joining `crop_record_entity` with `plant_entity` table:
- View used `p.id as plant_id` from the join
- When V12 tried to alter `crop_record_entity.plant_id` from BIGINT to VARCHAR, PostgreSQL blocked it
- PostgreSQL doesn't allow altering column types when views depend on them

## Solution

Updated V12 migration to:

1. **Drop the view first** before altering the column type
2. **Alter the column** safely after view is dropped
3. **Recreate the view** with updated schema that doesn't rely on `plant_entity` join

### Key Changes to the View

**Old view (V9)**:
```sql
CREATE OR REPLACE VIEW rotation_history AS
SELECT
    cr.grow_zone_id,
    cr.planting_date,
    p.id as plant_id,              -- From plant_entity join
    p.name as plant_name,          -- From plant_entity join
    pf.rotation_years_min,         -- From plant_families join
    pf.rotation_years_max,         -- From plant_families join
    ...
FROM crop_record_entity cr
JOIN plant_entity p ON cr.plant_id = p.id
LEFT JOIN plant_families pf ON p.family_id = pf.id
```

**New view (V12)**:
```sql
CREATE OR REPLACE VIEW rotation_history AS
SELECT
    cr.grow_zone_id,
    cr.planting_date,
    cr.plant_id,                   -- UUID string from crop_record
    cr.plant_name,                 -- Denormalized field
    cr.plant_family,               -- Cached from aggregator
    cr.had_diseases,
    cr.disease_notes,
    ...
FROM crop_record_entity cr         -- No joins needed!
WHERE cr.planting_date IS NOT NULL
```

## Benefits of New Approach

1. **Self-contained**: View doesn't depend on external tables
2. **Performance**: No joins required, faster queries
3. **Consistency**: Aligns with new architecture (Plant Data Aggregator)
4. **Denormalized data**: All needed fields cached in crop_record_entity

## Migration Steps (Updated V12)

```sql
-- Step 1: Drop view to release dependency
DROP VIEW IF EXISTS rotation_history;

-- Step 2: Drop FK constraint
ALTER TABLE crop_record_entity DROP CONSTRAINT IF EXISTS crop_record_entity_plant_id_fkey;

-- Step 3: Add plant_name column
ALTER TABLE crop_record_entity ADD COLUMN IF NOT EXISTS plant_name VARCHAR(255);

-- Step 4: Populate plant_name from old data (if any exists)
UPDATE crop_record_entity cr SET plant_name = pe.name
FROM plant_entity pe WHERE cr.plant_id::text = pe.id::text;

-- Step 5: Change plant_id type from BIGINT to VARCHAR(255)
ALTER TABLE crop_record_entity ALTER COLUMN plant_id TYPE VARCHAR(255) USING plant_id::TEXT;

-- Step 6: Make plant_name NOT NULL
UPDATE crop_record_entity SET plant_name = 'Unknown' WHERE plant_name IS NULL;
ALTER TABLE crop_record_entity ALTER COLUMN plant_name SET NOT NULL;

-- Step 7: Add comments
COMMENT ON COLUMN crop_record_entity.plant_id IS 'External plant UUID from plant-data-aggregator';
COMMENT ON COLUMN crop_record_entity.plant_name IS 'Plant name for display and lookup';

-- Step 8: Recreate view with new schema
CREATE OR REPLACE VIEW rotation_history AS
SELECT cr.grow_zone_id, cr.planting_date, cr.plant_id, cr.plant_name, cr.plant_family, ...
FROM crop_record_entity cr
WHERE cr.planting_date IS NOT NULL;
```

## Verification

✅ Migration executed successfully  
✅ Backend starts without errors  
✅ View recreated with simplified schema  
✅ No dependencies on plant_entity or plant_families tables  

## Files Modified

- `src/main/resources/db/migration/V12__migrate_crop_record_to_uuid_plant_id.sql`

## Lesson Learned

When altering column types in PostgreSQL:
1. Always check for view dependencies first
2. Drop and recreate views when necessary
3. Consider denormalizing data to avoid complex joins in views

---

**Result**: ✅ V12 migration successful, rotation_history view updated and working

🌱 Migration complete 🌱
