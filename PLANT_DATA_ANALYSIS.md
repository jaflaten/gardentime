# Plant Data Analysis & Comprehensive Data Class Design

## Current Data Sources

### 1. Trefle API Data
**Location**: Received via API (DTOs in `ExternalDtos.kt`)

**Available Fields**:
- **Identity**: scientificName, commonName, family, genus, slug
- **Classification**: vegetable, edible, ediblePart, duration (annual/perennial)
- **Growth Info**: 
  - growthForm, growthHabit, growthRate
  - averageHeight, maximumHeight
  - nitrogenFixation
  - daysToHarvest
- **Environmental Requirements**:
  - light (scale 1-10)
  - phMinimum, phMaximum
  - minimumTemperature, maximumTemperature
  - minimumPrecipitation, maximumPrecipitation
  - minimumRootDepth
  - soilNutriments, soilSalinity, soilTexture, soilHumidity (all scales 1-10)
  - atmosphericHumidity
- **Timing**:
  - growthMonths, bloomMonths, fruitMonths
- **Physical Characteristics**:
  - flower (color, conspicuous)
  - foliage (texture, color, leafRetention)
  - fruitOrSeed (conspicuous, color, shape, seedPersistence)
- **Spacing**: rowSpacing, spread
- **Images**: imageUrl, multiple image types (flower, leaf, habit, fruit, bark)
- **Metadata**: sources, synonyms, distribution (native/introduced)
- **Toxicity**: toxicity level

### 2. Perenual API Data
**Location**: Received via API (DTOs in `ExternalDtos.kt`)

**Available Fields**:
- **Identity**: scientificName (array), commonName, otherNames, family, genus
- **Classification**: type, origin, cycle
- **Growth Info**:
  - dimensions (type, min/max value, unit)
  - growthRate, maintenance, careLevel
- **Environmental Requirements**:
  - watering (general description)
  - wateringGeneralBenchmark (value, unit)
  - xWateringQuality, xWateringPeriod, xWateringAvgVolumeRequirement
  - xWateringDepthRequirement
  - xWateringBasedTemperature (unit, min, max)
  - xWateringPhLevel (min, max)
  - sunlight (array of levels)
  - xSunlightDuration (min, max, unit)
  - soil (array of types)
  - hardiness (min/max zones)
- **Care Requirements**:
  - pruningMonth, pruningCount (amount, interval)
  - propagation methods
- **Characteristics**:
  - flowers, cones, fruits, leaf (booleans)
  - edibleFruit, edibleLeaf
  - floweringSeason, fruitingSeason, harvestSeason, harvestMethod
  - plantAnatomy (part, color arrays)
- **Traits**:
  - droughtTolerant, saltTolerant
  - invasive, rare, tropical
  - thorny
  - poisonousToHumans, poisonousToPets
  - medicinal, cuisine, indoor
- **Attraction**: attracts (array of what it attracts)
- **Pests**: pestSusceptibility
- **Images**: defaultImage, otherImages
- **Metadata**: description, seeds count

### 3. Almanac Scraped Data (Raw)
**Location**: `plant-data-aggregator/docs/scrapers/parsed/*.json`

**Available Fields**:
- slug, source, url, scrapedAt
- commonName
- description (often null)
- companionSection (companion planting text)
- plantingGuide (rich text with planting instructions)
- careInstructions (rich text with care details)
- harvestInfo (harvesting guidance)
- pestsAndDiseases (pest/disease information)
- rawHtml (full page HTML)

### 4. Almanac Parsed Data (Structured)
**Location**: `plant-data-aggregator/docs/scrapers/extracted-text/*.json`

**Available Fields** (76 plants):
- **Identity**: commonName (singular)
- **Classification**: cycle (ANNUAL/PERENNIAL/BIENNIAL)
- **Environmental Requirements**:
  - sunNeeds (FULL_SUN/PART_SHADE/SHADE)
  - waterNeeds (LOW/MODERATE/HIGH/FREQUENT)
  - soilTempMinF, soilTempOptimalF
- **Growth Characteristics**:
  - rootDepth (SHALLOW/MEDIUM/DEEP)
  - growthHabit (BUSH/VINE/CLIMBER/ROOT/LEAF/FRUITING)
- **Planting Info**:
  - spacingMin, spacingMax (inches)
  - plantingDepthInches
  - frostTolerant (boolean)
