# IMPORTANT: Revised Parsing Strategy

## What Went Wrong

The original LLM parsing format I provided was **too narrow** - it only focused on extracting companion planting relationships, when you actually need to populate multiple database tables with various plant attributes (hardiness zones, watering needs, sun requirements, etc.).

Additionally, the Almanac.com pages **don't have companion planting information** on the main plant pages - that data is missing from your scrape.

## What You Actually Need

Looking at your database schema (`V1__baseline.sql`), you need to populate:

### 1. `plants` table
- Scientific name, common name, family, genus
- **Source**: Trefle/Perenual APIs (you already have this infrastructure)

### 2. `plant_attributes` table
- Cycle (annual/perennial/biennial)
- Sun needs, water needs, root depth
- Days to maturity, hardiness info
- **Source**: Parse from scraped Almanac.com data (what you have)

### 3. `plant_attribute_edible_parts` table
- Which parts are edible (fruit, leaf, root, etc.)
- **Source**: Parse from scraped data

### 4. `companion_relationships` table
- Beneficial and antagonistic plant pairings
- **Source**: NOT in Almanac.com scrape - need different source

## Revised Workflow

### Step 1: Extract Growing Attributes (What You Can Do Now)

Use the revised LLM prompt in `docs/llm-prompts/PRACTICAL-EXAMPLE-TOMATO.md` to extract:
- Plant cycle, sun needs, water needs
- Spacing, soil temperature, frost tolerance
- Staking requirements, container suitability
- Watering and fertilization schedules

This will populate `plant_attributes` table.

### Step 2: Get Scientific Data from APIs

Use your existing Trefle/Perenual integration to get:
- Canonical scientific name
- Family, genus
- Hardiness zones
- Additional botanical info

This will populate `plants` table.

### Step 3: Find Companion Planting Data

Since Almanac.com doesn't have this, you have options:

**Option A: Scrape a different site**
- GrowVeg.com has companion planting tools
- Johnny's Seeds has companion charts
- Create a new scraper for these sites

**Option B: Manual entry (fastest for MVP)**
- For your 15 priority plants, manually create companion relationships
- Use a trusted book or chart
- Would take 30-60 minutes total

**Option C: Skip for now**
- Focus on getting plant attributes working
- Add companion planting in Phase 2

### Step 4: Combine Everything in Database

Merge data from all sources:
```
Plant "Tomato":
  - Scientific name: Solanum lycopersicum (from Trefle)
  - Family: Solanaceae (from Trefle)
  - Cycle: ANNUAL (from Almanac scrape)
  - Sun needs: FULL_SUN (from Almanac scrape)
  - Water needs: FREQUENT (from Almanac scrape)
  - Companions: Basil, Carrot (from ??? - need source)
```

## Files to Read

1. **REVISED-PARSING-STRATEGY.md** - Explains the new approach in detail
2. **PRACTICAL-EXAMPLE-TOMATO.md** - Shows exactly how to parse your tomato data
3. Original `parse-companion-data.md` - IGNORE THIS, it's obsolete

## Immediate Next Steps

1. **Test parsing your tomato data**
   - Use the prompt in PRACTICAL-EXAMPLE-TOMATO.md
   - Paste your tomato plantingGuide + careInstructions
   - Get back JSON with plant attributes

2. **Validate the output**
   - Check if the JSON has the fields you need
   - Verify values make sense

3. **Decide on companion planting source**
   - Research where to get this data
   - Or skip for MVP

4. **Create import service**
   - Write Kotlin code to import parsed JSON into database
   - Combine with Trefle API data

## Why This Happened

I initially misunderstood what data you were trying to extract and what your database schema needed. The original approach was:
- ❌ Only focused on companion planting
- ❌ Assumed Almanac.com had companion data (it doesn't)
- ❌ Ignored all the other valuable attributes you can extract

The revised approach is:
- ✅ Extracts plant growing attributes (cycle, sun, water, etc.)
- ✅ Recognizes Almanac.com doesn't have companion data
- ✅ Aligns with your database schema
- ✅ Uses APIs for scientific data, scraping for growing instructions
- ✅ Acknowledges you need multiple data sources

## Questions to Answer

1. **Do you want companion planting in MVP?**
   - If yes, we need to find a data source
   - If no, we can focus on plant attributes first

2. **Are you okay using Trefle/Perenual APIs for scientific names?**
   - This seems like the right approach
   - They have hardiness zone data too

3. **Should we write an import service?**
   - To take parsed JSON and populate database
   - Or do you want to do this manually?

Let me know what direction you want to go!
