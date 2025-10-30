package no.sogn.gardentime.model

import java.time.LocalDate
import java.util.UUID

/**
 * Garden Dashboard - Aggregated data for garden overview
 */
data class GardenDashboardDTO(
    val summary: GardenSummary,
    val activeCrops: ActiveCropsWidget,
    val recentHarvests: List<RecentHarvestItem>,
    val upcomingTasks: List<UpcomingTask>,
    val capacity: GardenCapacityWidget,
    val plantingCalendar: PlantingCalendarWidget
)

data class GardenSummary(
    val gardenName: String,
    val totalGrowAreas: Int,
    val activeGrowAreas: Int,
    val inactiveGrowAreas: Int,
    val totalAreaCm2: Double?,
    val lastActivityDate: String?
)

data class ActiveCropsWidget(
    val total: Int,
    val planted: Int,
    val growing: Int,
    val readyToHarvest: Int
)

data class RecentHarvestItem(
    val id: UUID,
    val plantName: String,
    val harvestDate: String,
    val quantity: Double?,
    val unit: String?,
    val outcome: String?
)

data class UpcomingTask(
    val type: TaskType,
    val cropId: UUID?,
    val plantName: String?,
    val growAreaName: String?,
    val expectedDate: String?,
    val daysOverdue: Int?,
    val reason: String?
)

enum class TaskType {
    HARVEST_READY,
    HARVEST_SOON,
    ATTENTION_NEEDED,
    EMPTY_AREA
}

data class GardenCapacityWidget(
    val totalGrowAreas: Int,
    val inUseGrowAreas: Int,
    val utilizationPercent: Double,
    val emptyGrowAreas: List<String>,
    val crowdedGrowAreas: List<String>
)

data class PlantingCalendarWidget(
    val month: String,
    val events: List<CalendarEvent>
)

data class CalendarEvent(
    val date: String,
    val type: CalendarEventType,
    val plantName: String,
    val count: Int
)

enum class CalendarEventType {
    PLANTED,
    EXPECTED_HARVEST,
    ACTUAL_HARVEST
}
