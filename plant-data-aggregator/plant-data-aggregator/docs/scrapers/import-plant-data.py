#!/usr/bin/env python3
"""
Plant Data Import Script

This script imports plant data from multiple sources into the GardenTime database:
1. Almanac scraped data (planting guides, care instructions)
2. Trefle botanical data (family, genus, scientific name)
3. Pest and disease data
4. Companionship data

Usage:
    python3 import-plant-data.py

Prerequisites:
    pip install psycopg2-binary
    
Environment variables:
    DB_HOST (default: localhost)
    DB_PORT (default: 5432)
    DB_NAME (default: gardentime)
    DB_USER (default: postgres)
    DB_PASSWORD (required)
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Any
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime

# Manual family mapping for plants not found in Trefle
MANUAL_FAMILY_MAP = {
    "apples": "Rosaceae",
    "artichokes": "Asteraceae",
    "asparagus": "Asparagaceae",
    "blackberries": "Rosaceae",
    "cantaloupes": "Cucurbitaceae",
    "cauliflower": "Brassicaceae",
    "cherries": "Rosaceae",
    "collards": "Brassicaceae",
    "corn": "Poaceae",
    "edamame": "Fabaceae",
    "fava-beans": "Fabaceae",
    "fennel": "Apiaceae",
    "grapes": "Vitaceae",
    "honeydew-melons": "Cucurbitaceae",
    "horseradish": "Brassicaceae",
    "kohlrabi": "Brassicaceae",
    "mustard-greens": "Brassicaceae",
    "okra": "Malvaceae",
    "peaches": "Rosaceae",
    "peanuts": "Fabaceae",
    "pears": "Rosaceae",
    "plums": "Rosaceae",
    "rhubarb": "Polygonaceae",
    "rutabagas": "Brassicaceae",
    "salsify": "Asteraceae",
    "shallots": "Amaryllidaceae",
    "tomatillos": "Solanaceae",
    "watermelon": "Cucurbitaceae",
}

# Derive feeder type from family and soil nutrients
def derive_feeder_type(family: str, soil_nutrients: Optional[int]) -> str:
    """Derive feeder type from family and soil nutrient requirements."""
    if family == "Fabaceae":
        return "NITROGEN_FIXER"
    
    heavy_feeders = ["Solanaceae", "Brassicaceae", "Cucurbitaceae", "Poaceae"]
    light_feeders = ["Amaryllidaceae", "Asteraceae", "Lamiaceae"]
    
    if family in heavy_feeders:
        return "HEAVY"
    elif family in light_feeders:
        return "LIGHT"
    else:
        # Use soil nutrients if available
        if soil_nutrients:
            if soil_nutrients >= 7:
                return "HEAVY"
            elif soil_nutrients <= 4:
                return "LIGHT"
            else:
                return "MODERATE"
        return "MODERATE"

def get_db_connection():
    """Create database connection."""
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        database=os.getenv("DB_NAME", "gardentime"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD")
    )

def load_json_file(filepath: Path) -> Any:
    """Load and parse JSON file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def import_plant_families(conn):
    """Import plant families (already in V9 migration, just verify)."""
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM plant_families")
        count = cur.fetchone()[0]
        print(f"✓ Plant families: {count} rows")
        return count

def import_edible_parts(conn):
    """Import edible parts (already in V9 migration, just verify)."""
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM edible_parts")
        count = cur.fetchone()[0]
        print(f"✓ Edible parts: {count} rows")
        return count

def get_family_id(conn, family_name: str) -> Optional[int]:
    """Get family ID by name."""
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM plant_families WHERE name = %s", (family_name,))
        result = cur.fetchone()
        return result[0] if result else None

def get_edible_part_id(conn, part_name: str) -> Optional[int]:
    """Get edible part ID by name."""
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM edible_parts WHERE name = %s", (part_name,))
        result = cur.fetchone()
        return result[0] if result else None

