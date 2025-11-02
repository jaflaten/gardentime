# Quick Scraping Commands - Cheat Sheet

**Last Updated:** 2025-11-02

## Setup

```bash
# Start the application (run in gardentime root)
./gradlew :plant-data-aggregator:bootRun

# Verify it's running
curl http://localhost:8081/actuator/health | jq
```

---

## Scrape Single Plant

```bash
# Replace {slug} with plant slug from status document
curl -X POST http://localhost:8081/api/admin/scraping/plant/{slug} | jq

# Examples:
curl -X POST http://localhost:8081/api/admin/scraping/plant/potatoes | jq
curl -X POST http://localhost:8081/api/admin/scraping/plant/spinach | jq
curl -X POST http://localhost:8081/api/admin/scraping/plant/cilantro | jq
```

---

## High Priority Batch (Next 8 plants to scrape)

```bash
#!/bin/bash
# Copy and paste this entire block

for plant in potatoes spinach beets zucchini garlic cilantro mint oregano; do
  echo "=== Scraping $plant ==="
  curl -X POST http://localhost:8081/api/admin/scraping/plant/$plant | jq '.successful'
  sleep 5
done

echo "=== Done! Check docs/scrapers/parsed/ for results ==="
```

---

## View Scraped Data

```bash
# List all parsed files
ls -lt plant-data-aggregator/plant-data-aggregator/docs/scrapers/parsed/

# View planting guide for latest plant
LATEST=$(ls -t plant-data-aggregator/plant-data-aggregator/docs/scrapers/parsed/*.json | head -1)
cat "$LATEST" | jq '.plantingGuide'

# View care instructions
cat "$LATEST" | jq '.careInstructions'

# View everything
cat "$LATEST" | jq '.'
```

---

## Extract Text for LLM

```bash
# For a specific plant (e.g., potatoes)
PLANT="potatoes"
FILE=$(ls -t plant-data-aggregator/plant-data-aggregator/docs/scrapers/parsed/${PLANT}_* | head -1)

echo "=== PLANTING GUIDE ==="
cat "$FILE" | jq -r '.plantingGuide'
echo ""
echo "=== CARE INSTRUCTIONS ==="
cat "$FILE" | jq -r '.careInstructions'

# Now copy these sections and paste into your LLM with QUICK-PROMPT.txt
```

---

## LLM Prompt Location

```bash
# View the prompt template
cat plant-data-aggregator/plant-data-aggregator/docs/llm-prompts/QUICK-PROMPT.txt

# Or open in editor
nano plant-data-aggregator/plant-data-aggregator/docs/llm-prompts/QUICK-PROMPT.txt
```

---

## Save LLM Output

```bash
# After getting JSON from LLM, save to extracted-text/
# Replace {plant} with the plant name (e.g., potatoes)

nano plant-data-aggregator/plant-data-aggregator/docs/scrapers/extracted-text/{plant}.json

# Or use cat (paste JSON after hitting enter)
cat > plant-data-aggregator/plant-data-aggregator/docs/scrapers/extracted-text/potatoes.json << 'EOF'
{
  "commonName": "Potato",
  "cycle": "ANNUAL",
  ...paste your JSON here...
}
EOF
```

---

## Validate Extracted JSON

```bash
# Check if valid JSON
cat plant-data-aggregator/plant-data-aggregator/docs/scrapers/extracted-text/potatoes.json | jq '.'

# Should display formatted JSON without errors
```

---

## Check Progress

```bash
# Count completed plants
ls plant-data-aggregator/plant-data-aggregator/docs/scrapers/extracted-text/*.json | wc -l

# List completed plants
ls plant-data-aggregator/plant-data-aggregator/docs/scrapers/extracted-text/ | sed 's/.json$//' | sort

# View status document
cat plant-data-aggregator/plant-data-aggregator/docs/plants-we-want-to-scrape-status.md | less
```

---

## Complete Workflow (One Plant)

