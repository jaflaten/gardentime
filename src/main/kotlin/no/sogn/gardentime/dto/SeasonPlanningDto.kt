package no.sogn.gardentime.dto

import java.time.LocalDate
import java.util.UUID

data class GardenClimateInfoDTO(
    val gardenId: UUID,
    val lastFrostDate: LocalDate?,
    val firstFrostDate: LocalDate?,
    val hardinessZone: String?,
    val latitude: Double?,
    val longitude: Double?
)

data class CreateGardenClimateInfoDTO(
    val lastFrostDate: LocalDate?,
    val firstFrostDate: LocalDate?,
    val hardinessZone: String?,
    val latitude: Double?,
    val longitude: Double?
)

data class SeasonPlanDTO(
    val id: UUID,
    val gardenId: UUID,
    val userId: UUID,
    val season: String,
    val year: Int
)

data class CreateSeasonPlanDTO(
    val season: String,
    val year: Int
)

data class PlannedCropDTO(
    val id: UUID,
    val seasonPlanId: UUID,
    val plantId: Long,
    val plantName: String?,
    val quantity: Int,
    val preferredGrowAreaId: Long?,
    val preferredGrowAreaName: String?,
    val status: String,
    val indoorStartDate: LocalDate?,
    val indoorStartMethod: String?,
    val transplantDate: LocalDate?,
    val directSowDate: LocalDate?,
    val expectedHarvestDate: LocalDate?,
    val phase: String?,
    val notes: String?,
    val cropRecordId: UUID?
)

data class CreatePlannedCropDTO(
    val plantId: Long,
    val quantity: Int = 1,
    val preferredGrowAreaId: Long?,
    val phase: String?,
    val notes: String?
)

data class UpdatePlannedCropDTO(
    val status: String?,
    val quantity: Int?,
    val preferredGrowAreaId: Long?,
    val indoorStartDate: LocalDate?,
    val transplantDate: LocalDate?,
    val directSowDate: LocalDate?,
    val expectedHarvestDate: LocalDate?,
    val phase: String?,
    val notes: String?
)

data class CalendarEventDTO(
    val id: UUID,
    val date: LocalDate,
    val type: String,  // INDOOR_START, TRANSPLANT, DIRECT_SOW, EXPECTED_HARVEST, ACTUAL_HARVEST, ACTUAL_PLANTING
    val plantName: String,
    val plantId: Long,
    val plannedCropId: UUID?,
    val cropRecordId: UUID?,
    val growAreaName: String?,
    val quantity: Int?,
    val status: String?
)

data class CalendarResponseDTO(
    val events: List<CalendarEventDTO>
)

data class PlantDetailsDTO(
    val plantId: Long,
    val weeksBeforeFrostIndoor: Int?,
    val canDirectSow: Boolean,
    val canTransplant: Boolean,
    val frostTolerance: String?,
    val indoorStartMethod: String?,
    val transplantGuidance: String?
)
