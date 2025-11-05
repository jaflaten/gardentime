#!/usr/bin/env python3
"""
Fetch Trefle API data for all scraped plants.
Creates a mapping file with botanical information.
"""

import json
import os
import time
import requests
from pathlib import Path
from typing import Dict, Optional, List

TREFLE_API_KEY = os.environ.get('TREFLE_API_KEY', '')
TREFLE_BASE_URL = 'https://trefle.io/api/v1'

# Common name to scientific name mapping (known mappings)
COMMON_TO_SCIENTIFIC = {
    'tomatoes': 'Solanum lycopersicum',
    'peppers': 'Capsicum annuum',
    'potatoes': 'Solanum tuberosum',
    'eggplant': 'Solanum melongena',
    'beans': 'Phaseolus vulgaris',
    'peas': 'Pisum sativum',
    'lettuce': 'Lactuca sativa',
    'carrots': 'Daucus carota',
    'onions': 'Allium cepa',
    'garlic': 'Allium sativum',
    'cucumbers': 'Cucumis sativus',
    'zucchini': 'Cucurbita pepo',
    'pumpkins': 'Cucurbita pepo',
    'cabbage': 'Brassica oleracea',
    'broccoli': 'Brassica oleracea var. italica',
    'cauliflower': 'Brassica oleracea var. botrytis',
    'kale': 'Brassica oleracea var. sabellica',
    'brussels-sprouts': 'Brassica oleracea var. gemmifera',
    'spinach': 'Spinacia oleracea',
    'swiss-chard': 'Beta vulgaris subsp. vulgaris',
    'beets': 'Beta vulgaris',
    'radishes': 'Raphanus sativus',
    'turnips': 'Brassica rapa',
    'parsnips': 'Pastinaca sativa',
    'celery': 'Apium graveolens',
    'basil': 'Ocimum basilicum',
    'parsley': 'Petroselinum crispum',
    'cilantro-coriander': 'Coriandrum sativum',
    'dill': 'Anethum graveolens',
    'mint': 'Mentha',
    'oregano': 'Origanum vulgare',
    'rosemary': 'Rosmarinus officinalis',
    'sage': 'Salvia officinalis',
    'thyme': 'Thymus vulgaris',
    'chives': 'Allium schoenoprasum',
    'strawberries': 'Fragaria × ananassa',
    'raspberries': 'Rubus idaeus',
    'blueberries': 'Vaccinium corymbosum',
    'corn': 'Zea mays',
    'sweet-potatoes': 'Ipomoea batatas',
    'leeks': 'Allium porrum',
    'scallions': 'Allium fistulosum',
    'arugula': 'Eruca vesicaria',
    'bok-choy': 'Brassica rapa subsp. chinensis',
}

def search_trefle(query: str, token: str) -> Optional[Dict]:
    """Search Trefle API for a plant."""
    if not token:
        print("⚠️  No TREFLE_API_KEY found in environment")
        return None
    
    url = f"{TREFLE_BASE_URL}/plants/search"
    params = {'token': token, 'q': query}
    
    try:
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('data') and len(data['data']) > 0:
                return data['data'][0]  # Return first match
        elif response.status_code == 429:
            print("⚠️  Rate limited by Trefle API")
            time.sleep(60)  # Wait a minute
            return search_trefle(query, token)  # Retry
        else:
            print(f"❌ Trefle API error: {response.status_code}")
    except Exception as e:
        print(f"❌ Error calling Trefle: {e}")
    
    return None

def get_plant_details(plant_id: int, token: str) -> Optional[Dict]:
    """Get detailed plant information from Trefle."""
    if not token:
        return None
    
    url = f"{TREFLE_BASE_URL}/plants/{plant_id}"
    params = {'token': token}
    
    try:
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get('data')
        elif response.status_code == 429:
            print("⚠️  Rate limited by Trefle API")
            time.sleep(60)
            return get_plant_details(plant_id, token)
    except Exception as e:
        print(f"❌ Error getting plant details: {e}")
    
    return None

def process_plant(common_name: str, slug: str, api_key: str) -> Dict:
    """Fetch Trefle data for a single plant."""
    result = {
        'commonName': common_name,
        'slug': slug,
        'trefle_found': False,
        'trefle_id': None,
        'scientific_name': None,
        'family': None,
        'genus': None,
        'data': None
    }
    
    # Try scientific name mapping first
    scientific_name = COMMON_TO_SCIENTIFIC.get(slug)
    search_query = scientific_name if scientific_name else common_name
    
    print(f"🔍 Searching Trefle for: {common_name} ({search_query})...")
    
    # Search Trefle
    search_result = search_trefle(search_query, api_key)
    
    if search_result:
        plant_id = search_result.get('id')
        result['trefle_found'] = True
        result['trefle_id'] = plant_id
        result['scientific_name'] = search_result.get('scientific_name')
        result['family'] = search_result.get('family')
        result['genus'] = search_result.get('genus')
        
        print(f"   ✓ Found: {result['scientific_name']} (Family: {result['family']})")
        
        # Get detailed data
        time.sleep(0.6)  # Rate limiting: max 120 requests/minute
        details = get_plant_details(plant_id, api_key)
        if details:
            result['data'] = details
            print(f"   ✓ Retrieved detailed data")
    else:
        print(f"   ❌ Not found in Trefle")
    
    return result

def fetch_trefle_data_for_all_plants():
    """Fetch Trefle data for all scraped plants."""
    
    if not TREFLE_API_KEY:
        print("❌ TREFLE_API_KEY environment variable not set")
        print("   Set it with: export TREFLE_API_KEY='your-api-key'")
        return
    
    script_dir = Path(__file__).parent
    parsed_dir = script_dir / "parsed"
    
    if not parsed_dir.exists():
        print(f"❌ Directory not found: {parsed_dir}")
        return
    
    # Load all plant files
    json_files = list(parsed_dir.glob("*_scraped_*.json"))
    print(f"📁 Found {len(json_files)} plants to process\n")
    
    results = []
    found_count = 0
    
    for i, json_file in enumerate(sorted(json_files), 1):
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            common_name = data.get('commonName', '')
            slug = data.get('slug', '')
            
            print(f"[{i}/{len(json_files)}] Processing: {common_name}")
            
            result = process_plant(common_name, slug, TREFLE_API_KEY)
            results.append(result)
            
            if result['trefle_found']:
                found_count += 1
            
            time.sleep(0.6)  # Rate limiting
            
        except Exception as e:
            print(f"❌ Error processing {json_file.name}: {e}")
    
    # Save results
    output = {
        'metadata': {
            'generated_at': '2025-11-05T06:20:00Z',
            'total_plants': len(results),
            'found_in_trefle': found_count,
            'not_found': len(results) - found_count,
            'description': 'Trefle API botanical data for scraped plants'
        },
        'plants': results
    }
    
    output_file = script_dir / "trefle-botanical-data.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Successfully fetched Trefle data:")
    print(f"   📄 Output: {output_file}")
    print(f"   🌱 Total plants: {len(results)}")
    print(f"   ✓ Found in Trefle: {found_count}")
    print(f"   ❌ Not found: {len(results) - found_count}")
    
    # Summary by family
    families = {}
    for result in results:
        if result['family']:
            families[result['family']] = families.get(result['family'], 0) + 1
    
    print(f"\n📊 Plants by family:")
    for family, count in sorted(families.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"   • {family}: {count} plants")

if __name__ == "__main__":
    fetch_trefle_data_for_all_plants()
