#!/usr/bin/env python3
"""
Import companion planting data into GardenTime database
Maps plant names and creates bidirectional relationships
"""

import json
import sys
from pathlib import Path
from typing import Dict, Set, Tuple
import psycopg2

# Database connection settings
DB_CONFIG = {
    'host': 'localhost',
    'port': '5432',
    'database': 'gardentime',
    'user': 'gardentime',
    'password': 'gardentime'
}

SCRIPT_DIR = Path(__file__).parent
COMPANION_FILE = SCRIPT_DIR / 'companionship-extended2.json'

# Map companion data names to database plant names
NAME_MAPPING = {
    # Exact matches (case differences)
    'Arugula': 'Arugula',
    'Asparagus': 'Asparagus',
    'Basil': 'Basil',
    'Broccoli': 'Broccoli',
    'Cabbage': 'Cabbage',
    'Carrot': 'Carrot',
    'Cauliflower': 'Cauliflower',
    'Celery': 'Celery',
    'Corn': 'Corn',
    'Cucumber': 'Cucumber',
    'Dill': 'Dill',
    'Fennel': 'Fennel',
    'Garlic': 'Garlic',
    'Kale': 'Kale',
    'Lettuce': 'Lettuce',
    'Mint': 'Mint',
    'Onion': 'Onion',
    'Parsley': 'Parsley',
    'Parsnip': 'Parsnip',
    'Pepper': 'Pepper',
    'Pumpkin': 'Pumpkin',
    'Radish': 'Radish',
    'Sage': 'Sage',
    'Spinach': 'Spinach',
    'Tomato': 'Tomato',
    'Turnip': 'Turnip',
    
    # Plural to singular
    'Beans': 'Bean',
    'Peas': 'Pea',
    'Brussels Sprouts': 'Brussels Sprouts',
    'Leek': 'Leek',
    'Leeks': 'Leek',
    'Shallots': 'Shallot',
    
    # Special mappings
    'Beetroot': 'Beet',
    'Potato': 'Planting, Growing, and Harvesting Potato',
    'Eggplant': 'Eggplant (Aubergines)',
    'Strawberries': 'Strawberry Plant',
    'Zucchini': 'Zucchini & Summer Squash',
    'Squash': 'Zucchini & Summer Squash',  # Map to same
    'Swiss Chard': 'Swiss Chard',
    
    # Herb mappings
    'Chives': 'Chive',
    'Cilantro': 'How to Plant and Grow Cilantro and Coriander',
    'Thyme': 'Thyme Plant',
    'Oregano': 'Oregano',
    'Rosemary': 'Rosemary',
}

# Plants to skip (not in database - ornamental flowers/herbs)
SKIP_PLANTS = {
    'Chamomile', 'Marigold', 'Nasturtium', 'Rue', 'Borage',
    'Calendula', 'Petunia', 'Zinnia', 'Lavender', 'Sunflower',
    'Most plants'  # Special placeholder
}

# Relationship type mapping
RELATIONSHIP_MAP = {
    'beneficial': 'BENEFICIAL',
    'unfavorable': 'UNFAVORABLE',
    'neutral': 'NEUTRAL'
}


def get_db_connection():
    """Create database connection"""
    return psycopg2.connect(**DB_CONFIG)


def load_companion_data():
    """Load companion planting JSON"""
    with open(COMPANION_FILE, 'r') as f:
        return json.load(f)


def get_plant_id_map(conn) -> Dict[str, int]:
    """Get mapping of plant name to ID from database"""
    with conn.cursor() as cur:
        cur.execute("SELECT id, name FROM plant_entity")
        return {name: id for id, name in cur.fetchall()}


def normalize_plant_name(name: str) -> str:
    """Normalize plant name for database lookup"""
    if name in SKIP_PLANTS:
        return None
    return NAME_MAPPING.get(name, name)


def clear_existing_companions(conn):
    """Clear existing companion planting data"""
    print("\n=== Clearing existing companion data ===")
    with conn.cursor() as cur:
        cur.execute("DELETE FROM plant_companions;")
        conn.commit()
    print("✓ Cleared existing companion relationships")


def import_companions(conn, companion_data: dict, plant_id_map: Dict[str, int]):
    """Import companion planting relationships"""
    print("\n=== Importing companion relationships ===")
    
    relationships = []
    skipped_plants = set()
    unmapped_plants = set()
    processed_pairs = set()  # Track to avoid duplicates
    
    for plant_name, companions in companion_data.items():
        # Normalize source plant name
        normalized_plant = normalize_plant_name(plant_name)
        
        if normalized_plant is None:
            skipped_plants.add(plant_name)
            continue
        
        if normalized_plant not in plant_id_map:
            unmapped_plants.add(f"{plant_name} → {normalized_plant}")
            continue
        
        plant_id = plant_id_map[normalized_plant]
        
        for companion_name, relationship in companions.items():
            # Normalize companion plant name
            normalized_companion = normalize_plant_name(companion_name)
            
            if normalized_companion is None:
                skipped_plants.add(companion_name)
                continue
            
            if normalized_companion not in plant_id_map:
                unmapped_plants.add(f"{companion_name} → {normalized_companion}")
                continue
            
            companion_id = plant_id_map[normalized_companion]
            
            # Skip self-references
            if plant_id == companion_id:
                continue
            
            # Map relationship type
            rel_type = RELATIONSHIP_MAP.get(relationship.lower())
            if not rel_type:
                print(f"Warning: Unknown relationship type '{relationship}' for {plant_name} → {companion_name}")
                continue
            
            # Create unique key for this pair (order-independent)
            pair_key = tuple(sorted([plant_id, companion_id]))
            
            # Only add if not already processed
            if pair_key not in processed_pairs:
                relationships.append((plant_id, companion_id, rel_type))
                processed_pairs.add(pair_key)
    
    # Insert relationships
    if relationships:
        with conn.cursor() as cur:
            cur.executemany("""
                INSERT INTO plant_companions (plant_id, companion_id, relationship)
                VALUES (%s, %s, %s)
                ON CONFLICT (plant_id, companion_id) DO UPDATE
                SET relationship = EXCLUDED.relationship
            """, relationships)
            conn.commit()
    
    print(f"✓ Imported {len(relationships)} companion relationships")
    
    if skipped_plants:
        print(f"\nSkipped {len(skipped_plants)} ornamental/non-vegetable plants:")
        for plant in sorted(skipped_plants):
            print(f"  - {plant}")
    
    if unmapped_plants:
        print(f"\nWarning: {len(unmapped_plants)} plants could not be mapped:")
        for mapping in sorted(unmapped_plants):
            print(f"  - {mapping}")
    
    return len(relationships), skipped_plants, unmapped_plants


