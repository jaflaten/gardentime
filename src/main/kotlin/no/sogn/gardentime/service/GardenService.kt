package no.sogn.gardentime.service

import no.sogn.gardentime.db.CropRecordRepository
import no.sogn.gardentime.db.GardenRepository
import no.sogn.gardentime.model.CropRecord
import no.sogn.gardentime.model.Garden
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

    fun addGarden(name: String): Garden {
        return mapToGarden(
            gardenRepository.save(mapToGardenEntity(Garden(name = name))),
            cropRecords = mutableListOf()
        )
    }

    fun getGardenById(id: UUID): Garden? {
        val cropRecordsForThisGarden = growZoneService.getCropRecordsForGarden(id)
        return gardenRepository.findById(id).map { mapToGarden(it, cropRecordsForThisGarden) }.orElse(null)
    }

    fun deleteGardenById(id: UUID) {
        gardenRepository.deleteById(id)
    }
}