def import_plants(conn, scraped_dir: Path, trefle_file: Path):
    """Import plants from scraped data and Trefle data."""
    
    # Load Trefle data
    trefle_data = load_json_file(trefle_file)
    trefle_by_slug = {}
    
    for plant in trefle_data.get('plants', []):
        slug = plant.get('slug')
        if slug:
            trefle_by_slug[slug] = plant
    
    print(f"Loaded {len(trefle_by_slug)} plants from Trefle data")
    
    # Process extracted text files
    extracted_dir = scraped_dir / "extracted-text"
    json_files = list(extracted_dir.glob("*.json"))
    
    print(f"Found {len(json_files)} plant files to import")
    
    imported = 0
    skipped = 0
    
    with conn.cursor() as cur:
        for json_file in json_files:
            plant_data = load_json_file(json_file)
            
            common_name = plant_data.get('commonName')
            slug = json_file.stem.replace('_extracted_20251104', '').replace('_extracted', '')
            
            if not common_name:
                print(f"  ⚠️  Skipping {json_file.name}: no commonName")
                skipped += 1
                continue
            
            # Check if plant already exists
            cur.execute("SELECT id FROM plant_entity WHERE slug = %s", (slug,))
            existing = cur.fetchone()
            
            if existing:
                print(f"  ⚠️  Skipping {common_name}: already exists (slug: {slug})")
                skipped += 1
                continue
            
            # Get Trefle data if available
            trefle = trefle_by_slug.get(slug, {})
            trefle_main = trefle.get('data', {}).get('main_species', {}) if trefle.get('data') else {}
            trefle_growth = trefle_main.get('growth', {}) if trefle_main else {}
            
            # Get family
            family_name = None
            if trefle.get('family'):
                family_name = trefle['family']
            elif slug in MANUAL_FAMILY_MAP:
                family_name = MANUAL_FAMILY_MAP[slug]
            
            family_id = get_family_id(conn, family_name) if family_name else None
            
            # Determine if nitrogen fixer
            is_nitrogen_fixer = family_name == "Fabaceae"
            
            # Derive feeder type
            soil_nutrients = trefle_growth.get('soil_nutriments') if trefle_growth else None
            feeder_type = derive_feeder_type(family_name or "", soil_nutrients) if family_name else None
            
            # Insert plant
            cur.execute("""
                INSERT INTO plant_entity (
                    name, slug, scientific_name, genus,
                    family_id, cycle, sun_needs, water_needs, root_depth, growth_habit,
                    soil_temp_min_f, soil_temp_optimal_f, frost_tolerant,
                    spacing_min_inches, spacing_max_inches, planting_depth_inches,
                    container_suitable, requires_staking, requires_pruning,
                    days_to_maturity_min, days_to_maturity_max,
                    watering_inches_per_week, fertilizing_frequency_weeks, mulch_recommended,
                    notes, is_nitrogen_fixer, feeder_type,
                    soil_ph_min, soil_ph_max
                ) VALUES (
                    %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s,
                    %s, %s,
                    %s, %s, %s,
                    %s, %s, %s,
                    %s, %s
                ) RETURNING id
            """, (
                common_name, slug, trefle.get('scientific_name'), trefle.get('genus'),
                family_id, plant_data.get('cycle'), plant_data.get('sunNeeds'), 
                plant_data.get('waterNeeds'), plant_data.get('rootDepth'), 
                plant_data.get('growthHabit'),
                plant_data.get('soilTempMinF'), plant_data.get('soilTempOptimalF'),
                plant_data.get('frostTolerant', False),
                plant_data.get('spacingMin'), plant_data.get('spacingMax'),
                plant_data.get('plantingDepthInches'),
                plant_data.get('containerSuitable', False),
                plant_data.get('requiresStaking', False),
                plant_data.get('requiresPruning', False),
                plant_data.get('daysToMaturityMin'), plant_data.get('daysToMaturityMax'),
                plant_data.get('wateringInchesPerWeek'),
                plant_data.get('fertilizingFrequencyWeeks'),
                plant_data.get('mulchRecommended', True),
                plant_data.get('notes'),
                is_nitrogen_fixer, feeder_type,
                trefle_growth.get('ph_minimum') if trefle_growth else None,
                trefle_growth.get('ph_maximum') if trefle_growth else None
            ))
            
            plant_id = cur.fetchone()[0]
            
            # Import edible parts
            edible_parts = plant_data.get('edibleParts', [])
            for part_name in edible_parts:
                part_id = get_edible_part_id(conn, part_name)
                if part_id:
                    cur.execute("""
                        INSERT INTO plant_edible_parts (plant_id, edible_part_id)
                        VALUES (%s, %s)
                        ON CONFLICT DO NOTHING
                    """, (plant_id, part_id))
            
            imported += 1
            print(f"  ✓ Imported: {common_name} (family: {family_name or 'unknown'})")
    
    conn.commit()
    print(f"\n✅ Plants imported: {imported}, skipped: {skipped}")
    return imported

