# Crop Rotation Planner - Complete Gap Analysis
## What We're Missing for a Really Good Regenerative Farming Planner

_Last Updated: 2025-11-04_

---

## Executive Summary

**MVP Status**: ✅ Can build functional rotation planner NOW  
**Excellence Gap**: ⚠️ Missing 10 critical data points for advanced features  
**Recommendation**: Build MVP, then add missing data iteratively

---

## Current Data - What We HAVE ✓

### Core Rotation Data (Sufficient for MVP)

1. **plant.family** ✓ CRITICAL
   - Solanaceae, Brassicaceae, Fabaceae, etc.
   - Source: Trefle API
   - Coverage: All plants with Trefle data
   - **This is THE most important field for crop rotation**

2. **plant.genus** ✓ USEFUL
   - More specific than family
   - Source: Trefle API
   - Use case: Fine-tune rotation within family

3. **plant_attributes.root_depth** ✓ CRITICAL
   - SHALLOW, MEDIUM, DEEP enum
   - Source: Scraped Almanac data (76 plants)
   - Coverage: Good for common vegetables
   - **Essential for soil structure diversity**

4. **plant_attributes.feeder_type** ✓ CRITICAL
   - HEAVY, MODERATE, LIGHT enum
   - Source: Can derive from Trefle + scraped data
   - Coverage: Needs manual curation for accuracy
   - **Core of nutrient balance rotation**

5. **plant_attributes.is_nitrogen_fixer** ✓ CRITICAL
   - Boolean flag
   - Source: Trefle + family knowledge (Fabaceae)
   - Coverage: All legumes identified
   - **Key for soil improvement rotation**

6. **plant_attributes.primary_nutrient_contribution** ✓ USEFUL
   - NITROGEN, POTASSIUM, PHOSPHORUS, NONE
   - Source: Manual addition
   - Coverage: Limited, needs expansion

7. **plant_attributes.cycle** ✓ USEFUL
   - ANNUAL, PERENNIAL, BIENNIAL
   - Source: Scraped data
   - Coverage: 76 plants
   - **Important for multi-year planning**

8. **plant_attributes.days_to_maturity_min/max** ✓ USEFUL
   - Integer ranges
   - Source: Scraped data
   - Coverage: 76 plants
   - **For succession planting within season**

9. **plant_attributes.succession_interval_days** ✓ USEFUL
   - Integer (optional)
   - Source: Manual addition
   - Coverage: Very limited
   - **For continuous harvests**

10. **companion_relationships** ✓ BONUS
    - 2,303 relationships across 42 plants
    - Source: companionship-extended2.json
    - Coverage: Major garden vegetables
    - **Can extend to sequential planting (same spot, different years)**

---

## Missing Data - Critical Gaps ✗

### TIER 1: CRITICAL for Advanced Planning

#### 1. Rotation Interval by Family ✗
**What**: Minimum years before replanting same family in same spot

**Why Critical**:
- Different families have different disease pressures
- Solanaceae (tomatoes): 3-4 years (late blight, verticillium wilt)
- Brassicaceae (cabbage): 3-4 years (clubroot disease)
- Fabaceae (beans): 2-3 years (root rot)
- Cucurbitaceae: 2-3 years (powdery mildew)

**Current State**: Not in database

**Solution Options**:
1. **Short-term**: Hardcode rotation rules by family in application code
2. **Long-term**: Add `rotation_rules` table or `rotation_interval_years` field

**Recommended Schema Addition**:
```kotlin
// Option A: Per-plant field
@Column(name = "rotation_interval_years") 
var rotationIntervalYears: Int? = null

// Option B: Family-level rules table (BETTER)
@Entity
@Table(name = "rotation_rules")
data class RotationRule(
    @Id val id: UUID,
    @Column(name = "plant_family", nullable = false)
    val plantFamily: String, // "Solanaceae"
    @Column(name = "min_rotation_years", nullable = false)
    val minRotationYears: Int, // 3
    @Column(name = "optimal_rotation_years")
    val optimalRotationYears: Int?, // 4-5
    @Column(name = "reason", columnDefinition = "TEXT")
    val reason: String? // "Prone to soil-borne diseases"
)
```

