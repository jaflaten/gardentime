package no.sogn.gardentime.api

import no.sogn.gardentime.model.Plant
import no.sogn.gardentime.service.PlantService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/plants")
@CrossOrigin(origins = ["*"])
class PlantController(
    private val plantService: PlantService
) {

    @GetMapping("/")
    fun getPlants(): ResponseEntity<List<Plant>> {
        val plants = plantService.getPlants()
        // Always return an array, even if empty
        return ResponseEntity.ok(plants)
    }

    @GetMapping("/search")
    fun searchPlants(@RequestParam query: String): ResponseEntity<List<Plant>> {
        val plants = plantService.searchPlants(query)
        return ResponseEntity.ok(plants)
    }
}