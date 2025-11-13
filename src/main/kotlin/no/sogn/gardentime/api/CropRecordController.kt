package no.sogn.gardentime.api

import no.sogn.gardentime.model.CropRecordDTO
import no.sogn.gardentime.model.CropStatus
import no.sogn.gardentime.service.CropRecordService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.util.*
import org.slf4j.LoggerFactory

data class CreateCropRecordRequest(
    val growAreaId: String,  // Changed to String to handle frontend sending string IDs
    val plantId: String,  // UUID string from plant-data-aggregator
    val plantName: String,  // Plant name for display and lookup
    val datePlanted: LocalDate,
    val dateHarvested: LocalDate? = null,
    val notes: String? = null,
    val outcome: String? = null,
    val status: CropStatus? = null,  // Allow setting status when creating
    val quantityHarvested: Double? = null,
    val unit: String? = null
)

data class UpdateCropRecordRequest(
    val datePlanted: LocalDate? = null,
    val dateHarvested: LocalDate? = null,
    val notes: String? = null,
    val outcome: String? = null,
    val status: CropStatus? = null,
    val quantityHarvested: Double? = null,
    val unit: String? = null
)

@RestController
@RequestMapping("/api/crop-records")
@CrossOrigin(origins = ["*"])
class CropRecordController(
    private val cropRecordService: CropRecordService
) {
    private val logger = LoggerFactory.getLogger(CropRecordController::class.java)

    @PostMapping
    fun createCropRecord(@RequestBody request: CreateCropRecordRequest): ResponseEntity<CropRecordDTO> {
        val createdCropRecord = cropRecordService.createCropRecord(
            growAreaId = request.growAreaId,
            plantId = request.plantId,
            plantName = request.plantName,
            datePlanted = request.datePlanted,
            dateHarvested = request.dateHarvested,
            notes = request.notes,
            outcome = request.outcome,
            status = request.status
        )
        return ResponseEntity.ok(createdCropRecord)
    }

    @PutMapping("/{id}")
    fun updateCropRecord(
        @PathVariable id: UUID,
        @RequestBody request: UpdateCropRecordRequest
    ): ResponseEntity<CropRecordDTO> {
        val updatedCropRecord = cropRecordService.updateCropRecord(
            id = id,
            datePlanted = request.datePlanted,
            dateHarvested = request.dateHarvested,
            notes = request.notes,
            outcome = request.outcome,
            status = request.status
        )
        return ResponseEntity.ok(updatedCropRecord)
    }

    // Keep old endpoint for backward compatibility
    @PostMapping("/legacy/{plantName}/garden/{gardenId}/growzone/{growZoneId}")
    fun addCropRecordLegacy(
        @PathVariable plantName: String,
        @PathVariable gardenId: UUID,
        @PathVariable growZoneId: Long
    ): ResponseEntity<CropRecordDTO> {
        val createdCropRecord = cropRecordService.addCropRecordLegacy(plantName, gardenId, growZoneId)
        return ResponseEntity.ok(createdCropRecord)
    }

    @GetMapping("/{id}")
    fun getCropRecordById(@PathVariable id: UUID): ResponseEntity<CropRecordDTO> {
        val cropRecord = cropRecordService.getCropRecordById(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(cropRecord)
    }

    @GetMapping("/growarea/{growAreaId}")
    fun getCropRecordsByGrowAreaId(@PathVariable growAreaId: Long): ResponseEntity<List<CropRecordDTO>> {
        val cropRecords = cropRecordService.getCropRecordsByGrowAreaId(growAreaId)
        return ResponseEntity.ok(cropRecords)
    }

    @DeleteMapping("/{id}")
    fun deleteCropRecordById(@PathVariable id: UUID): ResponseEntity<Unit> {
        logger.info("=== DELETE REQUEST RECEIVED ===")
        logger.info("Attempting to delete crop record with ID: $id")
        return try {
            cropRecordService.deleteCropRecordById(id)
            logger.info("=== DELETE SUCCESSFUL ===")
            logger.info("Crop record $id deleted successfully")
            ResponseEntity.noContent().build()
        } catch (e: IllegalArgumentException) {
            logger.error("=== DELETE FAILED - BAD REQUEST ===")
            logger.error("Error: ${e.message}", e)
            throw e
        } catch (e: IllegalAccessException) {
            logger.error("=== DELETE FAILED - ACCESS DENIED ===")
            logger.error("Error: ${e.message}", e)
            throw e
        } catch (e: Exception) {
            logger.error("=== DELETE FAILED - UNEXPECTED ERROR ===")
            logger.error("Error type: ${e.javaClass.name}")
            logger.error("Error message: ${e.message}")
            logger.error("Full stack trace:", e)
            throw e
        }
    }

}