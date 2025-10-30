# Comprehensive Plant Data Parsing Guide

## The Problem with the Original Format

The original LLM parsing format was **too narrow** - it only focused on companion relationships and missed all the other valuable data we can extract from the scraped content.

Looking at your database schema, you need to populate **multiple tables**:
1. `plants` - Basic plant info
2. `plant_attributes` - Growing characteristics, hardiness, care needs
3. `plant_attribute_edible_parts` - What parts are edible
4. `companion_relationships` - Beneficial/antagonistic plants
5. `sources` - Where the data came from

## What Data You Actually Have

From the tomato scrape, we have:
- ✅ **Common name**: "Tomatoes"
- ✅ **Planting guide**: When to plant, frost dates, soil temp requirements
- ✅ **Care instructions**: Watering, fertilizing, pruning details
- ✅ **Harvest info**: When and how to harvest
- ✅ **Pest/disease info**: Common problems and solutions
- ❌ **Companion planting**: Not in this page (need different source or page)

## Revised LLM Parsing Strategy

Instead of one narrow JSON format, we need **multiple parsing passes** to extract different types of data:

### Pass 1: Plant Attributes (from any section)

Extract data to populate `plant_attributes` table:

```
Parse the following plant growing guide and extract attributes in this JSON format:

{
  "commonName": "Tomato",
  "cycle": "ANNUAL|PERENNIAL|BIENNIAL",
  "sunNeeds": "FULL_SUN|PART_SHADE|SHADE",
  "waterNeeds": "LOW|MODERATE|HIGH|FREQUENT",
  "rootDepth": "SHALLOW|MEDIUM|DEEP",
  "growthHabit": "BUSH|VINE|CLIMBER|ROOT|LEAF|FRUITING",
  "daysToMaturityMin": 60,
  "daysToMaturityMax": 85,
  "soilTempMinF": 55,
  "soilTempOptimalF": 70,
  "frostTolerant": false,
  "edibleParts": ["fruit"],
  "spacingInches": "24-36",
  "notes": "Long-season heat-loving plant"
}

Rules:
- If not mentioned, use null
- For sun needs: "8-10 hours direct sunlight" = FULL_SUN
- For water needs: "2 inches per week", "water frequently" = FREQUENT
- Extract numeric ranges when available
- Growth habit: Tomatoes are FRUITING (they produce edible fruit)

Text:
[paste plantingGuide + careInstructions here]
```

### Pass 2: Companion Relationships (separate source needed)

Since Almanac.com doesn't have companion info on the main plant page, we need to:

**Option A: Search for companion planting pages**
- URL pattern: `https://www.almanac.com/companion-planting-guide`
- Or search: "tomato companion planting almanac"

**Option B: Use different sources**
- GrowVeg.com has better companion planting info
- Johnny's Seeds
- University extension sites

When you DO find companion data:
```
{
  "plant": "Tomato",
  "companions": {
    "beneficial": [
      {
        "plant": "Basil",
        "relationshipSubtype": "PEST_DETERRENT|NUTRIENT_SUPPORT|SHADE|STRUCTURAL|OTHER",
        "reason": "Repels aphids and improves flavor",
        "confidence": "HIGH|MEDIUM|LOW",
        "evidenceType": "SCIENTIFIC|TRADITIONAL|ANECDOTAL"
      }
    ],
    "antagonistic": [
      {
        "plant": "Potato",
        "reason": "Can spread blight",
        "confidence": "HIGH"
      }
    ]
  }
}
```

### Pass 3: Pest & Disease Info

```
{
  "plant": "Tomato",
  "commonPests": [
    {
      "name": "Aphids",
      "treatment": "Spray with water jet or insecticidal soap",
      "prevention": "Monitor daily, check under leaves"
    },
    {
      "name": "Tomato Hornworm",
      "treatment": "Handpick with gloves, drop in soapy water",
      "prevention": "Daily monitoring"
    }
  ],
  "commonDiseases": [
    {
      "name": "Early Blight",
      "symptoms": "Dark concentric spots on lower leaves",
      "prevention": "Good ventilation, strip lower leaves",
      "treatment": "Remove infected leaves early"
    },
    {
      "name": "Blossom End Rot",
      "cause": "Calcium imbalance from uneven watering",
      "prevention": "Consistent watering schedule"
    }
  ]
}
```

### Pass 4: Hardiness & Climate Data

```
{
  "plant": "Tomato",
  "hardiness": {
    "frostTolerant": false,
    "minNightTemp": 55,
    "maxDayTemp": 90,
    "optimalDayTemp": "70-85",
    "optimalNightTemp": "60-75",
    "heatTolerance": "moderate",
    "requiresShadeInHotClimates": true,
    "notes": "In southern regions, light afternoon shade helps plants survive"
  }
}
```

## Realistic Workflow for Your Goals

### Step 1: Identify What Data Source Has What

