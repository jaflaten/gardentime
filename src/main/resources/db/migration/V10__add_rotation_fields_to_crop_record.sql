-- V10: Add rotation planning fields to crop_record_entity
-- Enables intelligent crop rotation by caching plant data and tracking disease history

-- Add rotation-critical plant data (cached from plant-data-aggregator API)
ALTER TABLE crop_record_entity
ADD COLUMN IF NOT EXISTS plant_family VARCHAR(100),
ADD COLUMN IF NOT EXISTS plant_genus VARCHAR(100),
ADD COLUMN IF NOT EXISTS feeder_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS is_nitrogen_fixer BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS root_depth VARCHAR(20);

-- Add disease tracking fields
ALTER TABLE crop_record_entity
ADD COLUMN IF NOT EXISTS had_diseases BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS disease_names TEXT,
ADD COLUMN IF NOT EXISTS disease_notes TEXT;

-- Add yield and soil quality tracking
ALTER TABLE crop_record_entity
ADD COLUMN IF NOT EXISTS yield_rating INTEGER CHECK (yield_rating >= 1 AND yield_rating <= 5),
ADD COLUMN IF NOT EXISTS soil_quality_after INTEGER CHECK (soil_quality_after >= 1 AND soil_quality_after <= 5);

-- Create indexes for rotation queries
CREATE INDEX IF NOT EXISTS idx_crop_record_plant_family ON crop_record_entity(plant_family);
CREATE INDEX IF NOT EXISTS idx_crop_record_grow_zone_planting_date ON crop_record_entity(grow_zone_id, planting_date);
CREATE INDEX IF NOT EXISTS idx_crop_record_planting_date ON crop_record_entity(planting_date);
CREATE INDEX IF NOT EXISTS idx_crop_record_had_diseases ON crop_record_entity(had_diseases) WHERE had_diseases = TRUE;

-- Add comments for documentation
COMMENT ON COLUMN crop_record_entity.plant_family IS 'Cached plant family from plant-data-aggregator for rotation planning';
COMMENT ON COLUMN crop_record_entity.feeder_type IS 'HEAVY, MODERATE, or LIGHT - for nutrient balance rotation';
COMMENT ON COLUMN crop_record_entity.is_nitrogen_fixer IS 'True for legumes - critical for soil improvement';
COMMENT ON COLUMN crop_record_entity.root_depth IS 'SHALLOW, MEDIUM, or DEEP - for root depth diversity';
COMMENT ON COLUMN crop_record_entity.had_diseases IS 'User marks if crop had disease issues';
COMMENT ON COLUMN crop_record_entity.disease_names IS 'Comma-separated list of disease names';
COMMENT ON COLUMN crop_record_entity.yield_rating IS '1-5 stars rating of harvest yield';
COMMENT ON COLUMN crop_record_entity.soil_quality_after IS '1-5 rating of soil quality after harvest';
