package no.sogn.gardentime.service

import no.sogn.gardentime.db.GardenRepository
import no.sogn.gardentime.model.Garden
import no.sogn.gardentime.model.mapToGarden
import no.sogn.gardentime.model.mapToGardenEntity
import org.springframework.stereotype.Service

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
}