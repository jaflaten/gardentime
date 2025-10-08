package no.sogn.gardentime.api

import no.sogn.gardentime.model.GrowArea
import no.sogn.gardentime.model.ZoneType
import no.sogn.gardentime.service.GrowAreaService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

data class CreateGrowAreaRequest(
    val name: String,
    val gardenId: UUID,
    val zoneSize: String? = null,
    val zoneType: ZoneType? = null,
    val nrOfRows: Int? = null,
    val notes: String? = null
)

data class UpdateGrowAreaRequest(
    val name: String?,
    val zoneSize: String? = null,
    val zoneType: ZoneType? = null,
    val nrOfRows: Int? = null,
    val notes: String? = null
)

@RestController
@RequestMapping("/api/growarea")
@CrossOrigin(origins = ["*"])
class GrowAreaController(
    private val growAreaService: GrowAreaService
) {

    @PostMapping
    fun addGrowArea(@RequestBody request: CreateGrowAreaRequest): ResponseEntity<GrowArea> {
        val createdGrowArea = growAreaService.addGrowArea(
            name = request.name,
            gardenId = request.gardenId,
            zoneSize = request.zoneSize,
            zoneType = request.zoneType,
            nrOfRows = request.nrOfRows,
            notes = request.notes
        )
        return ResponseEntity.ok(createdGrowArea)
    }

    @PutMapping("/{id}")
    fun updateGrowArea(@PathVariable id: Long, @RequestBody request: UpdateGrowAreaRequest): ResponseEntity<GrowArea> {
        val updatedGrowArea = growAreaService.updateGrowArea(
            id = id,
            name = request.name,
            zoneSize = request.zoneSize,
            zoneType = request.zoneType,
            nrOfRows = request.nrOfRows,
            notes = request.notes
        )
        return ResponseEntity.ok(updatedGrowArea)
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

    @GetMapping("/garden/{gardenId}")
    fun getGrowAreasByGardenId(@PathVariable gardenId: UUID): ResponseEntity<List<GrowArea>> {
        val growAreas = growAreaService.getGrowAreasByGardenId(gardenId)
        return ResponseEntity.ok(growAreas)
    }

}