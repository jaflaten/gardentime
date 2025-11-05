
# Updated Plant Data Model & Schema Design
## Revised Based on Trefle + Scraped Data + Companionship Data

_Last Updated: 2025-11-04_

---

## Data Source Strategy

### Primary Sources (Reliable & Available)
1. **Almanac Scraped Data** (76 plants) - PRIMARY for practical gardening info
   - Planting guides, care instructions, harvest info
   - Temperature requirements, spacing, watering/fertilizing schedules
   - Container suitability, support needs, maintenance
   
2. **Trefle API** - SECONDARY for botanical/scientific data
   - Taxonomy (scientific names, family, genus)
   - Environmental requirements (pH, temperature, precipitation)
   - Growth characteristics (height, spread, root depth)
   - Seasonal timing (growth months, bloom months, fruit months)
   - Images and sources
   
3. **Companionship Data** (42 plants, 2,303 relationships)
   - Pre-compiled companionship matrix
   - 194 beneficial, 64 unfavorable, 2,045 neutral relationships
   - Critical for garden planning features

### Deprecated Sources
- ~~Perenual API~~ - Free tier unreliable, will be replaced

---

## Core Database Schema

### 1. Plants Table (Core Identity)

```kotlin
@Entity
@Table(
    name = "plants",
    indexes = [
        Index(name = "idx_plants_canonical", columnList = "canonical_scientific_name"),
        Index(name = "idx_plants_common", columnList = "common_name"),
        Index(name = "idx_plants_slug", columnList = "slug")
    ]
)
data class Plant(
    @Id 
    val id: UUID = UUID.randomUUID(),
    
    // ============ Identity ============
    @Column(name = "canonical_scientific_name", nullable = false) 
    var canonicalScientificName: String,
    
    @Column(name = "common_name") 
    var commonName: String? = null,
    
    @Column(name = "slug", unique = true) 
    var slug: String? = null,
    
    @Column(name = "family") 
    var family: String? = null,
    
    @Column(name = "genus") 
    var genus: String? = null,
    
    // ============ Classification ============
    @Column(name = "type") 
    var type: String? = null, // "vegetable", "fruit", "herb"
    
    @Column(name = "origin") 
    var origin: String? = null,
    
    @Column(name = "vegetable") 
    var vegetable: Boolean? = null,
    
    @Column(name = "edible") 
    var edible: Boolean? = null,
    
    // ============ External Source IDs ============
    @Column(name = "source_trefle_id") 
    var sourceTrefleId: Long? = null,
    
    @Column(name = "almanac_slug") 
    var almanacSlug: String? = null,
    
    // ============ Metadata ============
    @Column(name = "created_at", nullable = false) 
    var createdAt: Instant = Instant.now(),
    
    @Column(name = "updated_at", nullable = false) 
    var updatedAt: Instant = Instant.now()
)
```

---

### 2. Plant Attributes Table (Extended)

