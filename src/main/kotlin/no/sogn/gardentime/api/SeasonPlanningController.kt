package no.sogn.gardentime.api

import no.sogn.gardentime.db.GardenClimateInfoRepository
import no.sogn.gardentime.db.GardenRepository
import no.sogn.gardentime.dto.*
import no.sogn.gardentime.model.GardenClimateInfo
import no.sogn.gardentime.security.SecurityUtils
import no.sogn.gardentime.service.SeasonPlanningService
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.*

@RestController
@RequestMapping("/api/gardens/{gardenId}")
class SeasonPlanningController(
    private val seasonPlanningService: SeasonPlanningService,
    private val gardenRepository: GardenRepository,
    private val gardenClimateInfoRepository: GardenClimateInfoRepository,
    private val securityUtils: SecurityUtils
) {

    // Garden Climate Info endpoints
    @GetMapping("/climate")
    fun getClimateInfo(
        @PathVariable gardenId: UUID
    ): ResponseEntity<GardenClimateInfoDTO> {
        val userId = securityUtils.getCurrentUserId()
        
        // Verify garden ownership
        val garden = gardenRepository.findById(gardenId).orElse(null) 
            ?: return ResponseEntity.notFound().build()
        if (garden.userId != userId) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        val climateInfo = gardenClimateInfoRepository.findByGardenId(gardenId)
        return if (climateInfo != null) {
            ResponseEntity.ok(climateInfo.toDTO())
        } else {
            ResponseEntity.ok(GardenClimateInfoDTO(
                gardenId = gardenId,
                lastFrostDate = null,
                firstFrostDate = null,
                hardinessZone = null,
                latitude = null,
                longitude = null
            ))
        }
    }

    @PutMapping("/climate")
    fun updateClimateInfo(
        @PathVariable gardenId: UUID,
        @RequestBody createDto: CreateGardenClimateInfoDTO
    ): ResponseEntity<GardenClimateInfoDTO> {
        val userId = securityUtils.getCurrentUserId()
        
        // Verify garden ownership
        val garden = gardenRepository.findById(gardenId).orElse(null) 
            ?: return ResponseEntity.notFound().build()
        if (garden.userId != userId) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        val existing = gardenClimateInfoRepository.findByGardenId(gardenId)
        val climateInfo = if (existing != null) {
            existing.apply {
                lastFrostDate = createDto.lastFrostDate
                firstFrostDate = createDto.firstFrostDate
                hardinessZone = createDto.hardinessZone
                latitude = createDto.latitude
                longitude = createDto.longitude
                updatedAt = LocalDateTime.now()
            }
        } else {
            GardenClimateInfo(
                gardenId = gardenId,
                lastFrostDate = createDto.lastFrostDate,
                firstFrostDate = createDto.firstFrostDate,
                hardinessZone = createDto.hardinessZone,
                latitude = createDto.latitude,
                longitude = createDto.longitude
            )
        }

        return ResponseEntity.ok(gardenClimateInfoRepository.save(climateInfo).toDTO())
    }

    // Season Plan endpoints
    @GetMapping("/season-plans")
    fun getSeasonPlans(
        @PathVariable gardenId: UUID
    ): ResponseEntity<List<SeasonPlanDTO>> {
        val userId = securityUtils.getCurrentUserId()
        
        // Verify garden ownership
        val garden = gardenRepository.findById(gardenId).orElse(null) 
            ?: return ResponseEntity.notFound().build()
        if (garden.userId != userId) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        return ResponseEntity.ok(seasonPlanningService.getSeasonPlans(gardenId))
    }

    @GetMapping("/season-plan")
    fun getCurrentSeasonPlan(
        @PathVariable gardenId: UUID
    ): ResponseEntity<SeasonPlanDTO> {
        val userId = securityUtils.getCurrentUserId()
        
        // Verify garden ownership
        val garden = gardenRepository.findById(gardenId).orElse(null) 
            ?: return ResponseEntity.notFound().build()
        if (garden.userId != userId) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        val seasonPlan = seasonPlanningService.getCurrentSeasonPlan(gardenId)
        return if (seasonPlan != null) {
            ResponseEntity.ok(seasonPlan)
        } else {
            ResponseEntity.notFound().build()
        }
    }

    @PostMapping("/season-plan")
    fun createSeasonPlan(
        @PathVariable gardenId: UUID,
        @RequestBody createDto: CreateSeasonPlanDTO
    ): ResponseEntity<SeasonPlanDTO> {
        val userId = securityUtils.getCurrentUserId()
        
        // Verify garden ownership
        val garden = gardenRepository.findById(gardenId).orElse(null) 
            ?: return ResponseEntity.notFound().build()
        if (garden.userId != userId) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        return try {
            ResponseEntity.status(HttpStatus.CREATED)
                .body(seasonPlanningService.createSeasonPlan(gardenId, userId, createDto))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }

    @DeleteMapping("/season-plans/{seasonPlanId}")
    fun deleteSeasonPlan(
        @PathVariable gardenId: UUID,
        @PathVariable seasonPlanId: UUID
    ): ResponseEntity<Void> {
        val userId = securityUtils.getCurrentUserId()
        
        // Verify garden ownership
        val garden = gardenRepository.findById(gardenId).orElse(null) 
            ?: return ResponseEntity.notFound().build()
        if (garden.userId != userId) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        seasonPlanningService.deleteSeasonPlan(seasonPlanId)
        return ResponseEntity.noContent().build()
    }

    // Planned Crops endpoints
    @GetMapping("/season-plans/{seasonPlanId}/planned-crops")
    fun getPlannedCrops(
        @PathVariable gardenId: UUID,
        @PathVariable seasonPlanId: UUID,
        @RequestParam(required = false) status: String?
    ): ResponseEntity<List<PlannedCropDTO>> {
        val userId = securityUtils.getCurrentUserId()
        
        // Verify garden ownership
        val garden = gardenRepository.findById(gardenId).orElse(null) 
            ?: return ResponseEntity.notFound().build()
        if (garden.userId != userId) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        val crops = if (status != null) {
            seasonPlanningService.getPlannedCropsByStatus(seasonPlanId, status)
        } else {
            seasonPlanningService.getPlannedCrops(seasonPlanId)
        }

        return ResponseEntity.ok(crops)
    }

    @PostMapping("/season-plans/{seasonPlanId}/planned-crops")
    fun addPlannedCrop(
        @PathVariable gardenId: UUID,
        @PathVariable seasonPlanId: UUID,
        @RequestBody createDto: CreatePlannedCropDTO
    ): ResponseEntity<PlannedCropDTO> {
        val userId = securityUtils.getCurrentUserId()
        
        // Verify garden ownership
        val garden = gardenRepository.findById(gardenId).orElse(null) 
            ?: return ResponseEntity.notFound().build()
        if (garden.userId != userId) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(seasonPlanningService.addPlannedCrop(seasonPlanId, createDto))
    }

    @PatchMapping("/season-plans/{seasonPlanId}/planned-crops/{plannedCropId}")
    fun updatePlannedCrop(
        @PathVariable gardenId: UUID,
        @PathVariable seasonPlanId: UUID,
        @PathVariable plannedCropId: UUID,
        @RequestBody updateDto: UpdatePlannedCropDTO
    ): ResponseEntity<PlannedCropDTO> {
        val userId = securityUtils.getCurrentUserId()
        
        // Verify garden ownership
        val garden = gardenRepository.findById(gardenId).orElse(null) 
            ?: return ResponseEntity.notFound().build()
        if (garden.userId != userId) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        return try {
            ResponseEntity.ok(seasonPlanningService.updatePlannedCrop(plannedCropId, updateDto))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.notFound().build()
        }
    }

    @DeleteMapping("/season-plans/{seasonPlanId}/planned-crops/{plannedCropId}")
    fun deletePlannedCrop(
        @PathVariable gardenId: UUID,
        @PathVariable seasonPlanId: UUID,
        @PathVariable plannedCropId: UUID
    ): ResponseEntity<Void> {
        val userId = securityUtils.getCurrentUserId()
        
        // Verify garden ownership
        val garden = gardenRepository.findById(gardenId).orElse(null) 
            ?: return ResponseEntity.notFound().build()
        if (garden.userId != userId) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        seasonPlanningService.deletePlannedCrop(plannedCropId)
        return ResponseEntity.noContent().build()
    }

    // Calendar endpoints
    @GetMapping("/calendar")
    fun getCalendarEvents(
        @PathVariable gardenId: UUID,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate
    ): ResponseEntity<CalendarResponseDTO> {
        val userId = securityUtils.getCurrentUserId()
        
        // Verify garden ownership
        val garden = gardenRepository.findById(gardenId).orElse(null) 
            ?: return ResponseEntity.notFound().build()
        if (garden.userId != userId) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        return ResponseEntity.ok(seasonPlanningService.getCalendarEvents(gardenId, startDate, endDate))
    }

    private fun GardenClimateInfo.toDTO() = GardenClimateInfoDTO(
        gardenId = gardenId,
        lastFrostDate = lastFrostDate,
        firstFrostDate = firstFrostDate,
        hardinessZone = hardinessZone,
        latitude = latitude,
        longitude = longitude
    )
}
