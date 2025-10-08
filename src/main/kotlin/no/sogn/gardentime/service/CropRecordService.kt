package no.sogn.gardentime.service

import no.sogn.gardentime.db.CropRecordRepository
import no.sogn.gardentime.db.GardenRepository
import no.sogn.gardentime.db.PlantRepository
import no.sogn.gardentime.exceptions.GardenIdNotFoundException
import no.sogn.gardentime.exceptions.GrowAreaIdNotFoundException
import no.sogn.gardentime.model.CropRecord
import no.sogn.gardentime.model.CropRecordEntity
import no.sogn.gardentime.model.PlantEntity
import no.sogn.gardentime.model.mapCropRecordEntityToDomain
import no.sogn.gardentime.security.SecurityUtils
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.util.*

@Service
class CropRecordService(
    private val cropRecordRepository: CropRecordRepository,
    private val gardenRepository: GardenRepository,
    private val plantRepository: PlantRepository,
    private val securityUtils: SecurityUtils,
) {

    fun addCropRecord(plantName: String, gardenId: UUID, growAreaId: Long): CropRecord {
        val currentUserId = securityUtils.getCurrentUserId()
        val gardenEntity = gardenRepository.findGardenEntityById(gardenId)
            ?: throw GardenIdNotFoundException("Garden with id $gardenId not found")

        // Security check: ensure the garden belongs to the current user
        if (gardenEntity.userId != currentUserId) {
            throw IllegalAccessException("You don't have permission to add crop records to this garden")
        }

        gardenEntity.growAreas.filter { it.id == growAreaId }
            .map {growAreaEntity ->
                requireNotNull(growAreaEntity.id)

                val cropRecord = CropRecordEntity(
                    plantingDate = LocalDate.now(),
                    plant = getPlantEntityByName(plantName),
                    growZoneId = growAreaEntity.id,
                    name = plantName
                    )
                return mapCropRecordEntityToDomain(cropRecordRepository.save(cropRecord))
        }
        throw GrowAreaIdNotFoundException("GrowArea with id $growAreaId not found in garden with id $gardenId")
    }

    private fun getPlantEntityByName(plantName: String): PlantEntity {
        val plants = plantRepository.findPlantEntityByName(plantName)
        if (plants.isEmpty()) {
            return plantRepository.save(PlantEntity(name = plantName))
        } else {
            return plants.first()
        }
    }

    fun getCropRecordById(id: UUID): CropRecord? {
        val currentUserId = securityUtils.getCurrentUserId()
        val cropRecordEntity = cropRecordRepository.findCropRecordEntityById(id)

        // Security check: verify the crop record belongs to a grow area in the user's garden
        val growAreaEntity = cropRecordEntity.growZoneId
        val gardenEntity = gardenRepository.findGardenEntityById(
            gardenRepository.findAll().first { garden ->
                garden.growAreas.any { it.id == growAreaEntity }
            }.id!!
        )

        if (gardenEntity?.userId != currentUserId) {
            throw IllegalAccessException("You don't have permission to access this crop record")
        }

        return mapCropRecordEntityToDomain(cropRecordEntity)
    }

    fun deleteCropRecordById(id: UUID) {
        val currentUserId = securityUtils.getCurrentUserId()
        val record = cropRecordRepository.findCropRecordEntityById(id)

        // Security check: verify the crop record belongs to a grow area in the user's garden
        val growAreaEntity = record.growZoneId
        val gardenEntity = gardenRepository.findAll().firstOrNull { garden ->
            garden.growAreas.any { it.id == growAreaEntity }
        } ?: throw IllegalArgumentException("Garden not found for this crop record")

        if (gardenEntity.userId != currentUserId) {
            throw IllegalAccessException("You don't have permission to delete this crop record")
        }

        cropRecordRepository.delete(record)
    }

}