package no.sogn.gardentime.api

import no.sogn.gardentime.model.Garden
import no.sogn.gardentime.service.GardenService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/garden")
class GardenController(
    private val gardenService: GardenService
) {
    @GetMapping("/")
    fun getGardens(): ResponseEntity<List<Garden>> {
        val gardens = gardenService.getGardens()
        if (gardens.isEmpty()) {
            return ResponseEntity.noContent().build()
        }
        return ResponseEntity.ok(gardens)
    }

    @PostMapping("/{name}")
    fun addGarden(@PathVariable name: String): ResponseEntity<Garden> {
        val createdGarden = gardenService.addGarden(name)
        return ResponseEntity.status(HttpStatus.CREATED).body(createdGarden)
    }
}