**Data Source**: Agricultural research + best practices (can compile from extension services)

---

#### 2. Common Pests (Structured) ✗
**What**: Which pests commonly attack each plant

**Why Critical**:
- Pests build up in soil/area when same crops planted repeatedly
- Some pests affect entire plant families
- Rotation breaks pest life cycles

**Current State**: Raw text in `pestsAndDiseases` field (scraped data), not structured

**Examples**:
- Tomato: Tomato hornworm, aphids, whiteflies
- Cabbage: Cabbage worm, aphids, flea beetles
- Beans: Mexican bean beetle, aphids

**Recommended Schema** (already designed):
```kotlin
@Entity
@Table(name = "plant_pests_diseases")
data class PlantPestDisease(
    @Id val id: UUID,
    @Column(name = "plant_id") val plantId: UUID,
    @Column(name = "name") var name: String, // "Tomato Hornworm"
    @Enumerated(EnumType.STRING)
    @Column(name = "type") var type: PestDiseaseType, // PEST
    @Column(name = "affects_family") var affectsFamily: Boolean, // true
    @Column(name = "severity") var severity: SeverityLevel // HIGH
)
```

**Data Source**: Parse from existing scraped `pestsAndDiseases` field

**Action Required**: Write parser to extract pest names from text

---

#### 3. Common Diseases (Structured) ✗
**What**: Which diseases commonly affect each plant, especially SOIL-BORNE diseases

**Why Critical**:
- Soil-borne diseases persist for YEARS
- Verticillium wilt (tomatoes): 3-4 years
- Clubroot (brassicas): 7+ years
- Fusarium wilt: 5-7 years
- **This is the PRIMARY reason for crop rotation**

**Current State**: Raw text in `pestsAndDiseases` field, not structured

**Critical Fields Needed**:
```kotlin
@Column(name = "soil_borne") var soilBorne: Boolean // TRUE/FALSE
@Column(name = "persistence_years") var persistenceYears: Int? // 3-7
@Column(name = "affects_family") var affectsFamily: Boolean
```

**Examples**:
```
Tomato:
  - Late Blight (soil-borne: false, airborne)
  - Verticillium Wilt (soil-borne: true, persistence: 3-4 years)
  - Fusarium Wilt (soil-borne: true, persistence: 5-7 years)

Cabbage:
  - Clubroot (soil-borne: true, persistence: 7-20 years!)
  - Black Rot (soil-borne: true, persistence: 2-3 years)
```

**Data Source**: Parse from scraped data + agricultural extension services

**Action Required**: 
1. Extract disease names from `pestsAndDiseases` text
2. Research soil-borne status
3. Add persistence data

---

#### 4. Specific Nutrient Depletion Patterns ✗
**What**: Which specific nutrients (N, P, K) each plant heavily depletes

**Why Critical**:
- More granular than general "heavy feeder"
- Different plants deplete different nutrients
- Allows precise nutrient balancing in rotation

**Current State**: Only have general `feeder_type` (HEAVY/MODERATE/LIGHT)

**Examples**:
```
Tomato:
  - Nitrogen depletion: HIGH (8/10)
  - Phosphorus depletion: MEDIUM (6/10)
  - Potassium depletion: VERY HIGH (9/10)

Corn:
  - Nitrogen depletion: VERY HIGH (10/10)
  - Phosphorus depletion: MEDIUM (5/10)
  - Potassium depletion: MEDIUM (6/10)

Lettuce:
  - Nitrogen depletion: LOW (3/10)
  - Phosphorus depletion: LOW (2/10)
  - Potassium depletion: LOW (3/10)

Beans (Nitrogen Fixers):
  - Nitrogen depletion: NEGATIVE (-5/10) - ADDS nitrogen
  - Phosphorus depletion: MEDIUM (5/10)
  - Potassium depletion: MEDIUM (5/10)
```

