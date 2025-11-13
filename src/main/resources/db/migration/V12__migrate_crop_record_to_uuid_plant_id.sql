-- V12: Migrate crop_record_entity to use UUID plant_id from plant-data-aggregator
-- This aligns CropRecord with PlannedCrop pattern (V11) for consistent plant references

-- Step 1: Drop the rotation_history view that depends on plant_id column
DROP VIEW IF EXISTS rotation_history;

-- Step 2: Remove FK constraint to local plant_entity table
ALTER TABLE crop_record_entity DROP CONSTRAINT IF EXISTS crop_record_entity_plant_id_fkey;

-- Step 3: Add plant_name column (will store name for display and lookup in plant-data-aggregator)
ALTER TABLE crop_record_entity ADD COLUMN IF NOT EXISTS plant_name VARCHAR(255);

-- Step 4: For any existing records, populate plant_name from plant_entity
-- (Currently 0 records as of Nov 2025, but this makes migration safe for future use)
UPDATE crop_record_entity cr
SET plant_name = pe.name
FROM plant_entity pe
WHERE cr.plant_id::text = pe.id::text AND cr.plant_name IS NULL;

-- Step 5: Change plant_id from BIGINT to VARCHAR to store UUID strings
ALTER TABLE crop_record_entity ALTER COLUMN plant_id TYPE VARCHAR(255) USING plant_id::TEXT;

-- Step 6: Make plant_name NOT NULL (required for plant lookup in plant-data-aggregator)
-- Set default for any records without plant_name (shouldn't happen, but safe)
UPDATE crop_record_entity SET plant_name = 'Unknown' WHERE plant_name IS NULL;
ALTER TABLE crop_record_entity ALTER COLUMN plant_name SET NOT NULL;

-- Step 7: Add helpful comments
COMMENT ON COLUMN crop_record_entity.plant_id IS 'External plant UUID from plant-data-aggregator microservice';
COMMENT ON COLUMN crop_record_entity.plant_name IS 'Plant name for display and lookup in plant-data-aggregator';

-- Step 8: Recreate rotation_history view with updated schema
-- Note: This view no longer joins to plant_entity or plant_families since plant data comes from external aggregator
-- Instead it uses the denormalized fields from crop_record_entity (plant_name, plant_family, etc.)
CREATE OR REPLACE VIEW rotation_history AS
SELECT
    cr.grow_zone_id,
    cr.planting_date,
    cr.harvest_date,
    cr.plant_id,
    cr.plant_name,
    cr.plant_family,
    cr.had_diseases as had_disease_issues,
    cr.disease_notes,
    EXTRACT(YEAR FROM cr.planting_date) as planting_year
FROM crop_record_entity cr
WHERE cr.planting_date IS NOT NULL
ORDER BY cr.grow_zone_id, cr.planting_date DESC;

-- Note: plant_entity table remains for backward compatibility and DataInitializer
-- It may be deprecated in future versions once all references are removed
