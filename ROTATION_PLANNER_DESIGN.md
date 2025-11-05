# Crop Rotation & Regenerative Farming Planner
## Data Model & Feature Design

_For sustainable garden planning and soil health management_

---

## Executive Summary

**Can we build a rotation planner with current data?**
**Answer: YES - Basic planner ✓ | Advanced planner requires additions ⚠️**

We have **sufficient data for a basic but functional rotation planner** using:
- Plant family (primary rotation criterion)
- Root depth (soil structure diversity)
- Feeder type (nutrient management)
- Nitrogen fixers (soil improvement)
- Companion relationships (avoid unfavorable combos)

For an **advanced regenerative farming planner**, we need to add:
- Pest/disease data (structured)
- Rotation interval recommendations
- Specific nutrient depletion patterns
- Cover crop suitability

---

## Core Rotation Principles

### 1. Family-Based Rotation (MOST IMPORTANT)
**Rule**: Don't plant the same family in the same spot for 2-4 years

**Why**:
- Families share pest/disease susceptibility
- Families have similar nutrient demands
- Breaks pest/disease life cycles

**Key Families for Rotation**:
```
Group 1: Solanaceae (Nightshades)
  → Tomato, Potato, Pepper, Eggplant
  → Heavy feeders, prone to soil-borne diseases
  → 3-4 year rotation interval

Group 2: Brassicaceae (Crucifers)
  → Cabbage, Broccoli, Kale, Cauliflower, Radish, Turnip
  → Heavy feeders, prone to clubroot disease
  → 3-4 year rotation interval

Group 3: Fabaceae (Legumes)
  → Beans, Peas, Fava Beans
  → NITROGEN FIXERS - improve soil
  → 2-3 year rotation interval

Group 4: Cucurbitaceae (Cucurbits)
  → Cucumber, Squash, Zucchini, Melon, Pumpkin
  → Heavy feeders, sprawling growth
  → 2-3 year rotation interval

Group 5: Apiaceae (Umbellifers)
  → Carrot, Celery, Parsley, Parsnip
  → Light to moderate feeders
  → 2-3 year rotation interval

Group 6: Amaranthaceae (Beet family)
  → Beet, Spinach, Swiss Chard
  → Moderate feeders
  → 2-3 year rotation interval

Group 7: Asteraceae (Composites)
  → Lettuce, Sunflower, Artichoke
  → Light to moderate feeders
  → 2 year rotation interval

Group 8: Allium (Onion family)
  → Onion, Garlic, Leek, Shallot
  → Light feeders, pest deterrents
  → 2-3 year rotation interval
```

### 2. Nutrient Management
**Rule**: Rotate heavy → nitrogen fixer → light feeder

**Classic 4-Year Rotation**:
```
Year 1: Heavy Feeders (Solanaceae, Brassicaceae, Cucurbitaceae)
  → Deplete nitrogen and minerals
  → Examples: Tomato, Cabbage, Squash

Year 2: Nitrogen Fixers (Fabaceae)
  → Replenish nitrogen in soil
  → Examples: Beans, Peas, Clover

Year 3: Light Feeders (Allium, Root vegetables)
  → Use residual nutrients
  → Examples: Onion, Carrot, Beet

Year 4: Soil Builders (Cover crops or light feeders)
  → Restore organic matter
  → Examples: Radish, Lettuce, Cover crops
```

### 3. Root Depth Rotation
**Rule**: Alternate shallow → deep → medium roots

**Benefits**:
- Different nutrient access levels
- Breaks up soil compaction
- Improves soil structure

```
Shallow (0-12"): Lettuce, Spinach, Radish, Onion
  → Quick crops, frequent succession

Medium (12-24"): Beans, Peas, Pepper, Cucumber
  → Standard garden crops

Deep (24"+): Tomato, Carrot, Parsnip, Asparagus
  → Break compaction, access deep nutrients
```

---

## Current Data Assessment

