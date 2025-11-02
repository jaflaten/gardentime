# Scraping Implementation Guide

**Last Updated:** 2025-11-02

## Overview

This guide shows you how to scrape plant data from Almanac.com, parse it with an LLM, and import it into the database.

**Current Progress:**
- ✅ 15 plants scraped and extracted
- 🔄 72 plants remaining
- See: `plant-data-aggregator/docs/plants-we-want-to-scrape-status.md` for full list

---

## Quick Start

### Prerequisites

1. **Start the application:**
```bash
cd /Users/Jorn-Are.Klubben.Flaten/dev/solo/gardentime
./gradlew :plant-data-aggregator:bootRun
```

2. **Verify it's running:**
```bash
curl http://localhost:8081/actuator/health | jq
# Should return: {"status":"UP"}
```

---

## Scraping Workflow

### Step 1: Choose Plants to Scrape

Check the status document to see what's pending:
```bash
cat plant-data-aggregator/plant-data-aggregator/docs/plants-we-want-to-scrape-status.md
```

**Recommended order:**
1. High Priority (8 remaining): potatoes, spinach, beets, zucchini, garlic, cilantro, mint, oregano
2. Medium Priority (20 plants): brussels-sprouts, cauliflower, sweet-potatoes, etc.
3. Low Priority (44 plants): fruits, specialty vegetables, perennials

---

### Step 2: Scrape a Plant

Use the slug from the status document:

```bash
# Single plant
curl -X POST http://localhost:8081/api/admin/scraping/plant/potatoes | jq

# Expected output:
# {
#   "slug": "potatoes",
#   "successful": true,
#   "message": "Successfully scraped potatoes",
#   "outputFiles": {
#     "rawHtml": "docs/scrapers/rawhtml/potatoes_20251102-203000.html",
#     "parsed": "docs/scrapers/parsed/potatoes_scraped_20251102-203000.json"
#   }
# }
```

**What happens:**
- Scrapes https://www.almanac.com/plant/potatoes
- Waits 3 seconds (polite scraping)
- Saves raw HTML to `docs/scrapers/rawhtml/`
- Saves structured JSON to `docs/scrapers/parsed/`
- Updates extraction report

---

### Step 3: View Scraped Data

```bash
# Find the latest parsed file
ls -lt plant-data-aggregator/plant-data-aggregator/docs/scrapers/parsed/ | head -5

# View the planting guide section
cat plant-data-aggregator/plant-data-aggregator/docs/scrapers/parsed/potatoes_scraped_*.json | jq '.plantingGuide'

# View care instructions
cat plant-data-aggregator/plant-data-aggregator/docs/scrapers/parsed/potatoes_scraped_*.json | jq '.careInstructions'
```

---

### Step 4: Parse with LLM

#### 4.1 Get the LLM Prompt

```bash
cat plant-data-aggregator/plant-data-aggregator/docs/llm-prompts/QUICK-PROMPT.txt
```

#### 4.2 Extract Text Sections

From the scraped JSON file, copy these sections:
- `plantingGuide`
- `careInstructions`
- `harvestInfo` (optional)

#### 4.3 Prepare the Prompt

1. Copy the entire QUICK-PROMPT.txt content
2. Replace `[PASTE YOUR plantingGuide TEXT HERE]` with the actual plantingGuide
3. Replace `[PASTE YOUR careInstructions TEXT HERE]` with the actual careInstructions

#### 4.4 Send to LLM

Paste into Claude, ChatGPT, or your preferred LLM.

**Expected output format:**
```json
{
  "commonName": "Potato",
  "cycle": "ANNUAL",
  "sunNeeds": "FULL_SUN",
  "waterNeeds": "MODERATE",
  "rootDepth": "MEDIUM",
  "growthHabit": "ROOT",
  "soilTempMinF": 45,
  "soilTempOptimalF": 60,
  "frostTolerant": false,
  "spacingMin": 12,
  "spacingMax": 15,
  "plantingDepthInches": 4,
  "containerSuitable": true,
  "requiresStaking": false,
  "requiresPruning": false,
  "edibleParts": ["root"],
  "daysToMaturityMin": 70,
  "daysToMaturityMax": 120,
  "wateringInchesPerWeek": 1.5,
  "fertilizingFrequencyWeeks": 4,
  "mulchRecommended": true,
  "notes": "Hill soil around plants as they grow. Avoid planting where tomatoes grew previously."
}
```

---

### Step 5: Save Extracted Data

Save the LLM output to the extracted-text directory:

