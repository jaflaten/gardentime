# Scraping Implementation Guide

## Quick Start

### 1. Check Service Status

```bash
curl http://localhost:8081/api/admin/scraping/status | jq
```

### 2. View Available Plants

```bash
# All target plants
curl http://localhost:8081/api/admin/scraping/available-plants | jq

# Top priority only (priority 1)
curl "http://localhost:8081/api/admin/scraping/available-plants?priority=1" | jq
```

### 3. Scrape a Single Plant (Test)

```bash
curl -X POST http://localhost:8081/api/admin/scraping/plant/tomatoes | jq
```

This will:
- Scrape https://www.almanac.com/plant/tomatoes
- Extract companion planting info, planting guide, care instructions, etc.
- Save raw HTML to `docs/scrapers/rawhtml/tomatoes_*.html`
- Save structured JSON to `docs/scrapers/parsed/tomatoes_scraped_*.json`
- Append to extraction report

### 4. Scrape Top 15 Priority Plants

```bash
curl -X POST http://localhost:8081/api/admin/scraping/top-priority | jq
```

This scrapes:
- Tomatoes, Lettuce, Cucumbers, Peppers, Beans, Peas, Carrots, Onions
- Broccoli, Cabbage, Kale, Radishes
- Basil, Dill, Parsley

**Time estimate:** ~50-60 seconds (3 seconds between requests + processing)

### 5. Scrape Custom Plant List

```bash
curl -X POST http://localhost:8081/api/admin/scraping/plants \
  -H "Content-Type: application/json" \
  -d '{"slugs": ["basil", "mint", "rosemary"]}' | jq
```

## Output Files

After scraping, check these directories:

```bash
# Raw HTML files
ls -lh plant-data-aggregator/docs/scrapers/rawhtml/

# Structured JSON files
ls -lh plant-data-aggregator/docs/scrapers/parsed/

# Reports
cat plant-data-aggregator/docs/scrapers/reports/extraction-report.md
cat plant-data-aggregator/docs/scrapers/reports/summary_*.md
```

## File Structure

```
plant-data-aggregator/docs/scrapers/
├── rawhtml/
│   └── tomatoes_20241030-204530.html
├── parsed/
│   └── tomatoes_scraped_20241030-204530.json
└── reports/
    ├── extraction-report.md
    └── summary_20241030-204600.md
```

## JSON Output Format

Example `tomatoes_scraped_*.json`:

```json
{
  "slug": "tomatoes",
  "source": "Almanac.com",
  "url": "https://www.almanac.com/plant/tomatoes",
  "commonName": "Tomatoes",
  "description": "...",
  "companionSection": "Plant tomatoes with basil, carrots, and marigolds. Avoid planting with potatoes, fennel, and brassicas.",
  "plantingGuide": "### When to Plant\n...\n### How to Plant\n...",
  "careInstructions": "### Watering\n...\n### Fertilizing\n...",
  "harvestInfo": "### When to Harvest\n...",
  "pestsAndDiseases": "### Common Pests\n...",
  "rawHtml": "<html>...",
  "scrapedAt": "2024-10-30T20:45:30Z",
  "successful": true,
  "errorMessage": null
}
```

## Next Steps: Parse Scraped Data with LLM

### Step 1: Extract the Text

After scraping, you'll have files like:
- `docs/scrapers/parsed/tomatoes_scraped_*.json` (full scraped data)

Open the file and copy the `plantingGuide` and `careInstructions` sections.

### Step 2: Use LLM to Parse Attributes

1. Open the LLM prompt template:
   ```bash
   cat docs/llm-prompts/QUICK-PROMPT.txt
   ```

2. Copy the entire prompt

3. Replace `[PASTE YOUR plantingGuide TEXT HERE]` with your actual plantingGuide text

4. Replace `[PASTE YOUR careInstructions TEXT HERE]` with your actual careInstructions text

