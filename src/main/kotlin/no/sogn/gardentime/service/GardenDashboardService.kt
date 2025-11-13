package no.sogn.gardentime.service

import no.sogn.gardentime.db.CropRecordRepository
import no.sogn.gardentime.db.GardenRepository
import no.sogn.gardentime.db.GrowAreaRepository
import no.sogn.gardentime.model.*
import no.sogn.gardentime.security.SecurityUtils
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.UUID

@Service
class GardenDashboardService(
    private val gardenRepository: GardenRepository,
    private val growAreaRepository: GrowAreaRepository,
    private val cropRecordRepository: CropRecordRepository,
    private val securityUtils: SecurityUtils
) {

    fun getDashboardData(gardenId: UUID): GardenDashboardDTO {
        val currentUserId = securityUtils.getCurrentUserId()
        
        // Security check
        val garden = gardenRepository.findById(gardenId).orElseThrow {
            IllegalArgumentException("Garden not found")
        }
        
        if (garden.userId != currentUserId) {
            throw IllegalAccessException("You don't have permission to access this garden")
        }

        // Fetch all grow areas for this garden
        val growAreas = growAreaRepository.findAllByGardenId(gardenId)
        
        // Fetch all crop records for this garden
        val allCropRecords = growAreas.flatMap { growArea ->
            cropRecordRepository.findAllByGrowZoneId(growArea.id ?: 0L)
        }

        // Build dashboard sections
        val summary = buildGardenSummary(garden, growAreas, allCropRecords)
        val activeCrops = buildActiveCropsWidget(allCropRecords)
        val recentHarvests = buildRecentHarvests(allCropRecords)
        val upcomingTasks = buildUpcomingTasks(allCropRecords, growAreas)
        val capacity = buildCapacityWidget(growAreas, allCropRecords)
        val plantingCalendar = buildPlantingCalendarWidget(allCropRecords)

        return GardenDashboardDTO(
            summary = summary,
            activeCrops = activeCrops,
            recentHarvests = recentHarvests,
            upcomingTasks = upcomingTasks,
            capacity = capacity,
            plantingCalendar = plantingCalendar
        )
    }

    private fun buildGardenSummary(
        garden: GardenEntity,
        growAreas: List<GrowAreaEntity>,
        cropRecords: List<CropRecordEntity>
    ): GardenSummary {
        val activeGrowAreaIds = cropRecords
            .filter { it.status in listOf(CropStatus.PLANTED, CropStatus.GROWING) }
            .map { it.growZoneId }
            .toSet()

        val totalAreaCm2 = growAreas
            .mapNotNull { area ->
                val width = area.width ?: return@mapNotNull null
                val length = area.length ?: return@mapNotNull null
                width * length
            }
            .sum()

        val lastActivityDate = cropRecords
            .mapNotNull { it.harvestDate ?: it.plantingDate }
            .maxOrNull()

        return GardenSummary(
            gardenName = garden.name,
            totalGrowAreas = growAreas.size,
            activeGrowAreas = activeGrowAreaIds.size,
            inactiveGrowAreas = growAreas.size - activeGrowAreaIds.size,
            totalAreaCm2 = if (totalAreaCm2 > 0) totalAreaCm2 else null,
            lastActivityDate = lastActivityDate?.toString()
        )
    }

    private fun buildActiveCropsWidget(cropRecords: List<CropRecordEntity>): ActiveCropsWidget {
        val activeCrops = cropRecords.filter { 
            it.status in listOf(CropStatus.PLANTED, CropStatus.GROWING) 
        }

        val planted = activeCrops.count { it.status == CropStatus.PLANTED }
        val growing = activeCrops.count { it.status == CropStatus.GROWING }
        
        // Count crops ready to harvest soon (estimate based on planting date + typical growing period)
        // For now, we'll use a simple heuristic: crops planted more than 60 days ago
        val today = LocalDate.now()
        val readyToHarvest = activeCrops.count { crop ->
            val daysSincePlanting = ChronoUnit.DAYS.between(crop.plantingDate, today)
            daysSincePlanting >= 60 // Simple heuristic
        }

        return ActiveCropsWidget(
            total = activeCrops.size,
            planted = planted,
            growing = growing,
            readyToHarvest = readyToHarvest
        )
    }

    private fun buildRecentHarvests(cropRecords: List<CropRecordEntity>): List<RecentHarvestItem> {
        return cropRecords
            .filter { it.status == CropStatus.HARVESTED && it.harvestDate != null }
            .sortedByDescending { it.harvestDate }
            .take(5)
            .map { crop ->
                RecentHarvestItem(
                    id = crop.id ?: UUID.randomUUID(),
                    plantName = crop.plantName,
                    harvestDate = crop.harvestDate!!.toString(),
                    quantity = null, // TODO: Add quantity field to CropRecord
                    unit = null,
                    outcome = crop.outcome
                )
            }
    }

    private fun buildUpcomingTasks(
        cropRecords: List<CropRecordEntity>,
        growAreas: List<GrowAreaEntity>
    ): List<UpcomingTask> {
        val tasks = mutableListOf<UpcomingTask>()
        val today = LocalDate.now()

        // Task 1: Crops needing attention (diseased or failed)
        cropRecords
            .filter { it.status in listOf(CropStatus.DISEASED, CropStatus.FAILED) }
            .forEach { crop ->
                val growArea = growAreas.find { it.id == crop.growZoneId }
                tasks.add(
                    UpcomingTask(
                        type = TaskType.ATTENTION_NEEDED,
                        cropId = crop.id,
                        plantName = crop.plantName,
                        growAreaName = growArea?.name,
                        expectedDate = null,
                        daysOverdue = null,
                        reason = crop.status?.name
                    )
                )
            }

        // Task 2: Crops potentially ready to harvest (simple heuristic based on planting date)
        cropRecords
            .filter { it.status in listOf(CropStatus.PLANTED, CropStatus.GROWING) }
            .forEach { crop ->
                val daysSincePlanting = ChronoUnit.DAYS.between(crop.plantingDate, today)
                if (daysSincePlanting >= 60) { // Simple threshold
                    val growArea = growAreas.find { it.id == crop.growZoneId }
                    tasks.add(
                        UpcomingTask(
                            type = TaskType.HARVEST_READY,
                            cropId = crop.id,
                            plantName = crop.plantName,
                            growAreaName = growArea?.name,
                            expectedDate = today.toString(),
                            daysOverdue = 0,
                            reason = null
                        )
                    )
                } else if (daysSincePlanting >= 50) { // Harvest soon
                    val growArea = growAreas.find { it.id == crop.growZoneId }
                    tasks.add(
                        UpcomingTask(
                            type = TaskType.HARVEST_SOON,
                            cropId = crop.id,
                            plantName = crop.plantName,
                            growAreaName = growArea?.name,
                            expectedDate = crop.plantingDate.plusDays(60).toString(),
                            daysOverdue = null,
                            reason = null
                        )
                    )
                }
            }

        // Task 3: Empty grow areas
        val activeGrowAreaIds = cropRecords
            .filter { it.status in listOf(CropStatus.PLANTED, CropStatus.GROWING) }
            .map { it.growZoneId }
            .toSet()

        growAreas
            .filter { it.id !in activeGrowAreaIds }
            .forEach { growArea ->
                tasks.add(
                    UpcomingTask(
                        type = TaskType.EMPTY_AREA,
                        cropId = null,
                        plantName = null,
                        growAreaName = growArea.name,
                        expectedDate = null,
                        daysOverdue = null,
                        reason = "Ready for planting"
                    )
                )
            }

        // Sort tasks by priority: ATTENTION_NEEDED > HARVEST_READY > HARVEST_SOON > EMPTY_AREA
        return tasks.sortedBy { task ->
            when (task.type) {
                TaskType.ATTENTION_NEEDED -> 1
                TaskType.HARVEST_READY -> 2
                TaskType.HARVEST_SOON -> 3
                TaskType.EMPTY_AREA -> 4
            }
        }
    }

    private fun buildCapacityWidget(
        growAreas: List<GrowAreaEntity>,
        cropRecords: List<CropRecordEntity>
    ): GardenCapacityWidget {
        val activeGrowAreaIds = cropRecords
            .filter { it.status in listOf(CropStatus.PLANTED, CropStatus.GROWING) }
            .map { it.growZoneId }
            .toSet()

        val inUseCount = activeGrowAreaIds.size
        val utilizationPercent = if (growAreas.isNotEmpty()) {
            (inUseCount.toDouble() / growAreas.size) * 100
        } else {
            0.0
        }

        val emptyGrowAreas = growAreas
            .filter { it.id !in activeGrowAreaIds }
            .map { it.name }

        // Crowded areas: more than 3 active crops
        val cropsPerArea = cropRecords
            .filter { it.status in listOf(CropStatus.PLANTED, CropStatus.GROWING) }
            .groupBy { it.growZoneId }

        val crowdedGrowAreas = growAreas
            .filter { (cropsPerArea[it.id]?.size ?: 0) > 3 }
            .map { it.name }

        return GardenCapacityWidget(
            totalGrowAreas = growAreas.size,
            inUseGrowAreas = inUseCount,
            utilizationPercent = utilizationPercent,
            emptyGrowAreas = emptyGrowAreas,
            crowdedGrowAreas = crowdedGrowAreas
        )
    }

    private fun buildPlantingCalendarWidget(cropRecords: List<CropRecordEntity>): PlantingCalendarWidget {
        val currentMonth = YearMonth.now()
        val events = mutableListOf<CalendarEvent>()

        // Group crops planted this month
        val plantedThisMonth = cropRecords
            .filter { 
                YearMonth.from(it.plantingDate) == currentMonth 
            }
            .groupBy { it.plantingDate }

        plantedThisMonth.forEach { (date, crops) ->
            events.add(
                CalendarEvent(
                    date = date.toString(),
                    type = CalendarEventType.PLANTED,
                    plantName = crops.first().plantName,
                    count = crops.size
                )
            )
        }

        // Group crops harvested this month
        val harvestedThisMonth = cropRecords
            .filter { 
                it.harvestDate != null && YearMonth.from(it.harvestDate) == currentMonth 
            }
            .groupBy { it.harvestDate }

        harvestedThisMonth.forEach { (date, crops) ->
            if (date != null) {
                events.add(
                    CalendarEvent(
                        date = date.toString(),
                        type = CalendarEventType.ACTUAL_HARVEST,
                        plantName = crops.first().plantName,
                        count = crops.size
                    )
                )
            }
        }

        return PlantingCalendarWidget(
            month = currentMonth.format(DateTimeFormatter.ofPattern("yyyy-MM")),
            events = events.sortedBy { it.date }
        )
    }
}
