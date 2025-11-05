# Plant Data Import Guide

This guide explains how to import plant data into the GardenTime database for crop rotation planning.

## Overview

The import process merges data from multiple sources:

1. **Almanac scraped data** - Planting guides, care instructions (77 plants)
2. **Trefle botanical data** - Plant families, genus, scientific names (44 plants matched)
3. **Manual family mappings** - For plants not found in Trefle (33 plants)
4. **Pest/disease database** - 184 pests, 111 diseases
5. **Companion planting data** - 2,303 relationships for 42 plants

## Prerequisites

### 1. Database Setup

First, ensure your database is running and migrations are applied:

```bash
# Start database (if using Docker)
docker-compose up -d postgres

# Or start locally installed PostgreSQL
pg_ctl start

# Apply migrations (Flyway will run automatically on app start)
./gradlew bootRun
```

The V9 migration (`V9__create_plant_rotation_tables.sql`) will create:
- `plant_families` table with 17 common families
- Extended `plant_entity` columns for rotation planning
- `plant_companions`, `pests`, `diseases` tables
- Junction tables for relationships
- Indexes for performance

### 2. Python Dependencies

Install required Python packages:

```bash
cd plant-data-aggregator/plant-data-aggregator/docs/scrapers

# Install psycopg2 for PostgreSQL
pip3 install psycopg2-binary
```

### 3. Data Files

Verify all required data files exist:

```bash
# Check Trefle botanical data
ls -lh trefle-botanical-data.json

# Check pest/disease database
ls -lh pests-diseases-database.json

# Check extracted plant data
ls -lh extracted-text/*.json | wc -l  # Should be 76-77 files

# Check companion data
ls -lh ../companionship/companionship-extended2.json
```

## Running the Import

### Step 1: Set Database Credentials

```bash
export DB_PASSWORD='your-database-password'

# Optional: Override defaults
export DB_HOST='localhost'
export DB_PORT='5432'
export DB_NAME='gardentime'
export DB_USER='postgres'
```

### Step 2: Run Import Script

```bash
cd plant-data-aggregator/plant-data-aggregator/docs/scrapers

python3 import-plant-data.py
```

### Expected Output

```
================================================================================
PLANT DATA IMPORT
================================================================================

✓ Connected to database

1. Verifying plant families...
✓ Plant families: 17 rows

2. Verifying edible parts...
✓ Edible parts: 6 rows

3. Importing plants...
Loaded 44 plants from Trefle data
Found 76 plant files to import
  ✓ Imported: Tomato (family: Solanaceae)
  ✓ Imported: Carrot (family: Apiaceae)
  ...
✅ Plants imported: 76, skipped: 0

4. Importing pests and diseases...
✓ Imported 184 pests
✓ Imported 111 diseases
✅ Linked plants to pests and diseases

5. Importing companion relationships...
✅ Companion relationships imported: 2303, skipped: 0

================================================================================
✅ IMPORT COMPLETE!
================================================================================
```

## Data Imported

### Plant Families (17)

Critical for crop rotation intervals:

| Family | Common Name | Rotation | Examples |
|--------|-------------|----------|----------|
| Solanaceae | Nightshade family | 3-4 years | Tomato, Pepper, Potato, Eggplant |
| Brassicaceae | Cabbage family | 3-4 years | Cabbage, Broccoli, Kale, Radish |
| Fabaceae | Legume family | 2-3 years | Beans, Peas (nitrogen fixers) |
| Cucurbitaceae | Cucurbit family | 2-3 years | Cucumber, Squash, Melon |
| Apiaceae | Carrot family | 2-3 years | Carrot, Celery, Parsley |
| Amaranthaceae | Amaranth family | 2-3 years | Beet, Spinach, Swiss Chard |
| Amaryllidaceae | Allium family | 2-3 years | Onion, Garlic, Leek |
| ... | ... | ... | ... |

### Plants (76)

Each plant includes:
- **Basic info**: Name, slug, scientific name, genus
- **Family**: Link to plant_families (for rotation)
- **Growing data**: Cycle, sun/water needs, root depth, growth habit
- **Planting info**: Spacing, depth, frost tolerance
- **Care**: Staking, pruning, watering, fertilizing
- **Maturity**: Days to harvest (min/max)
- **Rotation data**: Feeder type, nitrogen fixer flag
- **Botanical**: pH range (from Trefle)

### Feeder Types (Auto-derived)

Based on family and Trefle soil nutrient data:

- **HEAVY** - Solanaceae, Brassicaceae, Cucurbitaceae, Poaceae (tomato, corn, squash)
- **MODERATE** - Apiaceae, Amaranthaceae (carrot, beet)
- **LIGHT** - Amaryllidaceae, Asteraceae, Lamiaceae (onion, lettuce, herbs)
- **NITROGEN_FIXER** - Fabaceae (beans, peas)

### Edible Parts (6)

- fruit, leaf, root, seed, flower, stem

### Pests (184)

Common pests like:
- Aphids, Flea Beetle, Spider Mites
- Tomato Hornworm, Cabbage Worm
- Japanese Beetle, Cucumber Beetle
- (Some noise from pattern matching - can be cleaned later)

### Diseases (111 + 7 critical)

Common diseases like:
- Powdery Mildew, Downy Mildew
- Early Blight, Late Blight
- Fusarium Wilt, Verticillium Wilt
- Mosaic Virus, Clubroot

