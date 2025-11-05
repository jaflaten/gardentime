# Pest & Disease API - Implementation Complete

## Overview

Implemented pest and disease endpoints for the Plant Data API, completing 12 of 13 planned endpoints.

---

## What Was Added

### Database Schema (V2 Migration)

Created 4 new tables with sample data:

**Core Tables:**
- `pests` - Common garden pests with descriptions and treatments
- `diseases` - Plant diseases with soil-borne tracking
- `plant_pests` - Many-to-many relationship with susceptibility levels
- `plant_diseases` - Many-to-many relationship with susceptibility levels

**Enums Added:**
- `pest_disease_type` - PEST, DISEASE, DISORDER
- `severity_level` - LOW, MEDIUM, HIGH, CRITICAL
- `treatment_type` - ORGANIC, CHEMICAL, CULTURAL, BIOLOGICAL

**Sample Data Included:**
- 10 common pests (aphids, hornworms, cabbage worms, etc.)
- 10 common diseases (blight, powdery mildew, fusarium wilt, etc.)
- Soil-borne disease tracking with persistence years

---

## New Endpoints (3 of 3) ✅

### 1. Get Plant Pests
```http
GET /api/v1/plant-data/plants/{name}/pests
```

**Response:**
```json
{
  "plantName": "Tomato",
  "totalPests": 5,
  "pests": [
    {
      "pest": {
        "id": "uuid",
        "name": "Tomato Hornworm",
        "scientificName": "Manduca quinquemaculata",
        "description": "Large green caterpillars that can defoliate plants",
        "treatmentOptions": "Hand-pick, beneficial wasps, Bt spray",
        "severity": "HIGH"
      },
      "susceptibility": "HIGH",
      "notes": "Very common on tomatoes",
      "preventionTips": "Inspect plants regularly, encourage beneficial insects"
    }
  ]
}
```

### 2. Get Plant Diseases
```http
GET /api/v1/plant-data/plants/{name}/diseases
```

**Response:**
```json
{
  "plantName": "Tomato",
  "totalDiseases": 4,
  "diseases": [
    {
      "disease": {
        "id": "uuid",
        "name": "Blight",
        "scientificName": "Phytophthora infestans",
        "description": "Devastating fungal disease of tomatoes and potatoes",
        "treatmentOptions": "Remove affected plants, copper spray, resistant varieties",
        "severity": "CRITICAL",
        "isSoilBorne": true,
        "persistenceYears": 3
      },
      "susceptibility": "HIGH",
      "notes": "Monitor during humid weather",
      "preventionTips": "Good air circulation, water at base, mulch"
    }
  ]
}
```

### 3. Get Soil-Borne Diseases
```http
GET /api/v1/plant-data/diseases/soil-borne
```

**Purpose:** Critical for crop rotation planning - shows which diseases persist in soil and which plant families they affect.

**Response:**
```json
{
  "diseases": [
    {
      "disease": {
        "id": "uuid",
        "name": "Clubroot",
        "scientificName": "Plasmodiophora brassicae",
        "description": "Soil-borne disease causing swollen roots in brassicas",
        "severity": "CRITICAL",
        "isSoilBorne": true,
        "persistenceYears": 20
      },
      "affectedFamilies": ["Brassicaceae"],
      "affectedPlantCount": 30
    },
    {
      "disease": {
        "name": "Fusarium Wilt",
        "persistenceYears": 7,
        "severity": "HIGH"
      },
      "affectedFamilies": ["Solanaceae", "Cucurbitaceae"],
      "affectedPlantCount": 45
    }
  ]
}
```

**Use Cases:**
- Rotation planning: Avoid planting susceptible families where disease persists
- Risk assessment: Know which diseases are critical (persist 7-20 years)
- Family guidance: See all families affected by each disease

---

## Updated Endpoints

### Plant Details Now Include Counts
```http
GET /api/v1/plant-data/plants/{name}
```

**Added Fields:**
```json
{
  "pestCount": 5,
  "diseaseCount": 4
}
```

---

## Database Schema Details

### Pests Table
```sql
CREATE TABLE pests (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    scientific_name TEXT,
    description TEXT,
    treatment_options TEXT,
    severity severity_level DEFAULT 'MEDIUM'
);
```

**Sample Pests:**
- Aphids (MEDIUM)
- Tomato Hornworm (HIGH)
- Cabbage Worm (MEDIUM)
- Whitefly (MEDIUM)
- Spider Mites (HIGH)
- Slugs and Snails (MEDIUM)
- Cucumber Beetles (HIGH)
- Squash Bugs (HIGH)
- Cutworms (HIGH)
- Flea Beetles (MEDIUM)

### Diseases Table
```sql
CREATE TABLE diseases (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    scientific_name TEXT,
    description TEXT,
    treatment_options TEXT,
    severity severity_level DEFAULT 'MEDIUM',
    is_soil_borne BOOLEAN DEFAULT FALSE,
    persistence_years INTEGER
);
```

**Sample Diseases:**
- Blight (CRITICAL, soil-borne, 3 years)
- Clubroot (CRITICAL, soil-borne, 20 years)
- Fusarium Wilt (HIGH, soil-borne, 7 years)
- Verticillium Wilt (HIGH, soil-borne, 10 years)
- Powdery Mildew (MEDIUM, not soil-borne)
- Downy Mildew (MEDIUM, not soil-borne)
- Mosaic Virus (HIGH, not soil-borne)
- Root Rot (HIGH, soil-borne, 2 years)

