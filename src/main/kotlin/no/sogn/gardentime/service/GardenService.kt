package no.sogn.gardentime.service

import no.sogn.gardentime.db.GardenRepository
import no.sogn.gardentime.model.Garden
import no.sogn.gardentime.model.GardenEntity
import no.sogn.gardentime.model.GardenInfo
import no.sogn.gardentime.model.mapToGarden
import no.sogn.gardentime.model.mapToGardenEntity
import org.springframework.stereotype.Service
import java.util.UUID

@Service
class GardenService(
    private val gardenRepository: GardenRepository,
    private val growZoneService: GrowZoneService,
) {

    fun getGardenIds(): List<UUID> {
        return gardenRepository.findAll().mapNotNull { it.id }
    }

    fun addGarden(name: String, userId: UUID): Garden {
        return mapToGarden(
            gardenRepository.save(mapToGardenEntity(Garden(name = name, userId = userId))),
            cropRecords = mutableListOf()
        )
    }

    fun getGardenById(id: UUID): Garden? {
        val cropRecordsForThisGarden = growZoneService.getCropRecordsForGarden(id)
        return gardenRepository.findById(id).map { mapToGarden(it, cropRecordsForThisGarden) }.orElse(null)
    }

    fun getGardenByUserId(userId: UUID): List<GardenInfo> {
        val gardenEntities = gardenRepository.findAllByUserId(userId)
        return gardenEntities.map { GardenInfo(it.id!!, it.name) }.toList()
    }

    fun deleteGardenById(id: UUID) {
        gardenRepository.deleteById(id)
    }
}