- **Care Requirements**:
  - containerSuitable (boolean)
  - requiresStaking (boolean)
  - requiresPruning (boolean)
  - mulchRecommended (boolean)
  - wateringInchesPerWeek
  - fertilizingFrequencyWeeks
- **Harvest Info**:
  - edibleParts (array: fruit, leaf, root, seed, flower, stem)
  - daysToMaturityMin, daysToMaturityMax
- **Special Notes**: notes (concise care tips)

---

## Current Database Schema

### Core Tables

#### 1. `plants`
```kotlin
- id: UUID (PK)
- canonical_scientific_name: String (indexed)
- common_name: String?
- family: String?
- genus: String?
- source_trefle_id: Long?
- source_perenual_id: Long?
- created_at: Instant
- updated_at: Instant
```

#### 2. `plant_attributes`
```kotlin
- plant_id: UUID (PK, FK to plants)
- is_nitrogen_fixer: Boolean
- root_depth: RootDepth enum
- feeder_type: FeederType enum?
- cycle: PlantCycle enum?
- growth_habit: GrowthHabit enum?
- sun_needs: SunNeeds enum?
- water_needs: WaterNeeds enum?
- ph_min: Double?
- ph_max: Double?
- toxicity_level: ToxicityLevel enum?
- invasive: Boolean?
- drought_tolerant: Boolean?
- poisonous_to_pets: Boolean?
- days_to_maturity_min: Int?
- days_to_maturity_max: Int?
- succession_interval_days: Int?
- primary_nutrient_contribution: PrimaryNutrientContribution enum?
- created_at: Instant
- updated_at: Instant
```

#### 3. `plant_attribute_edible_parts`
```kotlin
- plant_id: UUID (PK, FK)
- edible_part: String (PK)
```

#### 4. `companion_relationships`
```kotlin
- id: UUID (PK)
- plant_a_id: UUID (FK)
- plant_b_id: UUID (FK)
- relationship_type: RelationshipType enum
- relationship_subtype: RelationshipSubtype enum?
- confidence_level: ConfidenceLevel enum
- evidence_type: EvidenceType enum
- reason: String?
- mechanism: Text?
- source_id: UUID? (FK)
- source_url: String?
- geographic_scope: String?
- is_bidirectional: Boolean
- verified: Boolean
- verified_at: Instant?
- verified_by: UUID?
- quality_score: Int?
- notes: Text?
- deprecated: Boolean
- created_at: Instant
- updated_at: Instant
```

#### 5. `plant_synonyms`
```kotlin
- id: UUID (PK)
- plant_id: UUID (FK)
- synonym: String
- type: String (e.g., "common", "scientific")
```

#### 6. `sources`
```kotlin
- id: UUID (PK)
- name: String
- type: SourceType enum
- url: String?
- citation: String?
- reliability_score: Int?
```

---

## Data Gaps Analysis

### Missing Critical Fields for Gardening Features

#### 1. **Temperature & Hardiness**
**Currently Missing**:
- ✗ Frost tolerance (scraped but not in DB)
- ✗ Hardiness zone min/max (Perenual has, not in DB)
- ✗ Min/max growing temperatures (Trefle has, not in DB)
- ✗ Soil temperature requirements (scraped but not in DB)

**Available**:
- ✓ Trefle: minimumTemperature, maximumTemperature
- ✓ Perenual: hardiness (zones)
- ✓ Scraped: soilTempMinF, soilTempOptimalF, frostTolerant

#### 2. **Spacing & Layout**
**Currently Missing**:
- ✗ Plant spacing min/max (scraped but not in DB)
- ✗ Row spacing (Trefle has, not in DB)
- ✗ Plant spread/width (Trefle has, not in DB)
- ✗ Height information (Trefle/Perenual have, not in DB)

**Available**:
- ✓ Trefle: rowSpacing, spread, averageHeight, maximumHeight
- ✓ Perenual: dimensions (height/spread with min/max)
- ✓ Scraped: spacingMin, spacingMax (inches)

#### 3. **Planting Details**
**Currently Missing**:
- ✗ Planting depth (scraped but not in DB)
- ✗ Germination time
- ✗ Transplant timing
- ✗ Direct sow vs transplant preference
- ✗ Seed starting indoors timing

**Available**:
- ✓ Scraped: plantingDepthInches
- ✓ Trefle: sowing information (text)

#### 4. **Watering**
**Currently Missing**:
- ✗ Watering frequency/schedule (scraped but not in DB)
- ✗ Drought tolerance (Perenual has, partially in DB)
- ✗ Water depth requirements (Perenual has)

