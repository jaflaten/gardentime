#!/usr/bin/env python3
"""
Import plant data to PostgreSQL database for crop rotation planning.
Imports: parsed plant data, Trefle botanical data, pests/diseases, and companionship data.
"""

import json
import os
import sys
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime
from pathlib import Path

# Database connection
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'gardentime',
    'user': 'gardentime',
    'password': 'gardentime'
}

# Data file paths
BASE_DIR = Path(__file__).parent
PARSED_DIR = BASE_DIR / 'parsed'
TREFLE_DATA = BASE_DIR / 'trefle-botanical-data.json'
PEST_DISEASE_DATA = BASE_DIR / 'pests-diseases-database.json'
COMPANIONSHIP_DATA = BASE_DIR.parent / 'companionship' / 'companionship-extended2.json'

# Mapping for feeder types based on plant family/type
FEEDER_TYPE_MAPPING = {
    'Solanaceae': 'HEAVY',  # Tomatoes, peppers
    'Cucurbitaceae': 'HEAVY',  # Squash, cucumbers
    'Poaceae': 'HEAVY',  # Corn
    'Brassicaceae': 'MODERATE',  # Cabbage, broccoli
    'Apiaceae': 'MODERATE',  # Carrots, celery
    'Amaranthaceae': 'MODERATE',  # Beets, spinach
    'Asteraceae': 'LIGHT',  # Lettuce
    'Amaryllidaceae': 'LIGHT',  # Onions, garlic
    'Fabaceae': 'NITROGEN_FIXER',  # Beans, peas
}

def connect_db():
    """Connect to PostgreSQL database."""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

def load_json(file_path):
    """Load JSON file."""
    if not os.path.exists(file_path):
        print(f"Warning: File not found: {file_path}")
        return None
    
    with open(file_path, 'r') as f:
        return json.load(f)

def slugify(text):
    """Convert text to URL-friendly slug."""
    return text.lower().replace(' ', '-').replace('_', '-')

def insert_plant_families(conn):
    """Plant families are already inserted via migration V9."""
    print("✓ Plant families already seeded via migration")

def get_family_id(cursor, family_name):
    """Get plant family ID by name."""
    if not family_name:
        return None
    
    cursor.execute("SELECT id FROM plant_families WHERE name = %s", (family_name,))
    result = cursor.fetchone()
    return result[0] if result else None

def insert_edible_parts(conn):
    """Edible parts are already inserted via migration V9."""
    print("✓ Edible parts already seeded via migration")

def get_edible_part_ids(cursor, edible_parts):
    """Get edible part IDs from list of names."""
    if not edible_parts:
        return []
    
    placeholders = ','.join(['%s'] * len(edible_parts))
    cursor.execute(f"SELECT id, name FROM edible_parts WHERE name IN ({placeholders})", edible_parts)
    return {name: id for id, name in cursor.fetchall()}