```bash
# 1. Scrape
curl -X POST http://localhost:8081/api/admin/scraping/plant/spinach | jq

# 2. View scraped data
LATEST=$(ls -t plant-data-aggregator/plant-data-aggregator/docs/scrapers/parsed/spinach_* | head -1)
cat "$LATEST" | jq -r '.plantingGuide' > /tmp/planting.txt
cat "$LATEST" | jq -r '.careInstructions' > /tmp/care.txt

# 3. View extracted text
cat /tmp/planting.txt
cat /tmp/care.txt

# 4. Copy text, use LLM with QUICK-PROMPT.txt, get JSON

# 5. Save LLM output
nano plant-data-aggregator/plant-data-aggregator/docs/scrapers/extracted-text/spinach.json

# 6. Validate
cat plant-data-aggregator/plant-data-aggregator/docs/scrapers/extracted-text/spinach.json | jq '.'

# 7. Update status to ✅ SCRAPED
nano plant-data-aggregator/plant-data-aggregator/docs/plants-we-want-to-scrape-status.md
```

---

## Medium Priority Batch (After high priority)

```bash
#!/bin/bash
# Brussels sprouts through pumpkins

for plant in brussels-sprouts cauliflower swiss-chard eggplant leeks scallions arugula bok-choy sweet-potatoes pumpkins; do
  echo "=== Scraping $plant ==="
  curl -X POST http://localhost:8081/api/admin/scraping/plant/$plant | jq '.successful'
  sleep 5
done
```

---

## Troubleshooting

```bash
# Check if app is running
curl http://localhost:8081/actuator/health

# View last scraping errors
tail -100 /tmp/bootrun*.log | grep ERROR

# Test single plant with verbose output
curl -v -X POST http://localhost:8081/api/admin/scraping/plant/test-plant

# Check scraper configuration
cat plant-data-aggregator/src/main/resources/application.yml | grep -A 6 "scraper:"
```

---

## File Locations Quick Reference

```
plant-data-aggregator/plant-data-aggregator/docs/
├── plants-we-want-to-scrape-status.md    ← Status tracking (87 plants)
├── llm-prompts/
│   └── QUICK-PROMPT.txt                   ← LLM parsing prompt
└── scrapers/
    ├── rawhtml/                           ← Raw HTML from Almanac.com
    ├── parsed/                            ← Scraped & structured JSON
    ├── extracted-text/                    ← ⭐ LLM-parsed attributes (FINAL)
    └── reports/                           ← Scraping logs
```

---

## Next Plants to Scrape (Priority Order)

### Batch 1: High Priority Vegetables (5)
```bash
potatoes spinach beets zucchini garlic
```

### Batch 2: High Priority Herbs (3)
```bash
cilantro mint oregano
```

### Batch 3: Medium Priority Vegetables (10)
```bash
brussels-sprouts cauliflower swiss-chard eggplant leeks scallions arugula bok-choy sweet-potatoes pumpkins
```

### Batch 4: Medium Priority Berries & Herbs (7)
```bash
strawberries raspberries blueberries rosemary sage thyme chives
```

---

## Import to Database (Future)

```bash
# Single plant
curl -X POST http://localhost:8081/api/admin/import/plant-attributes \
  -H "Content-Type: application/json" \
  -d @plant-data-aggregator/plant-data-aggregator/docs/scrapers/extracted-text/potatoes.json

# Bulk import
curl -X POST http://localhost:8081/api/admin/import/bulk-attributes \
  -H "Content-Type: application/json" \
  -d '{"directory": "plant-data-aggregator/plant-data-aggregator/docs/scrapers/extracted-text"}'
```

**Note:** Import service currently has transaction issues - may need manual SQL import.

---

## Tips

- ⏱️ **Wait 3-5 seconds between scrapes** (polite scraping)
- 📋 **Update status doc** after each plant extraction
- ✅ **Validate JSON** before saving to extracted-text/
- 🔍 **Check scraped data** before sending to LLM
- 💾 **Save raw output** from LLM before editing

---

## Slug Quick Reference

Common vegetables:
- `potatoes`, `spinach`, `beets`, `zucchini`, `garlic`
- `cauliflower`, `eggplant`, `swiss-chard`, `sweet-potatoes`
- `brussels-sprouts`, `bok-choy`, `mustard-greens`

Herbs:
- `cilantro`, `mint`, `oregano`, `rosemary`, `sage`, `thyme`
- `chives`, `marjoram`, `tarragon`, `lavender`, `ginger`

Berries:
- `strawberries`, `raspberries`, `blueberries`, `blackberries`
- `currants`, `gooseberries`, `elderberries`, `goji-berries`

Check full list: `docs/plants-we-want-to-scrape-status.md`
