# Practical Example: Parsing Tomato Data

## Your Actual Scraped Data

From `tomatoes_scraped_20251030-222405.json`:
- ✅ Common name: "Tomatoes"
- ✅ Planting guide: Detailed instructions
- ✅ Care instructions: Watering, fertilizing, pruning
- ❌ Companion section: NULL (not on this page)

## What We CAN Extract

### Step 1: Use This LLM Prompt

Copy this prompt and paste into Claude/GPT with your data:

```
Extract plant growing attributes from this gardening guide into JSON format:

{
  "commonName": "string",
  "cycle": "ANNUAL|PERENNIAL|BIENNIAL",
  "sunNeeds": "FULL_SUN|PART_SHADE|SHADE",
  "waterNeeds": "LOW|MODERATE|HIGH|FREQUENT",
  "rootDepth": "SHALLOW|MEDIUM|DEEP",
  "growthHabit": "BUSH|VINE|CLIMBER|FRUITING",
  "daysToMaturityMin": null,
  "daysToMaturityMax": null,
  "spacingInches": "string",
  "soilTempMinF": number,
  "soilTempOptimalF": number,
  "frostTolerant": boolean,
  "edibleParts": ["array"],
  "plantingDepthInches": number,
  "fertilizationSchedule": "string summary",
  "wateringSchedule": "string summary",
  "requiresStaking": boolean,
  "containerFriendly": boolean,
  "notes": "brief summary"
}

Guidelines:
- sunNeeds: "8-10 hours direct sunlight" = FULL_SUN; "afternoon shade" mentioned for southern regions = note this
- waterNeeds: "2 inches per week" = FREQUENT
- cycle: Look for annual/perennial/biennial
- frostTolerant: "won't tolerate frost" = false
- Extract ALL numeric values mentioned

Source text:
---
PLANTING GUIDE:
Select a site with full sun! In northern regions, 8 to 10 hours of direct sunlight are preferred. In southern regions, light afternoon shade (natural or applied, e.g., row covers) will help tomatoes to survive and thrive. Dig the soil to about 1 foot deep and mix in aged manure and/or compost. Give it two weeks to break down before planting. Also, choose a space where tomatoes (and members of their family, especially eggplants, peppers, and potatoes) have not grown in the previous couple of years. See tips on crop rotation. When to Plant Tomatoes Tomatoes are long-season, heat-loving plants that won't tolerate frost, so wait until the weather has warmed up in the spring. See our Planting Calendar for when to start tomatoes in your location. If you are starting tomatoes from seed, sow indoors 6 weeks before the last expected spring frost date in your area. Sow seeds 1/2-inch deep in small trays. Plant seedlings outdoors about 2 weeks after that date or when temperatures stay in the mid-50 degree range both day and night. See our full guide to starting tomato seeds indoors. If you have a long enough growing season, it is also possible to direct-seed tomatoes in the garden soil (1/2-inch deep)—but not before the soil is at least 55°F. Note that 70°F soil is optimum for maximum germination within 5 days. Place tomato stakes or cages in the soil when planting. Staking and caging keep developing fruit off the ground (to avoid disease and pests) and also help the plant to stay upright. Plant seedlings 2 to 3 feet apart. Crowded plants will not get sufficient sun, and the fruit may not ripen.

CARE INSTRUCTIONS:
Water in the early morning so that plants have sufficient moisture to make it through a hot day. Water generously the first few days that the tomato seedlings or transplants are in the ground. Then, water with about 2 inches (about 1.2 gallons) per square foot per week during the growing season. Deep watering encourages a strong root system. Mulch the plants 5 weeks after transplanting to retain moisture. Apply 2 to 4 inches of organic mulch. Side-dress plants, applying liquid seaweed or fish emulsion or an organic fertilizer every 2 weeks, starting when tomatoes are about 1 inch in diameter. Continue fertilizing tomatoes about every 3 to 4 weeks until frost. Avoid fast-release fertilizers and avoid high-nitrogen fertilizers. If growing vining tomatoes, pinch off suckers. Gently tie the stems to stakes. As a plant grows, trim the lower leaves from the bottom 12 inches of the stem.

CONTAINER GROWING:
Use a large pot or container (at least 20 inches in diameter) with drainage holes in the bottom. Choose determinate types, such as bush or dwarf varieties. Many cherry tomatoes grow well in pots. Plant one tomato plant per pot and give each at least 6 hours of sun per day. Keep soil moist. Containers will dry out more quickly than garden soil, so check daily and provide extra water during heat waves.
---

Output ONLY valid JSON, no explanation.
```

