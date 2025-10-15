package no.sogn.gardentime.service

import no.sogn.gardentime.db.PlantRepository
import no.sogn.gardentime.model.Plant
import no.sogn.gardentime.model.mapPlantToDomain
import org.springframework.stereotype.Service

@Service
class PlantService(
    private val plantRepository: PlantRepository
) {

    fun getPlants(): List<Plant> {
        return plantRepository.findAll().map {
            mapPlantToDomain(it)
        }
    }

    fun searchPlants(query: String): List<Plant> {
        return if (query.isBlank()) {
            plantRepository.findAll().map { mapPlantToDomain(it) }
        } else {
            plantRepository.findByNameContainingIgnoreCaseOrScientificNameContainingIgnoreCase(query, query)
                .map { mapPlantToDomain(it) }
        }
    }
}
