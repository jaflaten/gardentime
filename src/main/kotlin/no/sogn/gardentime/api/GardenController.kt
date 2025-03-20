package no.sogn.gardentime.api

import no.sogn.gardentime.model.Garden
import no.sogn.gardentime.model.GardenInfo
import no.sogn.gardentime.service.GardenService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/garden")
@CrossOrigin(origins = ["*"])

class GardenController(
    private val gardenService: GardenService
) {
    @GetMapping("/")
    fun getGardens(): ResponseEntity<List<UUID>> {
        val gardenIds = gardenService.getGardenIds()
        if (gardenIds.isEmpty()) {
            return ResponseEntity.noContent().build()
        }
        return ResponseEntity.ok(gardenIds)
    }

    @PostMapping("/{userId}/{name}")
    fun addGarden(@PathVariable name: String, @PathVariable userId: UUID): ResponseEntity<Garden> {
        val createdGarden = gardenService.addGarden(name, userId)
        return ResponseEntity.status(HttpStatus.CREATED).body(createdGarden)
    }

    @GetMapping("/user/{id}")
    fun getGardensByUserId(@PathVariable id: UUID): ResponseEntity<List<GardenInfo>> {
        val garden = gardenService.getGardenByUserId(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(garden)
    }

    @GetMapping("/{id}")
    fun getGardenById(@PathVariable id: UUID): ResponseEntity<Garden> {
        val garden = gardenService.getGardenById(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(garden)
    }

    @DeleteMapping("/{id}")
    fun deleteGardenById(@PathVariable id: UUID): ResponseEntity<Unit> {
        gardenService.deleteGardenById(id)
        return ResponseEntity.noContent().build()
    }
}