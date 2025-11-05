#!/usr/bin/env python3
"""
Extract pests and diseases from scraped plant data.
Creates a structured JSON file for use in crop rotation planning.
"""

import json
import os
import re
from pathlib import Path
from typing import List, Dict, Set
from collections import defaultdict

# Common pest patterns to extract
PEST_PATTERNS = [
    r'([A-Z][a-z]+ )?(?:aphids?|beetles?|borers?|bugs?|caterpillars?|cutworms?|flea beetles?|hornworms?|leaf ?miners?|maggots?|mites?|moths?|slugs?|snails?|thrips?|weevils?|whiteflies?|wireworms?)',
    r'([A-Z][a-z]+ (?:aphid|beetle|borer|bug|caterpillar|fly|maggot|mite|moth|worm))',
    r'(Colorado potato beetle|Mexican bean beetle|Japanese beetle)',
    r'(cabbage (?:looper|maggot|worm))',
    r'(tomato (?:fruitworm|hornworm))',
    r'(corn (?:earworm|borer))',
    r'(squash (?:bug|vine borer))',
]

# Common disease patterns
DISEASE_PATTERNS = [
    r'([A-Z][a-z]+ )?(?:blight|wilt|rot|mildew|rust|scab|spot|mosaic)',
    r'(early blight|late blight)',
    r'(powdery mildew|downy mildew)',
    r'(fusarium wilt|verticillium wilt)',
    r'(root rot|crown rot|blossom end rot)',
    r'(black spot|leaf spot|brown spot)',
    r'(bacterial (?:wilt|spot|canker))',
    r'(mosaic virus|yellow virus)',
    r'(clubroot|damping off)',
]

def extract_pests_from_text(text: str) -> Set[str]:
    """Extract pest names from text using patterns."""
    if not text:
        return set()
    
    pests = set()
    text_lower = text.lower()
    
    # Apply patterns
    for pattern in PEST_PATTERNS:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            pest = match.group(0).strip()
            # Capitalize properly
            pest = ' '.join(word.capitalize() for word in pest.split())
            pests.add(pest)
    
    return pests

def extract_diseases_from_text(text: str) -> Set[str]:
    """Extract disease names from text using patterns."""
    if not text:
        return set()
    
    diseases = set()
    text_lower = text.lower()
    
    # Apply patterns
    for pattern in DISEASE_PATTERNS:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            disease = match.group(0).strip()
            # Capitalize properly
            disease = ' '.join(word.capitalize() for word in disease.split())
            diseases.add(disease)
    
    return diseases

def process_plant_file(file_path: Path) -> Dict:
    """Process a single plant JSON file and extract pest/disease info."""
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    common_name = data.get('commonName', '')
    slug = data.get('slug', '')
    pests_diseases_text = data.get('pestsAndDiseases', '')
    
    # Extract pests and diseases
    pests = extract_pests_from_text(pests_diseases_text)
    diseases = extract_diseases_from_text(pests_diseases_text)
    
    return {
        'commonName': common_name,
        'slug': slug,
        'pests': sorted(list(pests)),
        'diseases': sorted(list(diseases)),
        'rawText': pests_diseases_text[:500] if pests_diseases_text else None  # Keep first 500 chars for reference
    }

def build_pest_disease_database():
    """Build comprehensive pest and disease database from all scraped plants."""
    
    script_dir = Path(__file__).parent
    parsed_dir = script_dir / "parsed"
    
    if not parsed_dir.exists():
        print(f"❌ Directory not found: {parsed_dir}")
        return
    
    # Process all JSON files
    plant_data = []
    all_pests = defaultdict(list)  # pest -> [plants affected]
    all_diseases = defaultdict(list)  # disease -> [plants affected]
    
    json_files = list(parsed_dir.glob("*_scraped_*.json"))
    print(f"📁 Found {len(json_files)} plant files to process...")
    
    for json_file in sorted(json_files):
        try:
            result = process_plant_file(json_file)
            plant_data.append(result)
            
            # Track which plants are affected by each pest/disease
            for pest in result['pests']:
                all_pests[pest].append(result['commonName'])
            
            for disease in result['diseases']:
                all_diseases[disease].append(result['commonName'])
            
            if result['pests'] or result['diseases']:
                print(f"✓ {result['commonName']}: {len(result['pests'])} pests, {len(result['diseases'])} diseases")
        
        except Exception as e:
            print(f"❌ Error processing {json_file.name}: {e}")
    
    # Create output
    output = {
        'metadata': {
            'generated_at': '2025-11-05T06:20:00Z',
            'total_plants': len(plant_data),
            'total_unique_pests': len(all_pests),
            'total_unique_diseases': len(all_diseases),
            'description': 'Pests and diseases extracted from Almanac scraped data'
        },
        'plants': plant_data,
        'pests_index': {
            pest: {
                'affected_plants': plants,
                'plant_count': len(plants)
            }
            for pest, plants in sorted(all_pests.items())
        },
        'diseases_index': {
            disease: {
                'affected_plants': plants,
                'plant_count': len(plants)
            }
            for disease, plants in sorted(all_diseases.items())
        }
    }
    
    # Save output
    output_file = script_dir / "pests-diseases-database.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Successfully created database:")
    print(f"   📄 Output: {output_file}")
    print(f"   🌱 Plants processed: {len(plant_data)}")
    print(f"   🐛 Unique pests found: {len(all_pests)}")
    print(f"   🦠 Unique diseases found: {len(all_diseases)}")
    
    # Print top pests and diseases
    print(f"\n🔝 Top 10 most common pests:")
    top_pests = sorted(all_pests.items(), key=lambda x: len(x[1]), reverse=True)[:10]
    for pest, plants in top_pests:
        print(f"   • {pest}: {len(plants)} plants")
    
    print(f"\n🔝 Top 10 most common diseases:")
    top_diseases = sorted(all_diseases.items(), key=lambda x: len(x[1]), reverse=True)[:10]
    for disease, plants in top_diseases:
        print(f"   • {disease}: {len(plants)} plants")

if __name__ == "__main__":
    build_pest_disease_database()