### ✓ SUFFICIENT FOR BASIC PLANNER

#### Critical Data We Have:

1. **plant.family** ✓
   - Primary rotation criterion
   - Essential for avoiding same-family planting
   - Source: Trefle API

2. **plant_attributes.root_depth** ✓
   - SHALLOW, MEDIUM, DEEP
   - For root depth rotation
   - Source: Scraped data

3. **plant_attributes.feeder_type** ✓
   - HEAVY, MODERATE, LIGHT
   - For nutrient management
   - Source: Can be derived

4. **plant_attributes.is_nitrogen_fixer** ✓
   - Critical for soil improvement
   - Identifies legumes
   - Source: Trefle + manual

5. **companion_relationships** ✓
   - 2,303 relationships
   - Avoid unfavorable combos in rotation
   - Source: companionship-extended2.json

6. **plant_attributes.cycle** ✓
   - ANNUAL, PERENNIAL, BIENNIAL
   - For planning multi-year crops
   - Source: Scraped data

7. **plant_attributes.days_to_maturity_min/max** ✓
   - For seasonal planning
   - Multiple crops per season
   - Source: Scraped data

### ⚠️ NEEDED FOR ADVANCED PLANNER

#### Missing Critical Data:

1. **Rotation Interval by Family** ✗
   - Minimum years before replanting same family
   - Can be hardcoded by family as constants

2. **Common Pests** ✗
   - Structured pest data
   - Avoid consecutive susceptible crops
   - Raw data exists in pestsAndDiseases field

3. **Common Diseases** ✗
   - Structured disease data
   - Especially soil-borne diseases
   - Raw data exists in pestsAndDiseases field

4. **Specific Nutrient Depletion** ✗
   - Beyond general heavy/moderate/light
   - Track N, P, K separately
   - Can be added to schema

5. **Cover Crop Suitability** ✗
   - Green manure potential
   - Can be added as boolean flag

---

## Enhanced Schema Additions

### New Fields for plant_attributes Table

```kotlin
// Rotation-specific fields
@Column(name = "rotation_interval_years") 
var rotationIntervalYears: Int? = null, // Minimum years before replanting in same spot

@Column(name = "cover_crop_suitable") 
var coverCropSuitable: Boolean = false, // Can be used as cover crop

@Column(name = "green_manure_value") 
var greenManureValue: Int? = null, // 1-10 scale for organic matter contribution

@Column(name = "allelopathic") 
var allelopathic: Boolean = false, // Releases growth-inhibiting chemicals

@Column(name = "volunteer_tendency") 
var volunteerTendency: Int? = null, // 1-10 scale for self-seeding

// Specific nutrient depletion (more granular than feeder_type)
@Column(name = "nitrogen_depletion") 
var nitrogenDepletion: Int? = null, // 1-10 scale

@Column(name = "phosphorus_depletion") 
var phosphorusDepletion: Int? = null, // 1-10 scale

@Column(name = "potassium_depletion") 
var potassiumDepletion: Int? = null, // 1-10 scale

// Soil improvement
@Column(name = "breaks_compaction") 
var breaksCompaction: Boolean = false, // Deep taproot benefits

@Column(name = "adds_organic_matter") 
var addsOrganicMatter: Boolean = false, // Green manure / cover crop
```

### New Table: Rotation Rules