**Available**:
- ✓ DB: water_needs (enum), drought_tolerant (boolean)
- ✓ Perenual: extensive watering data
- ✓ Scraped: wateringInchesPerWeek

#### 5. **Fertilizing & Nutrients**
**Currently Missing**:
- ✗ Fertilizing schedule (scraped but not in DB)
- ✗ NPK requirements
- ✗ Soil nutrient needs (Trefle has scale, not in DB)
- ✗ Heavy/light feeder (enum exists but underutilized)

**Available**:
- ✓ DB: feeder_type (enum), primary_nutrient_contribution (enum), is_nitrogen_fixer
- ✓ Trefle: soilNutriments (1-10 scale)
- ✓ Scraped: fertilizingFrequencyWeeks

#### 6. **Container Gardening**
**Currently Missing**:
- ✗ Container suitability (scraped but not in DB)
- ✗ Minimum container size
- ✗ Indoor growing capability (Perenual has)

**Available**:
- ✓ Perenual: indoor (boolean)
- ✓ Scraped: containerSuitable (boolean)

#### 7. **Support Structures**
**Currently Missing**:
- ✗ Staking requirements (scraped but not in DB)
- ✗ Trellising needs
- ✗ Support height requirements

**Available**:
- ✓ Scraped: requiresStaking (boolean)
- ✓ DB: growth_habit (includes CLIMBER, VINE)

#### 8. **Maintenance**
**Currently Missing**:
- ✗ Pruning requirements (scraped but not in DB)
- ✗ Pruning timing (Perenual has)
- ✗ Mulching recommendations (scraped but not in DB)
- ✗ Succession planting interval (exists but underutilized)

**Available**:
- ✓ DB: succession_interval_days
- ✓ Perenual: pruningMonth, pruningCount, maintenance level
- ✓ Scraped: requiresPruning, mulchRecommended

#### 9. **Harvest Information**
**Currently Missing**:
- ✗ Harvest timing/season (Perenual has)
- ✗ Harvest method (Perenual has)
- ✗ Yield expectations
- ✗ Storage information

**Available**:
- ✓ DB: days_to_maturity_min/max
- ✓ Perenual: harvestSeason, harvestMethod
- ✓ Scraped: daysToMaturityMin/Max

#### 10. **Plant Images**
**Currently Missing**:
- ✗ Image URLs (both APIs have, not in DB)
- ✗ Image types (flower, leaf, fruit, etc.)

**Available**:
- ✓ Trefle: imageUrl, images object with types
- ✓ Perenual: defaultImage, otherImages

#### 11. **Growing Season**
**Currently Missing**:
- ✗ Planting season/months
- ✗ Growing season length
- ✗ Bloom/flower timing (APIs have)
- ✗ Fruiting timing (APIs have)

**Available**:
- ✓ Trefle: growthMonths, bloomMonths, fruitMonths
- ✓ Perenual: floweringSeason, fruitingSeason

#### 12. **Pests & Diseases**
**Currently Missing**:
- ✗ Common pests
- ✗ Common diseases
- ✗ Pest resistance strategies
- ✗ Organic control methods

**Available**:
- ✓ Perenual: pestSusceptibility
- ✓ Scraped: pestsAndDiseases (raw text)

#### 13. **Companion Planting**
**Currently Missing**:
- ✗ Attractors (Perenual has)
- ✗ Companion planting from scraped data (exists as text, not structured)

**Available**:
- ✓ DB: companion_relationships table (comprehensive)
- ✓ Perenual: attracts (array)
- ✓ Scraped: companionSection (text)

---

## Recommended Comprehensive Data Class

### Main Plant Entity (Enhanced)

```kotlin
@Entity
@Table(name = "plants")
data class Plant(
    @Id val id: UUID = UUID.randomUUID(),
    
    // Identity - EXISTING
    @Column(name = "canonical_scientific_name", nullable = false) 
    var canonicalScientificName: String,
    
    @Column(name = "common_name") 
    var commonName: String? = null,
    
    @Column(name = "family") 
    var family: String? = null,
    
    @Column(name = "genus") 
    var genus: String? = null,
    
    // External IDs - EXISTING
    @Column(name = "source_trefle_id") 
    var sourceTrefleId: Long? = null,
    
    @Column(name = "source_perenual_id") 
    var sourcePerenualId: Long? = null,
    
    // NEW: Additional Identity Fields
    @Column(name = "slug") 
    var slug: String? = null,
    
    @Column(name = "type") 
    var type: String? = null, // from Perenual (e.g., "vegetable", "fruit")
    
    @Column(name = "origin") 
    var origin: String? = null,
    
    // Metadata - EXISTING
    @Column(name = "created_at", nullable = false) 
    var createdAt: Instant = Instant.now(),
    
    @Column(name = "updated_at", nullable = false) 
    var updatedAt: Instant = Instant.now()
)
```

