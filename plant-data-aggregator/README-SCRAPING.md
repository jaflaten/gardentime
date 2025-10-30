# Web Scraping - Quick Reference

## Implementation Status: ✅ COMPLETE

Phases 1-3 of the scraping plan are complete. Ready to collect companion planting data from Almanac.com.

## Quick Start (3 Steps)

### 1. Start the Application
```bash
./gradlew :plant-data-aggregator:bootRun
```

### 2. Test Single Plant
```bash
cd plant-data-aggregator
./test-scraping.sh single
```

### 3. View Results
```bash
cat docs/scrapers/parsed/tomatoes_scraped_*.json | jq '.companionSection'
```

## Common Commands

### Scrape Top 15 Priority Plants (~60 seconds)
```bash
curl -X POST http://localhost:8081/api/admin/scraping/top-priority | jq
```

### Scrape Custom List
```bash
curl -X POST http://localhost:8081/api/admin/scraping/plants \
  -H "Content-Type: application/json" \
  -d '{"slugs": ["basil", "mint", "rosemary"]}' | jq
```

### Check Status
```bash
curl http://localhost:8081/api/admin/scraping/status | jq
```

## Output Files

```
docs/scrapers/
├── rawhtml/           # Raw HTML from each page
├── parsed/            # Structured JSON data
└── reports/           # Scraping summaries
```

## Top Priority Plants (15)

**Tier 1 Vegetables:** Tomatoes, Lettuce, Cucumbers, Peppers, Beans, Peas, Carrots, Onions

**Tier 2 Vegetables:** Broccoli, Cabbage, Kale, Radishes

**Herbs:** Basil, Dill, Parsley

## Next Steps

1. **Scrape data** using the commands above
2. **Parse companion data** with LLM (see `docs/llm-prompts/parse-companion-data.md`)
3. **Import to database** (future implementation)

## Documentation

- **SCRAPING-GUIDE.md** - Detailed usage guide
- **SCRAPING-IMPLEMENTATION.md** - Technical implementation details
- **docs/llm-prompts/parse-companion-data.md** - LLM parsing instructions

## Features

✅ Rate limiting (3 second delays)  
✅ Retry logic with exponential backoff  
✅ Saves raw HTML and structured JSON  
✅ Generates summary reports  
✅ Extracts companion planting sections  
✅ REST API for automation  
✅ 15 top priority plants configured  
✅ Robots.txt compliant  

## Troubleshooting

**Service not running?**
```bash
./gradlew :plant-data-aggregator:bootRun
```

**No output files?**
The directories are created on first scrape. Run `./test-scraping.sh single` first.

**Want to scrape more plants?**
Edit `PlantSlugRegistry.kt` or use the custom endpoint with any slug.

## Build Status

```
BUILD SUCCESSFUL ✅
All code compiles and tests pass
```

Happy scraping! 🌱
