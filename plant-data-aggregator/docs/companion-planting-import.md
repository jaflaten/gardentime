# Companion Planting Data - Notes

## Data Source
- Primary: https://www.almanac.com/companion-planting-guide-vegetables
- User is compiling comprehensive list manually
- Will be imported once complete

## Database Schema (Already Exists)

The `companion_relationships` table is ready to receive this data:

```sql
CREATE TABLE companion_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plant_a_id UUID NOT NULL REFERENCES plants(id),
    plant_b_id UUID NOT NULL REFERENCES plants(id),
    relationship_type companion_relationship_type NOT NULL,
    reason TEXT,
    strength companion_strength,
    scientific_basis TEXT,
    source_id UUID REFERENCES sources(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT different_plants CHECK (plant_a_id != plant_b_id),
    CONSTRAINT ordered_relationship CHECK (plant_a_id < plant_b_id)
);
```

## Relationship Types

### Positive Relationships
- `ATTRACTS_BENEFICIAL_INSECTS` - Plant attracts pollinators or predatory insects
- `REPELS_PESTS` - Plant repels harmful insects/animals
- `IMPROVES_FLAVOR` - Enhances taste of companion
- `PROVIDES_SHADE` - Taller plant shades shorter sun-sensitive plant
- `PROVIDES_SUPPORT` - Physical support (e.g., corn for beans)
- `IMPROVES_SOIL` - Fixes nitrogen or adds nutrients
- `TRAP_CROP` - Sacrificial plant that attracts pests away

### Negative Relationships
- `INCOMPATIBLE` - General incompatibility
- `COMPETES_FOR_RESOURCES` - Water, nutrients, or space competition
- `ALLELOPATHIC` - Chemical inhibition

## Strength Levels
- `STRONG` - Well-documented, significant benefit/harm
- `MODERATE` - Some evidence, moderate benefit/harm
- `WEAK` - Anecdotal or minor benefit/harm

## Data Format (For Import)

### Option 1: CSV Format
```csv
plant_a,plant_b,relationship_type,strength,reason
Tomato,Basil,IMPROVES_FLAVOR,STRONG,"Basil repels tomato hornworms and improves tomato flavor"
Tomato,Carrot,REPELS_PESTS,MODERATE,"Carrots help aerate soil for tomato roots"
Tomato,Cabbage,INCOMPATIBLE,STRONG,"Both heavy feeders, compete for nutrients"
Carrot,Onion,REPELS_PESTS,STRONG,"Onions repel carrot fly"
```

### Option 2: JSON Format
```json
[
  {
    "plantA": "Tomato",
    "plantB": "Basil",
    "relationshipType": "IMPROVES_FLAVOR",
    "strength": "STRONG",
    "reason": "Basil repels tomato hornworms and improves tomato flavor",
    "scientificBasis": "Aromatic oils in basil confuse pest insects"
  },
  {
    "plantA": "Carrot",
    "plantB": "Onion",
    "relationshipType": "REPELS_PESTS",
    "strength": "STRONG",
    "reason": "Onions repel carrot fly"
  }
]
```

## Example Relationships from Almanac.com

### Tomato Companions
**Good:**
- Basil - improves flavor, repels pests
- Carrot - aerates soil
- Parsley - attracts beneficial insects
- Onion - repels pests

**Bad:**
- Cabbage family - compete for nutrients
- Corn - attracts tomato hornworm
- Fennel - allelopathic

### Bean Companions
**Good:**
- Corn - provides support for pole beans
- Carrot - benefits from nitrogen
- Cucumber - shares water/space well
- Radish - deters bean beetles

**Bad:**
- Onion family - inhibits growth
- Fennel - allelopathic

### Carrot Companions
**Good:**
- Onion - repels carrot fly
- Leek - repels carrot fly
- Tomato - helps aerate soil
- Radish - breaks up soil

**Bad:**
- Dill - can stunt growth if too close
- Parsnip - same family, attracts same pests

## Import Process (TODO)

1. **Receive Data from User**
   - Format: CSV or JSON
   - Validate completeness

