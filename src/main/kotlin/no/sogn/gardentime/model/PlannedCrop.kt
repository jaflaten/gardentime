package no.sogn.gardentime.model

import jakarta.persistence.*
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.*

@Entity
@Table(name = "planned_crops")
data class PlannedCrop(
    @Id
    @Column(name = "id")
    val id: UUID = UUID.randomUUID(),

    @Column(name = "season_plan_id", nullable = false)
    val seasonPlanId: UUID,

    @Column(name = "plant_id", nullable = false)
    val plantId: Long,

    @Column(name = "quantity")
    var quantity: Int = 1,

    @Column(name = "preferred_grow_area_id")
    var preferredGrowAreaId: Long? = null,

    @Column(name = "status", nullable = false, length = 50)
    var status: String = "PLANNED",  // PLANNED, SEEDS_STARTED, TRANSPLANTED, DIRECT_SOWN, GROWING, COMPLETED, CANCELLED

    @Column(name = "indoor_start_date")
    var indoorStartDate: LocalDate? = null,

    @Column(name = "indoor_start_method", length = 100)
    var indoorStartMethod: String? = null,

    @Column(name = "transplant_date")
    var transplantDate: LocalDate? = null,

    @Column(name = "direct_sow_date")
    var directSowDate: LocalDate? = null,

    @Column(name = "expected_harvest_date")
    var expectedHarvestDate: LocalDate? = null,

    @Column(name = "phase", length = 50)
    var phase: String? = null,  // EARLY, MID, LATE

    @Column(name = "notes", columnDefinition = "TEXT")
    var notes: String? = null,

    @Column(name = "crop_record_id")
    var cropRecordId: UUID? = null,

    @Column(name = "created_at")
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at")
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
