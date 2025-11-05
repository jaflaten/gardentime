package no.sogn.gardentime.model

import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDateTime


data class Plant(
    val id: Long? = null,
    val name: String, // einaste påkrevde
    val scientificName: String? = null,
    val plantType: PlantType? = null,
    val maturityTime: Int? = 0,
    val growingSeason: GrowingSeason? = null,
    val sunReq: String? = null,
    val waterReq: String? = null,
    val soilType: String? = null,
    val spaceReq: String? = null,
    )

@Entity
class PlantEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    val name: String,
    val scientificName: String? = null,
    @Convert(converter = PlantTypeConverter::class)
    val plantType: PlantType? = null,
    val maturityTime: Int? = 0,
    @Convert(converter = GrowingSeasonConverter::class)
    val growingSeason: GrowingSeason? = null,
    val sunReq: String? = null,
    val waterReq: String? = null,
    val soilType: String? = null,
    val spaceReq: String? = null,
    
    // New fields for rotation planning (V9 migration)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_id")
    val family: PlantFamily? = null,
    
    val genus: String? = null,
    
    @Column(unique = true)
    val slug: String? = null,
    
    @Convert(converter = PlantCycleConverter::class)
    val cycle: PlantCycle? = null,
    
    @Convert(converter = SunNeedsConverter::class)
    @Column(name = "sun_needs")
    val sunNeeds: SunNeeds? = null,
    
    @Convert(converter = WaterNeedsConverter::class)
    @Column(name = "water_needs")
    val waterNeeds: WaterNeeds? = null,
    
    @Convert(converter = RootDepthConverter::class)
    @Column(name = "root_depth")
    val rootDepth: RootDepth? = null,
    
    @Convert(converter = GrowthHabitConverter::class)
    @Column(name = "growth_habit")
    val growthHabit: GrowthHabit? = null,
    
    @Column(name = "soil_temp_min_f")
    val soilTempMinF: Int? = null,
    
    @Column(name = "soil_temp_optimal_f")
    val soilTempOptimalF: Int? = null,
    
    @Column(name = "frost_tolerant")
    val frostTolerant: Boolean = false,
    
    @Column(name = "spacing_min_inches")
    val spacingMinInches: Int? = null,
    
    @Column(name = "spacing_max_inches")
    val spacingMaxInches: Int? = null,
    
    @Column(name = "planting_depth_inches")
    val plantingDepthInches: java.math.BigDecimal? = null,
    
    @Column(name = "container_suitable")
    val containerSuitable: Boolean = false,
    
    @Column(name = "requires_staking")
    val requiresStaking: Boolean = false,
    
    @Column(name = "requires_pruning")
    val requiresPruning: Boolean = false,
    
    @Column(name = "days_to_maturity_min")
    val daysToMaturityMin: Int? = null,
    
    @Column(name = "days_to_maturity_max")
    val daysToMaturityMax: Int? = null,
    
    @Column(name = "watering_inches_per_week")
    val wateringInchesPerWeek: java.math.BigDecimal? = null,
    
    @Column(name = "fertilizing_frequency_weeks")
    val fertilizingFrequencyWeeks: Int? = null,
    
    @Column(name = "mulch_recommended")
    val mulchRecommended: Boolean = true,
    
    val notes: String? = null,
    
    @Column(name = "is_nitrogen_fixer")
    val isNitrogenFixer: Boolean = false,
    
    @Convert(converter = FeederTypeConverter::class)
    @Column(name = "feeder_type")
    val feederType: FeederType? = null,
    
    @Column(name = "soil_ph_min")
    val soilPhMin: java.math.BigDecimal? = null,
    
    @Column(name = "soil_ph_max")
    val soilPhMax: java.math.BigDecimal? = null,
    
    @Column(name = "updated_at")
    val updatedAt: java.time.LocalDateTime = java.time.LocalDateTime.now()
) {
    constructor() : this(
        null, "", null, null, 0, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null, false,
        null, null, null, false, false, false, null, null, null, null,
        true, null, false, null, null, null, java.time.LocalDateTime.now()
    ) {}
}

enum class GrowingSeason {
    WINTER,
    SPRING,
    SUMMER,
    AUTUMN,
}

enum class PlantType(val description: String, val examples: List<String>) {
    ROOT_VEGETABLE("Edible roots grown underground", listOf("Carrot", "Beetroot", "Radish")),
    LEAFY_GREEN("Edible leafy plants", listOf("Kale", "Spinach", "Lettuce")),
    TUBER("Underground storage organs", listOf("Potato", "Sweet Potato", "Yam")),
    FRUIT_VEGETABLE("Fruits commonly used as vegetables", listOf("Tomato", "Cucumber", "Zucchini")),
    HERB("Aromatic plants used in cooking", listOf("Basil", "Parsley", "Mint")),
    LEGUME("Seed-producing pod plants", listOf("Bean", "Pea", "Lentil")),
    GRAIN("Seed-bearing plants used for food", listOf("Corn", "Wheat", "Barley")),
    FLOWERING_PLANT("Plants grown for edible flowers", listOf("Broccoli", "Cauliflower", "Artichoke")),
    ALLIUM("Plants in the onion family", listOf("Onion", "Garlic", "Leek"));
}

fun mapPlantToDomain(plantEntity: PlantEntity): Plant {
    return Plant(
        id = plantEntity.id,
        name = plantEntity.name,
        scientificName = plantEntity.scientificName,
        plantType = plantEntity.plantType,
        maturityTime = plantEntity.maturityTime,
        growingSeason = plantEntity.growingSeason,
        sunReq = plantEntity.sunReq,
        waterReq = plantEntity.waterReq,
        soilType = plantEntity.soilType,
        spaceReq = plantEntity.spaceReq,
    )
}

@Converter(autoApply = true)
class PlantTypeConverter : AttributeConverter<PlantType, String> {

    override fun convertToDatabaseColumn(attribute: PlantType?): String? {
        return attribute?.name
    }

    override fun convertToEntityAttribute(dbData: String?): PlantType? {
        return dbData?.let { enumValue -> PlantType.valueOf(enumValue) }
    }
}

@Converter(autoApply = true)
class GrowingSeasonConverter : AttributeConverter<GrowingSeason, String> {

    override fun convertToDatabaseColumn(attribute: GrowingSeason?): String? {
        return attribute?.name
    }

    override fun convertToEntityAttribute(dbData: String?): GrowingSeason? {
        return dbData?.let { GrowingSeason.valueOf(it) }
    }
}