```kotlin
@Entity
@Table(name = "plant_attributes")
data class PlantAttributes(
    @Id 
    @Column(name = "plant_id") 
    val plantId: UUID,
    
    // ============================================================
    // CLASSIFICATION & GROWTH CHARACTERISTICS
    // ============================================================
    
    @Enumerated(EnumType.STRING) 
    @Column(name = "cycle")
    var cycle: PlantCycle? = null, // ANNUAL, PERENNIAL, BIENNIAL
    
    @Enumerated(EnumType.STRING) 
    @Column(name = "growth_habit")
    var growthHabit: GrowthHabit? = null, // BUSH, VINE, CLIMBER, ROOT, LEAF, FRUITING
    
    @Enumerated(EnumType.STRING) 
    @Column(name = "growth_rate")
    var growthRate: GrowthRate? = null, // SLOW, MODERATE, FAST (from Trefle)
    
    @Column(name = "is_nitrogen_fixer", nullable = false) 
    var isNitrogenFixer: Boolean = false,
    
    // ============================================================
    // ENVIRONMENTAL REQUIREMENTS
    // ============================================================
    
    // Sun & Light
    @Enumerated(EnumType.STRING) 
    @Column(name = "sun_needs")
    var sunNeeds: SunNeeds? = null, // FULL_SUN, PART_SHADE, SHADE
    
    @Column(name = "light_intensity") 
    var lightIntensity: Int? = null, // Trefle: 1-10 scale
    
    // Soil
    @Enumerated(EnumType.STRING) 
    @Column(name = "root_depth", nullable = false)
    var rootDepth: RootDepth, // SHALLOW, MEDIUM, DEEP
    
    @Column(name = "min_root_depth_cm") 
    var minRootDepthCm: Int? = null, // Trefle: minimum root depth
    
    @Column(name = "ph_min") 
    var phMin: Double? = null,
    
    @Column(name = "ph_max") 
    var phMax: Double? = null,
    
    @Column(name = "soil_nutrient_needs") 
    var soilNutrientNeeds: Int? = null, // Trefle: 1-10 scale
    
    @Column(name = "soil_texture_preference") 
    var soilTexturePreference: Int? = null, // Trefle: 1-10 scale
    
    @Column(name = "soil_humidity_preference") 
    var soilHumidityPreference: Int? = null, // Trefle: 1-10 scale
    
    @Column(name = "soil_salinity_tolerance") 
    var soilSalinityTolerance: Int? = null, // Trefle: 1-10 scale
    
    // Water
    @Enumerated(EnumType.STRING) 
    @Column(name = "water_needs")
    var waterNeeds: WaterNeeds? = null, // LOW, MODERATE, HIGH, FREQUENT
    
    @Column(name = "watering_inches_per_week") 
    var wateringInchesPerWeek: Double? = null, // Scraped: specific amount
    
    @Column(name = "watering_frequency_days") 
    var wateringFrequencyDays: Int? = null,
    
    @Column(name = "drought_tolerant") 
    var droughtTolerant: Boolean? = null,
    
    @Column(name = "atmospheric_humidity") 
    var atmosphericHumidity: Int? = null, // Trefle: 1-10 scale
    
    // ============================================================
    // TEMPERATURE & HARDINESS
    // ============================================================
    
    @Column(name = "frost_tolerant") 
    var frostTolerant: Boolean? = null, // Scraped
    
    @Column(name = "hardiness_zone_min") 
    var hardinessZoneMin: String? = null,
    
    @Column(name = "hardiness_zone_max") 
    var hardinessZoneMax: String? = null,
    
    @Column(name = "min_temperature_f") 
    var minTemperatureF: Int? = null, // Trefle: converted from Celsius
    
    @Column(name = "max_temperature_f") 
    var maxTemperatureF: Int? = null, // Trefle: converted from Celsius
    
    @Column(name = "soil_temp_min_f") 
    var soilTempMinF: Int? = null, // Scraped
    
    @Column(name = "soil_temp_optimal_f") 
    var soilTempOptimalF: Int? = null, // Scraped
    
    @Column(name = "min_precipitation_mm") 
    var minPrecipitationMm: Int? = null, // Trefle
    
    @Column(name = "max_precipitation_mm") 
    var maxPrecipitationMm: Int? = null, // Trefle
    
    // ============================================================
    // SPACING & DIMENSIONS
    // ============================================================
    
    @Column(name = "spacing_min_inches") 
    var spacingMinInches: Int? = null, // Scraped
    
    @Column(name = "spacing_max_inches") 
    var spacingMaxInches: Int? = null, // Scraped
    
    @Column(name = "row_spacing_inches") 
    var rowSpacingInches: Int? = null, // Trefle: converted from cm
    
    @Column(name = "spread_min_inches") 
    var spreadMinInches: Int? = null, // Trefle: converted from cm
    
    @Column(name = "spread_max_inches") 
    var spreadMaxInches: Int? = null,
    
    @Column(name = "height_min_inches") 
    var heightMinInches: Int? = null, // Trefle: average height
    
    @Column(name = "height_max_inches") 
    var heightMaxInches: Int? = null, // Trefle: maximum height
    
    // ============================================================
    // PLANTING & GERMINATION
    // ============================================================
    
    @Column(name = "planting_depth_inches") 
    var plantingDepthInches: Double? = null, // Scraped
    
    @Column(name = "germination_days_min") 
    var germinationDaysMin: Int? = null,
    
    @Column(name = "germination_days_max") 
    var germinationDaysMax: Int? = null,
    
    @Column(name = "sowing_description") 
    var sowingDescription: String? = null, // Trefle: text description
    
    // ============================================================
    // NUTRITION & FEEDING
    // ============================================================
    
    @Enumerated(EnumType.STRING) 
    @Column(name = "feeder_type")
    var feederType: FeederType? = null, // HEAVY, MODERATE, LIGHT
    
    @Enumerated(EnumType.STRING) 
    @Column(name = "primary_nutrient_contribution")
    var primaryNutrientContribution: PrimaryNutrientContribution? = null, // NITROGEN, POTASSIUM, PHOSPHORUS, NONE
    
    @Column(name = "fertilizing_frequency_weeks") 
    var fertilizingFrequencyWeeks: Int? = null, // Scraped
    
    // ============================================================
    // CONTAINER & SUPPORT
    // ============================================================
    
    @Column(name = "container_suitable") 
    var containerSuitable: Boolean? = null, // Scraped
    
    @Column(name = "min_container_size_gallons") 
    var minContainerSizeGallons: Int? = null,
    
    @Column(name = "requires_staking") 
    var requiresStaking: Boolean? = null, // Scraped
    
    @Column(name = "requires_trellising") 
    var requiresTrellising: Boolean? = null,
    
    // ============================================================
    // MAINTENANCE & CARE
    // ============================================================
    
    @Column(name = "requires_pruning") 
    var requiresPruning: Boolean? = null, // Scraped
    
    @Column(name = "pruning_frequency_weeks") 
    var pruningFrequencyWeeks: Int? = null,
    
    @Column(name = "mulch_recommended") 
    var mulchRecommended: Boolean? = null, // Scraped
    
    @Enumerated(EnumType.STRING) 
    @Column(name = "maintenance_level")
    var maintenanceLevel: MaintenanceLevel? = null, // LOW, MEDIUM, HIGH
    
    @Enumerated(EnumType.STRING) 
    @Column(name = "care_level")
    var careLevel: CareLevel? = null, // EASY, MODERATE, DIFFICULT
    
    // ============================================================
    // MATURITY & HARVEST
    // ============================================================
    
    @Column(name = "days_to_maturity_min") 
    var daysToMaturityMin: Int? = null, // Scraped
    
    @Column(name = "days_to_maturity_max") 
    var daysToMaturityMax: Int? = null, // Scraped
    
    @Column(name = "days_to_harvest") 
    var daysToHarvest: Int? = null, // Trefle
    
    @Column(name = "harvest_season") 
    var harvestSeason: String? = null,
    
    @Column(name = "succession_interval_days") 
    var successionIntervalDays: Int? = null,
    
    // ============================================================
    // SEASONAL TIMING (stored as JSON arrays)
    // ============================================================
    
    @Column(name = "growth_months", columnDefinition = "TEXT") 
    var growthMonths: String? = null, // Trefle: JSON array ["april", "may", "june"]
    
    @Column(name = "bloom_months", columnDefinition = "TEXT") 
    var bloomMonths: String? = null, // Trefle: JSON array
    
    @Column(name = "fruit_months", columnDefinition = "TEXT") 
    var fruitMonths: String? = null, // Trefle: JSON array
    
    // ============================================================
    // PLANT CHARACTERISTICS
    // ============================================================
    
    @Column(name = "has_flowers") 
    var hasFlowers: Boolean? = null,
    
    @Column(name = "flower_color") 
    var flowerColor: String? = null, // Trefle
    
    @Column(name = "flower_conspicuous") 
    var flowerConspicuous: Boolean? = null, // Trefle
    
    @Column(name = "foliage_texture") 
    var foliageTexture: String? = null, // Trefle
    
    @Column(name = "foliage_color") 
    var foliageColor: String? = null, // Trefle
    
    @Column(name = "fruit_conspicuous") 
    var fruitConspicuous: Boolean? = null, // Trefle
    
    @Column(name = "fruit_color") 
    var fruitColor: String? = null, // Trefle
    
    // ============================================================
    // TRAITS & PROPERTIES
    // ============================================================
    
    @Enumerated(EnumType.STRING) 
    @Column(name = "toxicity_level")
    var toxicityLevel: ToxicityLevel? = null, // NONE, LOW, MODERATE, HIGH
    
    @Column(name = "poisonous_to_humans") 
    var poisonousToHumans: Boolean? = null,
    
    @Column(name = "poisonous_to_pets") 
    var poisonousToPets: Boolean? = null,
    
    @Column(name = "invasive") 
    var invasive: Boolean? = null,
    
    @Column(name = "medicinal") 
    var medicinal: Boolean? = null,
    
    @Column(name = "attracts_pollinators") 
    var attractsPollinators: Boolean? = null,
    
    @Column(name = "attracts_beneficial_insects") 
    var attractsBeneficialInsects: Boolean? = null,
    
    // ============================================================
    // NOTES & DESCRIPTIONS
    // ============================================================
    
    @Column(name = "care_notes", columnDefinition = "TEXT") 
    var careNotes: String? = null, // Scraped: concise care tips
    
    @Column(name = "description", columnDefinition = "TEXT") 
    var description: String? = null, // Trefle or scraped
    
    // ============================================================
    // METADATA
    // ============================================================
    
    @Column(name = "created_at", nullable = false) 
    val createdAt: Instant = Instant.now(),
    
    @Column(name = "updated_at", nullable = false) 
    var updatedAt: Instant = Instant.now()
)
```

