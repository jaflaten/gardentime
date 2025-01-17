package no.sogn.gardentime.service

import no.sogn.gardentime.db.GardenRepository
import no.sogn.gardentime.model.Garden
import no.sogn.gardentime.model.mapToGarden
import no.sogn.gardentime.model.mapToGardenEntity
import org.springframework.stereotype.Service
import java.util.UUID

@Service
class GardenService(
    private val gardenRepository: GardenRepository
) {

    fun getGardens(): List<Garden> {
        return gardenRepository.findAll().map { mapToGarden(it) }
    }

    fun addGarden(name: String): Garden {
        return mapToGarden(gardenRepository.save(mapToGardenEntity(Garden(name = name))))
    }

    fun getGardenById(id: UUID): Garden? {
        return gardenRepository.findById(id).map { mapToGarden(it) }.orElse(null)
    }

    fun deleteGardenById(id: UUID) {
        gardenRepository.deleteById(id)
    }
}