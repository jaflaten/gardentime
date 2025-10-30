# LLM Prompt: Extract Plant Growing Attributes

## Purpose
Extract plant growing attributes from Almanac.com scraped data to populate the `plant_attributes` table in your database.

## How to Use

1. Open your scraped JSON file (e.g., `tomatoes_scraped_20251030-222405.json`)
2. Copy the `plantingGuide` and `careInstructions` sections
3. Paste this prompt into Claude/GPT
4. Replace the `[PASTE TEXT HERE]` with your actual data
5. Get back structured JSON ready for database import

---

## THE PROMPT (Copy everything below this line)

```
You are extracting plant growing attributes from a gardening guide to populate a plant database.

Extract the following information and output ONLY valid JSON in this exact format:

{
  "commonName": "string (singular form, e.g., 'Tomato' not 'Tomatoes')",
  "cycle": "ANNUAL|PERENNIAL|BIENNIAL",
  "sunNeeds": "FULL_SUN|PART_SHADE|SHADE",
  "waterNeeds": "LOW|MODERATE|HIGH|FREQUENT",
  "rootDepth": "SHALLOW|MEDIUM|DEEP",
  "growthHabit": "BUSH|VINE|CLIMBER|ROOT|LEAF|FRUITING",
  "soilTempMinF": "number or null",
  "soilTempOptimalF": "number or null",
  "frostTolerant": "boolean",
  "spacingMin": "number (inches) or null",
  "spacingMax": "number (inches) or null",
  "plantingDepthInches": "number or null",
  "containerSuitable": "boolean",
  "requiresStaking": "boolean",
  "requiresPruning": "boolean",
  "edibleParts": ["array of: fruit, leaf, root, seed, flower, stem"],
  "daysToMaturityMin": "number or null",
  "daysToMaturityMax": "number or null",
  "wateringInchesPerWeek": "number or null",
  "fertilizingFrequencyWeeks": "number or null",
  "mulchRecommended": "boolean",
  "notes": "brief summary of special requirements or care tips"
}

## Extraction Rules:

### cycle
- Look for keywords: "annual", "perennial", "biennial"
- "long-season" often indicates annual
- If not mentioned, infer from context (vegetables are usually annual)

### sunNeeds
- "8-10 hours direct sun" = FULL_SUN
- "6-8 hours" = FULL_SUN
- "afternoon shade", "partial shade" = PART_SHADE
- "shade tolerant" = SHADE

### waterNeeds
- "2 inches per week", "water frequently", "keep moist" = FREQUENT
- "moderate watering", "regular watering" = MODERATE
- "drought tolerant", "low water" = LOW
- "water generously" during establishment = FREQUENT

### rootDepth
- "deep watering encourages deep roots" = DEEP
- "shallow roots" = SHALLOW
- Tomatoes, peppers, beans = DEEP
- Lettuce, radishes = SHALLOW
- If not mentioned, use null

### growthHabit
- Produces edible fruit (tomatoes, peppers) = FRUITING
- Climbs or needs trellis = CLIMBER
- Vining but doesn't climb = VINE
- Compact, low growth = BUSH
- Grown for leaves = LEAF
- Grown for roots = ROOT

### frostTolerant
- "won't tolerate frost", "frost-sensitive" = false
- "frost hardy", "survives frost" = true

### spacing
- Extract min and max from ranges like "24-36 inches" = spacingMin: 24, spacingMax: 36
- Single value like "2 feet" = spacingMin: 24, spacingMax: 24

### containerSuitable
- "grows well in pots", "container friendly" = true
- "at least 20 inches in diameter" mentioned = true
- If not mentioned, assume false

### requiresStaking
- "place stakes", "needs support", "tie to stakes" = true
- "determinate" or "bush varieties" = false (but may still benefit)
- If mentioned at all, assume true

### requiresPruning
- "pinch off suckers", "trim lower leaves", "prune" = true
- If not mentioned, assume false

### edibleParts
- Tomatoes = ["fruit"]
- Lettuce = ["leaf"]
- Carrots = ["root"]
- Broccoli = ["flower"]
- Can have multiple: e.g., beets = ["root", "leaf"]

### Numeric values
- Extract all numbers mentioned:
  - Soil temperature (e.g., "soil at least 55°F" = soilTempMinF: 55)
  - Days to maturity (extract from harvest section if available)
  - Watering amount (e.g., "2 inches per week" = wateringInchesPerWeek: 2)
  - Fertilizing frequency (e.g., "every 2 weeks" = fertilizingFrequencyWeeks: 2)

### notes
- Summarize key points not captured in other fields
- Include any special requirements, warnings, or tips
- Keep under 200 characters

## Source Text to Parse:

---
PLANTING GUIDE:
[PASTE plantingGuide TEXT HERE]

CARE INSTRUCTIONS:
[PASTE careInstructions TEXT HERE]

HARVEST INFO (if available):
[PASTE harvestInfo TEXT HERE - optional]
---

## Important:
- Output ONLY the JSON object
- No explanations, no markdown, no additional text
- If a field is not mentioned in the text, use null (not empty string)
- For boolean fields, use true/false (not "true"/"false")
- Use the exact enum values provided (case-sensitive)
- Ensure the JSON is valid and properly formatted
```

