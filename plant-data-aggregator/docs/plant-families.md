# Plant Families Reference

## Why Plant Families Matter

In regenerative farming and sustainable gardening, understanding plant families is crucial for:

1. **Crop Rotation:** Avoid planting the same family in the same location year after year
2. **Pest Management:** Related plants attract similar pests and diseases
3. **Soil Health:** Different families have different nutrient needs and contributions
4. **Companion Planting:** Some families naturally complement each other

## Major Vegetable Families

### Solanaceae (Nightshade Family)
**Members:** Tomatoes, Peppers, Potatoes, Eggplant, Tomatillos

**Characteristics:**
- Heavy feeders (nitrogen, phosphorus, potassium)
- Susceptible to similar diseases (early/late blight, mosaic virus)
- Like warm weather
- Most are frost-sensitive

**Rotation Notes:**
- Don't follow with another Solanaceae for 3-4 years
- Good to follow legumes (benefit from fixed nitrogen)
- Avoid planting near each other (disease transmission)

---

### Brassicaceae (Cabbage/Mustard Family)
**Members:** Broccoli, Cabbage, Kale, Cauliflower, Radishes, Turnips, Arugula, Mustard Greens

**Characteristics:**
- Heavy feeders (especially nitrogen)
- Cool-season crops
- Many are frost-tolerant or frost-hardy
- Susceptible to cabbage worms, aphids

**Rotation Notes:**
- Don't follow with Brassicaceae for 2-3 years
- Benefit from following legumes
- Can deplete soil significantly

---

### Fabaceae (Legume Family)
**Members:** Beans, Peas, Lentils, Clover

**Characteristics:**
- **NITROGEN FIXERS** - enrich soil
- Form symbiotic relationship with rhizobia bacteria
- Light feeders (fix their own nitrogen)
- Good for soil improvement

**Rotation Notes:**
- Excellent to plant before heavy feeders
- Follow with Brassicaceae or Solanaceae
- Improve soil for next crop
- Susceptible to similar diseases (root rot, bean beetles)

---

### Cucurbitaceae (Gourd Family)
**Members:** Cucumbers, Squash, Zucchini, Melons, Pumpkins, Gourds

**Characteristics:**
- Heavy feeders
- Large leaves (provide ground cover/shade)
- Warm-season crops
- Susceptible to powdery mildew, cucumber beetles

**Rotation Notes:**
- Need nutrient-rich soil
- Good to follow legumes
- Don't repeat in same spot for 2-3 years

---

### Apiaceae (Carrot/Parsley Family)
**Members:** Carrots, Parsley, Celery, Dill, Fennel, Cilantro, Parsnips

**Characteristics:**
- Moderate feeders
- Many are biennial
- Attract beneficial insects (especially when flowering)
- Deep taproots (carrots, parsnips) break up soil

**Rotation Notes:**
- Can follow heavy feeders
- Good for soil structure
- Fennel can be allelopathic (inhibit other plants)

---

### Allium (Onion Family)
**Members:** Onions, Garlic, Leeks, Shallots, Chives, Scallions

**Characteristics:**
- Light to moderate feeders
- Natural pest repellents
- Sulfur compounds give distinctive smell
- Some are perennial (chives, some garlic)

**Rotation Notes:**
- Can follow heavy feeders
- Generally don't deplete soil much
- Help deter pests from other crops

---

### Asteraceae (Aster/Sunflower Family)
**Members:** Lettuce, Endive, Artichokes, Sunflowers, Chamomile

**Characteristics:**
- Variable feeding needs
- Lettuce is light feeder
- Sunflowers are heavy feeders
- Many attract beneficial insects

**Rotation Notes:**
- Varies by specific plant
- Lettuce can fit anywhere in rotation
- Sunflowers good for soil remediation

---

### Lamiaceae (Mint Family)
**Members:** Basil, Mint, Oregano, Thyme, Rosemary, Sage

**Characteristics:**
- Aromatic herbs
- Pest-repellent properties
- Many are perennial
- Light feeders

**Rotation Notes:**
- Perennials stay in place
- Annuals (basil) can go anywhere
- Mint can be invasive

---

### Chenopodiaceae (Goosefoot Family)
**Members:** Beets, Chard, Spinach, Quinoa

**Characteristics:**
- Moderate feeders
- Many are cool-season
- Chard and beets are related (beet greens and chard interchangeable)

**Rotation Notes:**
- Can follow legumes or light feeders
- Don't repeat in same location for 2 years

---

## Crop Rotation Guidelines

### Simple 4-Year Rotation
**Year 1:** Legumes (Beans, Peas) - Add nitrogen
**Year 2:** Leaf crops (Brassicas, Lettuce) - Use nitrogen
**Year 3:** Fruit crops (Tomatoes, Peppers, Cucurbits) - Use stored nutrients
**Year 4:** Root crops (Carrots, Onions, Beets) - Clean up remaining nutrients

### Principles
1. **Never follow with same family** - minimum 2 years, ideally 3-4
2. **Follow heavy feeders with light feeders or soil builders**
3. **Use nitrogen fixers strategically** - before heavy feeders
4. **Consider root depth** - alternate deep-rooted with shallow-rooted
5. **Rotate pest targets** - don't let pest populations build up

### Example Good Sequences
- Peas → Cabbage → Tomatoes → Carrots
- Beans → Broccoli → Peppers → Onions
- Clover (cover crop) → Squash → Lettuce → Radishes

### Combinations to Avoid
- ❌ Tomatoes → Peppers (same family)
- ❌ Cabbage → Broccoli (same family)
- ❌ Beans → Peas (same family)
- ❌ Heavy feeder → Heavy feeder (soil depletion)

---

## Our Current Plants (Family Classification)

Based on our 15 scraped plants:

### Solanaceae
- Tomato
- Pepper

### Brassicaceae
- Broccoli
- Cabbage
- Kale
- Radish

### Fabaceae
- Bean
- Pea

### Cucurbitaceae
- Cucumber

### Apiaceae
- Carrot
- Dill
- Parsley

### Allium
- Onion

### Asteraceae
- Lettuce

### Lamiaceae
- Basil

---

## Implementation Checklist

- [ ] Add `family` VARCHAR column to `plants` table
- [ ] Create migration with family data for existing 15 plants
- [ ] Update plant import service to include family
- [ ] Create `plant_families` reference table (optional - for family metadata)
- [ ] Add family filter to plant search/selection UI
- [ ] Implement crop rotation validator service
- [ ] Add historical family tracking per grow area
- [ ] Display family info in plant details
- [ ] Show family-based warnings in seasonal planner
- [ ] Add family-based search and grouping in UI

---

## Resources

- https://www.almanac.com/vegetable-families-and-crop-rotation
- https://www.gardeningknowhow.com/edible/vegetables/vgen/plant-family-chart.htm
- https://extension.oregonstate.edu/gardening/techniques/crop-rotation-home-garden
