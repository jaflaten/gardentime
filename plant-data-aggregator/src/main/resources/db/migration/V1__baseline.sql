-- PostgreSQL enum types
CREATE TYPE relationship_type AS ENUM ('BENEFICIAL','NEUTRAL','ANTAGONISTIC');
CREATE TYPE relationship_subtype AS ENUM ('PEST_DETERRENT','NUTRIENT_SUPPORT','SHADE','STRUCTURAL','OTHER');
CREATE TYPE confidence_level AS ENUM ('HIGH','MEDIUM','LOW');
CREATE TYPE evidence_type AS ENUM ('SCIENTIFIC','TRADITIONAL','ANECDOTAL');
CREATE TYPE root_depth AS ENUM ('SHALLOW','MEDIUM','DEEP');
CREATE TYPE feeder_type AS ENUM ('HEAVY','MODERATE','LIGHT');
CREATE TYPE plant_cycle AS ENUM ('ANNUAL','PERENNIAL','BIENNIAL');
CREATE TYPE growth_habit AS ENUM ('BUSH','VINE','CLIMBER','ROOT','LEAF','FRUITING','OTHER');
CREATE TYPE sun_needs AS ENUM ('FULL_SUN','PART_SHADE','SHADE');
CREATE TYPE water_needs AS ENUM ('LOW','MODERATE','HIGH','FREQUENT');
CREATE TYPE toxicity_level AS ENUM ('NONE','LOW','MODERATE','HIGH');
CREATE TYPE primary_nutrient_contribution AS ENUM ('NITROGEN','POTASSIUM','PHOSPHORUS','NONE');
CREATE TYPE source_type AS ENUM ('WEBSITE','BOOK','JOURNAL','INTERNAL');
CREATE TYPE conflict_resolution_strategy AS ENUM ('PREFER_TREFLE','PREFER_PERENUAL','MANUAL');

-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Plants table (simplified merged core)
CREATE TABLE plants (
    id UUID PRIMARY KEY,
    canonical_scientific_name TEXT NOT NULL,
    common_name TEXT NULL,
    family TEXT NULL,
    genus TEXT NULL,
    source_trefle_id BIGINT NULL,
    source_perenual_id BIGINT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_plants_canonical_scientific_name ON plants (LOWER(canonical_scientific_name));

-- Plant attributes 1:1 (no array columns; separate collection tables used)
CREATE TABLE plant_attributes (
    plant_id UUID PRIMARY KEY REFERENCES plants(id) ON DELETE CASCADE,
    is_nitrogen_fixer BOOLEAN DEFAULT FALSE,
    root_depth root_depth NOT NULL,
    feeder_type feeder_type NULL,
    cycle plant_cycle NULL,
    growth_habit growth_habit NULL,
    sun_needs sun_needs NULL,
    water_needs water_needs NULL,
    ph_min NUMERIC(3,1) NULL,
    ph_max NUMERIC(3,1) NULL,
    toxicity_level toxicity_level NULL,
    invasive BOOLEAN NULL,
    drought_tolerant BOOLEAN NULL,
    poisonous_to_pets BOOLEAN NULL,
    days_to_maturity_min INT NULL,
    days_to_maturity_max INT NULL,
    succession_interval_days INT NULL,
    primary_nutrient_contribution primary_nutrient_contribution NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_days_to_maturity CHECK (days_to_maturity_min IS NULL OR days_to_maturity_max IS NULL OR days_to_maturity_min <= days_to_maturity_max),
    CONSTRAINT chk_ph_range CHECK (ph_min IS NULL OR ph_max IS NULL OR ph_min <= ph_max)
);

-- Soil types collection
CREATE TABLE plant_attribute_soil_types (
    plant_id UUID NOT NULL REFERENCES plant_attributes(plant_id) ON DELETE CASCADE,
    soil_type TEXT NOT NULL,
    PRIMARY KEY (plant_id, soil_type)
);

-- Edible parts collection
CREATE TABLE plant_attribute_edible_parts (
    plant_id UUID NOT NULL REFERENCES plant_attributes(plant_id) ON DELETE CASCADE,
    edible_part TEXT NOT NULL,
    PRIMARY KEY (plant_id, edible_part)
);

-- Synonyms
CREATE TABLE plant_synonyms (
    id UUID PRIMARY KEY,
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    synonym TEXT NOT NULL,
    source TEXT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);
-- Case-insensitive uniqueness per plant
CREATE UNIQUE INDEX uq_synonym ON plant_synonyms (plant_id, LOWER(synonym));
CREATE INDEX idx_synonym_search ON plant_synonyms USING GIN (synonym gin_trgm_ops);

-- Sources
CREATE TABLE sources (
    id UUID PRIMARY KEY,
    type source_type NOT NULL,
    title TEXT NOT NULL,
    authors TEXT NULL,
    url TEXT NULL,
    accessed_at TIMESTAMP WITHOUT TIME ZONE NULL,
    copyright_ok BOOLEAN NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Companion relationships
CREATE TABLE companion_relationships (
    id UUID PRIMARY KEY,
    plant_a_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    plant_b_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    relationship_type relationship_type NOT NULL,
    relationship_subtype relationship_subtype NULL,
    confidence_level confidence_level NOT NULL,
    evidence_type evidence_type NOT NULL,
    reason TEXT NULL,
    mechanism TEXT NULL,
    source_id UUID NULL REFERENCES sources(id) ON DELETE SET NULL,
    source_url TEXT NULL,
    geographic_scope TEXT NULL,
    is_bidirectional BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITHOUT TIME ZONE NULL,
    verified_by UUID NULL,
    quality_score INT NULL,
    notes TEXT NULL,
    deprecated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_not_self_ref CHECK (plant_a_id <> plant_b_id)
);
CREATE UNIQUE INDEX uq_companion_pair_type ON companion_relationships (plant_a_id, plant_b_id, relationship_type);
CREATE INDEX idx_companion_a_type_verified ON companion_relationships (plant_a_id, relationship_type, verified);
CREATE INDEX idx_companion_b_type ON companion_relationships (plant_b_id, relationship_type);
CREATE INDEX idx_verified_beneficial ON companion_relationships (plant_a_id) WHERE verified AND relationship_type = 'BENEFICIAL';

-- Merge conflicts
CREATE TABLE plant_merge_conflicts (
    id UUID PRIMARY KEY,
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    trefle_value TEXT NULL,
    perenual_value TEXT NULL,
    resolved_value TEXT NULL,
    resolution_strategy conflict_resolution_strategy NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_conflicts_plant ON plant_merge_conflicts (plant_id);

-- API call tracker
CREATE TABLE api_call_tracker (
    id SERIAL PRIMARY KEY,
    api_name TEXT NOT NULL,
    date DATE NOT NULL,
    calls_made INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_api_day UNIQUE (api_name, date)
);

-- Trigger functions for updated_at (optional placeholders)
-- You can add actual trigger functions later to auto-update updated_at.