```kotlin
@Entity
@Table(name = "rotation_rules")
data class RotationRule(
    @Id 
    val id: UUID = UUID.randomUUID(),
    
    // Family-based rules
    @Column(name = "plant_family", nullable = false)
    val plantFamily: String, // e.g., "Solanaceae"
    
    @Column(name = "min_rotation_years", nullable = false)
    val minRotationYears: Int, // e.g., 3 for Solanaceae
    
    @Column(name = "optimal_rotation_years")
    val optimalRotationYears: Int? = null, // e.g., 4-5 for disease control
    
    // Predecessor preferences
    @Column(name = "good_predecessors", columnDefinition = "TEXT")
    val goodPredecessors: String? = null, // JSON array of families ["Fabaceae", "Apiaceae"]
    
    @Column(name = "bad_predecessors", columnDefinition = "TEXT")
    val badPredecessors: String? = null, // JSON array of families to avoid
    
    // Successor preferences
    @Column(name = "good_successors", columnDefinition = "TEXT")
    val goodSuccessors: String? = null, // JSON array of families
    
    @Column(name = "bad_successors", columnDefinition = "TEXT")
    val badSuccessors: String? = null, // JSON array of families
    
    // Notes
    @Column(name = "notes", columnDefinition = "TEXT")
    val notes: String? = null,
    
    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now()
)
```

### Enhanced Table: plant_pests_diseases (from earlier design)

```kotlin
@Entity
@Table(
    name = "plant_pests_diseases",
    indexes = [
        Index(name = "idx_pest_plant", columnList = "plant_id"),
        Index(name = "idx_pest_type", columnList = "type")
    ]
)
data class PlantPestDisease(
    @Id 
    val id: UUID = UUID.randomUUID(),
    
    @Column(name = "plant_id", nullable = false)
    val plantId: UUID,
    
    @Column(name = "name", nullable = false)
    var name: String,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    var type: PestDiseaseType, // PEST, DISEASE, DISORDER
    
    @Column(name = "affects_family")
    var affectsFamily: Boolean = true, // Does this affect entire plant family?
    
    @Column(name = "soil_borne")
    var soilBorne: Boolean = false, // Critical for rotation planning
    
    @Column(name = "persistence_years")
    var persistenceYears: Int? = null, // How long does it persist in soil?
    
    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,
    
    @Column(name = "prevention", columnDefinition = "TEXT")
    var prevention: String? = null,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "severity")
    var severity: SeverityLevel? = null,
    
    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now()
)
```

---

## Rotation Planning Algorithm

### MVP Algorithm (Using Current Data)

