package no.sogn.gardentime.api

import no.sogn.gardentime.model.GrowZone
import no.sogn.gardentime.service.GrowZoneService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/growzone")
@CrossOrigin(origins = ["*"])
class GrowZoneController(
    private val growZoneService: GrowZoneService
) {

    @PostMapping("/{name}/garden/{gardenId}")
    fun addGrowZone(@PathVariable name: String, @PathVariable gardenId: UUID): ResponseEntity<GrowZone> {
        val createdGrowZone = growZoneService.addGrowZone(name, gardenId)
        return ResponseEntity.ok(createdGrowZone)
    }

    @DeleteMapping("/{id}")
    fun deleteGrowZone(@PathVariable id: Long): ResponseEntity<Unit> {
        growZoneService.deleteGrowZone(id)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/{id}")
    fun getGrowZoneById(@PathVariable id: Long): ResponseEntity<GrowZone> {
        val growZone = growZoneService.getGrowZoneById(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(growZone)
    }

}