def import_plants(conn):
    """Import plant data from parsed JSON files and Trefle data."""
    cursor = conn.cursor()
    
    # Load Trefle data
    trefle_data = load_json(TREFLE_DATA)
    if not trefle_data:
        print("Warning: No Trefle data found")
        trefle_lookup = {}
    else:
        trefle_lookup = {p['slug']: p for p in trefle_data.get('plants', [])}
    
    # Get all parsed plant attribute files
    attributes_dir = BASE_DIR / 'plant-attributes'
    if not attributes_dir.exists():
        print(f"\nNo plant-attributes directory found. Plants need to be parsed first.")
        print(f"Run parse-all-plants.py to extract attributes from scraped data.")
        return
    
    parsed_files = list(attributes_dir.glob('*_attributes.json'))
    print(f"\nImporting {len(parsed_files)} plants...")
    
    imported = 0
    skipped = 0
    errors = 0
    
    for file_path in parsed_files:
        try:
            plant_data = load_json(file_path)
            if not plant_data:
                skipped += 1
                continue
            
            # Extract slug from filename (e.g., "tomatoes_attributes.json" -> "tomatoes")
            filename = file_path.stem
            slug = filename.replace('_attributes', '')
            
            # Get Trefle data if available
            trefle_info = trefle_lookup.get(slug, {})
            trefle_found = trefle_info.get('trefle_found', False)
            family_name = trefle_info.get('family') if trefle_found else None
            genus = trefle_info.get('genus') if trefle_found else None
            
            # Get family ID
            family_id = get_family_id(cursor, family_name)
            
            # Determine feeder type
            feeder_type = FEEDER_TYPE_MAPPING.get(family_name, 'MODERATE')
            is_nitrogen_fixer = (family_name == 'Fabaceae')
            
            # Check if plant already exists
            cursor.execute("SELECT id FROM plant_entity WHERE slug = %s", (slug,))
            existing = cursor.fetchone()
            
            if existing:
                plant_id = existing[0]
                # Update existing plant
                cursor.execute("""
                    UPDATE plant_entity SET
                        name = %s,
                        family_id = %s,
                        genus = %s,
                        cycle = %s,
                        sun_needs = %s,
                        water_needs = %s,
                        root_depth = %s,
                        growth_habit = %s,
                        soil_temp_min_f = %s,
                        soil_temp_optimal_f = %s,
                        frost_tolerant = %s,
                        spacing_min_inches = %s,
                        spacing_max_inches = %s,
                        planting_depth_inches = %s,
                        container_suitable = %s,
                        requires_staking = %s,
                        requires_pruning = %s,
                        days_to_maturity_min = %s,
                        days_to_maturity_max = %s,
                        watering_inches_per_week = %s,
                        fertilizing_frequency_weeks = %s,
                        mulch_recommended = %s,
                        notes = %s,
                        is_nitrogen_fixer = %s,
                        feeder_type = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (
                    plant_data.get('commonName'),
                    family_id,
                    genus,
                    plant_data.get('cycle'),
                    plant_data.get('sunNeeds'),
                    plant_data.get('waterNeeds'),
                    plant_data.get('rootDepth'),
                    plant_data.get('growthHabit'),
                    plant_data.get('soilTempMinF'),
                    plant_data.get('soilTempOptimalF'),
                    plant_data.get('frostTolerant'),
                    plant_data.get('spacingMin'),
                    plant_data.get('spacingMax'),
                    plant_data.get('plantingDepthInches'),
                    plant_data.get('containerSuitable'),
                    plant_data.get('requiresStaking'),
                    plant_data.get('requiresPruning'),
                    plant_data.get('daysToMaturityMin'),
                    plant_data.get('daysToMaturityMax'),
                    plant_data.get('wateringInchesPerWeek'),
                    plant_data.get('fertilizingFrequencyWeeks'),
                    plant_data.get('mulchRecommended'),
                    plant_data.get('notes'),
                    is_nitrogen_fixer,
                    feeder_type,
                    plant_id
                ))
            else:
                # Insert new plant
                cursor.execute("""
                    INSERT INTO plant_entity (
                        name, slug, family_id, genus, cycle, sun_needs, water_needs,
                        root_depth, growth_habit, soil_temp_min_f, soil_temp_optimal_f,
                        frost_tolerant, spacing_min_inches, spacing_max_inches,
                        planting_depth_inches, container_suitable, requires_staking,
                        requires_pruning, days_to_maturity_min, days_to_maturity_max,
                        watering_inches_per_week, fertilizing_frequency_weeks,
                        mulch_recommended, notes, is_nitrogen_fixer, feeder_type
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    ) RETURNING id
                """, (
                    plant_data.get('commonName'),
                    slug,
                    family_id,
                    genus,
                    plant_data.get('cycle'),
                    plant_data.get('sunNeeds'),
                    plant_data.get('waterNeeds'),
                    plant_data.get('rootDepth'),
                    plant_data.get('growthHabit'),
                    plant_data.get('soilTempMinF'),
                    plant_data.get('soilTempOptimalF'),
                    plant_data.get('frostTolerant'),
                    plant_data.get('spacingMin'),
                    plant_data.get('spacingMax'),
                    plant_data.get('plantingDepthInches'),
                    plant_data.get('containerSuitable'),
                    plant_data.get('requiresStaking'),
                    plant_data.get('requiresPruning'),
                    plant_data.get('daysToMaturityMin'),
                    plant_data.get('daysToMaturityMax'),
                    plant_data.get('wateringInchesPerWeek'),
                    plant_data.get('fertilizingFrequencyWeeks'),
                    plant_data.get('mulchRecommended'),
                    plant_data.get('notes'),
                    is_nitrogen_fixer,
                    feeder_type
                ))
                plant_id = cursor.fetchone()[0]
            
            # Handle edible parts (many-to-many)
            edible_parts = plant_data.get('edibleParts', [])
            if edible_parts:
                # Delete existing associations
                cursor.execute("DELETE FROM plant_edible_parts WHERE plant_id = %s", (plant_id,))
                
                # Get edible part IDs
                edible_part_ids = get_edible_part_ids(cursor, edible_parts)
                
                # Insert new associations
                for part in edible_parts:
                    if part in edible_part_ids:
                        cursor.execute(
                            "INSERT INTO plant_edible_parts (plant_id, edible_part_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                            (plant_id, edible_part_ids[part])
                        )
            
            imported += 1
            if imported % 10 == 0:
                print(f"  Imported {imported} plants...")
                
        except Exception as e:
            print(f"Error importing {file_path.name}: {e}")
            errors += 1
            continue
    
    conn.commit()
    cursor.close()
    
    print(f"\n✓ Plants import complete:")
    print(f"  - Imported: {imported}")
    print(f"  - Skipped: {skipped}")
    print(f"  - Errors: {errors}")

def import_pests_diseases(conn):
    """Import pests and diseases from extracted data."""
    cursor = conn.cursor()
    
    pest_disease_data = load_json(PEST_DISEASE_DATA)
    if not pest_disease_data:
        print("Warning: No pest/disease data found")
        return
    
    print(f"\nImporting pests and diseases...")
    
    pest_id_map = {}
    disease_id_map = {}
    
    # Get all unique pests and diseases
    all_pests = set()
    all_diseases = set()
    
    for plant in pest_disease_data.get('plants', []):
        all_pests.update(plant.get('pests', []))
        all_diseases.update(plant.get('diseases', []))
    
    # Insert pests
    for pest_name in all_pests:
        cursor.execute("""
            INSERT INTO pests (name, common_name)
            VALUES (%s, %s)
            ON CONFLICT (name) DO UPDATE SET common_name = EXCLUDED.common_name
            RETURNING id
        """, (pest_name, pest_name))
        pest_id_map[pest_name] = cursor.fetchone()[0]
    
    print(f"  Inserted {len(all_pests)} pests")
    
    # Insert diseases
    for disease_name in all_diseases:
        cursor.execute("""
            INSERT INTO diseases (name, common_name)
            VALUES (%s, %s)
            ON CONFLICT (name) DO UPDATE SET common_name = EXCLUDED.common_name
            RETURNING id
        """, (disease_name, disease_name))
        disease_id_map[disease_name] = cursor.fetchone()[0]
    
    print(f"  Inserted {len(all_diseases)} diseases")
    
    # Link plants to pests and diseases
    for plant in pest_disease_data.get('plants', []):
        slug = plant.get('slug')
        
        # Get plant ID
        cursor.execute("SELECT id FROM plant_entity WHERE slug = %s", (slug,))
        result = cursor.fetchone()
        if not result:
            continue
        
        plant_id = result[0]
        
        # Link pests
        for pest_name in plant.get('pests', []):
            if pest_name in pest_id_map:
                cursor.execute("""
                    INSERT INTO plant_pests (plant_id, pest_id, severity)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (plant_id, pest_id) DO NOTHING
                """, (plant_id, pest_id_map[pest_name], 'MODERATE'))
        
        # Link diseases
        for disease_name in plant.get('diseases', []):
            if disease_name in disease_id_map:
                cursor.execute("""
                    INSERT INTO plant_diseases (plant_id, disease_id, severity)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (plant_id, disease_id) DO NOTHING
                """, (plant_id, disease_id_map[disease_name], 'MODERATE'))
    
    conn.commit()
    cursor.close()
    
    print(f"✓ Pests and diseases import complete")

def import_companionship(conn):
    """Import companionship data."""
    cursor = conn.cursor()
    
    companionship_data = load_json(COMPANIONSHIP_DATA)
    if not companionship_data:
        print("Warning: No companionship data found")
        return
    
    print(f"\nImporting companionship data...")
    
    # Build slug lookup for plants
    cursor.execute("SELECT id, slug, name FROM plant_entity")
    plants = cursor.fetchall()
    slug_to_id = {slug: id for id, slug, name in plants}
    name_to_id = {name.lower(): id for id, slug, name in plants}
    
    imported = 0
    skipped = 0
    
    for plant_name, companions in companionship_data.items():
        # Try to find plant ID by name (normalize)
        plant_slug = slugify(plant_name)
        plant_id = slug_to_id.get(plant_slug) or name_to_id.get(plant_name.lower())
        
        if not plant_id:
            skipped += 1
            continue
        
        for companion_name, relationship in companions.items():
            companion_slug = slugify(companion_name)
            companion_id = slug_to_id.get(companion_slug) or name_to_id.get(companion_name.lower())
            
            if not companion_id:
                continue
            
            # Normalize relationship
            if relationship.lower() == 'beneficial':
                rel = 'BENEFICIAL'
            elif relationship.lower() == 'unfavorable':
                rel = 'UNFAVORABLE'
            else:
                rel = 'NEUTRAL'
            
            # Insert companionship (bidirectional)
            cursor.execute("""
                INSERT INTO plant_companions (plant_id, companion_id, relationship)
                VALUES (%s, %s, %s)
                ON CONFLICT (plant_id, companion_id) DO UPDATE SET relationship = EXCLUDED.relationship
            """, (plant_id, companion_id, rel))
            
            imported += 1
    
    conn.commit()
    cursor.close()
    
    print(f"✓ Companionship import complete:")
    print(f"  - Imported: {imported} relationships")
    print(f"  - Skipped: {skipped} plants not found")

def main():
    """Main import process."""
    print("=" * 60)
    print("PLANT DATA IMPORT - Crop Rotation Database")
    print("=" * 60)
    
    conn = connect_db()
    
    try:
        # Import data in order
        insert_plant_families(conn)
        insert_edible_parts(conn)
        import_plants(conn)
        import_pests_diseases(conn)
        import_companionship(conn)
        
        print("\n" + "=" * 60)
        print("✓ ALL DATA IMPORTED SUCCESSFULLY")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ Error during import: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()

if __name__ == '__main__':
    main()
