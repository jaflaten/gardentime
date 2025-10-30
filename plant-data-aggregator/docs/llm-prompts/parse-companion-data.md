# LLM Prompt: Parse Companion Planting Data

## Purpose
Parse companion planting information from scraped text into structured JSON format suitable for database import.

## Instructions for Use

1. Open a scraped JSON file from `docs/scrapers/parsed/`
2. Copy the `companionSection` text
3. Use this prompt with Claude, GPT-4, or similar LLM
4. Save the output JSON to a file for database import

## Prompt Template

```
You are parsing companion planting information for a gardening database.

Extract the following from the text:
1. Beneficial companion plants (plants that grow well together)
2. Antagonistic plants (plants that should not be grown together)
3. Reasons for each relationship when mentioned
4. Confidence level based on how the information is presented:
   - HIGH: Explicitly stated with clear language ("plant with", "grows well with")
   - MEDIUM: Suggested or recommended ("may benefit", "can help")
   - LOW: Vague or unclear statements

Output format (strict JSON):
{
  "plant": "Common name of the main plant",
  "beneficial": [
    {
      "plant": "Companion plant common name",
      "reason": "Why they work well together (if mentioned)",
      "confidence": "HIGH|MEDIUM|LOW"
    }
  ],
  "antagonistic": [
    {
      "plant": "Plant to avoid",
      "reason": "Why to avoid (if mentioned)",
      "confidence": "HIGH|MEDIUM|LOW"
    }
  ],
  "notes": "Any additional context or notes"
}

Rules:
- Normalize plant names to common singular/plural form (e.g., "tomatoes" → "Tomato")
- If a plant is mentioned in a list separated by commas/and, create separate entries
- If no reason is given, use null for the reason field
- If the text mentions "avoid" or "don't plant with", that's antagonistic
- If it says "plant with" or "grows well with", that's beneficial
- Ignore vague statements that don't clearly indicate a relationship

Text to parse:
---
[PASTE companionSection TEXT HERE]
---

Output only the JSON, no explanation.
```

## Example Input Text

```
Plant tomatoes with basil, carrots, and marigolds to help deter pests. 
Basil improves tomato flavor and repels aphids. Carrots can be planted 
underneath tomatoes to maximize space. Avoid planting tomatoes near 
potatoes as they can spread blight. Don't plant with fennel or brassicas 
as these can stunt tomato growth.
```

## Example Output

```json
{
  "plant": "Tomato",
  "beneficial": [
    {
      "plant": "Basil",
      "reason": "Improves flavor and repels aphids",
      "confidence": "HIGH"
    },
    {
      "plant": "Carrot",
      "reason": "Space optimization (planted underneath)",
      "confidence": "HIGH"
    },
    {
      "plant": "Marigold",
      "reason": "Pest deterrent",
      "confidence": "HIGH"
    }
  ],
  "antagonistic": [
    {
      "plant": "Potato",
      "reason": "Can spread blight",
      "confidence": "HIGH"
    },
    {
      "plant": "Fennel",
      "reason": "Can stunt tomato growth",
      "confidence": "HIGH"
    },
    {
      "plant": "Brassica",
      "reason": "Can stunt tomato growth",
      "confidence": "HIGH"
    }
  ],
  "notes": "Tomatoes benefit from companion planting for pest control and space optimization"
}
```

## Batch Processing Workflow

For processing multiple plants efficiently:

1. **Create a batch prompt:**
   ```
   Parse companion planting data for the following plants.
   For each plant, output the JSON structure as shown above.
   Separate each plant's JSON with a line containing "---NEXT---".
   
   Plant 1: Tomatoes
   [paste tomatoes companionSection]
   
   ---NEXT---
   
   Plant 2: Basil
   [paste basil companionSection]
   
   ---NEXT---
   
   Plant 3: Peppers
   [paste peppers companionSection]
   ```

2. **Split the output** by `---NEXT---` delimiter

3. **Validate JSON** for each entry

4. **Save to files** like `tomatoes_companions.json`, `basil_companions.json`, etc.

## Validation Checklist

After receiving LLM output, verify:

- ✅ Valid JSON structure
- ✅ Plant names are normalized
- ✅ Confidence levels are HIGH, MEDIUM, or LOW
- ✅ Reasons are present when mentioned in source text
- ✅ No duplicate entries in beneficial/antagonistic arrays
- ✅ Plant names are spelled correctly

## Common Parsing Challenges

### Challenge 1: Generic Terms
**Input:** "Plant with herbs"  
**Solution:** Skip generic terms, only extract specific plant names

### Challenge 2: Plant Families
**Input:** "Avoid planting with brassicas"  
**Solution:** 
```json
{
  "plant": "Brassica family",
  "reason": "...",
  "confidence": "MEDIUM",
  "note": "Includes cabbage, broccoli, kale, etc."
}
```

### Challenge 3: Conditional Statements
**Input:** "May benefit from planting with onions in some climates"  
**Solution:** Use MEDIUM confidence and note the condition

### Challenge 4: Missing Information
**Input:** "Plant with carrots"  
**Solution:**
```json
{
  "plant": "Carrot",
  "reason": null,
  "confidence": "HIGH"
}
```

## Database Import Format (Future)

The parsed JSON will be transformed into database records:

```sql
INSERT INTO companion_relationships (
  plant_a_id, 
  plant_b_id, 
  relationship_type, 
  confidence_level,
  reason,
  source_id
) VALUES (
  (SELECT id FROM plants WHERE common_name = 'Tomato'),
  (SELECT id FROM plants WHERE common_name = 'Basil'),
  'BENEFICIAL',
  'HIGH',
  'Improves flavor and repels aphids',
  (SELECT id FROM sources WHERE title = 'Almanac.com')
);
```

## Tips for Better Results

1. **Provide context** - Include the plant name in the prompt
2. **Clean input text** - Remove excessive whitespace or formatting
3. **Verify common names** - Check against your plant registry
4. **Review edge cases** - Manually check ambiguous relationships
5. **Iterate** - If LLM output is wrong, refine the prompt

## Alternative: Semi-Automated Approach

If LLM parsing is inconsistent, use this hybrid approach:

1. **LLM first pass** - Generate initial JSON
2. **Manual review** - Check and correct each entry
3. **Build pattern library** - Save common phrasings
4. **Regex assist** - Use regex to pre-extract plant names
5. **LLM second pass** - Parse only unclear relationships

## Saving Parsed Results

Create a directory structure:

```
docs/scrapers/parsed-companions/
├── tomatoes_companions.json
├── basil_companions.json
├── peppers_companions.json
└── validation-report.md
```

Each file contains the LLM-parsed companion data ready for database import.
