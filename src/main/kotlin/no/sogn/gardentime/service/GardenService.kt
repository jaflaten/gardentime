package no.sogn.gardentime.service

import no.sogn.gardentime.db.CropRecordRepository
import no.sogn.gardentime.db.GardenRepository
import no.sogn.gardentime.dto.CropRecordExportDto
import no.sogn.gardentime.dto.GardenDataDto
import no.sogn.gardentime.dto.GardenExportDto
import no.sogn.gardentime.dto.GardenImportRequest
import no.sogn.gardentime.dto.GrowAreaExportDto
import no.sogn.gardentime.model.CropRecordEntity
import no.sogn.gardentime.model.CropStatus
import no.sogn.gardentime.model.Garden
import no.sogn.gardentime.model.GardenEntity
import no.sogn.gardentime.model.GardenInfo
import no.sogn.gardentime.model.ZoneType
import no.sogn.gardentime.model.mapToGarden
import no.sogn.gardentime.model.mapToGardenEntity
import no.sogn.gardentime.security.SecurityUtils
import org.springframework.stereotype.Service
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Service
class GardenService(
    private val gardenRepository: GardenRepository,
    private val growAreaService: GrowAreaService,
    private val cropRecordRepository: CropRecordRepository,
    private val securityUtils: SecurityUtils,
) {

    fun getGardenIds(): List<UUID> {
        val currentUserId = securityUtils.getCurrentUserId()
        return gardenRepository.findAllByUserId(currentUserId).mapNotNull { it.id }
    }

    fun addGarden(name: String): Garden {
        val currentUserId = securityUtils.getCurrentUserId()
        return mapToGarden(
            gardenRepository.save(mapToGardenEntity(Garden(name = name, userId = currentUserId))),
            cropRecords = mutableListOf()
        )
    }

    fun getGardenById(id: UUID): Garden? {
        val currentUserId = securityUtils.getCurrentUserId()
        val garden = gardenRepository.findById(id).orElse(null) ?: return null

        // Security check: ensure the garden belongs to the current user
        if (garden.userId != currentUserId) {
            throw IllegalAccessException("You don't have permission to access this garden")
        }

        val cropRecordsForThisGarden = growAreaService.getCropRecordsForGarden(id)
        return mapToGarden(garden, cropRecordsForThisGarden)
    }

    fun getGardenByUserId(): List<GardenInfo> {
        val currentUserId = securityUtils.getCurrentUserId()
        val gardenEntities = gardenRepository.findAllByUserId(currentUserId)
        return gardenEntities.map { GardenInfo(it.id!!, it.name) }.toList()
    }

    fun deleteGardenById(id: UUID) {
        val currentUserId = securityUtils.getCurrentUserId()
        val garden = gardenRepository.findById(id).orElse(null)
            ?: throw IllegalArgumentException("Garden not found")

        // Security check: ensure the garden belongs to the current user
        if (garden.userId != currentUserId) {
            throw IllegalAccessException("You don't have permission to delete this garden")
        }

        // Delete grow areas first to avoid FK constraint violation
        growAreaService.deleteAllByGardenId(id)
        gardenRepository.deleteById(id)
    }

    fun exportGarden(gardenId: UUID): GardenExportDto {
        val garden = getGardenById(gardenId)
            ?: throw IllegalArgumentException("Garden not found")

        return GardenExportDto(
            exportVersion = "1.1",
            exportedAt = Instant.now(),
            garden = GardenDataDto(name = garden.name),
            growAreas = garden.growAreas.map { area ->
                GrowAreaExportDto(
                    name = area.name,
                    zoneSize = area.zoneSize,
                    zoneType = area.zoneType?.name,
                    nrOfRows = area.nrOfRows,
                    notes = area.notes,
                    positionX = area.positionX,
                    positionY = area.positionY,
                    width = area.width,
                    length = area.length,
                    height = area.height,
                    rotation = area.rotation,
                    cropRecords = area.cropRecord.map { record ->
                        CropRecordExportDto(
                            plantId = record.plantId,
                            plantName = record.plantName,
                            datePlanted = record.plantingDate.toString(),
                            dateHarvested = record.harvestDate?.toString(),
                            status = record.status?.name,
                            notes = record.notes,
                            outcome = record.outcome,
                            name = record.name,
                            description = record.description,
                            plantFamily = record.plantFamily,
                            plantGenus = record.plantGenus,
                            feederType = record.feederType,
                            isNitrogenFixer = record.isNitrogenFixer,
                            rootDepth = record.rootDepth,
                            hadDiseases = record.hadDiseases,
                            diseaseNames = record.diseaseNames,
                            diseaseNotes = record.diseaseNotes,
                            yieldRating = record.yieldRating,
                            soilQualityAfter = record.soilQualityAfter
                        )
                    }
                )
            }
        )
    }

    fun importGarden(request: GardenImportRequest): Garden {
        val currentUserId = securityUtils.getCurrentUserId()

        // Create new garden with user-provided name
        val newGarden = Garden(
            name = request.gardenName,
            userId = currentUserId
        )
        val savedGarden = gardenRepository.save(mapToGardenEntity(newGarden))

        // Create grow areas and their crop records
        request.growAreas.forEach { areaDto ->
            val createdArea = growAreaService.addGrowArea(
                name = areaDto.name,
                gardenId = savedGarden.id!!,
                zoneSize = areaDto.zoneSize,
                zoneType = areaDto.zoneType?.let { ZoneType.valueOf(it) },
                nrOfRows = areaDto.nrOfRows,
                notes = areaDto.notes,
                positionX = areaDto.positionX,
                positionY = areaDto.positionY,
                width = areaDto.width,
                length = areaDto.length,
                height = areaDto.height,
                rotation = areaDto.rotation
            )

            // Create crop records for this grow area
            areaDto.cropRecords.forEach { recordDto ->
                val cropRecordEntity = CropRecordEntity(
                    plantingDate = LocalDate.parse(recordDto.datePlanted),
                    harvestDate = recordDto.dateHarvested?.let { LocalDate.parse(it) },
                    plantId = recordDto.plantId,
                    plantName = recordDto.plantName,
                    growZoneId = createdArea.id!!,
                    name = recordDto.name,
                    description = recordDto.description,
                    notes = recordDto.notes,
                    outcome = recordDto.outcome,
                    status = recordDto.status?.let { CropStatus.valueOf(it) },
                    plantFamily = recordDto.plantFamily,
                    plantGenus = recordDto.plantGenus,
                    feederType = recordDto.feederType,
                    isNitrogenFixer = recordDto.isNitrogenFixer,
                    rootDepth = recordDto.rootDepth,
                    hadDiseases = recordDto.hadDiseases,
                    diseaseNames = recordDto.diseaseNames,
                    diseaseNotes = recordDto.diseaseNotes,
                    yieldRating = recordDto.yieldRating,
                    soilQualityAfter = recordDto.soilQualityAfter
                )
                cropRecordRepository.save(cropRecordEntity)
            }
        }

        return getGardenById(savedGarden.id!!)!!
    }
}