**Recommended Schema Addition**:
```kotlin
@Column(name = "nitrogen_depletion") 
var nitrogenDepletion: Int? = null, // -10 to 10 scale

@Column(name = "phosphorus_depletion") 
var phosphorusDepletion: Int? = null, // 1-10 scale

@Column(name = "potassium_depletion") 
var potassiumDepletion: Int? = null, // 1-10 scale

@Column(name = "calcium_depletion") 
var calciumDepletion: Int? = null, // 1-10 scale (for brassicas)
```

**Data Source**: Agricultural research, soil science literature

---

#### 5. Cover Crop Suitability ✗
**What**: Can this plant be used as a cover crop / green manure?

**Why Critical**:
- Cover crops are essential for regenerative farming
- Build soil organic matter
- Suppress weeds
- Prevent erosion
- Some fix nitrogen (legumes)

**Current State**: Not tracked

**Examples of Cover Crops**:
- Clover (nitrogen fixer, excellent cover)
- Rye (winter cover, breaks compaction)
- Buckwheat (fast-growing summer cover)
- Radish (daikon - breaks compaction, winter kill)
- Vetch (nitrogen fixer)
- Fava beans (nitrogen fixer, can be food crop too)

**Recommended Schema Addition**:
```kotlin
@Column(name = "cover_crop_suitable") 
var coverCropSuitable: Boolean = false,

@Column(name = "green_manure_value") 
var greenManureValue: Int? = null, // 1-10 for organic matter contribution

@Column(name = "winter_hardy_cover") 
var winterHardyCover: Boolean = false,

@Column(name = "winter_kill_cover") 
var winterKillCover: Boolean = false // Dies in frost, no spring tilling needed
```

**Data Source**: Cover crop research, extension services

---

### TIER 2: IMPORTANT for Enhanced Planning

#### 6. Predecessor Preferences ✗
**What**: Which plant families should ideally come BEFORE this plant

**Why Important**:
- Some crops benefit from specific predecessors
- Example: Heavy feeders do well after nitrogen fixers
- Example: Alliums do well after brassicas

**Current State**: Not tracked

**Examples**:
```
Tomato (Solanaceae):
  - Good after: Fabaceae (legumes), Apiaceae (carrots)
  - Bad after: Solanaceae (same family), Cucurbitaceae (similar pests)

Cabbage (Brassicaceae):
  - Good after: Fabaceae (nitrogen boost), Allium
  - Bad after: Brassicaceae (clubroot risk)

Corn:
  - Good after: Fabaceae (needs nitrogen boost)
  - Bad after: Heavy feeders (depleted soil)
```

**Recommended Schema** (in rotation_rules table):
```kotlin
@Column(name = "good_predecessors", columnDefinition = "TEXT")
val goodPredecessors: String? = null, // JSON array: ["Fabaceae", "Apiaceae"]

@Column(name = "bad_predecessors", columnDefinition = "TEXT")
val badPredecessors: String? = null, // JSON array: ["Solanaceae"]
```

**Data Source**: Crop rotation best practices, agricultural research

---

#### 7. Successor Preferences ✗
**What**: Which plant families should ideally come AFTER this plant

**Why Important**:
- Plan forward in rotation
- Example: After nitrogen fixers, plant heavy feeders
- Example: After heavy feeders, plant light feeders or soil builders

**Current State**: Not tracked

**Examples**:
```
Beans (Fabaceae):
  - Good successors: Solanaceae, Brassicaceae, Cucurbitaceae (all heavy feeders)
  - Reason: Soil enriched with nitrogen

Heavy Feeders (Tomato, Cabbage):
  - Good successors: Light feeders, Allium, Root vegetables
  - Reason: Let soil recover

Deep-rooted (Carrots):
  - Good successors: Shallow-rooted (Lettuce, Onion)
  - Reason: Access different soil layers
```