### Enhanced Plant Attributes

```kotlin
@Entity
@Table(name = "plant_attributes")
data class PlantAttributes(
    @Id @Column(name = "plant_id") 
    val plantId: UUID,
    
    // ============ EXISTING FIELDS ============
    
    // Basic Classification
    @Column(name = "is_nitrogen_fixer", nullable = false) 
    var isNitrogenFixer: Boolean = false,
    
    @Enumerated(EnumType.STRING) @Column(name = "cycle")
    var cycle: PlantCycle? = null,
    
    @Enumerated(EnumType.STRING) @Column(name = "growth_habit")
    var growthHabit: GrowthHabit? = null,
    
    // Environment
    @Enumerated(EnumType.STRING) @Column(name = "root_depth", nullable = false)
    var rootDepth: RootDepth,
    
    @Enumerated(EnumType.STRING) @Column(name = "sun_needs")
    var sunNeeds: SunNeeds? = null,
    
    @Enumerated(EnumType.STRING) @Column(name = "water_needs")
    var waterNeeds: WaterNeeds? = null,
    
    @Column(name = "ph_min") 
    var phMin: Double? = null,
    
    @Column(name = "ph_max") 
    var phMax: Double? = null,
    
    // Care
    @Enumerated(EnumType.STRING) @Column(name = "feeder_type")
    var feederType: FeederType? = null,
    
    @Enumerated(EnumType.STRING) @Column(name = "primary_nutrient_contribution")
    var primaryNutrientContribution: PrimaryNutrientContribution? = null,
    
    // Harvest
    @Column(name = "days_to_maturity_min") 
    var daysToMaturityMin: Int? = null,
    
    @Column(name = "days_to_maturity_max") 
    var daysToMaturityMax: Int? = null,
    
    @Column(name = "succession_interval_days") 
    var successionIntervalDays: Int? = null,
    
    // Traits
    @Enumerated(EnumType.STRING) @Column(name = "toxicity_level")
    var toxicityLevel: ToxicityLevel? = null,
    
    @Column(name = "invasive") 
    var invasive: Boolean? = null,
    
    @Column(name = "drought_tolerant") 
    var droughtTolerant: Boolean? = null,
    
    @Column(name = "poisonous_to_pets") 
    var poisonousToPets: Boolean? = null,
    
    // ============ NEW FIELDS ============
    
    // Temperature & Hardiness
    @Column(name = "frost_tolerant") 
    var frostTolerant: Boolean? = null,
    
    @Column(name = "hardiness_zone_min") 
    var hardinessZoneMin: String? = null,
    
    @Column(name = "hardiness_zone_max") 
    var hardinessZoneMax: String? = null,
    
    @Column(name = "min_temperature_f") 
    var minTemperatureF: Int? = null,
    
    @Column(name = "max_temperature_f") 
    var maxTemperatureF: Int? = null,
    
    @Column(name = "soil_temp_min_f") 
    var soilTempMinF: Int? = null,
    
    @Column(name = "soil_temp_optimal_f") 
    var soilTempOptimalF: Int? = null,
    
    // Spacing & Size
    @Column(name = "spacing_min_inches") 
    var spacingMinInches: Int? = null,
    
    @Column(name = "spacing_max_inches") 
    var spacingMaxInches: Int? = null,
    
    @Column(name = "row_spacing_inches") 
    var rowSpacingInches: Int? = null,
    
    @Column(name = "spread_min_inches") 
    var spreadMinInches: Int? = null,
    
    @Column(name = "spread_max_inches") 
    var spreadMaxInches: Int? = null,
    
    @Column(name = "height_min_inches") 
    var heightMinInches: Int? = null,
    
    @Column(name = "height_max_inches") 
    var heightMaxInches: Int? = null,
    
    // Planting
    @Column(name = "planting_depth_inches") 
    var plantingDepthInches: Double? = null,
    
    @Column(name = "min_root_depth_cm") 
    var minRootDepthCm: Int? = null,
    
    @Column(name = "germination_days_min") 
    var germinationDaysMin: Int? = null,
    
    @Column(name = "germination_days_max") 
    var germinationDaysMax: Int? = null,
    
    // Watering
    @Column(name = "watering_inches_per_week") 
    var wateringInchesPerWeek: Double? = null,
    
    @Column(name = "watering_frequency_days") 
    var wateringFrequencyDays: Int? = null,
    
    @Column(name = "watering_depth_inches") 
    var wateringDepthInches: Int? = null,
    
    // Fertilizing
    @Column(name = "fertilizing_frequency_weeks") 
    var fertilizingFrequencyWeeks: Int? = null,
    
    @Column(name = "soil_nutrient_needs") 
    var soilNutrientNeeds: Int? = null, // Trefle 1-10 scale
    
    // Container & Support
    @Column(name = "container_suitable") 
    var containerSuitable: Boolean? = null,
    
    @Column(name = "min_container_size_gallons") 
    var minContainerSizeGallons: Int? = null,
    
    @Column(name = "indoor_suitable") 
    var indoorSuitable: Boolean? = null,
    
    @Column(name = "requires_staking") 
    var requiresStaking: Boolean? = null,
    
    @Column(name = "requires_trellising") 
    var requiresTrallising: Boolean? = null,
    
    // Maintenance
    @Column(name = "requires_pruning") 
    var requiresPruning: Boolean? = null,
    
    @Column(name = "pruning_frequency_weeks") 
    var pruningFrequencyWeeks: Int? = null,
    
    @Column(name = "mulch_recommended") 
    var mulchRecommended: Boolean? = null,
    
    @Enumerated(EnumType.STRING) 
    @Column(name = "maintenance_level")
    var maintenanceLevel: MaintenanceLevel? = null, // NEW ENUM: LOW, MEDIUM, HIGH
    
    @Enumerated(EnumType.STRING) 
    @Column(name = "care_level")
    var careLevel: CareLevel? = null, // NEW ENUM: EASY, MODERATE, DIFFICULT
    
    // Growth & Development
    @Enumerated(EnumType.STRING) 
    @Column(name = "growth_rate")
    var growthRate: GrowthRate? = null, // NEW ENUM: SLOW, MODERATE, FAST
    
    // Seasonal Information
    @Column(name = "growth_months") 
    var growthMonths: String? = null, // JSON array
    
    @Column(name = "bloom_months") 
    var bloomMonths: String? = null, // JSON array
    
    @Column(name = "fruit_months") 
    var fruitMonths: String? = null, // JSON array
    
    @Column(name = "harvest_season") 
    var harvestSeason: String? = null,
    
    // Additional Traits
    @Column(name = "poisonous_to_humans") 
    var poisonousToHumans: Boolean? = null,
    
    @Column(name = "salt_tolerant") 
    var saltTolerant: Boolean? = null,
    
    @Column(name = "medicinal") 
    var medicinal: Boolean? = null,
    
    @Column(name = "attracts_pollinators") 
    var attractsPollinators: Boolean? = null,
    
    @Column(name = "attracts_beneficial_insects") 
    var attractsBeneficialInsects: Boolean? = null,
    
    @Column(name = "deer_resistant") 
    var deerResistant: Boolean? = null,
    
    @Column(name = "rare") 
    var rare: Boolean? = null,
    
    @Column(name = "tropical") 
    var tropical: Boolean? = null,
    
    // Notes & Description
    @Column(name = "care_notes", columnDefinition = "TEXT") 
    var careNotes: String? = null,
    
    @Column(name = "description", columnDefinition = "TEXT") 
    var description: String? = null,
    
    // Metadata
    @Column(name = "created_at", nullable = false) 
    val createdAt: Instant = Instant.now(),
    
    @Column(name = "updated_at", nullable = false) 
    var updatedAt: Instant = Instant.now()
)
```

