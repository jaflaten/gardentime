package no.sogn.gardentime.model

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "plant_details")
data class PlantDetails(
    @Id
    @Column(name = "plant_id")
    val plantId: Long,

    @Column(name = "weeks_before_frost_indoor")
    var weeksBeforeFrostIndoor: Int? = null,

    @Column(name = "can_direct_sow")
    var canDirectSow: Boolean = true,

    @Column(name = "can_transplant")
    var canTransplant: Boolean = false,

    @Column(name = "frost_tolerance", length = 50)
    var frostTolerance: String? = null,  // HARDY, SEMI_HARDY, TENDER

    @Column(name = "indoor_start_method", columnDefinition = "TEXT")
    var indoorStartMethod: String? = null,

    @Column(name = "transplant_guidance", columnDefinition = "TEXT")
    var transplantGuidance: String? = null,

    @Column(name = "created_at")
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at")
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
