package no.sogn.gardentime.service

import no.sogn.gardentime.db.CropRecordRepository
import no.sogn.gardentime.db.GardenRepository
import no.sogn.gardentime.model.CropRecord
import no.sogn.gardentime.model.CropRecordEntity
import no.sogn.gardentime.model.PlantEntity
import no.sogn.gardentime.model.mapCropRecordEntityToDomain
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.util.*

@Service
class CropRecordService(
    private val cropRecordRepository: CropRecordRepository,
    private val gardenRepository: GardenRepository,
) {

    fun addCropRecord(plantName: String, gardenId: UUID, growZoneId: Long): CropRecord {
        val gardenEntity = gardenRepository.findGardenEntityById(gardenId)
            ?: throw IllegalArgumentException("Garden with id $gardenId not found")

        gardenEntity.growZones.filter { it.id == growZoneId }
            .map {growZoneEntity ->
                requireNotNull(growZoneEntity.id)
                val cropRecord = CropRecordEntity(
                    plantingDate = LocalDate.now(),
                    plant = PlantEntity(name = plantName),
                    growZoneId = growZoneEntity.id,
                    )
                return mapCropRecordEntityToDomain(cropRecordRepository.save(cropRecord))
        }
        throw IllegalArgumentException("GrowZone with id $growZoneId not found in garden with id $gardenId")
    }

    fun getCropRecordById(id: UUID): CropRecord? {
        return mapCropRecordEntityToDomain(cropRecordRepository.findCropRecordEntityById(id))
    }

    fun deleteCropRecordById(id: UUID) {
        val record = cropRecordRepository.findCropRecordEntityById(id)
        cropRecordRepository.delete(record)
    }

}