### Plant Relationships
```sql
CREATE TABLE plant_pests (
    plant_id UUID REFERENCES plants(id),
    pest_id UUID REFERENCES pests(id),
    susceptibility severity_level,
    notes TEXT,
    prevention_tips TEXT
);

CREATE TABLE plant_diseases (
    plant_id UUID REFERENCES plants(id),
    disease_id UUID REFERENCES diseases(id),
    susceptibility severity_level,
    notes TEXT,
    prevention_tips TEXT
);
```

---

## Severity Levels

All pests and diseases are classified by severity:

- **CRITICAL**: Devastating impact, can destroy entire crop
- **HIGH**: Serious damage, requires immediate attention
- **MEDIUM**: Moderate damage, manageable with treatment
- **LOW**: Minor nuisance, rarely causes significant harm

---

## Soil-Borne Disease Persistence

Critical for rotation planning:

| Disease | Persistence | Rotation Needed |
|---------|-------------|-----------------|
| Clubroot | 20 years | Avoid brassicas for 2 decades |
| Verticillium Wilt | 10 years | Avoid solanaceae for 1 decade |
| Fusarium Wilt | 7 years | Avoid affected families for 7+ years |
| Blight | 3 years | Minimum 3-year rotation |
| Root Rot | 2 years | Minimum 2-year rotation |

---

## Integration with Rotation Planning

The soil-borne diseases endpoint is designed to support intelligent crop rotation:

```javascript
// Example: Check if it's safe to plant tomatoes
const soilBorneDiseases = await fetch('/diseases/soil-borne');
const tomatoFamily = 'Solanaceae';

const riskyDiseases = soilBorneDiseases.diseases.filter(d => 
  d.affectedFamilies.includes(tomatoFamily) && 
  d.disease.persistenceYears > 3
);

if (riskyDiseases.length > 0) {
  console.warn('High risk diseases for Solanaceae:', 
    riskyDiseases.map(d => `${d.disease.name} (${d.disease.persistenceYears} years)`)
  );
}
```

---

## Testing

### Start API
```bash
cd plant-data-aggregator
./gradlew bootRun
```

### Run Tests
```bash
./test-plant-api.sh
```

### Manual Tests
```bash
# Get pests for tomato
curl http://localhost:8081/api/v1/plant-data/plants/Tomato/pests

# Get diseases for tomato
curl http://localhost:8081/api/v1/plant-data/plants/Tomato/diseases

# Get all soil-borne diseases
curl http://localhost:8081/api/v1/plant-data/diseases/soil-borne

# Get plant with pest/disease counts
curl http://localhost:8081/api/v1/plant-data/plants/Tomato | jq '{name, pestCount, diseaseCount}'
```

---

## Files Created

### Database
```
plant-data-aggregator/src/main/resources/db/migration/
  V2__create_pests_diseases.sql (120 lines)
```

### Models
```
plant-data-aggregator/src/main/kotlin/no/sogn/plantdata/
  model/PestDisease.kt (60 lines)
  enums/Enums.kt (updated with SeverityLevel)
```

### Repository
```
plant-data-aggregator/src/main/kotlin/no/sogn/plantdata/
  repository/PestDiseaseRepositories.kt (35 lines)
```

### DTOs
```
plant-data-aggregator/src/main/kotlin/no/sogn/plantdata/
  dto/PestDiseaseDTOs.kt (85 lines)
```

### Service
```
plant-data-aggregator/src/main/kotlin/no/sogn/plantdata/
  service/PestDiseaseService.kt (145 lines)
```

### Controller
```
plant-data-aggregator/src/main/kotlin/no/sogn/plantdata/
  controller/PlantDataController.kt (updated with 3 endpoints)
```

---

## Implementation Status

### ✅ Completed (12 of 13 endpoints)

1. **Plant Information** (3 endpoints) ✅
2. **Plant Families** (2 endpoints) ✅
3. **Companion Planting** (2 endpoints) ✅
4. **Pest & Disease** (3 endpoints) ✅
5. **Bulk Operations** (1 endpoint) ✅

### ⏳ Remaining (1 of 13 endpoints)

6. **Seasonal Planning** (1 endpoint)
   - `GET /api/v1/plant-data/plants/seasonal` - Seasonal recommendations

7. **Rotation Planning** (2 endpoints - Phase 2)
   - `POST /api/v1/plant-data/rotation/validate`
   - `GET /api/v1/plant-data/rotation/recommendations`

---

## Next Steps

### Population of Pest/Disease Data

The tables are created with sample data, but need to be populated with actual plant-pest and plant-disease relationships:

1. **Data Import**: Import pest/disease data from scraped content
2. **Relationship Mapping**: Map which pests/diseases affect which plants
3. **Susceptibility Levels**: Assign appropriate severity for each relationship
4. **Prevention Tips**: Add plant-specific prevention strategies

### Seasonal Planning Endpoint

Implement the seasonal planning endpoint:
- Filter by planting season
- Consider frost tolerance
- Calculate planting windows

### Rotation Planning Endpoints (Phase 2)

High priority for intelligent crop rotation:
- Validate rotation plans
- Score rotations based on multiple factors
- Recommend next crops
- Consider soil-borne disease history

---

## Documentation

- **API Progress**: `docs/PHASE1_PROGRESS.md`
- **This Document**: `docs/PEST_DISEASE_IMPLEMENTATION.md`
- **API Plan**: `docs/API_IMPLEMENTATION_PLAN.md`
