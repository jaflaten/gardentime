package no.sogn.gardentime.db

import no.sogn.gardentime.model.CropRecordEntity
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface CropRecordRepository: CrudRepository<CropRecordEntity, UUID> {
    fun findAllByGrowZoneId(growZoneId: Long): MutableList<CropRecordEntity>
    fun findCropRecordEntityById(id: UUID): CropRecordEntity?
    fun findByGrowZoneIdIn(growZoneIds: List<Long>): List<CropRecordEntity>
}