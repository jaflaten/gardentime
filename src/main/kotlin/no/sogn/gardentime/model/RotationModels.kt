package no.sogn.gardentime.model

import jakarta.persistence.*

/**
 * Plant Family - Botanical taxonomy for crop rotation
 * Examples: Solanaceae (nightshades), Brassicaceae (cabbage family), Fabaceae (legumes)
 */
@Entity
@Table(name = "plant_families")
data class PlantFamily(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    
    @Column(unique = true, nullable = false, length = 100)
    val name: String = "",  // e.g., "Solanaceae"
    
    @Column(name = "common_name", length = 100)
    val commonName: String? = null,  // e.g., "Nightshade family"
    
    @Column(name = "rotation_years_min", nullable = false)
    val rotationYearsMin: Int = 2,  // Minimum years before replanting same family
    
    @Column(name = "rotation_years_max", nullable = false)
    val rotationYearsMax: Int = 4,  // Maximum recommended rotation interval
    
    @Column(columnDefinition = "TEXT")
    val description: String? = null,
    
    @Column(name = "created_at")
    val createdAt: java.time.LocalDateTime = java.time.LocalDateTime.now()
)

/**
 * Edible part of plant (fruit, leaf, root, seed, flower, stem)
 */
@Entity
@Table(name = "edible_parts")
data class EdiblePart(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    
    @Column(unique = true, nullable = false, length = 50)
    val name: String  // fruit, leaf, root, seed, flower, stem
)

/**
 * Plant-EdiblePart join table entity
 */
@Entity
@Table(name = "plant_edible_parts")
data class PlantEdiblePart(
    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_id")
    val plant: PlantEntity,
    
    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "edible_part_id")
    val ediblePart: EdiblePart
)

/**
 * Companion planting relationship
 */
@Entity
@Table(name = "plant_companions")
data class PlantCompanion(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_id", nullable = false)
    val plant: PlantEntity,
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "companion_id", nullable = false)
    val companion: PlantEntity,
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    val relationship: CompanionRelationship,
    
    @Column(columnDefinition = "TEXT")
    val reason: String? = null,
    
    @Column(name = "created_at")
    val createdAt: java.time.LocalDateTime = java.time.LocalDateTime.now()
)

enum class CompanionRelationship {
    BENEFICIAL,
    UNFAVORABLE,
    NEUTRAL
}

/**
 * Garden pest
 */
@Entity
@Table(name = "pests")
data class Pest(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    
    @Column(unique = true, nullable = false, length = 100)
    val name: String,
    
    @Column(name = "common_name", length = 100)
    val commonName: String? = null,
    
    @Column(columnDefinition = "TEXT")
    val description: String? = null,
    
    @Column(name = "is_soil_borne")
    val isSoilBorne: Boolean = false,
    
    @Column(name = "persistence_years")
    val persistenceYears: Int = 0,
    
    @Column(name = "created_at")
    val createdAt: java.time.LocalDateTime = java.time.LocalDateTime.now()
)

/**
 * Plant disease
 */
@Entity
@Table(name = "diseases")
data class Disease(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    
    @Column(unique = true, nullable = false, length = 100)
    val name: String,
    
    @Column(name = "common_name", length = 100)
    val commonName: String? = null,
    
    @Column(columnDefinition = "TEXT")
    val description: String? = null,
    
    @Column(name = "is_soil_borne")
    val isSoilBorne: Boolean = false,
    
    @Column(name = "persistence_years")
    val persistenceYears: Int = 0,  // Critical for rotation planning!
    
    @Column(name = "affected_families", columnDefinition = "TEXT[]")
    val affectedFamilies: Array<String>? = null,
    
    @Column(name = "created_at")
    val createdAt: java.time.LocalDateTime = java.time.LocalDateTime.now()
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false
        other as Disease
        return id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: 0
}

/**
 * Plant-Pest join table
 */
@Entity
@Table(name = "plant_pests")
data class PlantPest(
    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_id")
    val plant: PlantEntity,
    
    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pest_id")
    val pest: Pest,
    
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    val severity: Severity? = null
)

/**
 * Plant-Disease join table
 */
@Entity
@Table(name = "plant_diseases")
data class PlantDisease(
    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_id")
    val plant: PlantEntity,
    
    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disease_id")
    val disease: Disease,
    
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    val severity: Severity? = null
)

enum class Severity {
    LOW,
    MODERATE,
    HIGH
}

