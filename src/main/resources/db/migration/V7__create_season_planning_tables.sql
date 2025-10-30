-- V7: Create Season Planning Tables
-- Support for planning crops with indoor seed starting and frost date tracking

-- Table for storing garden climate information
-- Manual entry initially, will enhance with hardiness zone auto-detection later
CREATE TABLE IF NOT EXISTS garden_climate_info (
    garden_id UUID PRIMARY KEY,
    last_frost_date DATE,      -- e.g., May 15 (manual entry)
    first_frost_date DATE,     -- e.g., October 1 (manual entry)
    hardiness_zone VARCHAR(10), -- e.g., "7a" (manual entry, future: auto-detect)
    latitude DECIMAL(9,6),      -- Optional: for future weather integration
    longitude DECIMAL(9,6),     -- Optional: for future weather integration
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (garden_id) REFERENCES garden_entity(id) ON DELETE CASCADE
);

-- Table for season plans
-- Supports multiple seasons per year (Spring, Summer, Fall, Winter + phases)
CREATE TABLE IF NOT EXISTS season_plans (
    id UUID PRIMARY KEY,
    garden_id UUID NOT NULL,
    user_id UUID NOT NULL,
    season VARCHAR(50) NOT NULL,  -- e.g., "SPRING", "SUMMER", "FALL", "WINTER"
    year INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (garden_id) REFERENCES garden_entity(id) ON DELETE CASCADE,
    UNIQUE (garden_id, season, year)
);

CREATE INDEX IF NOT EXISTS idx_season_plans_garden_id ON season_plans(garden_id);
CREATE INDEX IF NOT EXISTS idx_season_plans_user_id ON season_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_season_plans_year ON season_plans(year);

-- Table for planned crops within a season
-- Supports both direct sow and indoor seed starting workflows
CREATE TABLE IF NOT EXISTS planned_crops (
    id UUID PRIMARY KEY,
    season_plan_id UUID NOT NULL,
    plant_id BIGINT NOT NULL,
    quantity INTEGER DEFAULT 1,
    preferred_grow_area_id BIGINT REFERENCES grow_area_entity(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PLANNED',  -- PLANNED, SEEDS_STARTED, TRANSPLANTED, DIRECT_SOWN, GROWING, COMPLETED, CANCELLED
    
    -- Seed starting dates (for crops that need indoor pre-planting)
    indoor_start_date DATE,          -- Calculated: When to start seeds indoors
    indoor_start_method VARCHAR(100), -- e.g., "seed_tray", "pots", "pellets"
    
    -- Outdoor planting dates
    transplant_date DATE,            -- Calculated: When to move to garden (for transplants)
    direct_sow_date DATE,            -- Calculated: When to plant directly (for direct sow)
    
    expected_harvest_date DATE,
    phase VARCHAR(50),               -- For countries like Norway: EARLY, MID, LATE
    notes TEXT,
    crop_record_id UUID REFERENCES crop_record_entity(id) ON DELETE SET NULL,  -- Link when actually planted
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (season_plan_id) REFERENCES season_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (plant_id) REFERENCES plant_entity(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_planned_crops_season_plan ON planned_crops(season_plan_id);
CREATE INDEX IF NOT EXISTS idx_planned_crops_status ON planned_crops(status);
CREATE INDEX IF NOT EXISTS idx_planned_crops_dates ON planned_crops(indoor_start_date, transplant_date, direct_sow_date);
CREATE INDEX IF NOT EXISTS idx_planned_crops_plant_id ON planned_crops(plant_id);

-- Extend plant_details table with indoor starting and planting method info
-- Data source: Will come from plant-data-aggregator API later
-- For now: Using placeholder data for common plants
CREATE TABLE IF NOT EXISTS plant_details (
    plant_id BIGINT PRIMARY KEY,
    weeks_before_frost_indoor INTEGER,  -- e.g., 6-8 weeks for tomatoes
    can_direct_sow BOOLEAN DEFAULT true,
    can_transplant BOOLEAN DEFAULT false,
    frost_tolerance VARCHAR(50),  -- HARDY, SEMI_HARDY, TENDER
    indoor_start_method TEXT,     -- Guidance: seed tray, pots, pellets, etc.
    transplant_guidance TEXT,     -- Instructions for moving outdoors
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plant_id) REFERENCES plant_entity(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_plant_details_plant_id ON plant_details(plant_id);

-- TODO: Phase 2 - populate from plant-data-aggregator API
-- TODO: Phase 2 - add notification/reminder system for seed starting dates
-- TODO: Phase 2 - Auto-populate frost dates from hardiness zone database
-- TODO: Phase 2 - Integrate with weather API for location-based data