```kotlin
data class PlotHistory(
    val plotId: UUID,
    val plantings: List<HistoricalPlanting>
)

data class HistoricalPlanting(
    val plantId: UUID,
    val plantFamily: String,
    val year: Int,
    val season: String // "spring", "summer", "fall"
)

data class RotationRecommendation(
    val recommendedPlants: List<PlantSuggestion>,
    val warnings: List<String>,
    val tips: List<String>
)

data class PlantSuggestion(
    val plant: Plant,
    val score: Int, // 0-100
    val reasons: List<String>
)

fun recommendNextCrop(
    plotHistory: PlotHistory,
    currentYear: Int,
    season: String,
    availablePlants: List<Plant>
): RotationRecommendation {
    
    val suggestions = availablePlants.map { plant ->
        var score = 50 // Start neutral
        val reasons = mutableListOf<String>()
        
        // 1. CHECK FAMILY ROTATION (Most Important)
        val sameFamilyPlantings = plotHistory.plantings.filter { 
            it.plantFamily == plant.family 
        }
        
        if (sameFamilyPlantings.isNotEmpty()) {
            val lastPlanting = sameFamilyPlantings.maxByOrNull { it.year }!!
            val yearsSince = currentYear - lastPlanting.year
            
            // Family-specific rotation rules (hardcoded for MVP)
            val minRotation = when (plant.family) {
                "Solanaceae", "Brassicaceae" -> 3 // Nightshades, Crucifers
                "Cucurbitaceae", "Fabaceae" -> 2  // Cucurbits, Legumes
                else -> 2 // Default
            }
            
            if (yearsSince < minRotation) {
                score -= 50
                reasons.add("⚠️ Same family planted ${yearsSince} year(s) ago (wait ${minRotation - yearsSince} more)")
            } else if (yearsSince == minRotation) {
                score += 10
                reasons.add("✓ Minimum rotation period met")
            } else {
                score += 20
                reasons.add("✓ Good rotation gap (${yearsSince} years)")
            }
        } else {
            score += 30
            reasons.add("✓ Family never planted in this plot")
        }
        
        // 2. CHECK NUTRIENT BALANCE
        val lastYearPlanting = plotHistory.plantings
            .filter { it.year == currentYear - 1 }
            .firstOrNull()
        
        if (lastYearPlanting != null) {
            val lastPlant = availablePlants.find { it.id == lastYearPlanting.plantId }
            
            if (lastPlant != null) {
                // If last was heavy feeder, prefer nitrogen fixer
                if (lastPlant.attributes.feederType == FeederType.HEAVY && 
                    plant.attributes.isNitrogenFixer) {
                    score += 25
                    reasons.add("✓ Nitrogen fixer after heavy feeder - excellent!")
                }
                
                // If last was nitrogen fixer, heavy feeders benefit
                if (lastPlant.attributes.isNitrogenFixer && 
                    plant.attributes.feederType == FeederType.HEAVY) {
                    score += 20
                    reasons.add("✓ Heavy feeder after nitrogen fixer - good match")
                }
                
                // Avoid consecutive heavy feeders
                if (lastPlant.attributes.feederType == FeederType.HEAVY && 
                    plant.attributes.feederType == FeederType.HEAVY) {
                    score -= 15
                    reasons.add("⚠️ Consecutive heavy feeders - will deplete soil")
                }
            }
        }
        
        // 3. CHECK ROOT DEPTH DIVERSITY
        if (lastYearPlanting != null) {
            val lastPlant = availablePlants.find { it.id == lastYearPlanting.plantId }
            
            if (lastPlant != null && 
                lastPlant.attributes.rootDepth != plant.attributes.rootDepth) {
                score += 10
                reasons.add("✓ Different root depth - improves soil structure")
            }
        }
        
        // 4. CHECK COMPANION RELATIONSHIPS
        // Avoid plants that were unfavorable companions last year
        // (may share pests/diseases)
        
        // 5. SEASON SUITABILITY
        // Check if plant can be grown in this season based on growthMonths
        
        PlantSuggestion(
            plant = plant,
            score = score.coerceIn(0, 100),
            reasons = reasons
        )
    }.sortedByDescending { it.score }
    
    // Generate warnings
    val warnings = mutableListOf<String>()
    val recentFamilies = plotHistory.plantings
        .filter { currentYear - it.year <= 2 }
        .map { it.plantFamily }
        .distinct()
    
    if (recentFamilies.size >= 3) {
        warnings.add("This plot has had good crop diversity recently")
    }
    
    return RotationRecommendation(
        recommendedPlants = suggestions.take(10),
        warnings = warnings,
        tips = generateRotationTips(plotHistory, currentYear)
    )
}

fun generateRotationTips(
    plotHistory: PlotHistory,
    currentYear: Int
): List<String> {
    val tips = mutableListOf<String>()
    
    // Check if nitrogen fixers have been planted recently
    val hasRecentLegumes = plotHistory.plantings.any { 
        it.year >= currentYear - 2 && it.plantFamily == "Fabaceae"
    }
    
    if (!hasRecentLegumes) {
        tips.add("💡 Consider planting legumes (beans/peas) to improve soil nitrogen")
    }
    
    // Check for family diversity
    val familyCounts = plotHistory.plantings
        .groupBy { it.plantFamily }
        .mapValues { it.value.size }
    
    val mostPlanted = familyCounts.maxByOrNull { it.value }
    if (mostPlanted != null && mostPlanted.value >= 3) {
        tips.add("💡 ${mostPlanted.key} has been planted frequently - give it a longer rest")
    }
    
    return tips
}
```

---

## Rotation Planning Features

### Feature 1: Simple Rotation Checker
**Input**: What I planted last 2-3 years
**Output**: What I can plant this year

**Algorithm**:
1. Check family rotation intervals
2. Balance nutrients (heavy → nitrogen fixer → light)
3. Vary root depths
4. Score each available plant
5. Recommend top options with explanations

