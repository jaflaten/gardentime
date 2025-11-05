# Plant Data Processing - Next Steps

**Created:** 2025-11-05  
**Status:** 76 plants scraped, ready for pest/disease extraction and Trefle API enrichment

---

## Current Status

### ✅ Completed
- **76 plants** scraped from Almanac.com
- Raw HTML saved to `rawhtml/`
- Extracted text saved to `extracted-text/` (JSON format)
- Includes: planting guides, care instructions, pests/diseases (raw text)

### 📋 Next Tasks
1. Extract structured pest/disease data
2. Fetch botanical data from Trefle API
3. Merge all data sources for database import

---

## Task 1: Extract Pests & Diseases

### Script: `parse-pests-diseases.py`

**Purpose:** Extract structured pest and disease information from scraped text.

**What it does:**
- Reads all JSON files in `extracted-text/`
- Extracts pest names using pattern matching
- Extracts disease names using pattern matching
- Creates comprehensive database with:
  - Per-plant pests and diseases
  - Pest index (which plants each pest affects)
  - Disease index (which plants each disease affects)

**Usage:**
```bash
cd plant-data-aggregator/plant-data-aggregator/docs/scrapers
chmod +x parse-pests-diseases.py
python3 parse-pests-diseases.py
```

**Output:** `pests-diseases-database.json`

**Expected results:**
```json
{
  "metadata": {
    "total_plants": 76,
    "total_unique_pests": ~50,
    "total_unique_diseases": ~40
  },
  "plants": [
    {
      "commonName": "Tomato",
      "slug": "tomatoes",
      "pests": ["Aphids", "Tomato Hornworm", "Whiteflies"],
      "diseases": ["Late Blight", "Early Blight", "Fusarium Wilt"]
    }
  ],
  "pests_index": {
    "Aphids": {
      "affected_plants": ["Tomato", "Pepper", "Cucumber", ...],
      "plant_count": 45
    }
  }
}
```

**Key features:**
- Pattern-based extraction (regex)
- Handles common pest variations (e.g., "aphid" → "Aphids")
- Proper capitalization
- Index for quick lookups

---

## Task 2: Fetch Trefle Botanical Data

### Script: `fetch-trefle-data.py`

**Purpose:** Get botanical information (family, genus, nitrogen fixation) from Trefle API.

**Prerequisites:**
```bash
export TREFLE_API_KEY='your-api-key-here'
```

**What it does:**
- Searches Trefle API for each plant
- Uses scientific name mapping when available
- Retrieves:
  - Scientific name
  - Plant family (CRITICAL for crop rotation)
  - Genus
  - Detailed botanical data
- Handles rate limiting (120 requests/minute max)

**Usage:**
```bash
cd plant-data-aggregator/plant-data-aggregator/docs/scrapers
chmod +x fetch-trefle-data.py
python3 fetch-trefle-data.py
```

**Output:** `trefle-botanical-data.json`

**Expected results:**
```json
{
  "metadata": {
    "total_plants": 76,
    "found_in_trefle": ~70,
    "not_found": ~6
  },
  "plants": [
    {
      "commonName": "Tomato",
      "slug": "tomatoes",
      "trefle_found": true,
      "trefle_id": 123456,
      "scientific_name": "Solanum lycopersicum",
      "family": "Solanaceae",
      "genus": "Solanum",
      "data": {
        // Full Trefle plant data
        "specifications": {
          "nitrogen_fixation": null
        },
        "growth": {
          "soil_nutriments": 8,
          "minimum_root_depth": { "cm": 60 },
          "ph_minimum": 6.0,
          "ph_maximum": 7.0
        }
      }
    }
  ]
}
```

**Important:** 
- Rate limit: Max 120 requests/minute (script handles this automatically)
- Takes ~40 seconds to process all 76 plants
- Some specialty plants may not be in Trefle

---

## Task 3: Data Analysis & Validation

Once both scripts have run, analyze the results:

### Check Pest/Disease Coverage
```bash
cat pests-diseases-database.json | jq '.metadata'
cat pests-diseases-database.json | jq '.pests_index | keys | length'
cat pests-diseases-database.json | jq '.diseases_index | keys | length'
```

### Check Trefle Coverage
```bash
cat trefle-botanical-data.json | jq '.metadata'
cat trefle-botanical-data.json | jq '[.plants[] | select(.family != null)] | length'
```

### List Plants by Family
```bash
cat trefle-botanical-data.json | jq -r '.plants[] | select(.family != null) | "\(.family): \(.commonName)"' | sort | uniq
```

