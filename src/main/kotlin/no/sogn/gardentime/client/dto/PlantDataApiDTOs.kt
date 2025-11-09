package no.sogn.gardentime.client.dto

import java.util.UUID

/**
 * DTOs mirrored from plant-data-aggregator API
 * These match the response structures from plant-data-aggregator
 */

// ============ Plant Information DTOs ============

data class PlantSummaryDTO(
    val id: UUID,
    val name: String,
    val scientificName: String,
    val family: String?,
    val genus: String?,
    val cycle: String?,
    val sunNeeds: String?,
    val waterNeeds: String?,
    val rootDepth: String,
    val growthHabit: String?,
    val feederType: String?,
    val isNitrogenFixer: Boolean,
    val edibleParts: List<String>,
    val maturityDaysMin: Int?,
    val maturityDaysMax: Int?
)

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
    val pestCount: Int,
    val diseaseCount: Int,
    val synonyms: List<String>
)

data class GrowthRequirementsDTO(
    val sunNeeds: String?,
    val waterNeeds: String?,
    val phMin: Double?,
    val phMax: Double?,
    val droughtTolerant: Boolean?
)

data class PlantingDetailsDTO(
    val rootDepth: String,
    val growthHabit: String?,
    val daysToMaturityMin: Int?,
    val daysToMaturityMax: Int?,
    val successionIntervalDays: Int?,
    val edibleParts: List<String>
)

data class RotationDataDTO(
    val feederType: String?,
    val isNitrogenFixer: Boolean,
    val primaryNutrientContribution: String?
)

data class CompanionCountDTO(
    val beneficial: Int,
    val antagonistic: Int,
    val neutral: Int
)

data class PlantListResponseDTO(
    val plants: List<PlantSummaryDTO>,
    val pagination: PaginationDTO
)

data class PaginationDTO(
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int
)

// ============ Family DTOs ============

data class FamiliesResponseDTO(
    val families: List<FamilySummaryDTO>
)

data class FamilySummaryDTO(
    val name: String,
    val plantCount: Int,
    val examplePlants: List<String>
)

data class FamilyWithPlantsDTO(
    val familyName: String,
    val plantCount: Int,
    val plants: List<PlantSummaryDTO>
)

// ============ Companion Planting DTOs ============

data class CompanionListDTO(
    val plant: PlantBasicDTO,
    val companions: CompanionsByRelationshipDTO,
    val summary: CompanionCountDTO
)

data class PlantBasicDTO(
    val id: UUID,
    val name: String,
    val scientificName: String
)

data class CompanionsByRelationshipDTO(
    val beneficial: List<CompanionDTO>,
    val antagonistic: List<CompanionDTO>,
    val neutral: List<CompanionDTO>
)

data class CompanionDTO(
    val id: UUID,
    val name: String,
    val scientificName: String,
    val relationship: String,
    val reason: String?,
    val mechanism: String?,
    val confidenceLevel: String,
    val evidenceType: String
)

// ============ Pest & Disease DTOs ============

data class SoilBorneDiseasesResponseDTO(
    val diseases: List<SoilBorneDiseaseDTO>
)

data class SoilBorneDiseaseDTO(
    val disease: DiseaseDTO,
    val affectedFamilies: List<String>,
    val affectedPlantCount: Int
)

data class DiseaseDTO(
    val id: UUID,
    val name: String,
    val scientificName: String?,
    val description: String?,
    val treatmentOptions: String?,
    val severity: String,
    val isSoilBorne: Boolean,
    val persistenceYears: Int?
)

data class PlantPestsResponseDTO(
    val plantName: String,
    val totalPests: Int,
    val pests: List<PlantPestDTO>
)

data class PlantPestDTO(
    val pest: PestDTO,
    val susceptibility: String,
    val notes: String?,
    val preventionTips: String?
)

data class PestDTO(
    val id: UUID,
    val name: String,
    val scientificName: String?,
    val description: String?,
    val treatmentOptions: String?,
    val severity: String
)

data class PlantDiseasesResponseDTO(
    val plantName: String,
    val totalDiseases: Int,
    val diseases: List<PlantDiseaseDTO>
)

data class PlantDiseaseDTO(
    val disease: DiseaseDTO,
    val susceptibility: String,
    val notes: String?,
    val preventionTips: String?
)

// ============ Bulk Plant DTOs ============

data class BulkPlantRequest(
    val plantNames: List<String>
)

data class BulkPlantResponseDTO(
    val plants: List<PlantDetailDTO>,
    val notFound: List<String>
)

// ============ Compatibility Check DTOs ============

data class CompatibilityCheckRequest(
    val plantNames: List<String>
)

data class CompatibilityCheckResponse(
    val compatible: Boolean,
    val relationships: List<PlantRelationshipDTO>,
    val warnings: List<CompatibilityWarningDTO>,
    val suggestions: List<String>
)

data class PlantRelationshipDTO(
    val plant1: String,
    val plant2: String,
    val relationship: String,
    val reason: String?,
    val mechanism: String?,
    val confidenceLevel: String
)

data class CompatibilityWarningDTO(
    val severity: String,
    val message: String
)