**Required Data**: ✓ family, feederType, rootDepth, isNitrogenFixer

---

### Feature 2: Multi-Year Rotation Planner
**Input**: Garden layout with multiple plots
**Output**: 4-year rotation plan for all plots

**Algorithm**:
1. Define 4-year rotation cycle per plot
2. Ensure each family rotates through all plots
3. Optimize for nutrient balance
4. Account for perennials (fixed plots)
5. Generate visual calendar

**Required Data**: ✓ family, cycle (annual/perennial), feederType, daysToMaturity

---

### Feature 3: Regenerative Score
**Input**: Historical plantings over multiple years
**Output**: Soil health score and recommendations

**Scoring Criteria**:
- ✓ Family diversity (more families = better)
- ✓ Nitrogen fixer frequency (legumes every 2-3 years)
- ✓ Root depth variety (all 3 depths used)
- ✓ Avoiding consecutive heavy feeders
- ⚠️ Cover crop usage (need cover_crop_suitable field)
- ⚠️ Pest/disease pressure (need pest/disease data)

**Required Data**: 
- Current: ✓ family, feederType, rootDepth, isNitrogenFixer
- Missing: ⚠️ cover_crop_suitable, pest/disease data

---

### Feature 4: Companion-Aware Rotation
**Input**: Last year's garden layout
**Output**: This year's layout avoiding unfavorable successions

**Algorithm**:
1. Check rotation intervals
2. Check companion relationships
3. Avoid planting where unfavorable companions grew last year
4. Suggest beneficial succession patterns

**Required Data**: ✓ All current data + companion_relationships

---

## Sample Rotation Plans

### Classic 4-Bed Rotation

```
Bed 1 → Bed 2 → Bed 3 → Bed 4
----------------------------------------
Year 1:
Bed 1: Solanaceae (Tomato, Pepper) - Heavy Feeders
Bed 2: Fabaceae (Beans, Peas) - Nitrogen Fixers
Bed 3: Brassicaceae (Cabbage, Broccoli) - Heavy Feeders
Bed 4: Allium + Root Veg (Onion, Carrot) - Light Feeders

Year 2:
Bed 1: Fabaceae (Beans, Peas) - Nitrogen Fixers
Bed 2: Brassicaceae (Cabbage, Broccoli) - Heavy Feeders
Bed 3: Allium + Root Veg (Onion, Carrot) - Light Feeders
Bed 4: Solanaceae (Tomato, Pepper) - Heavy Feeders

Year 3:
Bed 1: Brassicaceae (Cabbage, Broccoli) - Heavy Feeders
Bed 2: Allium + Root Veg (Onion, Carrot) - Light Feeders
Bed 3: Solanaceae (Tomato, Pepper) - Heavy Feeders
Bed 4: Fabaceae (Beans, Peas) - Nitrogen Fixers

Year 4:
Bed 1: Allium + Root Veg (Onion, Carrot) - Light Feeders
Bed 2: Solanaceae (Tomato, Pepper) - Heavy Feeders
Bed 3: Fabaceae (Beans, Peas) - Nitrogen Fixers
Bed 4: Brassicaceae (Cabbage, Broccoli) - Heavy Feeders

Year 5: Return to Year 1 pattern
```

---

## API Endpoints for Rotation Planning

