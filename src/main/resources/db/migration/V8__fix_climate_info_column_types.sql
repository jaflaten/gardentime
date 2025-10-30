-- V8: Fix garden_climate_info column types from DECIMAL to DOUBLE PRECISION
-- This resolves the Hibernate schema validation issue

ALTER TABLE garden_climate_info
    ALTER COLUMN latitude TYPE DOUBLE PRECISION,
    ALTER COLUMN longitude TYPE DOUBLE PRECISION;