### New Supporting Tables

#### Plant Images
```kotlin
@Entity
@Table(name = "plant_images")
data class PlantImage(
    @Id val id: UUID = UUID.randomUUID(),
    
    @Column(name = "plant_id", nullable = false)
    val plantId: UUID,
    
    @Column(name = "image_url", nullable = false)
    var imageUrl: String,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "image_type")
    var imageType: ImageType? = null, // FLOWER, LEAF, FRUIT, HABIT, BARK, OTHER
    
    @Column(name = "is_primary")
    var isPrimary: Boolean = false,
    
    @Column(name = "source")
    var source: String? = null, // "trefle", "perenual", "scraped"
    
    @Column(name = "license")
    var license: String? = null,
    
    @Column(name = "license_url")
    var licenseUrl: String? = null,
    
    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now()
)

enum class ImageType {
    FLOWER, LEAF, FRUIT, HABIT, BARK, SEED, WHOLE_PLANT, OTHER
}
```

#### Plant Pests & Diseases
```kotlin
@Entity
@Table(name = "plant_pests_diseases")
data class PlantPestDisease(
    @Id val id: UUID = UUID.randomUUID(),
    
    @Column(name = "plant_id", nullable = false)
    val plantId: UUID,
    
    @Column(name = "name", nullable = false)
    var name: String,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    var type: PestDiseaseType, // PEST, DISEASE, DISORDER
    
    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,
    
    @Column(name = "symptoms", columnDefinition = "TEXT")
    var symptoms: String? = null,
    
    @Column(name = "prevention", columnDefinition = "TEXT")
    var prevention: String? = null,
    
    @Column(name = "treatment", columnDefinition = "TEXT")
    var treatment: String? = null,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "severity")
    var severity: SeverityLevel? = null, // LOW, MEDIUM, HIGH
    
    @Column(name = "source")
    var source: String? = null,
    
    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now()
)

enum class PestDiseaseType { PEST, DISEASE, DISORDER }
enum class SeverityLevel { LOW, MEDIUM, HIGH }
```