| Data Type | Best Source | Available? |
|-----------|-------------|-----------|
| Basic plant info | Trefle/Perenual API | ✅ Yes |
| Hardiness zones | Trefle API | ✅ Yes |
| Growing instructions | Almanac.com | ✅ Yes (scraped) |
| Companion planting | ??? | ❌ Need to find |
| Pest/disease info | Almanac.com | ✅ Yes (scraped) |

### Step 2: Fix the Missing Companion Data

**Immediate Action Needed:**
1. Check if Almanac.com has a separate companion planting page
2. Search for companion planting data sources:
   - GrowVeg.com companion planting tool
   - Johnny's Seeds companion planting chart
   - Mother Earth News companion planting guide
   - University extension bulletins

**Alternative:** Manually create companion relationships from books/trusted sources for your 15 priority plants.

### Step 3: Use the Right Tool for Each Data Type

| Data Type | Method | Tool |
|-----------|--------|------|
| Scientific name, family, genus | API | Trefle/Perenual |
| Hardiness zones | API | Trefle |
| Growing attributes | Parse scraped data | LLM |
| Companion relationships | Find new source | Scrape + LLM |
| Pest/disease info | Parse scraped data | LLM (optional - may not need in DB) |

## Proposed Database Population Plan

### Phase 1: Core Plant Data (from APIs)
```sql
INSERT INTO plants (id, canonical_scientific_name, common_name, family, genus)
VALUES (
  uuid_generate_v4(),
  'Solanum lycopersicum',  -- from Trefle
  'Tomato',
  'Solanaceae',            -- from Trefle
  'Solanum'                -- from Trefle
);
```

### Phase 2: Plant Attributes (from LLM parsing of scraped data)
```sql
INSERT INTO plant_attributes (
  plant_id, cycle, sun_needs, water_needs, 
  root_depth, growth_habit, days_to_maturity_min, days_to_maturity_max
) VALUES (
  (SELECT id FROM plants WHERE common_name = 'Tomato'),
  'ANNUAL',
  'FULL_SUN',
  'FREQUENT',
  'DEEP',
  'FRUITING',
  60,
  85
);
```

### Phase 3: Companion Relationships (from new source)
```sql
-- After finding/scraping companion data
INSERT INTO companion_relationships (
  id, plant_a_id, plant_b_id, 
  relationship_type, relationship_subtype,
  confidence_level, evidence_type, reason
) VALUES (
  uuid_generate_v4(),
  (SELECT id FROM plants WHERE common_name = 'Tomato'),
  (SELECT id FROM plants WHERE common_name = 'Basil'),
  'BENEFICIAL',
  'PEST_DETERRENT',
  'HIGH',
  'TRADITIONAL',
  'Repels aphids and improves tomato flavor'
);
```

## Revised LLM Prompt Template

Use this for parsing the scraped Almanac data you already have:

```
You are extracting plant growing attributes from a gardening guide to populate a database.

Extract the following information and output as JSON:

{
  "commonName": "string",
  "cycle": "ANNUAL|PERENNIAL|BIENNIAL",
  "sunNeeds": "FULL_SUN|PART_SHADE|SHADE",
  "waterNeeds": "LOW|MODERATE|HIGH|FREQUENT",
  "rootDepth": "SHALLOW|MEDIUM|DEEP (infer from text)",
  "growthHabit": "BUSH|VINE|CLIMBER|FRUITING|OTHER",
  "daysToMaturityMin": "number or null",
  "daysToMaturityMax": "number or null",
  "spacingInches": "string like '24-36' or null",
  "soilTempMinF": "number or null",
  "soilTempOptimalF": "number or null",
  "frostTolerant": "boolean",
  "edibleParts": ["array of: fruit, leaf, root, seed, flower"],
  "plantingDepthInches": "number or null",
  "notes": "brief summary of key requirements"
}

Guidelines:
- For sunNeeds: "8-10 hours direct sun" = FULL_SUN, "light afternoon shade" = PART_SHADE
- For waterNeeds: "2 inches per week", "keep moist" = FREQUENT; "drought tolerant" = LOW
- For cycle: Look for "annual", "perennial", or "biennial" keywords
- For growthHabit: Tomatoes produce edible fruit = FRUITING; beans climb = CLIMBER
- Extract numeric values when mentioned (days to maturity, spacing, depth, temperature)
- frostTolerant: true if plant survives frost, false if "won't tolerate frost"

Source text to parse:
---
Planting Guide:
[paste plantingGuide]

Care Instructions:
[paste careInstructions]
---

Output only valid JSON, no explanation.
```

## Next Steps for YOU

1. **Parse what you have** - Use the revised prompt above on your tomato data to extract growing attributes

2. **Find companion planting source** - Research where to get companion planting data:
   - Check GrowVeg.com
   - Look for companion planting charts
   - Consider buying a companion planting book and entering data manually for 15 plants

3. **Use APIs for scientific data** - Use Trefle/Perenual for scientific names, families, hardiness zones

4. **Decide what goes in DB** - You may not need pest/disease info in database - that could be reference documentation instead

Does this make more sense for your goals?
