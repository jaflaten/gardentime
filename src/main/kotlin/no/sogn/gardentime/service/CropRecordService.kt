package no.sogn.gardentime.service

import no.sogn.gardentime.client.PlantDataApiClient
import no.sogn.gardentime.db.CropRecordRepository
import no.sogn.gardentime.db.GardenRepository
import no.sogn.gardentime.db.PlantRepository
import no.sogn.gardentime.exceptions.GardenIdNotFoundException
import no.sogn.gardentime.exceptions.GrowAreaIdNotFoundException
import no.sogn.gardentime.model.*
import no.sogn.gardentime.security.SecurityUtils
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.util.*
import org.slf4j.LoggerFactory

@Service
class CropRecordService(
    private val cropRecordRepository: CropRecordRepository,
    private val gardenRepository: GardenRepository,
    private val plantRepository: PlantRepository,
    private val securityUtils: SecurityUtils,
    private val plantDataApiClient: PlantDataApiClient
) {
    private val logger = LoggerFactory.getLogger(CropRecordService::class.java)

    fun createCropRecord(
        growAreaId: String,
        plantId: String,
        plantName: String,
        datePlanted: LocalDate,
        dateHarvested: LocalDate? = null,
        notes: String? = null,
        outcome: String? = null,
        status: CropStatus? = null
    ): CropRecordDTO {
        val currentUserId = securityUtils.getCurrentUserId()

        // Convert growAreaId string to Long
        val growAreaIdLong = try {
            growAreaId.toLong()
        } catch (e: NumberFormatException) {
            throw IllegalArgumentException("Invalid grow area ID format: $growAreaId")
        }

        // Security check: verify the grow area belongs to the user's garden
        val gardenEntity = gardenRepository.findAll().firstOrNull { garden ->
            garden.growAreas.any { it.id == growAreaIdLong }
        } ?: throw GrowAreaIdNotFoundException("Grow area with id $growAreaIdLong not found")

        if (gardenEntity.userId != currentUserId) {
            throw IllegalAccessException("You don't have permission to add crop records to this grow area")
        }

        // Validate plant exists in Plant Data Aggregator and fetch rotation data
        val plantData = try {
            plantDataApiClient.getPlantDetails(plantName)
        } catch (e: Exception) {
            logger.warn("Failed to fetch plant data for $plantName: ${e.message}")
            null
        }

        // Validate plantId matches if we got plant data
        if (plantData != null && plantData.id.toString() != plantId) {
            logger.warn("Plant ID mismatch: expected $plantId, got ${plantData.id}")
        }

        // Determine status: use provided status, or auto-set based on harvest date
        val cropStatus = status ?: if (dateHarvested != null) CropStatus.HARVESTED else CropStatus.PLANTED

        // Create the crop record with cached plant data from plant-data-aggregator
        val cropRecordEntity = CropRecordEntity(
            plantingDate = datePlanted,
            harvestDate = dateHarvested,
            plantId = plantId,
            plantName = plantName,
            growZoneId = growAreaIdLong,
            name = plantName,  // Record name same as plant name
            notes = notes,
            outcome = outcome,
            status = cropStatus,
            // Cache rotation-critical data from plant-data-aggregator API
            plantFamily = plantData?.family,
            plantGenus = plantData?.genus,
            feederType = plantData?.rotationData?.feederType,
            isNitrogenFixer = plantData?.rotationData?.isNitrogenFixer ?: false,
            rootDepth = plantData?.plantingDetails?.rootDepth
        )

        logger.info("Created crop record for $plantName (ID: $plantId) with family=${plantData?.family}, feeder=${plantData?.rotationData?.feederType}")
        return mapCropRecordEntityToDTO(cropRecordRepository.save(cropRecordEntity))
    }

    fun updateCropRecord(
        id: UUID,
        datePlanted: LocalDate? = null,
        dateHarvested: LocalDate? = null,
        notes: String? = null,
        outcome: String? = null,
        status: CropStatus? = null
    ): CropRecordDTO {
        val currentUserId = securityUtils.getCurrentUserId()
        val existingRecord = cropRecordRepository.findCropRecordEntityById(id)
            ?: throw IllegalArgumentException("Crop record with id $id not found")

        // Security check: verify the crop record belongs to a grow area in the user's garden
        val gardenEntity = gardenRepository.findAll().firstOrNull { garden ->
            garden.growAreas.any { it.id == existingRecord.growZoneId }
        } ?: throw IllegalArgumentException("Garden not found for this crop record")

        if (gardenEntity.userId != currentUserId) {
            throw IllegalAccessException("You don't have permission to update this crop record")
        }

        // Create updated entity (Kotlin data classes are immutable, so we create a new instance)
        val updatedEntity = CropRecordEntity(
            id = existingRecord.id,
            name = existingRecord.name,
            description = existingRecord.description,
            plantingDate = datePlanted ?: existingRecord.plantingDate,
            harvestDate = dateHarvested ?: existingRecord.harvestDate,
            plantId = existingRecord.plantId,
            plantName = existingRecord.plantName,
            status = status ?: existingRecord.status,
            growZoneId = existingRecord.growZoneId,
            outcome = outcome ?: existingRecord.outcome,
            notes = notes ?: existingRecord.notes,
            plantFamily = existingRecord.plantFamily,
            plantGenus = existingRecord.plantGenus,
            feederType = existingRecord.feederType,
            isNitrogenFixer = existingRecord.isNitrogenFixer,
            rootDepth = existingRecord.rootDepth,
            hadDiseases = existingRecord.hadDiseases,
            diseaseNames = existingRecord.diseaseNames,
            diseaseNotes = existingRecord.diseaseNotes,
            yieldRating = existingRecord.yieldRating,
            soilQualityAfter = existingRecord.soilQualityAfter
        )

        return mapCropRecordEntityToDTO(cropRecordRepository.save(updatedEntity))
    }

    fun addCropRecordLegacy(plantName: String, gardenId: UUID, growAreaId: Long): CropRecordDTO {
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

                // Fetch plant data from plant-data-aggregator API
                val plantData = try {
                    plantDataApiClient.getPlantDetails(plantName)
                } catch (e: Exception) {
                    logger.warn("Failed to fetch plant data for $plantName: ${e.message}")
                    null
                }

                val cropRecord = CropRecordEntity(
                    plantingDate = LocalDate.now(),
                    plantId = plantData?.id?.toString() ?: UUID.randomUUID().toString(),
                    plantName = plantName,
                    growZoneId = growAreaEntity.id,
                    name = plantName,
                    // Cache rotation data
                    plantFamily = plantData?.family,
                    plantGenus = plantData?.genus,
                    feederType = plantData?.rotationData?.feederType,
                    isNitrogenFixer = plantData?.rotationData?.isNitrogenFixer ?: false,
                    rootDepth = plantData?.plantingDetails?.rootDepth
                )
                return mapCropRecordEntityToDTO(cropRecordRepository.save(cropRecord))
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

    fun getCropRecordById(id: UUID): CropRecordDTO? {
        val currentUserId = securityUtils.getCurrentUserId()
        val cropRecordEntity = cropRecordRepository.findCropRecordEntityById(id)
            ?: return null

        // Security check: verify the crop record belongs to a grow area in the user's garden
        val growAreaEntity = cropRecordEntity.growZoneId
        val gardenEntity = gardenRepository.findAll().firstOrNull { garden ->
            garden.growAreas.any { it.id == growAreaEntity }
        } ?: throw IllegalArgumentException("Garden not found for this crop record")

        if (gardenEntity.userId != currentUserId) {
            throw IllegalAccessException("You don't have permission to access this crop record")
        }

        return mapCropRecordEntityToDTO(cropRecordEntity)
    }

    fun getCropRecordsByGrowAreaId(growAreaId: Long): List<CropRecordDTO> {
        val currentUserId = securityUtils.getCurrentUserId()

        // Security check: verify the grow area belongs to the user's garden
        val gardenEntity = gardenRepository.findAll().firstOrNull { garden ->
            garden.growAreas.any { it.id == growAreaId }
        } ?: throw GrowAreaIdNotFoundException("Grow area with id $growAreaId not found")

        if (gardenEntity.userId != currentUserId) {
            throw IllegalAccessException("You don't have permission to access crop records for this grow area")
        }

        // Get all crop records for this grow area
        val cropRecords = cropRecordRepository.findAll()
            .filter { it.growZoneId == growAreaId }
            .map { mapCropRecordEntityToDTO(it) }

        return cropRecords
    }

    fun deleteCropRecordById(id: UUID) {
        logger.info(">>> SERVICE: Starting delete operation for crop record ID: $id")

        try {
            val currentUserId = securityUtils.getCurrentUserId()
            logger.info(">>> SERVICE: Current user ID: $currentUserId")

            logger.info(">>> SERVICE: Looking up crop record in database...")
            val record = cropRecordRepository.findCropRecordEntityById(id)
            if (record == null) {
                logger.error(">>> SERVICE ERROR: Crop record not found with ID: $id")
                throw IllegalArgumentException("Crop record with id $id not found")
            }
            logger.info(">>> SERVICE: Found crop record - ID: ${record.id}, Plant: ${record.plantName}, GrowZoneId: ${record.growZoneId}")

            // Security check: verify the crop record belongs to a grow area in the user's garden
            val growAreaEntity = record.growZoneId
            logger.info(">>> SERVICE: Verifying ownership - looking for garden with grow area ID: $growAreaEntity")

            val gardenEntity = gardenRepository.findAll().firstOrNull { garden ->
                garden.growAreas.any { it.id == growAreaEntity }
            }

            if (gardenEntity == null) {
                logger.error(">>> SERVICE ERROR: No garden found containing grow area ID: $growAreaEntity")
                throw IllegalArgumentException("Garden not found for this crop record")
            }
            logger.info(">>> SERVICE: Found garden - ID: ${gardenEntity.id}, Owner: ${gardenEntity.userId}")

            if (gardenEntity.userId != currentUserId) {
                logger.error(">>> SERVICE ERROR: Permission denied - Garden owner: ${gardenEntity.userId}, Current user: $currentUserId")
                throw IllegalAccessException("You don't have permission to delete this crop record")
            }

            logger.info(">>> SERVICE: All checks passed. Executing delete operation...")
            cropRecordRepository.deleteById(id)
            logger.info(">>> SERVICE: Delete operation completed successfully for crop record ID: $id")

        } catch (e: Exception) {
            logger.error(">>> SERVICE EXCEPTION: ${e.javaClass.simpleName} - ${e.message}")
            throw e
        }
    }
    
    /**
     * Update disease information for a crop record
     * Used when user marks that a crop had disease issues
     */
    fun updateDiseaseInfo(
        id: UUID,
        hadDiseases: Boolean,
        diseaseNames: String? = null,
        diseaseNotes: String? = null
    ): CropRecordDTO {
        val currentUserId = securityUtils.getCurrentUserId()
        val existingRecord = cropRecordRepository.findCropRecordEntityById(id)
            ?: throw IllegalArgumentException("Crop record with id $id not found")

        // Security check
        val gardenEntity = gardenRepository.findAll().firstOrNull { garden ->
            garden.growAreas.any { it.id == existingRecord.growZoneId }
        } ?: throw IllegalArgumentException("Garden not found for this crop record")

        if (gardenEntity.userId != currentUserId) {
            throw IllegalAccessException("You don't have permission to update this crop record")
        }

        // Create updated entity with disease info
        val updatedEntity = CropRecordEntity(
            id = existingRecord.id,
            name = existingRecord.name,
            description = existingRecord.description,
            plantingDate = existingRecord.plantingDate,
            harvestDate = existingRecord.harvestDate,
            plantId = existingRecord.plantId,
            plantName = existingRecord.plantName,
            status = existingRecord.status,
            growZoneId = existingRecord.growZoneId,
            outcome = existingRecord.outcome,
            notes = existingRecord.notes,
            plantFamily = existingRecord.plantFamily,
            plantGenus = existingRecord.plantGenus,
            feederType = existingRecord.feederType,
            isNitrogenFixer = existingRecord.isNitrogenFixer,
            rootDepth = existingRecord.rootDepth,
            hadDiseases = hadDiseases,
            diseaseNames = diseaseNames,
            diseaseNotes = diseaseNotes,
            yieldRating = existingRecord.yieldRating,
            soilQualityAfter = existingRecord.soilQualityAfter
        )

        return mapCropRecordEntityToDTO(cropRecordRepository.save(updatedEntity))
    }
    
    /**
     * Update yield rating for a crop record
     */
    fun updateYieldRating(
        id: UUID,
        yieldRating: Int,
        soilQualityAfter: Int? = null
    ): CropRecordDTO {
        require(yieldRating in 1..5) { "Yield rating must be between 1 and 5" }
        soilQualityAfter?.let {
            require(it in 1..5) { "Soil quality rating must be between 1 and 5" }
        }

        val currentUserId = securityUtils.getCurrentUserId()
        val existingRecord = cropRecordRepository.findCropRecordEntityById(id)
            ?: throw IllegalArgumentException("Crop record with id $id not found")

        // Security check
        val gardenEntity = gardenRepository.findAll().firstOrNull { garden ->
            garden.growAreas.any { it.id == existingRecord.growZoneId }
        } ?: throw IllegalArgumentException("Garden not found for this crop record")

        if (gardenEntity.userId != currentUserId) {
            throw IllegalAccessException("You don't have permission to update this crop record")
        }

        // Create updated entity with yield rating
        val updatedEntity = CropRecordEntity(
            id = existingRecord.id,
            name = existingRecord.name,
            description = existingRecord.description,
            plantingDate = existingRecord.plantingDate,
            harvestDate = existingRecord.harvestDate,
            plantId = existingRecord.plantId,
            plantName = existingRecord.plantName,
            status = existingRecord.status,
            growZoneId = existingRecord.growZoneId,
            outcome = existingRecord.outcome,
            notes = existingRecord.notes,
            plantFamily = existingRecord.plantFamily,
            plantGenus = existingRecord.plantGenus,
            feederType = existingRecord.feederType,
            isNitrogenFixer = existingRecord.isNitrogenFixer,
            rootDepth = existingRecord.rootDepth,
            hadDiseases = existingRecord.hadDiseases,
            diseaseNames = existingRecord.diseaseNames,
            diseaseNotes = existingRecord.diseaseNotes,
            yieldRating = yieldRating,
            soilQualityAfter = soilQualityAfter ?: existingRecord.soilQualityAfter
        )

        return mapCropRecordEntityToDTO(cropRecordRepository.save(updatedEntity))
    }

}