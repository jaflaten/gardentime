package no.sogn.gardentime.api

import no.sogn.gardentime.model.Garden
import no.sogn.gardentime.model.GardenInfo
import no.sogn.gardentime.service.GardenService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/gardens")
@CrossOrigin(origins = ["*"])

class GardenController(
    private val gardenService: GardenService
) {
    @GetMapping
    fun getGardens(): ResponseEntity<List<GardenInfo>> {
        val gardens = gardenService.getGardenByUserId()
        return ResponseEntity.ok(gardens)
    }

    @PostMapping
    fun addGarden(@RequestBody request: CreateGardenRequest): ResponseEntity<Garden> {
        val createdGarden = gardenService.addGarden(request.name)
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

data class CreateGardenRequest(
    val name: String
)