**Recommended Schema** (in rotation_rules table):
```kotlin
@Column(name = "good_successors", columnDefinition = "TEXT")
val goodSuccessors: String? = null, // JSON array

@Column(name = "bad_successors", columnDefinition = "TEXT")
val badSuccessors: String? = null
```

**Data Source**: Rotation planning guides

---

#### 8. Soil Improvement Beyond Nitrogen ✗
**What**: Other ways plants improve soil (besides nitrogen fixing)

**Why Important**:
- Some plants break compaction with deep taproots
- Some add significant organic matter
- Some suppress weeds effectively

**Current State**: Only track `is_nitrogen_fixer`

**Examples**:
```
Daikon Radish:
  - Deep taproot breaks compaction
  - Winter-kill = free organic matter
  
Buckwheat:
  - Fast-growing, adds lots of organic matter
  - Suppresses weeds
  
Sunflower:
  - Deep roots bring up minerals
  - Allelopathic (can inhibit weeds)
```

**Recommended Schema Additions**:
```kotlin
@Column(name = "breaks_compaction") 
var breaksCompaction: Boolean = false, // Deep taproot benefits

@Column(name = "adds_organic_matter") 
var addsOrganicMatter: Boolean = false, // High biomass

@Column(name = "suppresses_weeds") 
var suppressesWeeds: Boolean = false, // Dense ground cover

@Column(name = "mines_deep_minerals") 
var minesDeepMinerals: Boolean = false // Deep roots bring up nutrients
```

**Data Source**: Permaculture literature, soil science

---

#### 9. Allelopathic Effects ✗
**What**: Does this plant release chemicals that inhibit other plants?

**Why Important**:
- Affects what can grow nearby OR in same spot next year
- Different from companion planting (which is about beneficial interactions)

**Current State**: Not tracked

**Examples**:
```
BLACK WALNUT: Very allelopathic
  - Juglone toxin affects tomatoes, potatoes, apples
  - Persists in soil for years

Sunflower: Mildly allelopathic
  - Can inhibit some crops
  
Sorghum: Allelopathic
  - Can suppress weeds (beneficial)
```

**Recommended Schema Addition**:
```kotlin
@Column(name = "allelopathic") 
var allelopathic: Boolean = false,

@Column(name = "allelopathic_severity") 
var allelopathicSeverity: Int? = null, // 1-10 scale

@Column(name = "allelopathic_notes", columnDefinition = "TEXT")
var allelopathicNotes: String? = null // Which plants affected
```

**Data Source**: Allelopathy research

---

#### 10. Volunteer/Self-Seeding Tendency ✗
**What**: How aggressively does this plant self-seed?

**Why Important**:
- Affects rotation planning (volunteers may appear next year)
- Some crops (like tomatoes) volunteer heavily
- Can disrupt rotation if not managed

**Current State**: Not tracked

**Examples**:
```
Tomato: HIGH volunteer tendency
  - Fallen fruit = volunteers next year
  - Can disrupt rotation plan

Dill: VERY HIGH
  - Self-seeds aggressively
  
Lettuce: HIGH
  - If allowed to bolt

Carrot: LOW
  - Biennial, rarely volunteers in annual garden
```

**Recommended Schema Addition**:
```kotlin
@Column(name = "volunteer_tendency") 
var volunteerTendency: Int? = null, // 1-10 scale

@Column(name = "volunteer_notes", columnDefinition = "TEXT")
var volunteerNotes: String? = null
```

**Data Source**: Gardening experience, seed-saving guides

---

### TIER 3: NICE TO HAVE

#### 11. Optimal Growing Season by Region ✗
**What**: When should this be planted in different climate zones?

**Current State**: Have generic `growthMonths` from Trefle, but not region-specific

**Why Useful**: Better succession planning by zone

---

#### 12. Typical Yield per Square Foot ✗
**What**: Expected harvest amount

**Why Useful**: Plan garden size to meet needs

---

#### 13. Water Usage Category ✗
**What**: More specific than current `waterNeeds` enum

**Current State**: Have LOW/MODERATE/HIGH/FREQUENT enum

**Enhancement**: Gallons per week per plant

