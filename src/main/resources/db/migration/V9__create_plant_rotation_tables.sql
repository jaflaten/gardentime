-- V9: Create Plant Rotation and Botanical Data Tables
-- Support for crop rotation planning based on plant families, nutrient needs, and companionship

-- ============================================================================
-- BOTANICAL TAXONOMY & FAMILY DATA
-- ============================================================================

-- Plant families (critical for crop rotation)
-- Data source: Trefle API + manual mappings
CREATE TABLE IF NOT EXISTS plant_families (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,  -- e.g., "Solanaceae", "Brassicaceae"
    common_name VARCHAR(100),            -- e.g., "Nightshade family", "Cabbage family"
    rotation_years_min INTEGER NOT NULL DEFAULT 2,  -- Minimum years before replanting same family
    rotation_years_max INTEGER NOT NULL DEFAULT 4,  -- Maximum recommended rotation interval
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_plant_families_name ON plant_families(name);

-- Insert common plant families with rotation intervals
INSERT INTO plant_families (name, common_name, rotation_years_min, rotation_years_max, description) VALUES
    ('Solanaceae', 'Nightshade family', 3, 4, 'Tomatoes, peppers, potatoes, eggplants. Prone to similar diseases like blight and wilt.'),
    ('Brassicaceae', 'Cabbage family', 3, 4, 'Cabbage, broccoli, kale, radish. Susceptible to clubroot which persists 7-20 years.'),
    ('Fabaceae', 'Legume family', 2, 3, 'Beans, peas, lentils. Nitrogen fixers that improve soil.'),
    ('Cucurbitaceae', 'Cucurbit family', 2, 3, 'Cucumber, squash, melon, pumpkin. Heavy feeders.'),
    ('Apiaceae', 'Carrot family', 2, 3, 'Carrots, celery, parsley, parsnips. Moderate feeders.'),
    ('Amaranthaceae', 'Amaranth family', 2, 3, 'Beets, spinach, Swiss chard. Moderate feeders.'),
    ('Amaryllidaceae', 'Allium family', 2, 3, 'Onions, garlic, leeks, chives. Light feeders, pest deterrents.'),
    ('Asteraceae', 'Daisy family', 2, 2, 'Lettuce, sunflower, artichoke. Light feeders.'),
    ('Lamiaceae', 'Mint family', 0, 0, 'Basil, mint, oregano, sage, thyme, rosemary. Herbs, no rotation needed.'),
    ('Rosaceae', 'Rose family', 0, 0, 'Strawberries, raspberries. Perennials.'),
    ('Ericaceae', 'Heath family', 0, 0, 'Blueberries. Perennial shrubs.'),
    ('Asparagaceae', 'Asparagus family', 0, 0, 'Asparagus. Long-lived perennial.'),
    ('Poaceae', 'Grass family', 2, 3, 'Corn. Heavy feeder.'),
    ('Malvaceae', 'Mallow family', 2, 3, 'Okra. Moderate feeder.'),
    ('Polygonaceae', 'Buckwheat family', 0, 0, 'Rhubarb. Perennial.'),
    ('Vitaceae', 'Grape family', 0, 0, 'Grapes. Perennial vines.'),
    ('Convolvulaceae', 'Morning glory family', 2, 3, 'Sweet potato. Heavy feeder.')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- EXTENDED PLANT DATA FOR ROTATION PLANNING
-- ============================================================================

-- Extend plant_entity with botanical and rotation data
-- This replaces the basic plant_details table with comprehensive rotation data
ALTER TABLE plant_entity
    ADD COLUMN IF NOT EXISTS family_id BIGINT REFERENCES plant_families(id),
    ADD COLUMN IF NOT EXISTS genus VARCHAR(100),
    ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE,  -- URL-friendly identifier (e.g., "tomatoes")
    ADD COLUMN IF NOT EXISTS cycle VARCHAR(20),         -- ANNUAL, PERENNIAL, BIENNIAL
    ADD COLUMN IF NOT EXISTS sun_needs VARCHAR(20),     -- FULL_SUN, PART_SHADE, SHADE
    ADD COLUMN IF NOT EXISTS water_needs VARCHAR(20),   -- LOW, MODERATE, HIGH, FREQUENT
    ADD COLUMN IF NOT EXISTS root_depth VARCHAR(20),    -- SHALLOW, MEDIUM, DEEP
    ADD COLUMN IF NOT EXISTS growth_habit VARCHAR(20),  -- BUSH, VINE, CLIMBER, ROOT, LEAF, FRUITING
    ADD COLUMN IF NOT EXISTS soil_temp_min_f INTEGER,
    ADD COLUMN IF NOT EXISTS soil_temp_optimal_f INTEGER,
    ADD COLUMN IF NOT EXISTS frost_tolerant BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS spacing_min_inches INTEGER,
    ADD COLUMN IF NOT EXISTS spacing_max_inches INTEGER,
    ADD COLUMN IF NOT EXISTS planting_depth_inches DECIMAL(4,2),
    ADD COLUMN IF NOT EXISTS container_suitable BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS requires_staking BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS requires_pruning BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS days_to_maturity_min INTEGER,
    ADD COLUMN IF NOT EXISTS days_to_maturity_max INTEGER,
    ADD COLUMN IF NOT EXISTS watering_inches_per_week DECIMAL(3,1),
    ADD COLUMN IF NOT EXISTS fertilizing_frequency_weeks INTEGER,
    ADD COLUMN IF NOT EXISTS mulch_recommended BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS is_nitrogen_fixer BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS feeder_type VARCHAR(20),   -- HEAVY, MODERATE, LIGHT, NITROGEN_FIXER
    ADD COLUMN IF NOT EXISTS soil_ph_min DECIMAL(3,1),
    ADD COLUMN IF NOT EXISTS soil_ph_max DECIMAL(3,1),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for rotation queries
CREATE INDEX IF NOT EXISTS idx_plant_entity_family ON plant_entity(family_id);
CREATE INDEX IF NOT EXISTS idx_plant_entity_slug ON plant_entity(slug);
CREATE INDEX IF NOT EXISTS idx_plant_entity_feeder_type ON plant_entity(feeder_type);
CREATE INDEX IF NOT EXISTS idx_plant_entity_nitrogen_fixer ON plant_entity(is_nitrogen_fixer);

-- ============================================================================
-- EDIBLE PARTS (Many-to-Many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS edible_parts (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE  -- fruit, leaf, root, seed, flower, stem
);

INSERT INTO edible_parts (name) VALUES
    ('fruit'), ('leaf'), ('root'), ('seed'), ('flower'), ('stem')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS plant_edible_parts (
    plant_id BIGINT NOT NULL REFERENCES plant_entity(id) ON DELETE CASCADE,
    edible_part_id BIGINT NOT NULL REFERENCES edible_parts(id) ON DELETE CASCADE,
    PRIMARY KEY (plant_id, edible_part_id)
);

CREATE INDEX IF NOT EXISTS idx_plant_edible_parts_plant ON plant_edible_parts(plant_id);

-- ============================================================================
-- COMPANION PLANTING
-- ============================================================================

CREATE TABLE IF NOT EXISTS plant_companions (
    id BIGSERIAL PRIMARY KEY,
    plant_id BIGINT NOT NULL REFERENCES plant_entity(id) ON DELETE CASCADE,
    companion_id BIGINT NOT NULL REFERENCES plant_entity(id) ON DELETE CASCADE,
    relationship VARCHAR(20) NOT NULL,  -- BENEFICIAL, UNFAVORABLE, NEUTRAL
    reason TEXT,  -- Why they are good/bad companions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (plant_id, companion_id)
);

CREATE INDEX IF NOT EXISTS idx_plant_companions_plant ON plant_companions(plant_id);
CREATE INDEX IF NOT EXISTS idx_plant_companions_companion ON plant_companions(companion_id);
CREATE INDEX IF NOT EXISTS idx_plant_companions_relationship ON plant_companions(relationship);

-- ============================================================================
-- PESTS & DISEASES
-- ============================================================================

CREATE TABLE IF NOT EXISTS pests (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    common_name VARCHAR(100),
    description TEXT,
    is_soil_borne BOOLEAN DEFAULT false,
    persistence_years INTEGER DEFAULT 0,  -- How many years it persists in soil (0 = not soil-borne)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS diseases (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    common_name VARCHAR(100),
    description TEXT,
    is_soil_borne BOOLEAN DEFAULT false,
    persistence_years INTEGER DEFAULT 0,  -- Critical for rotation planning!
    affected_families TEXT[],  -- Array of family names affected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add some critical soil-borne diseases with persistence data
INSERT INTO diseases (name, common_name, is_soil_borne, persistence_years, affected_families, description) VALUES
    ('Fusarium Wilt', 'Fusarium wilt', true, 7, ARRAY['Solanaceae'], 'Fungal disease affecting tomatoes, potatoes. Persists 5-7 years.'),
    ('Verticillium Wilt', 'Verticillium wilt', true, 4, ARRAY['Solanaceae'], 'Fungal disease affecting nightshades. Persists 3-4 years.'),
    ('Clubroot', 'Clubroot', true, 20, ARRAY['Brassicaceae'], 'Devastating disease of cabbage family. Persists 7-20 years in soil!'),
    ('White Rot', 'White rot', true, 15, ARRAY['Amaryllidaceae'], 'Onion/garlic disease. Persists 8-15 years.'),
    ('Powdery Mildew', 'Powdery mildew', false, 0, ARRAY['Cucurbitaceae', 'Solanaceae'], 'Fungal disease on leaves, not soil-borne.'),
    ('Late Blight', 'Late blight', false, 0, ARRAY['Solanaceae'], 'Affects tomatoes and potatoes, not soil-borne.'),
    ('Early Blight', 'Early blight', true, 1, ARRAY['Solanaceae'], 'Fungal disease, can overwinter in soil debris.')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS plant_pests (
    plant_id BIGINT NOT NULL REFERENCES plant_entity(id) ON DELETE CASCADE,
    pest_id BIGINT NOT NULL REFERENCES pests(id) ON DELETE CASCADE,
    severity VARCHAR(20),  -- LOW, MODERATE, HIGH
    PRIMARY KEY (plant_id, pest_id)
);

CREATE TABLE IF NOT EXISTS plant_diseases (
    plant_id BIGINT NOT NULL REFERENCES plant_entity(id) ON DELETE CASCADE,
    disease_id BIGINT NOT NULL REFERENCES diseases(id) ON DELETE CASCADE,
    severity VARCHAR(20),  -- LOW, MODERATE, HIGH
    PRIMARY KEY (plant_id, disease_id)
);

CREATE INDEX IF NOT EXISTS idx_plant_pests_plant ON plant_pests(plant_id);
CREATE INDEX IF NOT EXISTS idx_plant_diseases_plant ON plant_diseases(plant_id);
CREATE INDEX IF NOT EXISTS idx_diseases_soil_borne ON diseases(is_soil_borne);

-- ============================================================================
-- CROP HISTORY FOR ROTATION TRACKING
-- ============================================================================

-- Extend crop_record_entity to track family and diseases for rotation planning
ALTER TABLE crop_record_entity
    ADD COLUMN IF NOT EXISTS family_id BIGINT REFERENCES plant_families(id),
    ADD COLUMN IF NOT EXISTS had_disease_issues BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS disease_notes TEXT;

-- Create a view for easy rotation history lookup
CREATE OR REPLACE VIEW rotation_history AS
SELECT
    cr.grow_zone_id,
    cr.planting_date,
    cr.harvest_date,
    p.id as plant_id,
    p.name as plant_name,
    p.slug as plant_slug,
    pf.id as family_id,
    pf.name as family_name,
    pf.rotation_years_min,
    pf.rotation_years_max,
    cr.had_disease_issues,
    cr.disease_notes,
    EXTRACT(YEAR FROM cr.planting_date) as planting_year
FROM crop_record_entity cr
         JOIN plant_entity p ON cr.plant_id = p.id
         LEFT JOIN plant_families pf ON p.family_id = pf.id
WHERE cr.planting_date IS NOT NULL
ORDER BY cr.grow_zone_id, cr.planting_date DESC;

-- ============================================================================
-- ROTATION RECOMMENDATIONS (computed data)
-- ============================================================================

-- This table could store pre-computed rotation scores for performance
-- But for MVP, we'll calculate on-demand in the application
CREATE TABLE IF NOT EXISTS rotation_recommendation_cache (
    id BIGSERIAL PRIMARY KEY,
    grow_area_id BIGINT NOT NULL REFERENCES grow_area_entity(id) ON DELETE CASCADE,
    plant_id BIGINT NOT NULL REFERENCES plant_entity(id) ON DELETE CASCADE,
    season VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    score INTEGER NOT NULL,  -- 0-100, higher is better
    reasons JSONB,  -- JSON array of scoring factors
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (grow_area_id, plant_id, season, year)
);

CREATE INDEX IF NOT EXISTS idx_rotation_cache_area_season ON rotation_recommendation_cache(grow_area_id, season, year);
CREATE INDEX IF NOT EXISTS idx_rotation_cache_score ON rotation_recommendation_cache(score DESC);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE plant_families IS 'Plant family taxonomy for crop rotation planning';
COMMENT ON TABLE plant_companions IS 'Companion planting relationships (beneficial, unfavorable, neutral)';
COMMENT ON TABLE pests IS 'Common garden pests';
COMMENT ON TABLE diseases IS 'Plant diseases with soil persistence data for rotation planning';
COMMENT ON TABLE plant_pests IS 'Which pests affect which plants';
COMMENT ON TABLE plant_diseases IS 'Which diseases affect which plants';
COMMENT ON VIEW rotation_history IS 'Historical crop data by grow area for rotation planning';
COMMENT ON TABLE rotation_recommendation_cache IS 'Pre-computed rotation recommendations for performance';

COMMENT ON COLUMN plant_entity.feeder_type IS 'Nutrient demand: HEAVY (tomato, corn), MODERATE (carrot), LIGHT (onion, lettuce), NITROGEN_FIXER (beans, peas)';
COMMENT ON COLUMN plant_entity.is_nitrogen_fixer IS 'True for legumes (Fabaceae family) that fix nitrogen in soil';
COMMENT ON COLUMN diseases.persistence_years IS 'How many years disease persists in soil (critical for rotation interval!)';
COMMENT ON COLUMN diseases.affected_families IS 'Array of plant family names affected by this disease';