def analyze_coverage(conn, plant_id_map: Dict[str, int]):
    """Analyze companion data coverage"""
    print("\n=== Analyzing coverage ===")
    
    with conn.cursor() as cur:
        # Count plants with companion data
        cur.execute("""
            SELECT COUNT(DISTINCT p.id)
            FROM plant_entity p
            WHERE EXISTS (
                SELECT 1 FROM plant_companions pc
                WHERE pc.plant_id = p.id OR pc.companion_id = p.id
            )
        """)
        plants_with_data = cur.fetchone()[0]
        
        # Get plants without companion data
        cur.execute("""
            SELECT p.name
            FROM plant_entity p
            WHERE NOT EXISTS (
                SELECT 1 FROM plant_companions pc
                WHERE pc.plant_id = p.id OR pc.companion_id = p.id
            )
            ORDER BY p.name
        """)
        plants_without_data = [row[0] for row in cur.fetchall()]
        
        # Count by relationship type
        cur.execute("""
            SELECT relationship, COUNT(*) as count
            FROM plant_companions
            GROUP BY relationship
            ORDER BY count DESC
        """)
        by_relationship = cur.fetchall()
    
    total_plants = len(plant_id_map)
    print(f"✓ Total plants in database: {total_plants}")
    print(f"✓ Plants with companion data: {plants_with_data} ({plants_with_data/total_plants*100:.1f}%)")
    print(f"✓ Plants without companion data: {len(plants_without_data)}")
    
    print("\nRelationships by type:")
    for rel_type, count in by_relationship:
        print(f"  - {rel_type}: {count}")
    
    print(f"\nPlants missing companion data ({len(plants_without_data)}):")
    for plant in plants_without_data:
        print(f"  - {plant}")


def verify_relationships(conn):
    """Verify imported relationships with samples"""
    print("\n=== Verifying relationships ===")
    
    with conn.cursor() as cur:
        # Sample beneficial relationships
        cur.execute("""
            SELECT p1.name as plant, p2.name as companion
            FROM plant_companions pc
            JOIN plant_entity p1 ON pc.plant_id = p1.id
            JOIN plant_entity p2 ON pc.companion_id = p2.id
            WHERE pc.relationship = 'BENEFICIAL'
            ORDER BY p1.name
            LIMIT 10
        """)
        
        print("\nSample beneficial relationships:")
        for plant, companion in cur.fetchall():
            print(f"  ✓ {plant} + {companion}")
        
        # Sample unfavorable relationships
        cur.execute("""
            SELECT p1.name as plant, p2.name as companion
            FROM plant_companions pc
            JOIN plant_entity p1 ON pc.plant_id = p1.id
            JOIN plant_entity p2 ON pc.companion_id = p2.id
            WHERE pc.relationship = 'UNFAVORABLE'
            ORDER BY p1.name
            LIMIT 10
        """)
        
        print("\nSample unfavorable relationships:")
        for plant, companion in cur.fetchall():
            print(f"  ✗ {plant} + {companion}")


def main():
    """Main import process"""
    print("=" * 70)
    print("GardenTime Companion Planting Data Import")
    print("=" * 70)
    
    try:
        # Connect to database
        conn = get_db_connection()
        print("✓ Connected to database")
        
        # Load data
        companion_data = load_companion_data()
        print(f"✓ Loaded companion data for {len(companion_data)} plants")
        
        # Get plant ID mapping
        plant_id_map = get_plant_id_map(conn)
        print(f"✓ Found {len(plant_id_map)} plants in database")
        
        # Clear existing data
        clear_existing_companions(conn)
        
        # Import companion relationships
        count, skipped, unmapped = import_companions(conn, companion_data, plant_id_map)
        
        # Analyze coverage
        analyze_coverage(conn, plant_id_map)
        
        # Verify with samples
        verify_relationships(conn)
        
        print("\n" + "=" * 70)
        print("✓ Import completed successfully!")
        print("=" * 70)
        
        return 0
        
    except Exception as e:
        print(f"\n✗ Error during import: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    finally:
        if conn:
            conn.close()


if __name__ == '__main__':
    sys.exit(main())
