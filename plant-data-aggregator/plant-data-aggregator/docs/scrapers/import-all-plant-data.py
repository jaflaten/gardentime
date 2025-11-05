#!/usr/bin/env python3
"""
Complete plant data import script for GardenTime
Imports:
- 76 plants with full growing data
- Botanical data from Trefle API
- Pests and diseases
- Links between plants and pests/diseases
- Edible parts
"""

import json
import os
import re
from pathlib import Path
from typing import Dict, List, Set, Optional
import psycopg2
from psycopg2.extras import execute_batch

# Database connection settings
DB_CONFIG = {
    'host': 'localhost',
    'port': '5432',
    'database': 'gardentime',
    'user': 'gardentime',
    'password': 'gardentime'
}

# Paths to data files
SCRIPT_DIR = Path(__file__).parent
PARSED_DIR = SCRIPT_DIR / 'parsed'
PESTS_DISEASES_FILE = SCRIPT_DIR / 'pests-diseases-database.json'
TREFLE_FILE = SCRIPT_DIR / 'trefle-botanical-data.json'


def get_db_connection():
    """Create database connection"""
    return psycopg2.connect(**DB_CONFIG)


def clear_existing_plants(conn):
    """Clear existing plant data"""
    print("\n=== Clearing existing plant data ===")
    with conn.cursor() as cur:
        # Delete in order due to foreign key constraints
        cur.execute("DELETE FROM rotation_recommendation_cache;")
        cur.execute("DELETE FROM plant_pests;")
        cur.execute("DELETE FROM plant_diseases;")
        cur.execute("DELETE FROM plant_companions;")
        cur.execute("DELETE FROM plant_edible_parts;")
        cur.execute("DELETE FROM crop_record_entity;")
        cur.execute("DELETE FROM planned_crops;")
        cur.execute("DELETE FROM plant_details;")
        cur.execute("DELETE FROM plant_entity;")
        
        # Reset sequence
        cur.execute("ALTER SEQUENCE plant_entity_id_seq RESTART WITH 1;")
        
        conn.commit()
        print("✓ Cleared all existing plant data")