### Common Families (Expected)
- **Solanaceae** (Nightshades): Tomato, Pepper, Eggplant, Potato
- **Brassicaceae** (Crucifers): Cabbage, Broccoli, Kale, Cauliflower, Brussels Sprouts, Radish, Turnip
- **Fabaceae** (Legumes): Beans, Peas, Fava Beans, Peanuts (Nitrogen fixers!)
- **Cucurbitaceae** (Cucurbits): Cucumber, Zucchini, Pumpkin, Squash, Melon
- **Apiaceae** (Umbellifers): Carrot, Celery, Parsley, Parsnip, Dill, Fennel
- **Allium** (Onion family): Onion, Garlic, Leek, Shallots, Chives
- **Asteraceae** (Composites): Lettuce, Sunflower, Artichoke
- **Amaranthaceae** (Beet family): Beet, Spinach, Swiss Chard

---

## Task 4: Create Merged Database

After both extractions are complete, we need to merge:
1. Scraped Almanac data (planting, care, spacing, etc.)
2. Pest/disease data (from Task 1)
3. Trefle botanical data (from Task 2)
4. Companionship data (`companionship-extended2.json`)

### Create merge script:
```python
# merge-plant-data.py
import json

# Load all sources
with open('extracted-text/tomatoes_extracted.json') as f:
    almanac_data = json.load(f)

with open('pests-diseases-database.json') as f:
    pest_disease_db = json.load(f)
    
with open('trefle-botanical-data.json') as f:
    trefle_db = json.load(f)

# Merge logic here...
```

---

## Expected Workflow

### Step 1: Run Pest/Disease Extraction (5 minutes)
```bash
cd /Users/Jorn-Are.Klubben.Flaten/dev/solo/gardentime/plant-data-aggregator/plant-data-aggregator/docs/scrapers
python3 parse-pests-diseases.py
```

### Step 2: Run Trefle Data Fetch (~1 minute with API)
```bash
export TREFLE_API_KEY='your-key'
python3 fetch-trefle-data.py
```

### Step 3: Review Results
```bash
ls -lh *.json
cat pests-diseases-database.json | jq '.metadata'
cat trefle-botanical-data.json | jq '.metadata'
```

### Step 4: Create Import Script for Database
Based on the merged data, create database import script using the schema from `COMPREHENSIVE_DATA_MODEL.md`.

---

## Files Created

### Input Files (Already Exist)
- `extracted-text/*.json` (76 files) - Scraped Almanac data
- `../companionship/companionship-extended2.json` - Companionship relationships

### Output Files (To Be Generated)
- `pests-diseases-database.json` - Structured pest/disease data
- `trefle-botanical-data.json` - Botanical information
- `merged-plant-database.json` - All sources combined (future)

---

## Integration with Crop Rotation Planner

The data from these scripts will populate:

### From Trefle Data:
- `plant.family` ✓ CRITICAL
- `plant.genus` ✓
- `plant_attributes.is_nitrogen_fixer` ✓ (from specifications.nitrogen_fixation + family)
- `plant_attributes.feeder_type` ✓ (derived from family + soil_nutriments)
- `plant_attributes.root_depth` ✓ (from growth.minimum_root_depth)

### From Pest/Disease Data:
- `plant_pests_diseases` table records
- Can later be enhanced with:
  - Soil-borne flag (manual research)
  - Persistence years (manual research)
  - Affects family flag

### From Scraped Data (Already Have):
- Spacing, planting depth, watering, fertilizing
- Container suitability, staking, pruning needs
- Days to maturity
- Care notes

---

## Next Actions

1. **Run parse-pests-diseases.py** to extract pest/disease data
2. **Run fetch-trefle-data.py** to get botanical info
3. **Review outputs** for quality and coverage
4. **Create database migration** based on COMPREHENSIVE_DATA_MODEL.md
5. **Build import scripts** to populate database
6. **Implement rotation planner MVP** using family + feeder type + root depth

---

## Notes

- **Trefle API is read-only** (was shut down in 2021, but data may still be cached)
- Alternative: Use manual family mapping + hardcoded rotation rules
- Pest/disease extraction uses pattern matching (not perfect, may need manual review)
- For production, consider manual curation of critical soil-borne diseases

---

## Questions?

Refer to these documents:
- `API_DATA_ANALYSIS.md` - What Trefle provides
- `ROTATION_PLANNER_GAPS.md` - What data we're missing
- `ROTATION_PLANNER_DESIGN.md` - How to build rotation planner
- `COMPREHENSIVE_DATA_MODEL.md` - Database schema
