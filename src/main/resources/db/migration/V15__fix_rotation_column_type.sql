-- V15__fix_rotation_column_type.sql
-- Fix rotation column type to match Hibernate's expected DOUBLE PRECISION

ALTER TABLE grow_area_entity
ALTER COLUMN rotation TYPE DOUBLE PRECISION USING rotation::double precision;
