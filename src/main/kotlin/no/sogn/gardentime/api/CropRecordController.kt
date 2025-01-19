package no.sogn.gardentime.api

import no.sogn.gardentime.model.CropRecord
import no.sogn.gardentime.service.CropRecordService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.*

@RestController
@RequestMapping("/api/croprecord")
class CropRecordController(
    private val cropRecordService: CropRecordService
) {

    @PostMapping("/{plantName}/garden/{gardenId}/growzone/{growZoneId}")
    fun addCropRecord(
        @PathVariable plantName: String,
        @PathVariable gardenId: UUID,
        @PathVariable growZoneId: Long
    ): ResponseEntity<CropRecord> {
        val createdCropRecord = cropRecordService.addCropRecord(plantName, gardenId, growZoneId)
        return ResponseEntity.ok(createdCropRecord)
    }

    @GetMapping("/{id}")
    fun getCropRecordById(@PathVariable id: UUID): ResponseEntity<CropRecord> {
        val cropRecord = cropRecordService.getCropRecordById(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(cropRecord)
    }

    @DeleteMapping("/{id}")
    fun deleteCropRecordById(@PathVariable id: UUID): ResponseEntity<Unit> {
        cropRecordService.deleteCropRecordById(id)
        return ResponseEntity.noContent().build()
    }

}