```bash
# Manually create the file
nano plant-data-aggregator/plant-data-aggregator/docs/scrapers/extracted-text/potatoes.json

# Or use echo (paste the JSON):
cat > plant-data-aggregator/plant-data-aggregator/docs/scrapers/extracted-text/potatoes.json << 'EOF'
{
  "commonName": "Potato",
  "cycle": "ANNUAL",
  ...
}
EOF
```

**File naming convention:** `{slug}.json` (e.g., `potatoes.json`, `cilantro.json`)

---

### Step 6: Validate JSON

```bash
# Check if it's valid JSON
cat plant-data-aggregator/plant-data-aggregator/docs/scrapers/extracted-text/potatoes.json | jq '.'

# Should display the formatted JSON without errors
```

---

### Step 7: Update Status Document

Mark the plant as scraped:

```bash
# Edit the status file
nano plant-data-aggregator/plant-data-aggregator/docs/plants-we-want-to-scrape-status.md

# Change the line from:
# | 36 | Potatoes | potatoes | 🔄 PENDING | |

# To:
# | 36 | Potatoes | potatoes | ✅ SCRAPED | |
```

---

## Batch Scraping

### Scrape Multiple Plants at Once

**High Priority Batch (8 plants):**
```bash
# Create a batch script
cat > /tmp/scrape-high-priority.sh << 'EOF'
#!/bin/bash
for plant in potatoes spinach beets zucchini garlic cilantro mint oregano; do
  echo "Scraping $plant..."
  curl -X POST http://localhost:8081/api/admin/scraping/plant/$plant | jq '.successful'
  echo "Waiting 5 seconds..."
  sleep 5
done
EOF

chmod +x /tmp/scrape-high-priority.sh
/tmp/scrape-high-priority.sh
```

**Time estimate:** ~50 seconds (8 plants × 3 sec + overhead)

---

## Testing the Scraping & Parsing Flow

### Complete Test with One Plant

Let's test with spinach:

```bash
# 1. Scrape
curl -X POST http://localhost:8081/api/admin/scraping/plant/spinach | jq

# 2. View scraped data
ls -lt plant-data-aggregator/plant-data-aggregator/docs/scrapers/parsed/ | grep spinach

# 3. Extract text for LLM
LATEST_FILE=$(ls -t plant-data-aggregator/plant-data-aggregator/docs/scrapers/parsed/spinach_* | head -1)
cat "$LATEST_FILE" | jq '.plantingGuide' > /tmp/spinach-planting.txt
cat "$LATEST_FILE" | jq '.careInstructions' > /tmp/spinach-care.txt

echo "=== PLANTING GUIDE ==="
cat /tmp/spinach-planting.txt
echo ""
echo "=== CARE INSTRUCTIONS ==="
cat /tmp/spinach-care.txt

# 4. Now paste these into your LLM with the QUICK-PROMPT.txt template

# 5. After LLM parsing, save to extracted-text/spinach.json

# 6. Validate
cat plant-data-aggregator/plant-data-aggregator/docs/scrapers/extracted-text/spinach.json | jq '.'

# 7. Update status document to mark as ✅ SCRAPED
```

---

## Output Directory Structure

```
plant-data-aggregator/plant-data-aggregator/docs/scrapers/
├── rawhtml/                          # Raw HTML from Almanac.com
│   ├── tomatoes_20251030-220000.html
│   ├── potatoes_20251102-203000.html
│   └── ...
├── parsed/                           # Structured JSON extracted by scraper
│   ├── tomatoes_scraped_20251030-220000.json
│   ├── potatoes_scraped_20251102-203000.json
│   └── ...
├── extracted-text/                   # LLM-parsed plant attributes (FINAL)
│   ├── tomatoes.json                ✅ Ready for database import
│   ├── basil.json                   ✅ Ready for database import
│   ├── potatoes.json                🔄 Add this after LLM parsing
│   └── ...
└── reports/
    ├── extraction-report.md          # Ongoing scraping log
    └── summary_20251030-225834.md    # Summary reports
```

---

## Import to Database (Future Step)

Once you have extracted-text JSON files, you can import them:

```bash
# Single plant
curl -X POST http://localhost:8081/api/admin/import/plant-attributes \
  -H "Content-Type: application/json" \
  -d @plant-data-aggregator/plant-data-aggregator/docs/scrapers/extracted-text/potatoes.json

# Bulk import all extracted files
curl -X POST http://localhost:8081/api/admin/import/bulk-attributes \
  -H "Content-Type: application/json" \
  -d '{"directory": "plant-data-aggregator/plant-data-aggregator/docs/scrapers/extracted-text"}'
```

