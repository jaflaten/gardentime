# Plant Attribute Import Service - Usage Guide

## Overview

The import service allows you to import LLM-parsed plant attributes into the database. It handles:
- Creating or updating plant records
- Storing plant attributes
- Managing edible parts in separate table
- Fetching scientific names from Trefle API (optional)
- Validation and error handling

## Quick Start

### 1. Parse Your Data with LLM

Use the prompt from `docs/llm-prompts/QUICK-PROMPT.txt` to get structured JSON.

### 2. Save to File

Save the output to `docs/scrapers/extracted-text/{plant-name}.json`:

```json
{
  "commonName": "Tomato",
  "cycle": "ANNUAL",
  "sunNeeds": "FULL_SUN",
  "waterNeeds": "FREQUENT",
  "rootDepth": "DEEP",
  "growthHabit": "FRUITING",
  "soilTempMinF": 55,
  "soilTempOptimalF": 70,
  "frostTolerant": false,
  "spacingMin": 24,
  "spacingMax": 36,
  "plantingDepthInches": 0.5,
  "containerSuitable": true,
  "requiresStaking": true,
  "requiresPruning": true,
  "edibleParts": ["fruit"],
  "daysToMaturityMin": null,
  "daysToMaturityMax": null,
  "wateringInchesPerWeek": 2,
  "fertilizingFrequencyWeeks": 2,
  "mulchRecommended": true,
  "notes": "Heat-loving plant. Requires staking."
}
```

### 3. Import Single Plant

```bash
curl -X POST http://localhost:8081/api/admin/import/simple \
  -H "Content-Type: application/json" \
  -d @docs/scrapers/extracted-text/tomatoes.json | jq
```

Or from the project root:

```bash
curl -X POST http://localhost:8081/api/admin/import/simple \
  -H "Content-Type: application/json" \
  -d @plant-data-aggregator/plant-data-aggregator/docs/scrapers/extracted-text/tomatoes.json | jq
```

### 4. Import All Plants in Directory

```bash
curl -X POST http://localhost:8081/api/admin/import/bulk-attributes \
  -H "Content-Type: application/json" \
  -d '{"directory": "plant-data-aggregator/plant-data-aggregator/docs/scrapers/extracted-text"}' | jq
```

## API Endpoints

### POST /api/admin/import/simple

Import from a plain JSON file (recommended for testing).

**Input:** Parsed plant attributes JSON (direct from LLM)

**Example:**
```bash
curl -X POST http://localhost:8081/api/admin/import/simple \
  -H "Content-Type: application/json" \
  -d '{
    "commonName": "Tomato",
    "cycle": "ANNUAL",
    "sunNeeds": "FULL_SUN",
    "waterNeeds": "FREQUENT",
    "rootDepth": "DEEP",
    "growthHabit": "FRUITING",
    "frostTolerant": false,
    "edibleParts": ["fruit"],
    "containerSuitable": true,
    "requiresStaking": true,
    "requiresPruning": true,
    "notes": "Heat-loving plant"
  }'
```

**Response:**
```json
{
  "success": true,
  "plantId": "550e8400-e29b-41d4-a716-446655440000",
  "commonName": "Tomato",
  "message": "Successfully imported plant attributes",
  "warnings": [
    "Soil temperature data captured but not stored in current schema (min: 55°F, optimal: 70°F)",
    "Spacing data captured but not stored in current schema (24-36 inches)"
  ]
}
```

### POST /api/admin/import/plant-attributes

Import with additional metadata (scientific name override, custom source).

**Input:**
```json
{
  "attributes": {
    "commonName": "Tomato",
    "cycle": "ANNUAL",
    ...
  },
  "scientificName": "Solanum lycopersicum",
  "source": "Almanac.com"
}
```

### POST /api/admin/import/bulk-attributes

Import all JSON files from a directory.

**Input:**
```json
{
  "directory": "docs/scrapers/extracted-text"
}
```

**Response:**
```json
{
  "totalProcessed": 15,
  "successful": 14,
  "failed": 1,
  "results": [
    {
      "success": true,
      "plantId": "...",
      "commonName": "Tomato",
      "message": "Successfully imported plant attributes",
      "warnings": []
    },
    ...
  ]
}
```

## What Gets Imported

### Database Tables Populated

#### 1. `plants` table
```sql
INSERT INTO plants (id, canonical_scientific_name, common_name)
VALUES (
  uuid_generate_v4(),
  'Solanum lycopersicum',  -- from Trefle or provided
  'Tomato'                 -- from parsed JSON
);
```

#### 2. `plant_attributes` table
```sql
INSERT INTO plant_attributes (
  plant_id, cycle, sun_needs, water_needs, 
  root_depth, growth_habit, days_to_maturity_min, days_to_maturity_max
) VALUES (
  plant_id,
  'ANNUAL',
  'FULL_SUN',
  'FREQUENT',
  'DEEP',
  'FRUITING',
  NULL,
  NULL
);
```

#### 3. `plant_attribute_edible_parts` table
```sql
INSERT INTO plant_attribute_edible_parts (plant_id, edible_part)
VALUES (plant_id, 'fruit');
```