2. **Create Import Service**
   ```kotlin
   class CompanionPlantingImportService {
       fun importFromCsv(file: File)
       fun importFromJson(json: String)
       fun validateRelationship(relationship: CompanionRelationship)
   }
   ```

3. **Match Plant Names**
   - Look up plants by common name
   - Handle variations (e.g., "Tomato" vs "Tomatoes")
   - Create missing plants if needed

4. **Insert Relationships**
   - Ensure plant_a_id < plant_b_id (constraint)
   - Avoid duplicates
   - Set source to "Almanac.com"

5. **Verification**
   - Count relationships per plant
   - Check for orphaned references
   - Validate enum values

## Queries for Seasonal Planning

### Find Good Companions for a Plant
```sql
SELECT 
    CASE 
        WHEN cr.plant_a_id = $plant_id THEN p.common_name 
        ELSE p2.common_name 
    END as companion,
    cr.relationship_type,
    cr.strength,
    cr.reason
FROM companion_relationships cr
LEFT JOIN plants p ON p.id = cr.plant_b_id
LEFT JOIN plants p2 ON p2.id = cr.plant_a_id
WHERE (cr.plant_a_id = $plant_id OR cr.plant_b_id = $plant_id)
  AND cr.relationship_type NOT IN ('INCOMPATIBLE', 'COMPETES_FOR_RESOURCES', 'ALLELOPATHIC')
ORDER BY 
    CASE cr.strength 
        WHEN 'STRONG' THEN 1 
        WHEN 'MODERATE' THEN 2 
        WHEN 'WEAK' THEN 3 
    END;
```

### Find Incompatible Plants
```sql
SELECT 
    CASE 
        WHEN cr.plant_a_id = $plant_id THEN p.common_name 
        ELSE p2.common_name 
    END as incompatible_plant,
    cr.relationship_type,
    cr.reason
FROM companion_relationships cr
LEFT JOIN plants p ON p.id = cr.plant_b_id
LEFT JOIN plants p2 ON p2.id = cr.plant_a_id
WHERE (cr.plant_a_id = $plant_id OR cr.plant_b_id = $plant_id)
  AND cr.relationship_type IN ('INCOMPATIBLE', 'COMPETES_FOR_RESOURCES', 'ALLELOPATHIC');
```

### Find Neighboring Plants in Garden
```sql
-- Get plants that are physically near each other
SELECT 
    p1.common_name as plant1,
    p2.common_name as plant2,
    ga1.name as area1,
    ga2.name as area2,
    cr.relationship_type,
    cr.reason
FROM garden_plantings gp1
JOIN garden_plantings gp2 ON gp1.garden_id = gp2.garden_id 
    AND gp1.id != gp2.id
JOIN plants p1 ON gp1.plant_id = p1.id
JOIN plants p2 ON gp2.plant_id = p2.id
JOIN grow_areas ga1 ON gp1.grow_area_id = ga1.id
JOIN grow_areas ga2 ON gp2.grow_area_id = ga2.id
LEFT JOIN companion_relationships cr ON 
    (cr.plant_a_id = p1.id AND cr.plant_b_id = p2.id) OR
    (cr.plant_a_id = p2.id AND cr.plant_b_id = p1.id)
WHERE gp1.garden_id = $garden_id
  AND gp1.season_id = $current_season
  -- Add spatial proximity filter based on grow_area positions
ORDER BY cr.relationship_type;
```

## Checklist

- [ ] User completes companion planting data compilation
- [ ] Decide on import format (CSV vs JSON)
- [ ] Create import service
- [ ] Test import with subset of data
- [ ] Full import
- [ ] Verify data integrity
- [ ] Create API endpoints to query relationships
- [ ] Integrate into seasonal planner
- [ ] Add UI to display compatibility
- [ ] Add warnings for incompatible pairings in garden

## Future Enhancements

- Scientific citations for relationships
- Images showing companion combinations
- Success ratings from user community
- Regional variations in effectiveness
- Seasonal timing considerations (some companions better in spring vs fall)
- Quantity recommendations (1 basil plant per 3 tomatoes, etc.)
