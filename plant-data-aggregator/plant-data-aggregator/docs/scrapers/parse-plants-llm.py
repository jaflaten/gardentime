#!/usr/bin/env python3
"""
Parse extracted plant text into structured JSON using Claude API for high-quality extraction.
Processes all extracted-text JSON files from 20251104 scraping.
"""

import json
import os
from pathlib import Path
import anthropic
import sys

# Directories
SCRIPT_DIR = Path(__file__).parent
EXTRACTED_DIR = SCRIPT_DIR / "extracted-text"
PARSED_DIR = SCRIPT_DIR / "parsed"
PARSED_DIR.mkdir(exist_ok=True)

# Get API key from environment
API_KEY = os.environ.get("ANTHROPIC_API_KEY")
if not API_KEY:
    print("Error: ANTHROPIC_API_KEY environment variable not set")
    sys.exit(1)

# Initialize Anthropic client
client = anthropic.Anthropic(api_key=API_KEY)

EXTRACTION_PROMPT = """You are extracting plant growing attributes from a gardening guide to populate a plant database.

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

Extraction Rules:
- cycle: Look for "annual", "perennial", "biennial"
- sunNeeds: "8-10 hours" = FULL_SUN, "afternoon shade" = PART_SHADE, "shade tolerant" = SHADE
- waterNeeds: "2 inches/week" or "frequently" = FREQUENT, "drought tolerant" = LOW, "moderate" = MODERATE, "consistently moist" = HIGH
- rootDepth: "deep watering/roots" = DEEP, lettuce/radish = SHALLOW, carrots/beets = MEDIUM
- growthHabit: tomatoes/peppers = FRUITING, peas/cucumbers = CLIMBER, bush beans = BUSH, vining squash = VINE, lettuce/spinach = LEAF, carrots/radishes = ROOT
- frostTolerant: "won't tolerate frost" = false, "frost hardy" or "cold hardy" = true
- spacing: Extract from "24-36 inches" = spacingMin: 24, spacingMax: 36. If single value like "12 inches", use as both min and max
- containerSuitable: "grows in pots" or "container" mentioned = true, "needs space" or "not for containers" = false
- requiresStaking: "stake" or "cage" or "support" mentioned = true
- requiresPruning: "pinch", "trim", "prune" mentioned = true
- edibleParts: tomato = ["fruit"], lettuce = ["leaf"], carrot = ["root"], beans = ["seed"], squash flowers = ["flower"], asparagus = ["stem"]
- Extract all numbers: temps, spacing, watering amounts, fertilizing frequency
- daysToMaturity: Look for "harvest in 60-80 days" or "ready in X days"
- notes: Summarize key points not in other fields (under 200 chars)

Source Text:
---
PLANTING GUIDE:
{plantingGuide}

CARE INSTRUCTIONS:
{careInstructions}
---

Output ONLY the JSON object. No explanations. No markdown. Just valid JSON."""


def parse_plant(plant_name: str, extracted_data: dict) -> dict:
    """Parse plant data using Claude API"""
    
    planting_guide = extracted_data.get("plantingGuide", "")
    care_instructions = extracted_data.get("careInstructions", "")
    
    prompt = EXTRACTION_PROMPT.format(
        plantingGuide=planting_guide,
        careInstructions=care_instructions
    )
    
    try:
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        response_text = message.content[0].text.strip()
        
        # Parse JSON response
        parsed_data = json.loads(response_text)
        return parsed_data
        
    except Exception as e:
        print(f"  Error parsing {plant_name}: {e}")
        return None


def main():
    """Parse all extracted plant files"""
    
    # Get all extracted text files
    extracted_files = sorted(EXTRACTED_DIR.glob("*.json"))
    
    print(f"Found {len(extracted_files)} extracted plant files")
    print(f"Parsing plants using Claude API...\n")
    
    successful = 0
    failed = 0
    
    for extracted_file in extracted_files:
        plant_name = extracted_file.stem
        parsed_file = PARSED_DIR / f"{plant_name}.json"
        
        # Skip if already parsed
        if parsed_file.exists():
            print(f"✓ {plant_name} - already parsed, skipping")
            successful += 1
            continue
        
        print(f"Parsing {plant_name}...", end=" ")
        
        # Load extracted data
        with open(extracted_file, 'r') as f:
            extracted_data = json.load(f)
        
        # Parse using Claude
        parsed_data = parse_plant(plant_name, extracted_data)
        
        if parsed_data:
            # Save parsed data
            with open(parsed_file, 'w') as f:
                json.dump(parsed_data, f, indent=2)
            print("✓")
            successful += 1
        else:
            print("✗")
            failed += 1
    
    print(f"\n{'='*60}")
    print(f"Parsing complete!")
    print(f"Successful: {successful}")
    print(f"Failed: {failed}")
    print(f"Total: {len(extracted_files)}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
