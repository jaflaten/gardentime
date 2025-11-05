-- V2: Create Pests and Diseases tables
-- Support for plant-specific pest and disease information

-- Pest and Disease types
CREATE TYPE pest_disease_type AS ENUM ('PEST', 'DISEASE', 'DISORDER');
CREATE TYPE severity_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE treatment_type AS ENUM ('ORGANIC', 'CHEMICAL', 'CULTURAL', 'BIOLOGICAL');

-- Pests table
CREATE TABLE pests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    scientific_name TEXT NULL,
    description TEXT NULL,
    treatment_options TEXT NULL,
    severity severity_level DEFAULT 'MEDIUM',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Diseases table  
CREATE TABLE diseases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    scientific_name TEXT NULL,
    description TEXT NULL,
    treatment_options TEXT NULL,
    severity severity_level DEFAULT 'MEDIUM',
    is_soil_borne BOOLEAN DEFAULT FALSE,
    persistence_years INTEGER NULL, -- How long disease persists in soil
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Plant-Pest relationships (many-to-many)
CREATE TABLE plant_pests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    pest_id UUID NOT NULL REFERENCES pests(id) ON DELETE CASCADE,
    susceptibility severity_level DEFAULT 'MEDIUM',
    notes TEXT NULL,
    prevention_tips TEXT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_plant_pest UNIQUE (plant_id, pest_id)
);

-- Plant-Disease relationships (many-to-many)
CREATE TABLE plant_diseases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    disease_id UUID NOT NULL REFERENCES diseases(id) ON DELETE CASCADE,
    susceptibility severity_level DEFAULT 'MEDIUM',
    notes TEXT NULL,
    prevention_tips TEXT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_plant_disease UNIQUE (plant_id, disease_id)
);

-- Indexes for performance
CREATE INDEX idx_plant_pests_plant ON plant_pests(plant_id);
CREATE INDEX idx_plant_pests_pest ON plant_pests(pest_id);
CREATE INDEX idx_plant_diseases_plant ON plant_diseases(plant_id);
CREATE INDEX idx_plant_diseases_disease ON plant_diseases(disease_id);
CREATE INDEX idx_diseases_soil_borne ON diseases(is_soil_borne) WHERE is_soil_borne = TRUE;

-- Sample data for common pests
INSERT INTO pests (name, scientific_name, description, severity) VALUES
    ('Aphids', 'Aphidoidea', 'Small sap-sucking insects that cluster on new growth', 'MEDIUM'),
    ('Tomato Hornworm', 'Manduca quinquemaculata', 'Large green caterpillars that can defoliate plants', 'HIGH'),
    ('Cabbage Worm', 'Pieris rapae', 'Green caterpillars that damage brassicas', 'MEDIUM'),
    ('Whitefly', 'Aleyrodidae', 'Tiny white flying insects that suck plant sap', 'MEDIUM'),
    ('Spider Mites', 'Tetranychidae', 'Tiny arachnids that cause stippling on leaves', 'HIGH'),
    ('Slugs and Snails', 'Gastropoda', 'Mollusks that eat holes in leaves and fruit', 'MEDIUM'),
    ('Cucumber Beetles', 'Diabrotica', 'Yellow-green beetles that spread bacterial wilt', 'HIGH'),
    ('Squash Bugs', 'Anasa tristis', 'Brown bugs that damage cucurbits', 'HIGH'),
    ('Cutworms', 'Noctuidae larvae', 'Caterpillars that cut seedlings at soil level', 'HIGH'),
    ('Flea Beetles', 'Chrysomelidae', 'Tiny jumping beetles that create shot-hole damage', 'MEDIUM');

-- Sample data for common diseases
INSERT INTO diseases (name, scientific_name, description, is_soil_borne, persistence_years, severity) VALUES
    ('Powdery Mildew', 'Erysiphales', 'White powdery fungal growth on leaves', FALSE, 0, 'MEDIUM'),
    ('Blight', 'Phytophthora infestans', 'Devastating fungal disease of tomatoes and potatoes', TRUE, 3, 'CRITICAL'),
    ('Fusarium Wilt', 'Fusarium oxysporum', 'Soil-borne fungal disease causing wilting', TRUE, 7, 'HIGH'),
    ('Verticillium Wilt', 'Verticillium', 'Soil-borne fungal disease causing yellowing and wilting', TRUE, 10, 'HIGH'),
    ('Clubroot', 'Plasmodiophora brassicae', 'Soil-borne disease causing swollen roots in brassicas', TRUE, 20, 'CRITICAL'),
    ('Downy Mildew', 'Peronosporaceae', 'Fungal disease causing yellow patches on leaves', FALSE, 0, 'MEDIUM'),
    ('Anthracnose', 'Colletotrichum', 'Fungal disease causing dark lesions on fruit', FALSE, 2, 'MEDIUM'),
    ('Bacterial Wilt', 'Erwinia tracheiphila', 'Bacterial disease spread by cucumber beetles', FALSE, 0, 'HIGH'),
    ('Mosaic Virus', 'Various viruses', 'Viral disease causing mottled, distorted leaves', FALSE, 0, 'HIGH'),
    ('Root Rot', 'Various fungi', 'Fungal disease of roots in waterlogged soil', TRUE, 2, 'HIGH');