---

### 3. Plant Edible Parts Table

```kotlin
@Entity
@Table(name = "plant_edible_parts")
@IdClass(PlantEdiblePartId::class)
data class PlantEdiblePart(
    @Id
    @Column(name = "plant_id")
    val plantId: UUID,
    
    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "edible_part")
    val ediblePart: EdiblePart // FRUIT, LEAF, ROOT, SEED, FLOWER, STEM
)

data class PlantEdiblePartId(
    val plantId: UUID = UUID.randomUUID(),
    val ediblePart: EdiblePart = EdiblePart.FRUIT
) : Serializable

enum class EdiblePart {
    FRUIT, LEAF, ROOT, SEED, FLOWER, STEM, TUBER, BULB
}
```

---

### 4. Companion Relationships Table (Enhanced)

```kotlin
@Entity
@Table(
    name = "companion_relationships",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["plant_a_id", "plant_b_id"])
    ],
    indexes = [
        Index(name = "idx_companion_plant_a", columnList = "plant_a_id"),
        Index(name = "idx_companion_plant_b", columnList = "plant_b_id"),
        Index(name = "idx_companion_type", columnList = "relationship_type")
    ]
)
data class CompanionRelationship(
    @Id 
    val id: UUID = UUID.randomUUID(),
    
    // ============ Plant Pair ============
    @ManyToOne(fetch = FetchType.LAZY) 
    @JoinColumn(name = "plant_a_id", nullable = false) 
    val plantA: Plant,
    
    @ManyToOne(fetch = FetchType.LAZY) 
    @JoinColumn(name = "plant_b_id", nullable = false) 
    val plantB: Plant,
    
    // ============ Relationship ============
    @Enumerated(EnumType.STRING) 
    @Column(name = "relationship_type", nullable = false) 
    val relationshipType: RelationshipType, // BENEFICIAL, NEUTRAL, UNFAVORABLE
    
    @Enumerated(EnumType.STRING) 
    @Column(name = "relationship_subtype") 
    val relationshipSubtype: RelationshipSubtype? = null, // PEST_DETERRENT, NUTRIENT_SUPPORT, SHADE, STRUCTURAL, OTHER
    
    // ============ Evidence & Quality ============
    @Enumerated(EnumType.STRING) 
    @Column(name = "confidence_level", nullable = false) 
    val confidenceLevel: ConfidenceLevel, // HIGH, MEDIUM, LOW
    
    @Enumerated(EnumType.STRING) 
    @Column(name = "evidence_type", nullable = false) 
    val evidenceType: EvidenceType, // SCIENTIFIC, TRADITIONAL, ANECDOTAL
    
    @Column(name = "quality_score") 
    val qualityScore: Int? = null, // 1-100
    
    // ============ Details ============
    @Column(name = "reason", length = 400) 
    val reason: String? = null,
    
    @Column(name = "mechanism", columnDefinition = "TEXT") 
    val mechanism: String? = null,
    
    @Column(name = "notes", columnDefinition = "TEXT") 
    val notes: String? = null,
    
    // ============ Source ============
    @ManyToOne(fetch = FetchType.LAZY) 
    @JoinColumn(name = "source_id") 
    val source: Source? = null,
    
    @Column(name = "source_url") 
    val sourceUrl: String? = null,
    
    @Column(name = "source_data_origin") 
    val sourceDataOrigin: String? = null, // "companionship-extended2.json", etc.
    
    // ============ Scope & Direction ============
    @Column(name = "geographic_scope") 
    val geographicScope: String? = null,
    
    @Column(name = "is_bidirectional") 
    val isBidirectional: Boolean = true, // Most companionships work both ways
    
    // ============ Verification ============
    @Column(name = "verified") 
    val verified: Boolean = false,
    
    @Column(name = "verified_at") 
    val verifiedAt: Instant? = null,
    
    @Column(name = "verified_by") 
    val verifiedBy: UUID? = null,
    
    @Column(name = "deprecated") 
    val deprecated: Boolean = false,
    
    // ============ Metadata ============
    @Column(name = "created_at", nullable = false) 
    val createdAt: Instant = Instant.now(),
    
    @Column(name = "updated_at", nullable = false) 
    var updatedAt: Instant = Instant.now()
)
```