/**
 * Rotation recommendation cache (for performance)
 */
@Entity
@Table(name = "rotation_recommendation_cache")
data class RotationRecommendationCache(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    
    @Column(name = "grow_area_id", nullable = false)
    val growAreaId: Long,
    
    @Column(name = "plant_id", nullable = false)
    val plantId: Long,
    
    @Column(nullable = false, length = 50)
    val season: String,
    
    @Column(nullable = false)
    val year: Int,
    
    @Column(nullable = false)
    val score: Int,  // 0-100, higher is better
    
    @Column(columnDefinition = "JSONB")
    val reasons: String? = null,  // JSON array of scoring factors
    
    @Column(name = "calculated_at")
    val calculatedAt: java.time.LocalDateTime = java.time.LocalDateTime.now()
)

/**
 * Enums for extended plant properties
 */
enum class PlantCycle {
    ANNUAL,
    PERENNIAL,
    BIENNIAL
}

enum class SunNeeds {
    FULL_SUN,
    PART_SHADE,
    SHADE
}

enum class WaterNeeds {
    LOW,
    MODERATE,
    HIGH,
    FREQUENT
}

enum class RootDepth {
    SHALLOW,
    MEDIUM,
    DEEP
}

enum class GrowthHabit {
    BUSH,
    VINE,
    CLIMBER,
    ROOT,
    LEAF,
    FRUITING
}

enum class FeederType {
    HEAVY,      // e.g., Tomato, Corn, Squash
    MODERATE,   // e.g., Carrot, Beet
    LIGHT,      // e.g., Onion, Lettuce, Herbs
    NITROGEN_FIXER  // e.g., Beans, Peas (Fabaceae)
}

/**
 * Converters for enums
 */
@Converter(autoApply = true)
class PlantCycleConverter : AttributeConverter<PlantCycle, String> {
    override fun convertToDatabaseColumn(attribute: PlantCycle?): String? = attribute?.name
    override fun convertToEntityAttribute(dbData: String?): PlantCycle? = dbData?.let { PlantCycle.valueOf(it) }
}

@Converter(autoApply = true)
class SunNeedsConverter : AttributeConverter<SunNeeds, String> {
    override fun convertToDatabaseColumn(attribute: SunNeeds?): String? = attribute?.name
    override fun convertToEntityAttribute(dbData: String?): SunNeeds? = dbData?.let { SunNeeds.valueOf(it) }
}

@Converter(autoApply = true)
class WaterNeedsConverter : AttributeConverter<WaterNeeds, String> {
    override fun convertToDatabaseColumn(attribute: WaterNeeds?): String? = attribute?.name
    override fun convertToEntityAttribute(dbData: String?): WaterNeeds? = dbData?.let { WaterNeeds.valueOf(it) }
}

@Converter(autoApply = true)
class RootDepthConverter : AttributeConverter<RootDepth, String> {
    override fun convertToDatabaseColumn(attribute: RootDepth?): String? = attribute?.name
    override fun convertToEntityAttribute(dbData: String?): RootDepth? = dbData?.let { RootDepth.valueOf(it) }
}

@Converter(autoApply = true)
class GrowthHabitConverter : AttributeConverter<GrowthHabit, String> {
    override fun convertToDatabaseColumn(attribute: GrowthHabit?): String? = attribute?.name
    override fun convertToEntityAttribute(dbData: String?): GrowthHabit? = dbData?.let { GrowthHabit.valueOf(it) }
}

@Converter(autoApply = true)
class FeederTypeConverter : AttributeConverter<FeederType, String> {
    override fun convertToDatabaseColumn(attribute: FeederType?): String? = attribute?.name
    override fun convertToEntityAttribute(dbData: String?): FeederType? = dbData?.let { FeederType.valueOf(it) }
}

@Converter(autoApply = true)
class CompanionRelationshipConverter : AttributeConverter<CompanionRelationship, String> {
    override fun convertToDatabaseColumn(attribute: CompanionRelationship?): String? = attribute?.name
    override fun convertToEntityAttribute(dbData: String?): CompanionRelationship? = dbData?.let { CompanionRelationship.valueOf(it) }
}

@Converter(autoApply = true)
class SeverityConverter : AttributeConverter<Severity, String> {
    override fun convertToDatabaseColumn(attribute: Severity?): String? = attribute?.name
    override fun convertToEntityAttribute(dbData: String?): Severity? = dbData?.let { Severity.valueOf(it) }
}