def load_json_file(filepath: Path) -> dict:
    """Load JSON file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def normalize_name(name: str) -> str:
    """Normalize pest/disease names for matching"""
    # Remove common prefixes/suffixes
    name = re.sub(r'^(And|For|More|Remove|Prevention|Watering|Overharvesting|Nearby|Releasing|Vigor|Debris|Vines|Winds|Will|With)\s+', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\s+(Insect|Wilt|Spot|Rot|Rust|Mildew)$', r' \1', name, flags=re.IGNORECASE)
    return name.strip()


def get_family_id(conn, family_name: str) -> Optional[int]:
    """Get family ID from name"""
    if not family_name:
        return None
    
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM plant_families WHERE name = %s", (family_name,))
        result = cur.fetchone()
        return result[0] if result else None


def determine_feeder_type(family_name: str, is_nitrogen_fixer: bool) -> Optional[str]:
    """Determine feeder type based on family"""
    if is_nitrogen_fixer:
        return 'NITROGEN_FIXER'
    
    feeder_map = {
        'Solanaceae': 'HEAVY',      # Tomatoes, peppers, potatoes
        'Cucurbitaceae': 'HEAVY',   # Squash, cucumbers, melons
        'Brassicaceae': 'HEAVY',    # Cabbage, broccoli
        'Poaceae': 'HEAVY',         # Corn
        'Apiaceae': 'MODERATE',     # Carrots, celery
        'Amaranthaceae': 'MODERATE', # Beets, spinach, chard
        'Amaryllidaceae': 'LIGHT',  # Onions, garlic
        'Asteraceae': 'LIGHT',      # Lettuce
        'Lamiaceae': 'LIGHT',       # Herbs
    }
    
    return feeder_map.get(family_name)


def import_plants(conn):
    """Import all plants from parsed JSON files"""
    print("\n=== Importing plants ===")
    
    # Load trefle data
    trefle_data = load_json_file(TREFLE_FILE)
    trefle_by_slug = {p['slug']: p for p in trefle_data['plants']}
    
    # Load parsed plant files
    parsed_files = sorted(PARSED_DIR.glob('*.json'))
    # Filter out scraped files
    parsed_files = [f for f in parsed_files if '_scraped_' not in f.name]
    
    plants_imported = 0
    plants_data = []
    
    for filepath in parsed_files:
        slug = filepath.stem  # filename without extension
        
        # Load parsed data
        parsed = load_json_file(filepath)
        
        # Get trefle data if available
        trefle = trefle_by_slug.get(slug, {})
        scientific_name = trefle.get('scientific_name')
        family_name = trefle.get('family')
        genus = trefle.get('genus')
        
        # Get family ID
        family_id = get_family_id(conn, family_name)
        
        # Determine if nitrogen fixer (Fabaceae family)
        is_nitrogen_fixer = family_name == 'Fabaceae'
        
        # Determine feeder type
        feeder_type = determine_feeder_type(family_name, is_nitrogen_fixer)
        
        # Extract common name (clean it up)
        common_name = parsed.get('commonName', slug.replace('-', ' ').title())
        
        plants_data.append({
            'name': common_name,
            'scientific_name': scientific_name,
            'slug': slug,
            'family_id': family_id,
            'genus': genus,
            'cycle': parsed.get('cycle'),
            'sun_needs': parsed.get('sunNeeds'),
            'water_needs': parsed.get('waterNeeds'),
            'root_depth': parsed.get('rootDepth'),
            'growth_habit': parsed.get('growthHabit'),
            'soil_temp_min_f': parsed.get('soilTempMinF'),
            'soil_temp_optimal_f': parsed.get('soilTempOptimalF'),
            'frost_tolerant': parsed.get('frostTolerant', False),
            'spacing_min_inches': parsed.get('spacingMin'),
            'spacing_max_inches': parsed.get('spacingMax'),
            'planting_depth_inches': parsed.get('plantingDepthInches'),
            'container_suitable': parsed.get('containerSuitable', False),
            'requires_staking': parsed.get('requiresStaking', False),
            'requires_pruning': parsed.get('requiresPruning', False),
            'days_to_maturity_min': parsed.get('daysToMaturityMin'),
            'days_to_maturity_max': parsed.get('daysToMaturityMax'),
            'watering_inches_per_week': parsed.get('wateringInchesPerWeek'),
            'fertilizing_frequency_weeks': parsed.get('fertilizingFrequencyWeeks'),
            'mulch_recommended': parsed.get('mulchRecommended', True),
            'notes': parsed.get('notes'),
            'is_nitrogen_fixer': is_nitrogen_fixer,
            'feeder_type': feeder_type,
            'edible_parts': parsed.get('edibleParts', [])
        })
    
    # Insert plants
    with conn.cursor() as cur:
        insert_sql = """
            INSERT INTO plant_entity (
                name, scientific_name, slug, family_id, genus,
                cycle, sun_needs, water_needs, root_depth, growth_habit,
                soil_temp_min_f, soil_temp_optimal_f, frost_tolerant,
                spacing_min_inches, spacing_max_inches, planting_depth_inches,
                container_suitable, requires_staking, requires_pruning,
                days_to_maturity_min, days_to_maturity_max,
                watering_inches_per_week, fertilizing_frequency_weeks,
                mulch_recommended, notes, is_nitrogen_fixer, feeder_type
            ) VALUES (
                %(name)s, %(scientific_name)s, %(slug)s, %(family_id)s, %(genus)s,
                %(cycle)s, %(sun_needs)s, %(water_needs)s, %(root_depth)s, %(growth_habit)s,
                %(soil_temp_min_f)s, %(soil_temp_optimal_f)s, %(frost_tolerant)s,
                %(spacing_min_inches)s, %(spacing_max_inches)s, %(planting_depth_inches)s,
                %(container_suitable)s, %(requires_staking)s, %(requires_pruning)s,
                %(days_to_maturity_min)s, %(days_to_maturity_max)s,
                %(watering_inches_per_week)s, %(fertilizing_frequency_weeks)s,
                %(mulch_recommended)s, %(notes)s, %(is_nitrogen_fixer)s, %(feeder_type)s
            ) RETURNING id, slug
        """
        
        plant_id_map = {}  # slug -> id
        
        for plant_data in plants_data:
            edible_parts = plant_data.pop('edible_parts')  # Remove from dict for insert
            cur.execute(insert_sql, plant_data)
            plant_id, slug = cur.fetchone()
            plant_id_map[slug] = (plant_id, edible_parts)
            plants_imported += 1
        
        conn.commit()
    
    print(f"✓ Imported {plants_imported} plants")
    return plant_id_map


def import_edible_parts(conn, plant_id_map: Dict[str, tuple]):
    """Import edible parts for plants"""
    print("\n=== Importing edible parts ===")
    
    # Get edible part IDs
    with conn.cursor() as cur:
        cur.execute("SELECT id, name FROM edible_parts")
        edible_part_ids = {name: id for id, name in cur.fetchall()}
    
    # Insert plant-edible part relationships
    relationships = []
    for slug, (plant_id, edible_parts) in plant_id_map.items():
        for part in edible_parts:
            if part in edible_part_ids:
                relationships.append((plant_id, edible_part_ids[part]))
    
    with conn.cursor() as cur:
        execute_batch(
            cur,
            "INSERT INTO plant_edible_parts (plant_id, edible_part_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            relationships
        )
        conn.commit()
    
    print(f"✓ Imported {len(relationships)} edible part relationships")


def import_pests_and_diseases(conn, plant_id_map: Dict[str, tuple]):
    """Import pests and diseases and link to plants"""
    print("\n=== Importing pests and diseases ===")
    
    # Load pest/disease data
    pd_data = load_json_file(PESTS_DISEASES_FILE)
    
    # Get or create pests
    pest_id_map = {}
    with conn.cursor() as cur:
        for pest_name, pest_data in pd_data['pests_index'].items():
            normalized = normalize_name(pest_name)
            
            cur.execute("""
                INSERT INTO pests (name, common_name, description)
                VALUES (%s, %s, %s)
                ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                RETURNING id
            """, (normalized, pest_name, f"Affects {pest_data['plant_count']} plants"))
            
            pest_id_map[pest_name] = cur.fetchone()[0]
        
        conn.commit()
    
    print(f"✓ Imported {len(pest_id_map)} pests")
    
    # Get or create diseases
    disease_id_map = {}
    with conn.cursor() as cur:
        for disease_name, disease_data in pd_data['diseases_index'].items():
            normalized = normalize_name(disease_name)
            
            cur.execute("""
                INSERT INTO diseases (name, common_name, description)
                VALUES (%s, %s, %s)
                ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                RETURNING id
            """, (normalized, disease_name, f"Affects {disease_data['plant_count']} plants"))
            
            disease_id_map[disease_name] = cur.fetchone()[0]
        
        conn.commit()
    
    print(f"✓ Imported {len(disease_id_map)} diseases")
    
    # Link plants to pests and diseases
    plant_pest_links = []
    plant_disease_links = []
    
    for plant_data in pd_data['plants']:
        slug = plant_data['slug']
        
        if slug not in plant_id_map:
            continue
        
        plant_id = plant_id_map[slug][0]
        
        # Link pests
        for pest_name in plant_data.get('pests', []):
            if pest_name in pest_id_map:
                plant_pest_links.append((plant_id, pest_id_map[pest_name]))
        
        # Link diseases
        for disease_name in plant_data.get('diseases', []):
            if disease_name in disease_id_map:
                plant_disease_links.append((plant_id, disease_id_map[disease_name]))
    
    # Insert links
    with conn.cursor() as cur:
        execute_batch(
            cur,
            "INSERT INTO plant_pests (plant_id, pest_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            plant_pest_links
        )
        
        execute_batch(
            cur,
            "INSERT INTO plant_diseases (plant_id, disease_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            plant_disease_links
        )
        
        conn.commit()
    
    print(f"✓ Linked {len(plant_pest_links)} plant-pest relationships")
    print(f"✓ Linked {len(plant_disease_links)} plant-disease relationships")


def verify_import(conn):
    """Verify the import was successful"""
    print("\n=== Verifying import ===")
    
    with conn.cursor() as cur:
        # Count plants
        cur.execute("SELECT COUNT(*) FROM plant_entity")
        plant_count = cur.fetchone()[0]
        print(f"✓ Total plants: {plant_count}")
        
        # Count plants with families
        cur.execute("SELECT COUNT(*) FROM plant_entity WHERE family_id IS NOT NULL")
        family_count = cur.fetchone()[0]
        print(f"✓ Plants with families: {family_count}")
        
        # Count plants with slugs
        cur.execute("SELECT COUNT(*) FROM plant_entity WHERE slug IS NOT NULL")
        slug_count = cur.fetchone()[0]
        print(f"✓ Plants with slugs: {slug_count}")
        
        # Count edible part relationships
        cur.execute("SELECT COUNT(*) FROM plant_edible_parts")
        edible_count = cur.fetchone()[0]
        print(f"✓ Edible part relationships: {edible_count}")
        
        # Count pests
        cur.execute("SELECT COUNT(*) FROM pests")
        pest_count = cur.fetchone()[0]
        print(f"✓ Total pests: {pest_count}")
        
        # Count diseases
        cur.execute("SELECT COUNT(*) FROM diseases")
        disease_count = cur.fetchone()[0]
        print(f"✓ Total diseases: {disease_count}")
        
        # Count plant-pest relationships
        cur.execute("SELECT COUNT(*) FROM plant_pests")
        pp_count = cur.fetchone()[0]
        print(f"✓ Plant-pest relationships: {pp_count}")
        
        # Count plant-disease relationships
        cur.execute("SELECT COUNT(*) FROM plant_diseases")
        pd_count = cur.fetchone()[0]
        print(f"✓ Plant-disease relationships: {pd_count}")
        
        # Show sample of imported plants
        print("\nSample of imported plants:")
        cur.execute("""
            SELECT p.name, p.slug, pf.name as family, p.feeder_type
            FROM plant_entity p
            LEFT JOIN plant_families pf ON p.family_id = pf.id
            ORDER BY p.id
            LIMIT 10
        """)
        
        for row in cur.fetchall():
            print(f"  - {row[0]:20s} ({row[1]:20s}) Family: {row[2] or 'N/A':20s} Feeder: {row[3] or 'N/A'}")


def main():
    """Main import process"""
    print("=" * 70)
    print("GardenTime Plant Data Import")
    print("=" * 70)
    
    try:
        # Connect to database
        conn = get_db_connection()
        print("✓ Connected to database")
        
        # Clear existing data
        clear_existing_plants(conn)
        
        # Import plants
        plant_id_map = import_plants(conn)
        
        # Import edible parts
        import_edible_parts(conn, plant_id_map)
        
        # Import pests and diseases
        import_pests_and_diseases(conn, plant_id_map)
        
        # Verify
        verify_import(conn)
        
        print("\n" + "=" * 70)
        print("✓ Import completed successfully!")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n✗ Error during import: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    finally:
        if conn:
            conn.close()
    
    return 0


if __name__ == '__main__':
    exit(main())
