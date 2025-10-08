package no.sogn.gardentime.service

import no.sogn.gardentime.db.GardenRepository
import no.sogn.gardentime.model.Garden
import no.sogn.gardentime.model.GardenEntity
import no.sogn.gardentime.model.GardenInfo
import no.sogn.gardentime.model.mapToGarden
import no.sogn.gardentime.model.mapToGardenEntity
import no.sogn.gardentime.security.SecurityUtils
import org.springframework.stereotype.Service
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

        gardenRepository.deleteById(id)
    }
}