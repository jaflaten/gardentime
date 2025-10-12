-- V4__add_position_and_dimensions_to_grow_area.sql
-- Add position and dimension fields for visual board layout

-- Add canvas position fields (in pixels)
ALTER TABLE grow_area_entity ADD COLUMN position_x DOUBLE PRECISION;
ALTER TABLE grow_area_entity ADD COLUMN position_y DOUBLE PRECISION;

-- Add physical dimension fields (in centimeters)
ALTER TABLE grow_area_entity ADD COLUMN width DOUBLE PRECISION;
ALTER TABLE grow_area_entity ADD COLUMN length DOUBLE PRECISION;
ALTER TABLE grow_area_entity ADD COLUMN height DOUBLE PRECISION;

-- Keep existing zone_size column for backward compatibility
-- All new columns are nullable to support grow areas not yet placed on the board

