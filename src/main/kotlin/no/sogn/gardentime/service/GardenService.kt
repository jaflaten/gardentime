package no.sogn.gardentime.service

import no.sogn.gardentime.db.GardenRepository
import no.sogn.gardentime.dto.GardenDataDto
import no.sogn.gardentime.dto.GardenExportDto
import no.sogn.gardentime.dto.GardenImportRequest
import no.sogn.gardentime.dto.GrowAreaExportDto
import no.sogn.gardentime.model.Garden
import no.sogn.gardentime.model.GardenEntity
import no.sogn.gardentime.model.GardenInfo
import no.sogn.gardentime.model.ZoneType
import no.sogn.gardentime.model.mapToGarden
import no.sogn.gardentime.model.mapToGardenEntity
import no.sogn.gardentime.security.SecurityUtils
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.UUID

@Service
class GardenService(
    private val gardenRepository: GardenRepository,
    private val growAreaService: GrowAreaService,
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
            exportVersion = "1.0",
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
                    height = area.height
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

        // Create grow areas
        request.growAreas.forEach { areaDto ->
            growAreaService.addGrowArea(
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
                height = areaDto.height
            )
        }

        return getGardenById(savedGarden.id!!)!!
    }
}