### Step 2: Expected LLM Output

```json
{
  "commonName": "Tomato",
  "cycle": "ANNUAL",
  "sunNeeds": "FULL_SUN",
  "waterNeeds": "FREQUENT",
  "rootDepth": "DEEP",
  "growthHabit": "FRUITING",
  "daysToMaturityMin": null,
  "daysToMaturityMax": null,
  "spacingInches": "24-36",
  "soilTempMinF": 55,
  "soilTempOptimalF": 70,
  "frostTolerant": false,
  "edibleParts": ["fruit"],
  "plantingDepthInches": 0.5,
  "fertilizationSchedule": "Every 2 weeks initially, then every 3-4 weeks until frost with organic fertilizer",
  "wateringSchedule": "2 inches (1.2 gallons) per square foot per week",
  "requiresStaking": true,
  "containerFriendly": true,
  "notes": "Long-season heat-loving plant. Requires full sun (8-10 hours). Won't tolerate frost. Deep roots benefit from deep watering. Vining varieties need staking and sucker removal."
}
```

### Step 3: Transform to Database Inserts

```sql
-- Insert into plants table (combine with Trefle API data)
INSERT INTO plants (
  id, 
  canonical_scientific_name, 
  common_name, 
  family, 
  genus
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000', 
  'Solanum lycopersicum',  -- from Trefle API
  'Tomato',                -- from scraped data
  'Solanaceae',            -- from Trefle API
  'Solanum'                -- from Trefle API
);

-- Insert into plant_attributes
INSERT INTO plant_attributes (
  plant_id,
  root_depth,
  cycle,
  growth_habit,
  sun_needs,
  water_needs,
  drought_tolerant,
  invasive,
  poisonous_to_pets,
  is_nitrogen_fixer
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'DEEP',
  'ANNUAL',
  'FRUITING',
  'FULL_SUN',
  'FREQUENT',
  false,
  false,
  false,
  false
);

-- Insert edible parts
INSERT INTO plant_attribute_edible_parts (plant_id, edible_part)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'fruit');
```

## What About Companion Planting?

The Almanac.com tomato page **does not have companion planting info**. You need to:

### Option 1: Find Companion Planting Pages

Try scraping these instead:
- `https://www.almanac.com/companion-planting-guide` (if exists)
- `https://www.growveg.com/plants/` (has companion planting tool)
- `https://www.johnnyseeds.com/` (has companion charts)

### Option 2: Manual Entry for Top Priority Plants

For your 15 priority plants, you could manually create a companion planting table based on trusted sources:

```json
{
  "Tomato": {
    "beneficial": ["Basil", "Carrot", "Marigold", "Nasturtium", "Parsley"],
    "antagonistic": ["Potato", "Fennel", "Cabbage", "Broccoli"]
  },
  "Basil": {
    "beneficial": ["Tomato", "Pepper"],
    "antagonistic": ["Rue"]
  }
}
```

This would only take 30-60 minutes to research and enter for 15 plants.

### Option 3: Build a Dedicated Companion Planting Scraper

Create a scraper for GrowVeg.com or another site that has structured companion planting data.

## Summary: What to Do Next

1. **Test the revised LLM prompt** - Parse your tomato data with the prompt above to get plant attributes

2. **Verify the output** - Check that the JSON matches what you need for your database

3. **Decide on companion data source**:
   - Option A: Find and scrape a companion planting page
   - Option B: Manually enter for 15 plants from a book/chart
   - Option C: Skip for MVP and add later

4. **Write import script** - Once you have parsed data, create a service to import the JSON into your database tables

5. **Repeat for other plants** - Parse the rest of your 15 priority plants

Does this clearer workflow make sense?
