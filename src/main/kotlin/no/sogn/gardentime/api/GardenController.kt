package no.sogn.gardentime.api

import no.sogn.gardentime.model.Garden
import no.sogn.gardentime.service.GardenService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/garden")
class GardenController(
    private val gardenService: GardenService
) {
    @GetMapping
    fun getGardens(): ResponseEntity<List<UUID>> {
        val gardenIds = gardenService.getGardenIds()
        if (gardenIds.isEmpty()) {
            return ResponseEntity.noContent().build()
        }
        return ResponseEntity.ok(gardenIds)
    }

    @PostMapping("/{name}")
    fun addGarden(@PathVariable name: String): ResponseEntity<Garden> {
        val createdGarden = gardenService.addGarden(name)
        return ResponseEntity.status(HttpStatus.CREATED).body(createdGarden)
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