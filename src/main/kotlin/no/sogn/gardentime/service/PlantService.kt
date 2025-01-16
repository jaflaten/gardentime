package no.sogn.gardentime.service

import no.sogn.gardentime.db.PlantRepository
import no.sogn.gardentime.model.Plant
import no.sogn.gardentime.model.mapPlantToDomain
import no.sogn.gardentime.model.mapPlantToEntity
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

    fun getPlantById(id: Long): Plant? {
        plantRepository.findById(id).orElse(null)?.let {
            return mapPlantToDomain(it)
        }
        return null
    }

    fun addPlant(name: String): Plant {
        val plant = plantRepository.save(mapPlantToEntity(Plant(name = name)))
        return mapPlantToDomain(plant)
    }

}