---

### 5. Plant Synonyms Table

```kotlin
@Entity
@Table(
    name = "plant_synonyms",
    indexes = [
        Index(name = "idx_synonym_plant", columnList = "plant_id"),
        Index(name = "idx_synonym_name", columnList = "synonym_name")
    ]
)
data class PlantSynonym(
    @Id 
    val id: UUID = UUID.randomUUID(),
    
    @Column(name = "plant_id", nullable = false)
    val plantId: UUID,
    
    @Column(name = "synonym_name", nullable = false)
    var synonymName: String,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "synonym_type")
    var synonymType: SynonymType, // COMMON_NAME, SCIENTIFIC_NAME, TRADE_NAME, REGIONAL_NAME
    
    @Column(name = "language")
    var language: String? = null, // ISO 639-1 code (e.g., "en", "es", "fr")
    
    @Column(name = "region")
    var region: String? = null,
    
    @Column(name = "source")
    var source: String? = null, // "trefle", "almanac", "manual"
    
    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now()
)

enum class SynonymType {
    COMMON_NAME, SCIENTIFIC_NAME, TRADE_NAME, REGIONAL_NAME
}
```

---

### 6. Plant Images Table

```kotlin
@Entity
@Table(
    name = "plant_images",
    indexes = [
        Index(name = "idx_image_plant", columnList = "plant_id"),
        Index(name = "idx_image_primary", columnList = "is_primary")
    ]
)
data class PlantImage(
    @Id 
    val id: UUID = UUID.randomUUID(),
    
    @Column(name = "plant_id", nullable = false)
    val plantId: UUID,
    
    @Column(name = "image_url", nullable = false, length = 1000)
    var imageUrl: String,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "image_type")
    var imageType: ImageType? = null, // FLOWER, LEAF, FRUIT, HABIT, BARK, SEED, WHOLE_PLANT, OTHER
    
    @Column(name = "is_primary")
    var isPrimary: Boolean = false,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "source")
    var source: ImageSource, // TREFLE, ALMANAC, USER_UPLOAD, OTHER
    
    @Column(name = "license")
    var license: String? = null,
    
    @Column(name = "license_url")
    var licenseUrl: String? = null,
    
    @Column(name = "attribution")
    var attribution: String? = null,
    
    @Column(name = "description")
    var description: String? = null,
    
    @Column(name = "width")
    var width: Int? = null,
    
    @Column(name = "height")
    var height: Int? = null,
    
    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now()
)

enum class ImageType {
    FLOWER, LEAF, FRUIT, HABIT, BARK, SEED, WHOLE_PLANT, OTHER
}

enum class ImageSource {
    TREFLE, ALMANAC, USER_UPLOAD, OTHER
}
```

