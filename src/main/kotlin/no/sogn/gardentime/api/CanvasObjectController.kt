package no.sogn.gardentime.api

import no.sogn.gardentime.model.CanvasObject
import no.sogn.gardentime.model.CanvasObjectType
import no.sogn.gardentime.service.CanvasObjectService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

data class CreateCanvasObjectRequest(
    val gardenId: UUID,
    val type: CanvasObjectType,
    val x: Double,
    val y: Double,
    val width: Double? = null,
    val height: Double? = null,
    val points: String? = null,
    val fillColor: String? = null,
    val strokeColor: String? = null,
    val strokeWidth: Double? = null,
    val opacity: Double? = null,
    val text: String? = null,
    val fontSize: Int? = null,
    val fontFamily: String? = null,
    val rotation: Double? = null,
    val zIndex: Int? = null,
    val locked: Boolean = false,
    val layerId: String? = null
)

data class UpdateCanvasObjectRequest(
    val x: Double? = null,
    val y: Double? = null,
    val width: Double? = null,
    val height: Double? = null,
    val points: String? = null,
    val fillColor: String? = null,
    val strokeColor: String? = null,
    val strokeWidth: Double? = null,
    val opacity: Double? = null,
    val text: String? = null,
    val fontSize: Int? = null,
    val fontFamily: String? = null,
    val rotation: Double? = null,
    val zIndex: Int? = null,
    val locked: Boolean? = null,
    val layerId: String? = null
)

data class BatchCreateCanvasObjectsRequest(
    val objects: List<CreateCanvasObjectRequest>
)

@RestController
@RequestMapping("/api/canvas-objects")
@CrossOrigin(origins = ["*"])
class CanvasObjectController(
    private val canvasObjectService: CanvasObjectService
) {

    @PostMapping
    fun createCanvasObject(@RequestBody request: CreateCanvasObjectRequest): ResponseEntity<CanvasObject> {
        val created = canvasObjectService.createCanvasObject(
            gardenId = request.gardenId,
            type = request.type,
            x = request.x,
            y = request.y,
            width = request.width,
            height = request.height,
            points = request.points,
            fillColor = request.fillColor,
            strokeColor = request.strokeColor,
            strokeWidth = request.strokeWidth,
            opacity = request.opacity,
            text = request.text,
            fontSize = request.fontSize,
            fontFamily = request.fontFamily,
            rotation = request.rotation,
            zIndex = request.zIndex,
            locked = request.locked,
            layerId = request.layerId
        )
        return ResponseEntity.status(201).body(created)
    }

    @GetMapping("/garden/{gardenId}")
    fun getCanvasObjectsByGarden(@PathVariable gardenId: UUID): ResponseEntity<List<CanvasObject>> {
        val objects = canvasObjectService.getCanvasObjectsByGarden(gardenId)
        return ResponseEntity.ok(objects)
    }

    @PutMapping("/{id}")
    fun updateCanvasObject(
        @PathVariable id: Long,
        @RequestBody request: UpdateCanvasObjectRequest
    ): ResponseEntity<CanvasObject> {
        val updated = canvasObjectService.updateCanvasObject(
            id = id,
            x = request.x,
            y = request.y,
            width = request.width,
            height = request.height,
            points = request.points,
            fillColor = request.fillColor,
            strokeColor = request.strokeColor,
            strokeWidth = request.strokeWidth,
            opacity = request.opacity,
            text = request.text,
            fontSize = request.fontSize,
            fontFamily = request.fontFamily,
            rotation = request.rotation,
            zIndex = request.zIndex,
            locked = request.locked,
            layerId = request.layerId
        )
        return ResponseEntity.ok(updated)
    }

    @DeleteMapping("/{id}")
    fun deleteCanvasObject(@PathVariable id: Long): ResponseEntity<Void> {
        canvasObjectService.deleteCanvasObject(id)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/batch")
    fun batchCreateCanvasObjects(@RequestBody request: BatchCreateCanvasObjectsRequest): ResponseEntity<List<CanvasObject>> {
        val canvasObjects = request.objects.map { req ->
            CanvasObject(
                gardenId = req.gardenId,
                type = req.type,
                x = req.x,
                y = req.y,
                width = req.width,
                height = req.height,
                points = req.points,
                fillColor = req.fillColor,
                strokeColor = req.strokeColor,
                strokeWidth = req.strokeWidth,
                opacity = req.opacity,
                text = req.text,
                fontSize = req.fontSize,
                fontFamily = req.fontFamily,
                rotation = req.rotation,
                zIndex = req.zIndex,
                locked = req.locked,
                layerId = req.layerId
            )
        }
        val created = canvasObjectService.batchCreateCanvasObjects(canvasObjects)
        return ResponseEntity.status(201).body(created)
    }
}
