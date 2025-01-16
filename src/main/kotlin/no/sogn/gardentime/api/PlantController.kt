package no.sogn.gardentime.api

import no.sogn.gardentime.model.Plant
import no.sogn.gardentime.service.PlantService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/plants")
class PlantController(
    private val plantService: PlantService
) {

    @GetMapping("/")
    fun getPlants(): ResponseEntity<List<Plant>> {
        val plants = plantService.getPlants()
        if (plants.isEmpty()) {
            return ResponseEntity.noContent().build()
        }
        return ResponseEntity.ok(plants)
    }

    @GetMapping("/{id}")
    fun getPlantById(id: Long): ResponseEntity<Plant> {
        val plant = plantService.getPlantById(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(plant)
    }

    @PostMapping("/{name}")
    fun addPlant(@PathVariable name: String): ResponseEntity<Plant> {
        val createdPlant = plantService.addPlant(name)
        return ResponseEntity.ok(createdPlant)
    }
}