#### 4. `sources` table
```sql
INSERT INTO sources (id, type, title, url, copyright_ok)
VALUES (
  uuid_generate_v4(),
  'WEBSITE',
  'Almanac.com',
  'https://www.almanac.com',
  true
);
```

## Data Mapping

| JSON Field | Database Field | Table | Notes |
|------------|---------------|-------|-------|
| commonName | common_name | plants | Used to lookup or create plant |
| cycle | cycle | plant_attributes | ANNUAL/PERENNIAL/BIENNIAL |
| sunNeeds | sun_needs | plant_attributes | FULL_SUN/PART_SHADE/SHADE |
| waterNeeds | water_needs | plant_attributes | LOW/MODERATE/HIGH/FREQUENT |
| rootDepth | root_depth | plant_attributes | SHALLOW/MEDIUM/DEEP |
| growthHabit | growth_habit | plant_attributes | BUSH/VINE/CLIMBER/FRUITING/etc |
| frostTolerant | drought_tolerant | plant_attributes | Inverse mapping |
| daysToMaturityMin | days_to_maturity_min | plant_attributes | Integer |
| daysToMaturityMax | days_to_maturity_max | plant_attributes | Integer |
| edibleParts | edible_part | plant_attribute_edible_parts | Array → multiple rows |

### Data Not Yet Stored

These fields are captured but not stored (warnings generated):
- soilTempMinF, soilTempOptimalF
- spacingMin, spacingMax
- plantingDepthInches
- wateringInchesPerWeek
- fertilizingFrequencyWeeks
- containerSuitable, requiresStaking, requiresPruning, mulchRecommended

Consider storing these in the `notes` field or extending the schema.

## Behavior

### Creating New Plants

If a plant doesn't exist:
1. Try to fetch scientific name from Trefle API
2. If Trefle not configured or no results, use common name as placeholder
3. Create new plant record
4. Create plant attributes
5. Add edible parts

### Updating Existing Plants

If a plant exists (matched by common name):
1. Keep existing scientific name/family/genus
2. Update plant attributes with new values
3. Replace edible parts (delete old, insert new)

### Scientific Name Resolution

1. If scientificName provided in request → use it
2. Else if Trefle configured → search by common name
3. Else → use common name as placeholder (generate warning)

## Error Handling

The service handles errors gracefully:

### Invalid Enum Values
```json
{
  "success": true,
  "warnings": ["Invalid sun needs: SUPER_BRIGHT, using null"]
}
```

### Trefle API Failure
```json
{
  "success": true,
  "warnings": ["Failed to fetch scientific name from Trefle: timeout"]
}
```

### Complete Failure
```json
{
  "success": false,
  "plantId": null,
  "commonName": "Tomato",
  "message": "Failed to import: Database connection error"
}
```

## Testing the Import

### 1. Verify Your JSON

Test parsing first:
```bash
cat docs/scrapers/extracted-text/tomatoes.json | jq .
```

### 2. Test Import

```bash
curl -X POST http://localhost:8081/api/admin/import/simple \
  -H "Content-Type: application/json" \
  -d @docs/scrapers/extracted-text/tomatoes.json | jq
```

### 3. Verify in Database

```sql
-- Check plant created
SELECT * FROM plants WHERE common_name = 'Tomato';

-- Check attributes
SELECT * FROM plant_attributes WHERE plant_id = (
  SELECT id FROM plants WHERE common_name = 'Tomato'
);

-- Check edible parts
SELECT * FROM plant_attribute_edible_parts WHERE plant_id = (
  SELECT id FROM plants WHERE common_name = 'Tomato'
);
```

### 4. Check Logs

```bash
# View application logs
tail -f plant-data-aggregator/logs/application.log
```

Look for:
- `Importing plant attributes for: Tomato`
- `Found scientific name from Trefle: Solanum lycopersicum`
- `Successfully imported attributes for Tomato`

## Workflow Summary

```
1. Scrape plant data
   ↓
2. Parse with LLM (using QUICK-PROMPT.txt)
   ↓
3. Save JSON to extracted-text/
   ↓
4. Import via /api/admin/import/simple
   ↓
5. Verify in database
   ↓
6. Repeat for other plants
   ↓
7. Bulk import all remaining plants
```

## Troubleshooting

### "No value passed for parameter"
- Make sure all required fields are in JSON
- Required: commonName, cycle, sunNeeds, waterNeeds, rootDepth, growthHabit

### "Plant already exists"
- Service will UPDATE existing plant, not error
- Check warnings for details

### "Invalid enum value"
- Check that enums are uppercase: ANNUAL not annual
- Valid values listed in docs/llm-prompts/extract-plant-attributes.md

### "Trefle not configured"
- Set TREFLE_API_KEY environment variable
- Or provide scientificName in request
- Or accept common name as placeholder (warning generated)

## Next Steps

After importing:
1. Review warnings - some data may not be stored
2. Consider extending schema for additional fields
3. Add companion planting data (separate process)
4. Verify data quality in database
5. Use imported data in your garden planning application
