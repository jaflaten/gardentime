package no.sogn.plantdata.dto

import java.math.BigDecimal
import java.util.UUID

/**
 * Plant Summary DTO for list views
 */
data class PlantSummaryDTO(
    val id: UUID,
    val name: String,
    val scientificName: String,
    val family: String?,
    val genus: String?,
    val cycle: String?,
    val sunNeeds: String?,
    val waterNeeds: String?,
    val rootDepth: String?,
    val growthHabit: String?,
    val feederType: String?,
    val isNitrogenFixer: Boolean,
    val edibleParts: List<String>,
    val maturityDaysMin: Int?,
    val maturityDaysMax: Int?
)

/**
 * Plant Detail DTO for single plant views
 */
data class PlantDetailDTO(
    val id: UUID,
    val name: String,
    val scientificName: String,
    val family: String?,
    val genus: String?,
    val cycle: String?,
    val growthRequirements: GrowthRequirementsDTO,
    val plantingDetails: PlantingDetailsDTO,
    val rotationData: RotationDataDTO,
    val companionCount: CompanionCountDTO,
    val synonyms: List<String>
)

/**
 * Growth Requirements
 */
data class GrowthRequirementsDTO(
    val sunNeeds: String?,
    val waterNeeds: String?,
    val phMin: BigDecimal?,
    val phMax: BigDecimal?,
    val droughtTolerant: Boolean?
)

/**
 * Planting Details
 */
data class PlantingDetailsDTO(
    val rootDepth: String?,
    val growthHabit: String?,
    val daysToMaturityMin: Int?,
    val daysToMaturityMax: Int?,
    val successionIntervalDays: Int?,
    val edibleParts: List<String>
)

/**
 * Rotation Data
 */
data class RotationDataDTO(
    val feederType: String?,
    val isNitrogenFixer: Boolean,
    val primaryNutrientContribution: String?
)

/**
 * Companion Count Summary
 */
data class CompanionCountDTO(
    val beneficial: Int,
    val antagonistic: Int,
    val neutral: Int
)

/**
 * Paginated Plant List Response
 */
data class PlantListResponseDTO(
    val plants: List<PlantSummaryDTO>,
    val pagination: PaginationDTO
)

/**
 * Pagination Info
 */
data class PaginationDTO(
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int
)