---

### 7. Sources Table

```kotlin
@Entity
@Table(name = "sources")
data class Source(
    @Id 
    val id: UUID = UUID.randomUUID(),
    
    @Column(name = "name", nullable = false)
    var name: String,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    var type: SourceType, // WEBSITE, BOOK, JOURNAL, API, INTERNAL
    
    @Column(name = "url", length = 1000)
    var url: String? = null,
    
    @Column(name = "citation", columnDefinition = "TEXT")
    var citation: String? = null,
    
    @Column(name = "reliability_score")
    var reliabilityScore: Int? = null, // 1-100
    
    @Column(name = "last_accessed")
    var lastAccessed: Instant? = null,
    
    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now()
)

enum class SourceType {
    WEBSITE, BOOK, JOURNAL, API, INTERNAL
}
```

---

## Enums Summary

```kotlin
// Plant Classification
enum class PlantCycle { ANNUAL, PERENNIAL, BIENNIAL }
enum class GrowthHabit { BUSH, VINE, CLIMBER, ROOT, LEAF, FRUITING, OTHER }
enum class GrowthRate { SLOW, MODERATE, FAST }

// Environmental
enum class SunNeeds { FULL_SUN, PART_SHADE, SHADE }
enum class WaterNeeds { LOW, MODERATE, HIGH, FREQUENT }
enum class RootDepth { SHALLOW, MEDIUM, DEEP }

// Nutrition
enum class FeederType { HEAVY, MODERATE, LIGHT }
enum class PrimaryNutrientContribution { NITROGEN, POTASSIUM, PHOSPHORUS, NONE }

// Care
enum class MaintenanceLevel { LOW, MEDIUM, HIGH }
enum class CareLevel { EASY, MODERATE, DIFFICULT }

// Safety
enum class ToxicityLevel { NONE, LOW, MODERATE, HIGH }

// Companionship
enum class RelationshipType { BENEFICIAL, NEUTRAL, UNFAVORABLE }
enum class RelationshipSubtype { PEST_DETERRENT, NUTRIENT_SUPPORT, SHADE, STRUCTURAL, OTHER }
enum class ConfidenceLevel { HIGH, MEDIUM, LOW }
enum class EvidenceType { SCIENTIFIC, TRADITIONAL, ANECDOTAL }

// Edible Parts
enum class EdiblePart { FRUIT, LEAF, ROOT, SEED, FLOWER, STEM, TUBER, BULB }

// Other
enum class SynonymType { COMMON_NAME, SCIENTIFIC_NAME, TRADE_NAME, REGIONAL_NAME }
enum class ImageType { FLOWER, LEAF, FRUIT, HABIT, BARK, SEED, WHOLE_PLANT, OTHER }
enum class ImageSource { TREFLE, ALMANAC, USER_UPLOAD, OTHER }
enum class SourceType { WEBSITE, BOOK, JOURNAL, API, INTERNAL }
```

