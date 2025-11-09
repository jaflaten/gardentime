package no.sogn.gardentime.service

import no.sogn.gardentime.db.*
import no.sogn.gardentime.dto.*
import no.sogn.gardentime.model.PlannedCrop
import no.sogn.gardentime.model.SeasonPlan
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.*

@Service
class SeasonPlanningService(
    private val seasonPlanRepository: SeasonPlanRepository,
    private val plannedCropRepository: PlannedCropRepository,
    private val plantRepository: PlantRepository,
    private val growAreaRepository: GrowAreaRepository,
    private val cropRecordRepository: CropRecordRepository,
    private val plantingDateCalculator: PlantingDateCalculatorService
) {

    fun getSeasonPlans(gardenId: UUID): List<SeasonPlanDTO> {
        return seasonPlanRepository.findByGardenId(gardenId).map { it.toDTO() }
    }

    fun getSeasonPlan(seasonPlanId: UUID): SeasonPlanDTO? {
        return seasonPlanRepository.findById(seasonPlanId).map { it.toDTO() }.orElse(null)
    }

    fun getCurrentSeasonPlan(gardenId: UUID): SeasonPlanDTO? {
        val currentDate = LocalDate.now()
        val currentSeason = getCurrentSeason(currentDate)
        val currentYear = currentDate.year

        return seasonPlanRepository.findByGardenIdAndSeasonAndYear(gardenId, currentSeason, currentYear)?.toDTO()
    }

    @Transactional
    fun createSeasonPlan(gardenId: UUID, userId: UUID, createDto: CreateSeasonPlanDTO): SeasonPlanDTO {
        // Check if plan already exists
        val existing = seasonPlanRepository.findByGardenIdAndSeasonAndYear(
            gardenId, createDto.season, createDto.year
        )
        if (existing != null) {
            throw IllegalArgumentException("Season plan for ${createDto.season} ${createDto.year} already exists")
        }

        val seasonPlan = SeasonPlan(
            gardenId = gardenId,
            userId = userId,
            season = createDto.season,
            year = createDto.year
        )

        return seasonPlanRepository.save(seasonPlan).toDTO()
    }

    @Transactional
    fun deleteSeasonPlan(seasonPlanId: UUID) {
        seasonPlanRepository.deleteById(seasonPlanId)
    }

    // Planned Crops
    fun getPlannedCrops(seasonPlanId: UUID): List<PlannedCropDTO> {
        return plannedCropRepository.findBySeasonPlanId(seasonPlanId).map { it.toDTO() }
    }

    fun getPlannedCropsByStatus(seasonPlanId: UUID, status: String): List<PlannedCropDTO> {
        return plannedCropRepository.findBySeasonPlanIdAndStatus(seasonPlanId, status).map { it.toDTO() }
    }

    @Transactional
    fun addPlannedCrop(seasonPlanId: UUID, createDto: CreatePlannedCropDTO): PlannedCropDTO {
        val seasonPlan = seasonPlanRepository.findById(seasonPlanId).orElseThrow {
            IllegalArgumentException("Season plan not found")
        }

        // Calculate dates based on garden climate and plant info
        val dates = plantingDateCalculator.calculatePlantingDates(seasonPlan.gardenId, createDto.plantId)

        val plannedCrop = PlannedCrop(
            seasonPlanId = seasonPlanId,
            plantId = createDto.plantId,
            plantName = createDto.plantName,
            quantity = createDto.quantity,
            preferredGrowAreaId = createDto.preferredGrowAreaId,
            phase = createDto.phase,
            notes = createDto.notes,
            indoorStartDate = dates.indoorStartDate,
            transplantDate = dates.transplantDate,
            directSowDate = dates.directSowDate,
            expectedHarvestDate = dates.expectedHarvestDate,
            indoorStartMethod = when (dates.recommendedMethod) {
                "TRANSPLANT" -> "seed_tray"
                else -> null
            }
        )

        return plannedCropRepository.save(plannedCrop).toDTO()
    }

    @Transactional
    fun updatePlannedCrop(plannedCropId: UUID, updateDto: UpdatePlannedCropDTO): PlannedCropDTO {
        val plannedCrop = plannedCropRepository.findById(plannedCropId).orElseThrow {
            IllegalArgumentException("Planned crop not found")
        }

        updateDto.status?.let { plannedCrop.status = it }
        updateDto.quantity?.let { plannedCrop.quantity = it }
        updateDto.preferredGrowAreaId?.let { plannedCrop.preferredGrowAreaId = it }
        updateDto.indoorStartDate?.let { plannedCrop.indoorStartDate = it }
        updateDto.transplantDate?.let { plannedCrop.transplantDate = it }
        updateDto.directSowDate?.let { plannedCrop.directSowDate = it }
        updateDto.expectedHarvestDate?.let { plannedCrop.expectedHarvestDate = it }
        updateDto.phase?.let { plannedCrop.phase = it }
        updateDto.notes?.let { plannedCrop.notes = it }
        plannedCrop.updatedAt = LocalDateTime.now()

        return plannedCropRepository.save(plannedCrop).toDTO()
    }

    @Transactional
    fun deletePlannedCrop(plannedCropId: UUID) {
        plannedCropRepository.deleteById(plannedCropId)
    }

    // Calendar events
    fun getCalendarEvents(gardenId: UUID, startDate: LocalDate, endDate: LocalDate): CalendarResponseDTO {
        val events = mutableListOf<CalendarEventDTO>()

        // Get all season plans for this garden
        val seasonPlans = seasonPlanRepository.findByGardenId(gardenId)

        // Get events from planned crops
        seasonPlans.forEach { seasonPlan ->
            val plannedCrops = plannedCropRepository.findBySeasonPlanId(seasonPlan.id)
            plannedCrops.forEach { plannedCrop ->
                val growArea = plannedCrop.preferredGrowAreaId?.let { 
                    growAreaRepository.findById(it).orElse(null) 
                }

                // Indoor start event
                plannedCrop.indoorStartDate?.let { date ->
                    if (!date.isBefore(startDate) && !date.isAfter(endDate)) {
                        events.add(CalendarEventDTO(
                            id = UUID.randomUUID(),
                            date = date,
                            type = "INDOOR_START",
                            plantName = plannedCrop.plantName,
                            plantId = plannedCrop.plantId,
                            plannedCropId = plannedCrop.id,
                            cropRecordId = null,
                            growAreaName = growArea?.name,
                            quantity = plannedCrop.quantity,
                            status = plannedCrop.status
                        ))
                    }
                }

                // Transplant event
                plannedCrop.transplantDate?.let { date ->
                    if (!date.isBefore(startDate) && !date.isAfter(endDate)) {
                        events.add(CalendarEventDTO(
                            id = UUID.randomUUID(),
                            date = date,
                            type = "TRANSPLANT",
                            plantName = plannedCrop.plantName,
                            plantId = plannedCrop.plantId,
                            plannedCropId = plannedCrop.id,
                            cropRecordId = plannedCrop.cropRecordId,
                            growAreaName = growArea?.name,
                            quantity = plannedCrop.quantity,
                            status = plannedCrop.status
                        ))
                    }
                }

                // Direct sow event
                plannedCrop.directSowDate?.let { date ->
                    if (!date.isBefore(startDate) && !date.isAfter(endDate)) {
                        events.add(CalendarEventDTO(
                            id = UUID.randomUUID(),
                            date = date,
                            type = "DIRECT_SOW",
                            plantName = plannedCrop.plantName,
                            plantId = plannedCrop.plantId,
                            plannedCropId = plannedCrop.id,
                            cropRecordId = plannedCrop.cropRecordId,
                            growAreaName = growArea?.name,
                            quantity = plannedCrop.quantity,
                            status = plannedCrop.status
                        ))
                    }
                }

                // Expected harvest event
                plannedCrop.expectedHarvestDate?.let { date ->
                    if (!date.isBefore(startDate) && !date.isAfter(endDate)) {
                        events.add(CalendarEventDTO(
                            id = UUID.randomUUID(),
                            date = date,
                            type = "EXPECTED_HARVEST",
                            plantName = plannedCrop.plantName,
                            plantId = plannedCrop.plantId,
                            plannedCropId = plannedCrop.id,
                            cropRecordId = plannedCrop.cropRecordId,
                            growAreaName = growArea?.name,
                            quantity = plannedCrop.quantity,
                            status = plannedCrop.status
                        ))
                    }
                }
            }
        }

        // Get events from actual crop records
        val growAreas = growAreaRepository.findAllByGardenId(gardenId)
        growAreas.forEach { growArea ->
            requireNotNull(growArea.id)
            val cropRecords = cropRecordRepository.findAllByGrowZoneId(growArea.id)
            cropRecords.forEach { cropRecord ->
                // Actual planting event
                if (!cropRecord.plantingDate.isBefore(startDate) && !cropRecord.plantingDate.isAfter(endDate)) {
                    events.add(CalendarEventDTO(
                        id = UUID.randomUUID(),
                        date = cropRecord.plantingDate,
                        type = "ACTUAL_PLANTING",
                        plantName = cropRecord.plant.name ?: "Unknown",
                        plantId = cropRecord.plant.id?.toString() ?: "0",
                        plannedCropId = null,
                        cropRecordId = cropRecord.id,
                        growAreaName = growArea.name,
                        quantity = null,
                        status = cropRecord.status?.name
                    ))
                }

                // Actual harvest event
                cropRecord.harvestDate?.let { harvestDate ->
                    if (!harvestDate.isBefore(startDate) && !harvestDate.isAfter(endDate)) {
                        events.add(CalendarEventDTO(
                            id = UUID.randomUUID(),
                            date = harvestDate,
                            type = "ACTUAL_HARVEST",
                            plantName = cropRecord.plant.name ?: "Unknown",
                            plantId = cropRecord.plant.id?.toString() ?: "0",
                            plannedCropId = null,
                            cropRecordId = cropRecord.id,
                            growAreaName = growArea.name,
                            quantity = null,
                            status = cropRecord.status?.name
                        ))
                    }
                }
            }
        }

        return CalendarResponseDTO(events = events.sortedBy { it.date })
    }

    private fun getCurrentSeason(date: LocalDate): String {
        val month = date.monthValue
        return when (month) {
            in 3..5 -> "SPRING"
            in 6..8 -> "SUMMER"
            in 9..11 -> "FALL"
            else -> "WINTER"
        }
    }

    private fun SeasonPlan.toDTO() = SeasonPlanDTO(
        id = id,
        gardenId = gardenId,
        userId = userId,
        season = season,
        year = year
    )

    private fun PlannedCrop.toDTO(): PlannedCropDTO {
        val growArea = preferredGrowAreaId?.let { growAreaRepository.findById(it).orElse(null) }

        return PlannedCropDTO(
            id = id,
            seasonPlanId = seasonPlanId,
            plantId = plantId,
            plantName = plantName,
            quantity = quantity,
            preferredGrowAreaId = preferredGrowAreaId,
            preferredGrowAreaName = growArea?.name,
            status = status,
            indoorStartDate = indoorStartDate,
            indoorStartMethod = indoorStartMethod,
            transplantDate = transplantDate,
            directSowDate = directSowDate,
            expectedHarvestDate = expectedHarvestDate,
            phase = phase,
            notes = notes,
            cropRecordId = cropRecordId
        )
    }
}