**Critical soil-borne diseases** (pre-loaded with persistence data):
- Fusarium Wilt (Solanaceae) - 7 years
- Verticillium Wilt (Solanaceae) - 4 years
- Clubroot (Brassicaceae) - 20 years!
- White Rot (Amaryllidaceae) - 15 years
- Early Blight (Solanaceae) - 1 year

### Companion Relationships (2,303)

- BENEFICIAL - Plants that help each other
- UNFAVORABLE - Plants that should not be planted together
- NEUTRAL - No significant interaction

## Verification

### Check Import Success

```sql
-- Connect to database
psql -U postgres -d gardentime

-- Count imported data
SELECT 'Plant Families' as table_name, COUNT(*) as count FROM plant_families
UNION ALL
SELECT 'Plants', COUNT(*) FROM plant_entity
UNION ALL
SELECT 'Pests', COUNT(*) FROM pests
UNION ALL
SELECT 'Diseases', COUNT(*) FROM diseases
UNION ALL
SELECT 'Companions', COUNT(*) FROM plant_companions
UNION ALL
SELECT 'Plant-Pests', COUNT(*) FROM plant_pests
UNION ALL
SELECT 'Plant-Diseases', COUNT(*) FROM plant_diseases;

-- Expected results:
-- Plant Families: 17
-- Plants: 76
-- Pests: 184
-- Diseases: 111+
-- Companions: 2,303
-- Plant-Pests: varies
-- Plant-Diseases: varies
```

### Verify Rotation Data

```sql
-- Plants by family (critical for rotation)
SELECT 
    pf.name as family,
    pf.rotation_years_min || '-' || pf.rotation_years_max as rotation_years,
    COUNT(p.id) as plant_count
FROM plant_families pf
LEFT JOIN plant_entity p ON p.family_id = pf.id
GROUP BY pf.id, pf.name, pf.rotation_years_min, pf.rotation_years_max
ORDER BY plant_count DESC;

-- Nitrogen fixers
SELECT name, slug, family_id
FROM plant_entity
WHERE is_nitrogen_fixer = true;

-- Feeder types
SELECT feeder_type, COUNT(*) as count
FROM plant_entity
WHERE feeder_type IS NOT NULL
GROUP BY feeder_type
ORDER BY count DESC;

-- Soil-borne diseases
SELECT name, persistence_years, affected_families
FROM diseases
WHERE is_soil_borne = true
ORDER BY persistence_years DESC;
```

### Sample Queries

```sql
-- Get plant with all rotation data
SELECT 
    p.name,
    p.slug,
    pf.name as family,
    p.feeder_type,
    p.is_nitrogen_fixer,
    p.root_depth,
    p.days_to_maturity_min,
    p.days_to_maturity_max
FROM plant_entity p
LEFT JOIN plant_families pf ON p.family_id = pf.id
WHERE p.slug = 'tomatoes';

-- Get companions for a plant
SELECT 
    p1.name as plant,
    p2.name as companion,
    pc.relationship,
    pc.reason
FROM plant_companions pc
JOIN plant_entity p1 ON pc.plant_id = p1.id
JOIN plant_entity p2 ON pc.companion_id = p2.id
WHERE p1.slug = 'tomatoes'
ORDER BY pc.relationship;

-- Get rotation history view
SELECT * FROM rotation_history
WHERE grow_zone_id = 1
ORDER BY planting_date DESC;
```

## Troubleshooting

### Import Fails with "duplicate key value"

If you've already imported data:

```sql
-- Clear existing plant data (WARNING: This deletes all plants!)
TRUNCATE plant_entity CASCADE;

-- Or skip existing plants (import script already does this)
-- Look for: "⚠️  Skipping ... already exists"
```

### Database connection fails

```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Check credentials
psql -U postgres -d gardentime -c "SELECT 1"

# Verify environment variables
echo $DB_PASSWORD
```

### Missing data files

```bash
# Re-run extraction scripts if needed
cd plant-data-aggregator/plant-data-aggregator/docs/scrapers

python3 parse-pests-diseases.py
python3 fetch-trefle-data.py
```

## Next Steps

After successful import:

1. **Verify data** - Run verification queries above
2. **Test rotation queries** - Use rotation_history view
3. **Build API endpoints** - Expose data to frontend
4. **Implement rotation planner** - Use family data for recommendations
5. **Add more plants** - Scrape remaining 11 plants from TODO list

## Files

### Migration
- `src/main/resources/db/migration/V9__create_plant_rotation_tables.sql`

### Kotlin Models
- `src/main/kotlin/no/sogn/gardentime/model/Plant.kt` (updated)
- `src/main/kotlin/no/sogn/gardentime/model/RotationModels.kt` (new)

### Import Script
- `plant-data-aggregator/plant-data-aggregator/docs/scrapers/import-plant-data.py`

### Data Sources
- `trefle-botanical-data.json` - Botanical data (44 plants)
- `pests-diseases-database.json` - Pests and diseases (184 + 111)
- `extracted-text/*.json` - Scraped plant data (76 files)
- `../companionship/companionship-extended2.json` - Companion data (42 plants)

## Support

For issues or questions:
1. Check verification queries above
2. Review error messages in import output
3. Check database logs
4. Verify all data files exist and are valid JSON
