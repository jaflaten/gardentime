package no.sogn.plantdata.model

import jakarta.persistence.*
import no.sogn.plantdata.enums.*
import java.time.Instant
import java.util.*

@Entity
@Table(name = "plant_attributes")
data class PlantAttributes(
    @Id 
    @Column(name = "plant_id") 
    val plantId: UUID,
    
    @Column(name = "is_nitrogen_fixer", nullable = false) 
    var isNitrogenFixer: Boolean = false,
    
    @Enumerated(EnumType.STRING) 
    @Column(name = "root_depth", nullable = false) 
    var rootDepth: RootDepth,
    
    @Enumerated(EnumType.STRING) 
    @Column(name = "feeder_type") 
    var feederType: FeederType? = null,
    
    @Enumerated(EnumType.STRING) 
    @Column(name = "cycle") 
    var cycle: PlantCycle? = null,
    
    @Enumerated(EnumType.STRING) 
    @Column(name = "growth_habit") 
    var growthHabit: GrowthHabit? = null,
    
    @Enumerated(EnumType.STRING) 
    @Column(name = "sun_needs") 
    var sunNeeds: SunNeeds? = null,
    
    @Enumerated(EnumType.STRING) 
    @Column(name = "water_needs") 
    var waterNeeds: WaterNeeds? = null,
    
    @Column(name = "ph_min") 
    var phMin: Double? = null,
    
    @Column(name = "ph_max") 
    var phMax: Double? = null,
    
    @Enumerated(EnumType.STRING) 
    @Column(name = "toxicity_level") 
    var toxicityLevel: ToxicityLevel? = null,
    
    @Column(name = "invasive") 
    var invasive: Boolean? = null,
    
    @Column(name = "drought_tolerant") 
    var droughtTolerant: Boolean? = null,
    
    @Column(name = "poisonous_to_pets") 
    var poisonousToPets: Boolean? = null,
    
    @Column(name = "days_to_maturity_min") 
    var daysToMaturityMin: Int? = null,
    
    @Column(name = "days_to_maturity_max") 
    var daysToMaturityMax: Int? = null,
    
    @Column(name = "succession_interval_days") 
    var successionIntervalDays: Int? = null,
    
    @Enumerated(EnumType.STRING) 
    @Column(name = "primary_nutrient_contribution") 
    var primaryNutrientContribution: PrimaryNutrientContribution? = null,
    
    @Column(name = "created_at", nullable = false) 
    val createdAt: Instant = Instant.now(),
    
    @Column(name = "updated_at", nullable = false) 
    var updatedAt: Instant = Instant.now()
)
