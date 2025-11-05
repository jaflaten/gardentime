#!/usr/bin/env python3
"""
Parse all scraped plant data (dated 20251104) using Claude AI.
Extracts structured plant attributes from plantingGuide and careInstructions.
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime
import anthropic

# Directories
BASE_DIR = Path(__file__).parent
PARSED_DIR = BASE_DIR / 'parsed'
OUTPUT_DIR = BASE_DIR / 'plant-attributes'
OUTPUT_DIR.mkdir(exist_ok=True)

# Parse prompt template
PARSE_PROMPT = """You are extracting plant growing attributes from a gardening guide to populate a plant database.

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
- sunNeeds: "8-10 hours" = FULL_SUN, "afternoon shade" = PART_SHADE
- waterNeeds: "2 inches/week" or "frequently" = FREQUENT, "drought tolerant" = LOW
- rootDepth: "deep watering/roots" = DEEP, lettuce/radish = SHALLOW
- growthHabit: fruit crops = FRUITING, climbers = CLIMBER, leafy = LEAF
- frostTolerant: "won't tolerate frost" = false
- spacing: Extract from "24-36 inches" = spacingMin: 24, spacingMax: 36
- containerSuitable: "grows in pots" = true
- requiresStaking: "stake" or "cage" mentioned = true
- requiresPruning: "pinch", "trim", "prune" mentioned = true
- edibleParts: tomato = ["fruit"], lettuce = ["leaf"], carrot = ["root"]
- Extract all numbers: temps, spacing, watering amounts, fertilizing frequency
- notes: Summarize key points not in other fields (under 200 chars)

Source Text:
---
PLANTING GUIDE:
{planting_guide}

CARE INSTRUCTIONS:
{care_instructions}
---

Output ONLY the JSON object. No explanations. No markdown. Just valid JSON."""


def parse_plant_with_claude(plant_data):
    """Parse plant data using Claude API."""
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        print("Error: ANTHROPIC_API_KEY environment variable not set")
        sys.exit(1)
    
    client = anthropic.Anthropic(api_key=api_key)
    
    # Prepare prompt
    planting_guide = plant_data.get('plantingGuide', '')
    care_instructions = plant_data.get('careInstructions', '')
    
    if not planting_guide and not care_instructions:
        print(f"  Skipping {plant_data.get('slug')}: No text content")
        return None
    
    prompt = PARSE_PROMPT.format(
        planting_guide=planting_guide,
        care_instructions=care_instructions
    )
    
    # Call Claude
    try:
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        # Extract JSON from response
        response_text = message.content[0].text.strip()
        
        # Remove markdown if present
        if response_text.startswith('```'):
            lines = response_text.split('\n')
            response_text = '\n'.join(lines[1:-1])
        
        # Parse JSON
        parsed_data = json.loads(response_text)
        return parsed_data
        
    except Exception as e:
        print(f"  Error parsing with Claude: {e}")
        return None


def main():
    """Parse all plants from scraped data dated 20251104."""
    # Find all parsed files from today's date (but they were scraped, not parsed yet)
    date_filter = "20251104"  # Nov 4, 2025
    
    parsed_files = list(PARSED_DIR.glob(f'*_scraped_{date_filter}*.json'))
    
    if not parsed_files:
        # Try all files from parsed directory
        parsed_files = list(PARSED_DIR.glob('*_scraped_*.json'))
    
    print(f"Found {len(parsed_files)} plant files to parse")
    
    if not parsed_files:
        print("No files found. Exiting.")
        return
    
    success_count = 0
    skip_count = 0
    error_count = 0
    
    for file_path in sorted(parsed_files):
        slug = file_path.stem.split('_scraped_')[0]
        print(f"\n{slug}...")
        
        # Load scraped data
        with open(file_path, 'r') as f:
            plant_data = json.load(f)
        
        # Parse with Claude
        parsed_attrs = parse_plant_with_claude(plant_data)
        
        if parsed_attrs:
            # Save to output directory
            output_file = OUTPUT_DIR / f"{slug}_attributes.json"
            
            # Add metadata
            parsed_attrs['slug'] = slug
            parsed_attrs['source'] = plant_data.get('source', 'Unknown')
            parsed_attrs['parsedAt'] = datetime.utcnow().isoformat() + 'Z'
            
            with open(output_file, 'w') as f:
                json.dump(parsed_attrs, f, indent=2)
            
            print(f"  ✓ Saved to {output_file.name}")
            success_count += 1
        else:
            skip_count += 1
    
    print(f"\n" + "="*60)
    print(f"Parsing complete:")
    print(f"  Success: {success_count}")
    print(f"  Skipped: {skip_count}")
    print(f"  Errors: {error_count}")
    print(f"="*60)


if __name__ == '__main__':
    main()