```kotlin
// Get rotation recommendations
POST /api/rotation/recommend
Request: {
  plotId: UUID,
  history: [
    { plantId: UUID, year: 2023, season: "spring" },
    { plantId: UUID, year: 2024, season: "spring" }
  ],
  currentYear: 2025,
  season: "spring",
  preferences: {
    prioritizeNitrogenFixers: boolean,
    avoidHeavyFeeders: boolean
  }
}
Response: {
  recommendations: [
    {
      plant: PlantSummaryDto,
      score: 85,
      reasons: [
        "Family never planted in this plot",
        "Nitrogen fixer after heavy feeder"
      ]
    }
  ],
  warnings: ["..."],
  tips: ["..."]
}

// Generate multi-year rotation plan
POST /api/rotation/plan
Request: {
  plots: [
    { plotId: UUID, size: "4x8", location: "north" }
  ],
  startYear: 2025,
  planYears: 4,
  desiredPlants: [UUID]
}
Response: {
  plan: {
    2025: { plotId: [plantIds] },
    2026: { plotId: [plantIds] },
    ...
  },
  analysis: {
    familyDiversity: 8,
    nitrogenFixerFrequency: "Every 2 years",
    soilHealthScore: 87
  }
}

// Calculate soil health score
POST /api/rotation/health-score
Request: {
  plotId: UUID,
  history: [...] // Last 3-5 years
}
Response: {
  score: 78,
  breakdown: {
    familyDiversity: 85,
    nutrientBalance: 75,
    rootDepthVariety: 70,
    nitrogenFixerUsage: 80
  },
  recommendations: [
    "Plant more legumes",
    "Vary root depths more"
  ]
}
```

---

## Recommended Hardcoded Rotation Rules

```kotlin
// Can be stored in database or config
val FAMILY_ROTATION_RULES = mapOf(
    "Solanaceae" to RotationRule(
        family = "Solanaceae",
        minYears = 3,
        optimalYears = 4,
        goodPredecessors = listOf("Fabaceae", "Apiaceae"),
        badPredecessors = listOf("Solanaceae"),
        notes = "Prone to soil-borne diseases. Needs long rotation."
    ),
    "Brassicaceae" to RotationRule(
        family = "Brassicaceae",
        minYears = 3,
        optimalYears = 4,
        goodPredecessors = listOf("Fabaceae", "Allium"),
        badPredecessors = listOf("Brassicaceae"),
        notes = "Susceptible to clubroot. Avoid after other brassicas."
    ),
    "Fabaceae" to RotationRule(
        family = "Fabaceae",
        minYears = 2,
        optimalYears = 3,
        goodSuccessors = listOf("Solanaceae", "Brassicaceae", "Cucurbitaceae"),
        notes = "Nitrogen fixers. Excellent predecessors for heavy feeders."
    ),
    // ... etc for all major families
)
```

---

## Implementation Roadmap

### Phase 1: MVP Rotation Checker ✅ (Can Build Now)
**Using current data**:
- Family-based rotation checking
- Nutrient balance recommendations
- Root depth diversity
- Basic scoring algorithm

**Deliverable**: Simple "What can I plant?" tool

### Phase 2: Enhanced Attributes 📋 (Need to add)
**Add to schema**:
- rotation_interval_years
- specific nutrient depletion (N, P, K)
- cover_crop_suitable
- Hardcoded rotation rules

**Deliverable**: More accurate recommendations

### Phase 3: Pest/Disease Integration 📋 (Structure existing data)
**Parse scraped data**:
- Extract pests from pestsAndDiseases field
- Identify soil-borne diseases
- Create plant_pests_diseases records

**Deliverable**: Disease-aware rotation planning

### Phase 4: Multi-Year Planner 🎯 (Advanced feature)
**Build on previous phases**:
- Garden plot management
- 4+ year rotation plans
- Visual calendar
- Soil health scoring

**Deliverable**: Complete regenerative farming tool

---

## Conclusion

### Can We Build a Rotation Planner? **YES ✓**

**With current data** we can build a **functional basic rotation planner** that:
- Prevents same-family plantings for proper intervals
- Balances nutrients via heavy/nitrogen fixer/light rotation
- Varies root depths for soil health
- Uses companion data to avoid unfavorable sequences

**For advanced features**, we should add:
- Rotation interval recommendations (can hardcode by family)
- Structured pest/disease data (parse from existing scraped data)
- Specific nutrient depletion patterns
- Cover crop suitability flags

**Priority**: Build MVP with current data, then enhance iteratively.
