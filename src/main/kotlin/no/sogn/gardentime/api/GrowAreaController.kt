package no.sogn.gardentime.api

import no.sogn.gardentime.model.GrowArea
import no.sogn.gardentime.service.GrowAreaService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/growarea")
@CrossOrigin(origins = ["*"])
class GrowAreaController(
    private val growAreaService: GrowAreaService
) {

    @PostMapping("/{name}/garden/{gardenId}")
    fun addGrowArea(@PathVariable name: String, @PathVariable gardenId: UUID): ResponseEntity<GrowArea> {
        val createdGrowArea = growAreaService.addGrowArea(name, gardenId)
        return ResponseEntity.ok(createdGrowArea)
    }

    @DeleteMapping("/{id}")
    fun deleteGrowArea(@PathVariable id: Long): ResponseEntity<Unit> {
        growAreaService.deleteGrowArea(id)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/{id}")
    fun getGrowAreaById(@PathVariable id: Long): ResponseEntity<GrowArea> {
        val growArea = growAreaService.getGrowAreaById(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(growArea)
    }

}