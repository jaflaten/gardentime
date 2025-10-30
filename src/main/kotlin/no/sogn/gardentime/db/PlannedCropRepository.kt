package no.sogn.gardentime.db

import no.sogn.gardentime.model.PlannedCrop
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface PlannedCropRepository : JpaRepository<PlannedCrop, UUID> {
    fun findBySeasonPlanId(seasonPlanId: UUID): List<PlannedCrop>
    fun findBySeasonPlanIdAndStatus(seasonPlanId: UUID, status: String): List<PlannedCrop>
    fun findByCropRecordId(cropRecordId: UUID): PlannedCrop?
}
