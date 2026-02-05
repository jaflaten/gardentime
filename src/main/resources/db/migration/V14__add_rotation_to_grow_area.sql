-- V14__add_rotation_to_grow_area.sql

ALTER TABLE grow_area_entity
ADD COLUMN rotation DECIMAL(5,1) DEFAULT 0;

COMMENT ON COLUMN grow_area_entity.rotation IS 'Rotation angle in degrees (0-360)';