5. Paste into Claude or GPT-4

6. Get back structured JSON with plant attributes

### Step 3: Save Parsed Attributes

Save the LLM output to:
```
docs/scrapers/extracted-text/tomatoes.json
```

Example output:
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
  "edibleParts": ["fruit"],
  "requiresStaking": true,
  "containerSuitable": true,
  "notes": "Heat-loving plant..."
}
```

### Step 4: Import to Database

Use the import service:
```bash
curl -X POST http://localhost:8081/api/admin/import/plant-attributes \
  -H "Content-Type: application/json" \
  -d @docs/scrapers/extracted-text/tomatoes.json
```

Or import all parsed files:
```bash
curl -X POST http://localhost:8081/api/admin/import/bulk-attributes \
  -H "Content-Type: application/json" \
  -d '{"directory": "docs/scrapers/extracted-text"}'
```

### Quick Test Workflow

```bash
# 1. Scrape a plant
curl -X POST http://localhost:8081/api/admin/scraping/plant/tomatoes

# 2. View the scraped data
cat docs/scrapers/parsed/tomatoes_scraped_*.json | jq '.plantingGuide'

# 3. Copy text and use LLM prompt from docs/llm-prompts/QUICK-PROMPT.txt

# 4. Save LLM output to docs/scrapers/extracted-text/tomatoes.json

# 5. Import to database
curl -X POST http://localhost:8081/api/admin/import/plant-attributes \
  -H "Content-Type: application/json" \
  -d @docs/scrapers/extracted-text/tomatoes.json
```

## Configuration

Edit `application.yml` to adjust scraping behavior:

```yaml
scraper:
  request-delay-ms: 3000  # Time between requests (be polite!)
  connection-timeout-ms: 30000
  max-retries: 3
  retry-delay-ms: 5000
```

## Rate Limiting

The scraper respects rate limits:
- 3 seconds between requests to the same domain (configurable)
- Exponential backoff on failures
- Maximum 3 retry attempts

## Troubleshooting

### "403 Forbidden" or "503 Service Unavailable"

The site may be blocking automated requests. This is handled by:
- Using a realistic User-Agent header
- Rate limiting between requests
- Retry logic with backoff

If problems persist, increase `request-delay-ms` in configuration.

### Empty or Missing Sections

Some plants may not have all sections (companion planting, pests, etc.). This is normal and captured in the JSON as `null` values.

### Scraping Takes Too Long

Adjust the plant list. Instead of scraping all 15 top priority plants, scrape a subset:

```bash
curl -X POST http://localhost:8081/api/admin/scraping/plants \
  -H "Content-Type: application/json" \
  -d '{"slugs": ["tomatoes", "basil", "peppers"]}' | jq
```

## Legal & Ethical Notes

1. **Robots.txt Compliance:** We check that `/plant/` paths are allowed
2. **Rate Limiting:** 3 second delays between requests
3. **User-Agent:** Identifies our scraper with contact info
4. **Caching:** Raw HTML is saved to avoid re-scraping
5. **Fair Use:** Educational/research purposes for companion planting data

## Implementation Status

✅ Phase 1: Project Setup - COMPLETE
- JSoup dependency added
- Directory structure created
- Configuration in place

✅ Phase 2: Core Scraper Infrastructure - COMPLETE
- BaseScraper abstract class
- RateLimiter
- FileOutputService
- ScraperConfig

✅ Phase 3: Almanac.com Scraper - COMPLETE
- AlmanacScraper with DOM extraction
- Companion planting section extraction
- Planting guide extraction
- Care instructions extraction
- Harvest info extraction
- Pest/disease extraction

✅ Orchestration - COMPLETE
- ScrapingOrchestrator
- PlantSlugRegistry (15 top priority + 30 total)
- REST API endpoints

🔄 Next: Manual LLM Parsing (Phase 6)
- Scrape data
- Parse companion sections with LLM
- Import into database