def import_pests_diseases(conn, pests_diseases_file: Path):
    """Import pests and diseases."""
    
    data = load_json_file(pests_diseases_file)
    
    # Import pests
    pests_map = {}
    with conn.cursor() as cur:
        for pest_name, pest_data in data.get('pests_index', {}).items():
            cur.execute("""
                INSERT INTO pests (name, common_name)
                VALUES (%s, %s)
                ON CONFLICT (name) DO UPDATE SET common_name = EXCLUDED.common_name
                RETURNING id
            """, (pest_name, pest_name.lower()))
            pests_map[pest_name] = cur.fetchone()[0]
    
    print(f"✓ Imported {len(pests_map)} pests")
    
    # Import diseases
    diseases_map = {}
    with conn.cursor() as cur:
        for disease_name, disease_data in data.get('diseases_index', {}).items():
            cur.execute("""
                INSERT INTO diseases (name, common_name)
                VALUES (%s, %s)
                ON CONFLICT (name) DO UPDATE SET common_name = EXCLUDED.common_name
                RETURNING id
            """, (disease_name, disease_name.lower()))
            diseases_map[disease_name] = cur.fetchone()[0]
    
    print(f"✓ Imported {len(diseases_map)} diseases")
    
    # Link plants to pests and diseases
    with conn.cursor() as cur:
        for plant_data in data.get('plants', []):
            slug = plant_data.get('slug')
            
            # Get plant ID
            cur.execute("SELECT id FROM plant_entity WHERE slug = %s", (slug,))
            result = cur.fetchone()
            if not result:
                continue
            plant_id = result[0]
            
            # Link pests
            for pest_name in plant_data.get('pests', []):
                if pest_name in pests_map:
                    cur.execute("""
                        INSERT INTO plant_pests (plant_id, pest_id)
                        VALUES (%s, %s)
                        ON CONFLICT DO NOTHING
                    """, (plant_id, pests_map[pest_name]))
            
            # Link diseases
            for disease_name in plant_data.get('diseases', []):
                if disease_name in diseases_map:
                    cur.execute("""
                        INSERT INTO plant_diseases (plant_id, disease_id)
                        VALUES (%s, %s)
                        ON CONFLICT DO NOTHING
                    """, (plant_id, diseases_map[disease_name]))
    
    conn.commit()
    print("✅ Linked plants to pests and diseases")

def import_companions(conn, companions_file: Path):
    """Import companion planting relationships."""
    
    data = load_json_file(companions_file)
    
    imported = 0
    skipped = 0
    
    with conn.cursor() as cur:
        for plant_slug, companions in data.items():
            # Get plant ID
            cur.execute("SELECT id FROM plant_entity WHERE slug = %s", (plant_slug,))
            result = cur.fetchone()
            if not result:
                skipped += 1
                continue
            plant_id = result[0]
            
            for companion_slug, relationship_data in companions.items():
                # Get companion ID
                cur.execute("SELECT id FROM plant_entity WHERE slug = %s", (companion_slug,))
                result = cur.fetchone()
                if not result:
                    continue
                companion_id = result[0]
                
                relationship = relationship_data.get('relationship', 'NEUTRAL')
                reason = relationship_data.get('reason', '')
                
                # Insert bidirectional relationship
                cur.execute("""
                    INSERT INTO plant_companions (plant_id, companion_id, relationship, reason)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (plant_id, companion_id) DO NOTHING
                """, (plant_id, companion_id, relationship, reason))
                
                imported += 1
    
    conn.commit()
    print(f"✅ Companion relationships imported: {imported}, skipped: {skipped}")

def main():
    """Main import function."""
    
    # Check for DB password
    if not os.getenv("DB_PASSWORD"):
        print("❌ DB_PASSWORD environment variable required")
        print("   Set it with: export DB_PASSWORD='your-password'")
        sys.exit(1)
    
    # Paths
    script_dir = Path(__file__).parent
    scraped_dir = script_dir
    trefle_file = script_dir / "trefle-botanical-data.json"
    pests_diseases_file = script_dir / "pests-diseases-database.json"
    companions_file = script_dir.parent / "companionship" / "companionship-extended2.json"
    
    # Verify files exist
    if not trefle_file.exists():
        print(f"❌ Trefle data file not found: {trefle_file}")
        sys.exit(1)
    
    if not pests_diseases_file.exists():
        print(f"❌ Pests/diseases file not found: {pests_diseases_file}")
        sys.exit(1)
    
    if not companions_file.exists():
        print(f"❌ Companions file not found: {companions_file}")
        sys.exit(1)
    
    print("=" * 80)
    print("PLANT DATA IMPORT")
    print("=" * 80)
    print()
    
    # Connect to database
    try:
        conn = get_db_connection()
        print("✓ Connected to database\n")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)
    
    try:
        # Import in order
        print("1. Verifying plant families...")
        import_plant_families(conn)
        print()
        
        print("2. Verifying edible parts...")
        import_edible_parts(conn)
        print()
        
        print("3. Importing plants...")
        import_plants(conn, scraped_dir, trefle_file)
        print()
        
        print("4. Importing pests and diseases...")
        import_pests_diseases(conn, pests_diseases_file)
        print()
        
        print("5. Importing companion relationships...")
        import_companions(conn, companions_file)
        print()
        
        print("=" * 80)
        print("✅ IMPORT COMPLETE!")
        print("=" * 80)
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Import failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    main()
