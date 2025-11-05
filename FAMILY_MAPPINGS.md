# Plants Without Family Mapping

These 33 plants need family assignment for proper crop rotation planning.

## Manual Family Mappings Needed

### Rosaceae (Rose family) - Fruits
- ✅ Strawberries (already mapped)
- ✅ Raspberries (already mapped)
- apples → Rosaceae
- blackberries → Rosaceae
- cherries → Rosaceae
- peaches → Rosaceae
- pears → Rosaceae
- plums → Rosaceae

### Brassicaceae (Cabbage family) - Cruciferous
- cauliflower → Brassicaceae
- collards → Brassicaceae
- kohlrabi → Brassicaceae
- mustard-greens → Brassicaceae
- rutabagas → Brassicaceae
- horseradish → Brassicaceae

### Asteraceae (Daisy family)
- artichokes → Asteraceae

### Asparagaceae (Asparagus family)
- asparagus → Asparagaceae

### Apiaceae (Carrot family)
- fennel → Apiaceae

### Cucurbitaceae (Cucurbit family)
- cantaloupes → Cucurbitaceae
- honeydew-melons → Cucurbitaceae
- watermelon → Cucurbitaceae

### Solanaceae (Nightshade family)
- tomatillos → Solanaceae

### Fabaceae (Legume family)
- edamame → Fabaceae
- fava-beans → Fabaceae
- peanuts → Fabaceae

### Amaryllidaceae (Allium family)
- shallots → Amaryllidaceae

### Vitaceae (Grape family)
- grapes → Vitaceae

### Ericaceae (Heath family)
- elderberries → Ericaceae
- currants → Ericaceae (actually Grossulariaceae, but related)
- gooseberries → Ericaceae (actually Grossulariaceae)
- goji-berries → Solanaceae (actually a nightshade!)

### Moraceae (Fig family)
- figs → Moraceae (need to add this family)

### Malvaceae (Mallow family)
- okra → Malvaceae

### Polygonaceae (Buckwheat family)
- rhubarb → Polygonaceae

### Asteraceae (Daisy family)
- salsify → Asteraceae

### Brassicaceae (actually!)
- microgreens → depends on type, skip for now

## Missing Families to Add

Need to add these to `plant_families` table:

```sql
INSERT INTO plant_families (name, common_name, rotation_years_min, rotation_years_max, description) VALUES
    ('Moraceae', 'Fig family', 0, 0, 'Figs. Long-lived perennial trees.'),
    ('Grossulariaceae', 'Currant family', 0, 0, 'Currants, gooseberries. Perennial shrubs.')
ON CONFLICT (name) DO NOTHING;
```

## SQL Update Statements

```sql
-- Update plants with families

-- Rosaceae fruits
UPDATE plant_entity SET family_id = (SELECT id FROM plant_families WHERE name = 'Rosaceae')
WHERE slug IN ('apples', 'blackberries', 'cherries', 'peaches', 'pears', 'plums');

-- Brassicaceae cruciferous
UPDATE plant_entity SET family_id = (SELECT id FROM plant_families WHERE name = 'Brassicaceae')
WHERE slug IN ('cauliflower', 'collards', 'kohlrabi', 'mustard-greens', 'rutabagas', 'horseradish');

-- Asteraceae
UPDATE plant_entity SET family_id = (SELECT id FROM plant_families WHERE name = 'Asteraceae')
WHERE slug IN ('artichokes', 'salsify');

-- Asparagaceae
UPDATE plant_entity SET family_id = (SELECT id FROM plant_families WHERE name = 'Asparagaceae')
WHERE slug = 'asparagus';

-- Apiaceae
UPDATE plant_entity SET family_id = (SELECT id FROM plant_families WHERE name = 'Apiaceae')
WHERE slug = 'fennel';

-- Cucurbitaceae
UPDATE plant_entity SET family_id = (SELECT id FROM plant_families WHERE name = 'Cucurbitaceae')
WHERE slug IN ('cantaloupes', 'honeydew-melons', 'watermelon');

-- Solanaceae
UPDATE plant_entity SET family_id = (SELECT id FROM plant_families WHERE name = 'Solanaceae')
WHERE slug IN ('tomatillos', 'goji-berries');

-- Fabaceae
UPDATE plant_entity SET family_id = (SELECT id FROM plant_families WHERE name = 'Fabaceae'),
                        is_nitrogen_fixer = true,
                        feeder_type = 'NITROGEN_FIXER'
WHERE slug IN ('edamame', 'fava-beans', 'peanuts');

-- Amaryllidaceae
UPDATE plant_entity SET family_id = (SELECT id FROM plant_families WHERE name = 'Amaryllidaceae'),
                        feeder_type = 'LIGHT'
WHERE slug = 'shallots';

-- Vitaceae
UPDATE plant_entity SET family_id = (SELECT id FROM plant_families WHERE name = 'Vitaceae')
WHERE slug = 'grapes';

-- Ericaceae
UPDATE plant_entity SET family_id = (SELECT id FROM plant_families WHERE name = 'Ericaceae')
WHERE slug = 'elderberries';

-- Malvaceae
UPDATE plant_entity SET family_id = (SELECT id FROM plant_families WHERE name = 'Malvaceae')
WHERE slug = 'okra';

-- Polygonaceae
UPDATE plant_entity SET family_id = (SELECT id FROM plant_families WHERE name = 'Polygonaceae')
WHERE slug = 'rhubarb';

-- Add Moraceae family and update figs
INSERT INTO plant_families (name, common_name, rotation_years_min, rotation_years_max, description) VALUES
    ('Moraceae', 'Fig family', 0, 0, 'Figs. Long-lived perennial trees.')
ON CONFLICT (name) DO NOTHING;

UPDATE plant_entity SET family_id = (SELECT id FROM plant_families WHERE name = 'Moraceae')
WHERE slug = 'figs';

-- Add Grossulariaceae family and update currants/gooseberries
INSERT INTO plant_families (name, common_name, rotation_years_min, rotation_years_max, description) VALUES
    ('Grossulariaceae', 'Currant family', 0, 0, 'Currants, gooseberries. Perennial shrubs.')
ON CONFLICT (name) DO NOTHING;

UPDATE plant_entity SET family_id = (SELECT id FROM plant_families WHERE name = 'Grossulariaceae')
WHERE slug IN ('currants', 'gooseberries');
```

## To Apply

Run the SQL statements above to complete family mappings. After this:
- 73/76 plants will have families (96%)
- Only microgreens, and 2 others will remain unmapped
- All major vegetable families will be covered