---

## Data Import Strategy

### Phase 1: Import Companionship Data
**Source**: `companionship-extended2.json` (42 plants, 2,303 relationships)

1. Parse JSON file
2. For each plant pair:
   - Look up or create Plant records (use common names)
   - Map "beneficial" → BENEFICIAL
   - Map "unfavorable" → UNFAVORABLE  
   - Map "neutral" → NEUTRAL
   - Set confidence_level = MEDIUM (curated data)
   - Set evidence_type = TRADITIONAL (companion planting knowledge)
   - Set source_data_origin = "companionship-extended2.json"
   - Set is_bidirectional = true (most companion relationships work both ways)

### Phase 2: Import Scraped Almanac Data
**Source**: `extracted-text/*.json` (76 plants)

Priority fields to import:
- Plant identity (commonName, slug)
- cycle, sunNeeds, waterNeeds, rootDepth, growthHabit
- frostTolerant, soilTempMinF, soilTempOptimalF
- spacingMin/Max, plantingDepthInches
- containerSuitable, requiresStaking, requiresPruning, mulchRecommended
- wateringInchesPerWeek, fertilizingFrequencyWeeks
- daysToMaturityMin/Max
- edibleParts (create PlantEdiblePart records)
- notes → care_notes

### Phase 3: Enhance with Trefle Data
**Source**: Trefle API

For each plant with a trefle_id:
- Taxonomy: scientificName, family, genus
- Environmental: phMin/Max, lightIntensity, soilNutrientNeeds, min/maxTemperature
- Dimensions: height, spread, rowSpacing, minRootDepthCm
- Timing: growthMonths, bloomMonths, fruitMonths
- Characteristics: flowerColor, foliageTexture, etc.
- Images: create PlantImage records
- Synonyms: create PlantSynonym records

