package no.sogn.plantdata.model

import jakarta.persistence.*
import no.sogn.plantdata.enums.*
import java.time.Instant
import java.util.*

@Entity
@Table(name = "plant_attributes")
data class PlantAttributes(
    @Id @Column(name = "plant_id") val plantId: UUID,
    @MapsId @OneToOne(fetch = FetchType.LAZY) @JoinColumn(name = "plant_id") val plant: Plant,
    @Column(name = "is_nitrogen_fixer", nullable = false) val isNitrogenFixer: Boolean = false,
    @Enumerated(EnumType.STRING) @Column(name = "root_depth", nullable = false) val rootDepth: RootDepth,
    @Enumerated(EnumType.STRING) @Column(name = "feeder_type") val feederType: FeederType? = null,
    @Enumerated(EnumType.STRING) @Column(name = "cycle") val cycle: PlantCycle? = null,
    @Enumerated(EnumType.STRING) @Column(name = "growth_habit") val growthHabit: GrowthHabit? = null,
    @Enumerated(EnumType.STRING) @Column(name = "sun_needs") val sunNeeds: SunNeeds? = null,
    @Enumerated(EnumType.STRING) @Column(name = "water_needs") val waterNeeds: WaterNeeds? = null,
    @Column(name = "ph_min") val phMin: Double? = null,
    @Column(name = "ph_max") val phMax: Double? = null,
    @ElementCollection @CollectionTable(name = "plant_attribute_soil_types", joinColumns = [JoinColumn(name = "plant_id")]) @Column(name = "soil_type") val soilTypes: Set<String> = emptySet(),
    @Enumerated(EnumType.STRING) @Column(name = "toxicity_level") val toxicityLevel: ToxicityLevel? = null,
    @Column(name = "invasive") val invasive: Boolean? = null,
    @Column(name = "drought_tolerant") val droughtTolerant: Boolean? = null,
    @ElementCollection @CollectionTable(name = "plant_attribute_edible_parts", joinColumns = [JoinColumn(name = "plant_id")]) @Column(name = "edible_part") val edibleParts: Set<String> = emptySet(),
    @Column(name = "poisonous_to_pets") val poisonousToPets: Boolean? = null,
    @Column(name = "days_to_maturity_min") val daysToMaturityMin: Int? = null,
    @Column(name = "days_to_maturity_max") val daysToMaturityMax: Int? = null,
    @Column(name = "succession_interval_days") val successionIntervalDays: Int? = null,
    @Enumerated(EnumType.STRING) @Column(name = "primary_nutrient_contribution") val primaryNutrientContribution: PrimaryNutrientContribution? = null,
    @Column(name = "created_at", nullable = false) val createdAt: Instant = Instant.now(),
    @Column(name = "updated_at", nullable = false) var updatedAt: Instant = Instant.now()
)
