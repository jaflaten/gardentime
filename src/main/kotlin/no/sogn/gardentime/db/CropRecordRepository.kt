package no.sogn.gardentime.db

import no.sogn.gardentime.model.CropRecordEntity
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.*

@Repository
interface CropRecordRepository: CrudRepository<CropRecordEntity, UUID> {
    fun findAllByGrowZoneId(growZoneId: Long): MutableList<CropRecordEntity>
    fun findCropRecordEntityById(id: UUID): CropRecordEntity?
    fun findByGrowZoneIdIn(growZoneIds: List<Long>): List<CropRecordEntity>
    
    // Rotation planning queries
    fun findByGrowZoneIdAndPlantingDateAfter(growZoneId: Long, date: LocalDate): List<CropRecordEntity>
    fun findByGrowZoneIdAndPlantingDateAfterAndHarvestDateIsNull(
        growZoneId: Long,
        date: LocalDate
    ): List<CropRecordEntity>
    fun findByGrowZoneIdOrderByPlantingDateDesc(growZoneId: Long): List<CropRecordEntity>
}