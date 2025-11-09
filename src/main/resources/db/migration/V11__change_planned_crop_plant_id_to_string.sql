-- Change plant_id in planned_crops from BIGINT to VARCHAR to reference external plant IDs
-- from plant-data-aggregator instead of local plant_entity table

-- First, drop the foreign key constraint if it exists
ALTER TABLE planned_crops DROP CONSTRAINT IF EXISTS planned_crops_plant_id_fkey;

-- Add a new column for plant_name
ALTER TABLE planned_crops ADD COLUMN IF NOT EXISTS plant_name VARCHAR(255);

-- Change plant_id type to VARCHAR
ALTER TABLE planned_crops ALTER COLUMN plant_id TYPE VARCHAR(255) USING plant_id::TEXT;

-- Update plant_name for any existing rows (if any) - set to a placeholder
UPDATE planned_crops SET plant_name = 'Unknown' WHERE plant_name IS NULL;

-- Make plant_name NOT NULL
ALTER TABLE planned_crops ALTER COLUMN plant_name SET NOT NULL;
