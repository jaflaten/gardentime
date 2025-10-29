-- V6__add_dash_to_canvas_object.sql
-- Add dash field for line styles (dashed, dotted, etc.)

ALTER TABLE canvas_object ADD COLUMN dash VARCHAR(50);