### Phase 4: Data Merging Strategy

When data conflicts between sources:
1. **Identity**: Prefer Trefle (canonical scientific names)
2. **Practical Gardening**: Prefer Scraped (spacing, watering, care)
3. **Scientific**: Prefer Trefle (taxonomy, botanical characteristics)
4. **Companionship**: Use dedicated companionship file
5. **Images**: Aggregate from all sources, mark primary

---

## API Response DTOs

### Plant Summary DTO (for lists)
```kotlin
data class PlantSummaryDto(
    val id: UUID,
    val commonName: String?,
    val scientificName: String,
    val slug: String?,
    val family: String?,
    val type: String?,
    val cycle: PlantCycle?,
    val sunNeeds: SunNeeds?,
    val waterNeeds: WaterNeeds?,
    val edibleParts: List<EdiblePart>,
    val primaryImageUrl: String?,
    val daysToMaturityMin: Int?,
    val daysToMaturityMax: Int?
)
```

### Plant Detail DTO (for single plant view)
```kotlin
data class PlantDetailDto(
    // Identity
    val id: UUID,
    val commonName: String?,
    val scientificName: String,
    val slug: String?,
    val family: String?,
    val genus: String?,
    val type: String?,
    val synonyms: List<PlantSynonymDto>,
    
    // Classification
    val cycle: PlantCycle?,
    val growthHabit: GrowthHabit?,
    val growthRate: GrowthRate?,
    val isNitrogenFixer: Boolean,
    
    // Environment
    val sunNeeds: SunNeeds?,
    val waterNeeds: WaterNeeds?,
    val rootDepth: RootDepth,
    val phMin: Double?,
    val phMax: Double?,
    val frostTolerant: Boolean?,
    val hardinessZoneMin: String?,
    val hardinessZoneMax: String?,
    
    // Planting
    val spacingMinInches: Int?,
    val spacingMaxInches: Int?,
    val plantingDepthInches: Double?,
    val soilTempMinF: Int?,
    val soilTempOptimalF: Int?,
    
    // Care
    val wateringInchesPerWeek: Double?,
    val fertilizingFrequencyWeeks: Int?,
    val containerSuitable: Boolean?,
    val requiresStaking: Boolean?,
    val requiresPruning: Boolean?,
    val mulchRecommended: Boolean?,
    val careLevel: CareLevel?,
    
    // Harvest
    val daysToMaturityMin: Int?,
    val daysToMaturityMax: Int?,
    val edibleParts: List<EdiblePart>,
    
    // Companionship
    val companions: CompanionshipSummaryDto,
    
    // Images
    val images: List<PlantImageDto>,
    
    // Additional
    val careNotes: String?,
    val description: String?
)

data class CompanionshipSummaryDto(
    val beneficial: List<PlantSummaryDto>,
    val unfavorable: List<PlantSummaryDto>,
    val neutral: List<PlantSummaryDto>
)
```

---

## Implementation Priority

### Phase 1: Core Schema (Week 1)
- [ ] Create database migration scripts
- [ ] Add new enums
- [ ] Extend plant_attributes table
- [ ] Create plant_images table
- [ ] Update companion_relationships table

### Phase 2: Data Import (Week 2)
- [ ] Import companionship data (42 plants, 2,303 relationships)
- [ ] Import scraped Almanac data (76 plants)
- [ ] Enhance with Trefle data
- [ ] Resolve duplicates and merge conflicts

### Phase 3: API Development (Week 3-4)
- [ ] Create DTOs
- [ ] Implement plant list endpoint
- [ ] Implement plant detail endpoint
- [ ] Implement companion search endpoint
- [ ] Add filtering/searching capabilities

### Phase 4: Testing & Optimization
- [ ] Data quality validation
- [ ] API performance testing
- [ ] Documentation
- [ ] Deploy to production

---

## Notes

- **Companionship data is critical** for garden planning features
- Focus on Trefle + Scraped data, skip Perenual for now
- Prioritize practical gardening attributes over botanical details
- Build extensible schema to accommodate future data sources
- Maintain data source tracking for audit and quality control