---

#### 14. Carbon Sequestration Value ✗
**What**: How much carbon does this crop sequester?

**Why Useful**: Regenerative farming metrics, climate impact

---

## Summary: Data Gaps Prioritization

### MUST HAVE for Excellent Planner (Tier 1):
1. ✗ Rotation interval by family (can hardcode initially)
2. ✗ Common pests (structured) - parse from scraped data
3. ✗ Common diseases (structured) - parse from scraped data  
4. ✗ Specific nutrient depletion (N, P, K)
5. ✗ Cover crop suitability

### SHOULD HAVE for Advanced Features (Tier 2):
6. ✗ Predecessor preferences
7. ✗ Successor preferences
8. ✗ Soil improvement qualities
9. ✗ Allelopathic effects
10. ✗ Volunteer tendency

### NICE TO HAVE (Tier 3):
11. ✗ Regional growing calendars
12. ✗ Yield expectations
13. ✗ Detailed water usage
14. ✗ Carbon metrics

---

## Recommended Action Plan

### Phase 1: Build MVP (Weeks 1-2)
**Use current data**:
- ✓ Family rotation
- ✓ Feeder type + nitrogen fixers
- ✓ Root depth diversity
- ✓ Companion relationships

**Add minimal enhancements**:
- Hardcode rotation interval rules by family in code
- Simple algorithm (already designed)

**Deliverable**: Working "What should I plant?" tool

---

### Phase 2: Add Critical Data (Weeks 3-4)
**Database additions**:
- Add `rotation_rules` table
- Add nutrient depletion fields
- Add cover crop fields

**Data entry**:
- Create rotation rules for 8 major families
- Parse pest/disease data from scraped text
- Research and add N/P/K depletion patterns

**Deliverable**: More accurate recommendations

---

### Phase 3: Structure Pest/Disease Data (Weeks 5-6)
**Parse existing data**:
- Extract pest names from `pestsAndDiseases` text
- Extract disease names
- Research soil-borne status
- Add persistence data

**Create records**:
- Populate `plant_pests_diseases` table
- Link to plants

**Deliverable**: Disease-aware rotation planning

---

### Phase 4: Enhanced Features (Weeks 7-8)
**Add remaining fields**:
- Predecessor/successor preferences
- Soil improvement qualities
- Allelopathic flags

**Build features**:
- Multi-year rotation planner
- Soil health scoring
- Visual rotation calendar

**Deliverable**: Complete regenerative farming tool

---

## Data Sources for Missing Information

### Scientific/Research:
- University Extension Services (excellent free resources)
- USDA Agricultural Research Service
- Rodale Institute (organic farming research)
- Soil Science Society journals

### Practical Guides:
- "The Vegetable Gardener's Bible" (Edward C. Smith)
- "Crop Rotation and Cover Cropping" (Charles L. Mohler)
- "Building Soils for Better Crops" (Fred Magdoff)
- Johnny's Selected Seeds growing guides

### Online Resources:
- University extension websites (Cornell, Penn State, UC Davis)
- Farmer to Farmer (farmertofarmerpodcast.com)
- Modern Farmer magazine
- Permaculture Research Institute

### For Pest/Disease Data:
- Existing scraped `pestsAndDiseases` field (primary source)
- IPM (Integrated Pest Management) guides
- University extension pest databases

---

## Conclusion

**Current State**: We have the 3 critical pillars for crop rotation:
1. ✓ Family data
2. ✓ Nutrient management data  
3. ✓ Root depth data

**This is sufficient for a valuable MVP rotation planner.**

**For excellence**, we need to add:
- Tier 1: 5 critical data points (rotation intervals, pests, diseases, NPK, cover crops)
- Tier 2: 5 important enhancements (predecessors, successors, soil building, etc.)

**Recommendation**: 
1. Build MVP immediately with current data
2. Add Tier 1 enhancements iteratively
3. Add Tier 2 as resources allow

The beauty of this approach is that each enhancement adds value incrementally - you don't need everything to launch a useful tool.
