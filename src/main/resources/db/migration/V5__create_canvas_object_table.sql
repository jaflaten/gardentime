-- V5__create_canvas_object_table.sql
-- Create table for canvas objects (shapes, text, arrows, etc.)

CREATE TABLE canvas_object (
    id BIGSERIAL PRIMARY KEY,
    garden_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL,

    -- Position and dimensions
    x DOUBLE PRECISION NOT NULL,
    y DOUBLE PRECISION NOT NULL,
    width DOUBLE PRECISION,
    height DOUBLE PRECISION,

    -- For lines, arrows, freehand paths (JSON array of points)
    points TEXT,

    -- Styling
    fill_color VARCHAR(20),
    stroke_color VARCHAR(20),
    stroke_width DOUBLE PRECISION,
    opacity DOUBLE PRECISION,

    -- Text content
    text TEXT,
    font_size INTEGER,
    font_family VARCHAR(50),

    -- Metadata
    rotation DOUBLE PRECISION,
    z_index INTEGER,
    locked BOOLEAN DEFAULT FALSE,
    layer_id VARCHAR(50),

    -- Add index on garden_id for faster queries
    CONSTRAINT fk_garden FOREIGN KEY (garden_id) REFERENCES garden_entity(id) ON DELETE CASCADE
);

CREATE INDEX idx_canvas_object_garden_id ON canvas_object(garden_id);