#### Plant Growing Tips
```kotlin
@Entity
@Table(name = "plant_growing_tips")
data class PlantGrowingTip(
    @Id val id: UUID = UUID.randomUUID(),
    
    @Column(name = "plant_id", nullable = false)
    val plantId: UUID,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    var category: TipCategory, // PLANTING, WATERING, FERTILIZING, PRUNING, HARVESTING, GENERAL
    
    @Column(name = "tip", columnDefinition = "TEXT", nullable = false)
    var tip: String,
    
    @Column(name = "priority")
    var priority: Int? = null, // 1=highest
    
    @Column(name = "source")
    var source: String? = null,
    
    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now()
)

enum class TipCategory {
    PLANTING, WATERING, FERTILIZING, PRUNING, HARVESTING, PEST_CONTROL, GENERAL
}
```

### New Enums Needed

```kotlin
enum class MaintenanceLevel { LOW, MEDIUM, HIGH }
enum class CareLevel { EASY, MODERATE, DIFFICULT }
enum class GrowthRate { SLOW, MODERATE, FAST }
```

---

## Priority Fields for API Development

### High Priority (Core Features)
1. **Identity**: commonName, scientificName, family, genus ✓
2. **Growing**: cycle, sunNeeds, waterNeeds, rootDepth ✓
3. **Spacing**: spacingMin/Max, height, spread **NEW**
4. **Planting**: plantingDepth, frostTolerant, soilTemp **NEW**
5. **Maturity**: daysToMaturity ✓
6. **Container**: containerSuitable **NEW**
7. **Companions**: existing relationship table ✓
8. **Edible Parts**: existing table ✓

### Medium Priority (Enhanced Features)
9. **Temperature**: hardiness zones, min/max temps **NEW**
10. **Watering**: frequency, amount **NEW**
11. **Fertilizing**: frequency **NEW**
12. **Support**: staking, trellising **NEW**
13. **Maintenance**: pruning, mulching **NEW**
14. **Images**: primary image **NEW**
15. **Seasonal**: growth/bloom/fruit months **NEW**

### Low Priority (Nice to Have)
16. **Pests/Diseases**: separate table **NEW**
17. **Growing Tips**: separate table **NEW**
18. **Advanced Traits**: attracts pollinators, deer resistant, etc. **NEW**

---

## Recommendation Summary

### Immediate Actions:
1. **Extend `plant_attributes` table** with high-priority fields marked **NEW**
2. **Create `plant_images` table** for image management
3. **Add new enums**: MaintenanceLevel, CareLevel, GrowthRate, ImageType
4. **Update ETL pipeline** to populate new fields from all three sources

### Data Quality:
- Scraped data (76 plants) provides best coverage for practical gardening info
- Trefle provides scientific/botanical data
- Perenual provides comprehensive characteristics
- **Strategy**: Use scraped as primary for gardening attributes, APIs for taxonomy and metadata

### Next Steps:
1. Review and approve enhanced schema
2. Create database migration scripts
3. Update DTOs for API responses
4. Implement data merge logic to populate from all sources
5. Build REST API endpoints with comprehensive plant data
