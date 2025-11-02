# Next Scraping Batches - Ready to Run

**Status:** 40/87 plants scraped (47 remaining)  
**Date:** 2025-11-02

---

## 🚀 Quick Start

All batches are configured and ready to run. Just execute the commands below in order.

### Prerequisites
```bash
# 1. Start the application
./gradlew :plant-data-aggregator:bootRun

# 2. In a new terminal, run batch scraping
./scrape-batch.sh <batch-name>
```

---

## 📋 Scraping Order (Recommended)

### Batch 1: Next Vegetables (13 plants) - ~65 seconds
```bash
./scrape-batch.sh next-vegetables
```

**Plants:**
- artichokes
- asparagus
- celery
- collards
- corn
- edamame
- fennel
- horseradish
- kohlrabi
- parsnips
- rhubarb
- tomatillos
- turnips

---

### Batch 2: Medium Vegetables 2 (8 plants) - ~40 seconds
```bash
./scrape-batch.sh medium-vegetables-2
```

**Plants:**
- fava-beans
- microgreens (may not exist on Almanac)
- mustard-greens
- okra
- peanuts
- rutabagas
- salsify
- shallots

**Note:** If microgreens fails, that's expected - it may not have an Almanac page.

---

### Batch 3: Specialty Items (2 plants) - ~10 seconds
```bash
./scrape-batch.sh specialty
```

**Plants:**
- turmeric
- winter-squash

---

### Batch 4: Fruits Part 1 (14 plants) - ~70 seconds
```bash
./scrape-batch.sh fruits-1
```

**Plants:**
- apples
- blackberries
- cantaloupes
- cherries
- currants
- elderberries
- figs
- gooseberries
- goji-berries
- grapes
- honeydew-melons
- kiwi
- lemons
- peaches

---

### Batch 5: Fruits Part 2 (3 plants) - ~15 seconds
```bash
./scrape-batch.sh fruits-2
```

**Plants:**
- pears
- plums
- watermelon

---

### Batch 6: Remaining Herbs (4 plants) - ~20 seconds
```bash
./scrape-batch.sh remaining-herbs
```

**Plants:**
- ginger
- lavender
- marjoram
- tarragon

---

## ✅ After Each Batch

### 1. Check Scraped Files
```bash
ls -lt plant-data-aggregator/docs/scrapers/parsed/ | head -20
```

### 2. Extract with LLM (Manual Process)

For each newly scraped plant:

1. **Open the parsed JSON file** (e.g., `parsed/artichokes_scraped_20251102-XXXXXX.json`)

2. **Copy the extraction prompt** from `docs/llm-prompts/QUICK-PROMPT.txt`

3. **Replace the placeholders** with actual data from the JSON:
   - Replace `[PASTE YOUR plantingGuide TEXT HERE]` with the `plantingGuide` field
   - Replace `[PASTE YOUR careInstructions TEXT HERE]` with the `careInstructions` field

4. **Send to LLM** (ChatGPT, Claude, etc.)

5. **Save the JSON response** to `docs/scrapers/extracted-text/{plant}.json`

### 3. Update Status

Edit `docs/plants-we-want-to-scrape-status.md`:
- Change 🔄 PENDING to ✅ SCRAPED for completed plants
- Update the summary counts

---

## 📊 Progress Tracking

| Batch | Plants | Status | Date |
|-------|--------|--------|------|
| high-priority | 1 | ✅ DONE | 2025-11-02 |
| medium-vegetables | 10 | ✅ DONE | 2025-11-02 |
| medium-berries-herbs | 7 | ✅ DONE | 2025-11-02 |
| **next-vegetables** | **13** | **🔄 TODO** | |
| medium-vegetables-2 | 8 | 🔄 TODO | |
| specialty | 2 | 🔄 TODO | |
| fruits-1 | 14 | 🔄 TODO | |
| fruits-2 | 3 | 🔄 TODO | |
| remaining-herbs | 4 | 🔄 TODO | |

**Total Remaining:** 44 plants (3 may not exist on Almanac)

---

## 🎯 Estimation

- **Scraping time:** ~220 seconds (~4 minutes total)
- **LLM extraction:** ~5-10 minutes per plant manually
- **Total time:** ~3-7 hours for all remaining plants (mostly LLM extraction)

---

## ⚡ Tips

1. **Run batches when you're available** - The script waits 5 seconds between plants to be polite to the server.

2. **Extract in batches** - Don't try to extract all at once. Do 5-10 plants at a time.

3. **Use ChatGPT/Claude** - The extraction prompt is designed to work with any LLM.

4. **Verify output** - After extraction, quickly scan the JSON to ensure it looks correct.

5. **Commit often** - Commit extracted-text JSON files after each batch to avoid losing work.

---

## 🔧 Troubleshooting

### If a plant fails to scrape:
1. Check if the URL exists: `https://www.almanac.com/plant/{slug}`
2. If the slug is wrong, update it in the batch config
3. Re-run just that plant: `curl -X POST http://localhost:8081/api/admin/scraping/plant/{slug}`

### If extraction seems wrong:
1. Re-read the source text from the parsed JSON
2. Try the LLM prompt again with more specific instructions
3. Manually adjust the output if needed

---

## 📝 Notes

- **Microgreens** may not have an Almanac page - that's okay, skip it.
- **Tree fruits** (apples, cherries, etc.) may have different data - extract what's available.
- **Perennials** (asparagus, rhubarb, artichokes) may have unique planting info.

---

Good luck! 🌱