---

## Example Usage

### Input Data (from your tomato scrape):

**Planting Guide:**
```
Select a site with full sun! In northern regions, 8 to 10 hours of direct sunlight are preferred. Tomatoes are long-season, heat-loving plants that won't tolerate frost. Sow seeds 1/2-inch deep. Direct-seed tomatoes in the garden soil (1/2-inch deep)—but not before the soil is at least 55°F. Note that 70°F soil is optimum for maximum germination. Place tomato stakes or cages in the soil when planting. Plant seedlings 2 to 3 feet apart.
```

**Care Instructions:**
```
Water with about 2 inches (about 1.2 gallons) per square foot per week during the growing season. Deep watering encourages a strong root system. Mulch the plants 5 weeks after transplanting. Side-dress plants, applying organic fertilizer every 2 weeks, starting when tomatoes are about 1 inch in diameter. Continue fertilizing every 3 to 4 weeks until frost. If growing vining tomatoes, pinch off suckers. Gently tie the stems to stakes. As a plant grows, trim the lower leaves from the bottom 12 inches of the stem.
```

### Expected Output:

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
  "notes": "Heat-loving, needs full sun 8-10 hours. Deep watering promotes strong roots. Vining types need staking and sucker removal. Fertilize every 2-4 weeks."
}
```

## After Getting the JSON

1. **Validate the output** - Check that all fields are present and values make sense
2. **Save to file** - Save as `tomato_attributes.json` or similar
3. **Repeat for other plants** - Use the same prompt for your other 14 priority plants
4. **Create import service** - Write code to import these JSON files into your database

## Mapping to Database Fields

The JSON fields map to your `plant_attributes` table:

| JSON Field | Database Column | Type |
|------------|----------------|------|
| commonName | (reference for plant_id lookup) | - |
| cycle | cycle | plant_cycle enum |
| sunNeeds | sun_needs | sun_needs enum |
| waterNeeds | water_needs | water_needs enum |
| rootDepth | root_depth | root_depth enum |
| growthHabit | growth_habit | growth_habit enum |
| frostTolerant | (calculate drought_tolerant) | boolean |
| daysToMaturityMin | days_to_maturity_min | integer |
| daysToMaturityMax | days_to_maturity_max | integer |
| edibleParts | → plant_attribute_edible_parts table | separate table |

Additional fields (not in current schema but captured):
- soilTempMinF, soilTempOptimalF - store in notes or extend schema
- spacingMin, spacingMax - store in notes or extend schema
- wateringInchesPerWeek - store in notes
- fertilizingFrequencyWeeks - store in notes
- containerSuitable, requiresStaking, requiresPruning, mulchRecommended - store in notes

## Tips for Best Results

1. **Include all sections** - Paste both plantingGuide AND careInstructions for complete data
2. **Check for null values** - If something is null but should have a value, re-read the source text
3. **Validate enums** - Make sure the LLM used the exact enum values (case-sensitive)
4. **Review notes** - The notes field should summarize anything important not captured elsewhere
5. **Test with multiple plants** - Try on 2-3 different plants to ensure consistent output

## Troubleshooting

**LLM returns explanation instead of JSON:**
- Add to the end of your prompt: "Output ONLY the JSON object, no explanations."

**Invalid enum values:**
- Check that the LLM used UPPERCASE for enums (ANNUAL not annual)
- Correct mapping: FULL_SUN (not "full sun")

**Missing required fields:**
- Remind the LLM to use null if data is not available
- Required fields: cycle, rootDepth, sunNeeds, waterNeeds, growthHabit

**Numbers as strings:**
- Ensure numbers are not quoted: 55 not "55"
- Booleans should be true/false not "true"/"false"