**Note:** Currently there's a transaction issue with the import service. Manual SQL import may be needed temporarily.

---

## Troubleshooting

### Scraping Errors

**403 Forbidden:**
```bash
# Increase delay between requests
# Edit application.yml:
scraper:
  request-delay-ms: 5000  # Increase from 3000
```

**Plant not found (404):**
- Verify the slug exists: https://www.almanac.com/plant/{slug}
- Check for alternate slugs (e.g., "bok-choy" vs "bok_choy")

**Empty sections:**
- Some plants may not have all sections
- This is normal - captured as `null` in JSON

### LLM Parsing Issues

**Invalid JSON output:**
```bash
# Validate and fix with jq
cat output.json | jq '.' > fixed.json
```

**Missing fields:**
- Re-run LLM with clarification
- Manually add required fields (commonName, cycle, sunNeeds, waterNeeds, rootDepth, growthHabit)

**Wrong enum values:**
- Check valid values in QUICK-PROMPT.txt
- Ensure exact match (e.g., "FULL_SUN" not "Full Sun")

---

## Configuration

Edit `application.yml` to adjust scraping:

```yaml
scraper:
  user-agent: "Mozilla/5.0 (compatible; GardenTime-PlantDataAggregator/1.0; +https://gardentime.app)"
  request-delay-ms: 3000  # 3 seconds between requests
  connection-timeout-ms: 30000
  max-retries: 3
  retry-delay-ms: 5000
  output-base-dir: "plant-data-aggregator/docs/scrapers"
```

---

## Progress Tracking

### Check Your Progress

```bash
# Count scraped plants
ls plant-data-aggregator/plant-data-aggregator/docs/scrapers/extracted-text/*.json | wc -l

# List scraped plants
ls plant-data-aggregator/plant-data-aggregator/docs/scrapers/extracted-text/ | sed 's/.json$//' | sort

# View status summary
cat plant-data-aggregator/plant-data-aggregator/docs/plants-we-want-to-scrape-status.md | grep "Summary" -A 3
```

### Update Status File

After each plant extraction, update the status document:
```bash
nano plant-data-aggregator/plant-data-aggregator/docs/plants-we-want-to-scrape-status.md

# Change 🔄 PENDING to ✅ SCRAPED for completed plants
```

---

## Next Batch Recommendations

### Immediate Next: High Priority (8 plants)

1. **potatoes** - Very common, easy to grow
2. **spinach** - Cool season green
3. **beets** - Root vegetable
4. **zucchini** - Summer squash
5. **garlic** - Essential allium
6. **cilantro** - Popular herb
7. **mint** - Aromatic herb
8. **oregano** - Perennial herb

### After High Priority: Medium Priority (20 plants)

Focus on common vegetables and popular berries first, then perennial herbs.

---

## Legal & Ethical Notes

1. **Robots.txt Compliance:** Verified `/plant/` paths are allowed
2. **Rate Limiting:** 3 second delays between requests
3. **User-Agent:** Identifies our scraper
4. **Caching:** Raw HTML saved to avoid re-scraping
5. **Fair Use:** Educational/research purposes

---

## Summary of Complete Workflow

```
1. START APPLICATION
   └─> ./gradlew :plant-data-aggregator:bootRun

2. SCRAPE PLANT
   └─> curl -X POST http://localhost:8081/api/admin/scraping/plant/{slug}

3. VIEW SCRAPED DATA
   └─> cat docs/scrapers/parsed/{plant}_scraped_*.json | jq '.plantingGuide'

4. PARSE WITH LLM
   ├─> Get prompt: cat docs/llm-prompts/QUICK-PROMPT.txt
   ├─> Copy plantingGuide and careInstructions sections
   ├─> Paste into Claude/GPT with prompt
   └─> Get structured JSON output

5. SAVE EXTRACTED DATA
   └─> Save LLM output to docs/scrapers/extracted-text/{plant}.json

6. VALIDATE
   └─> cat docs/scrapers/extracted-text/{plant}.json | jq '.'

7. UPDATE STATUS
   └─> Mark plant as ✅ SCRAPED in plants-we-want-to-scrape-status.md

8. REPEAT for next plant
```

---

## Questions?

- Check `/plant-data-aggregator/README-SCRAPING.md` for architecture details
- Check `/plant-data-aggregator/SCRAPING-IMPLEMENTATION.md` for code structure
- View example outputs in `docs/scrapers/extracted-text/tomatoes.json`
