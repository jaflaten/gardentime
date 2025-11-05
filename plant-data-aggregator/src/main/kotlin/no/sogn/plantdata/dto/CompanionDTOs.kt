package no.sogn.plantdata.dto

import java.util.UUID

/**
 * Companion plant information
 */
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

/**
 * Grouped companions by relationship type
 */
data class CompanionListDTO(
    val plant: PlantBasicDTO,
    val companions: CompanionsByRelationshipDTO,
    val summary: CompanionCountDTO
)

/**
 * Companions grouped by beneficial, antagonistic, neutral
 */
data class CompanionsByRelationshipDTO(
    val beneficial: List<CompanionDTO>,
    val antagonistic: List<CompanionDTO>,
    val neutral: List<CompanionDTO>
)

/**
 * Basic plant info for companion responses
 */
data class PlantBasicDTO(
    val id: UUID,
    val name: String,
    val scientificName: String
)

/**
 * Compatibility check request
 */
data class CompatibilityCheckRequest(
    val plantNames: List<String>  // Can be common names or scientific names
)

/**
 * Compatibility check response
 */
data class CompatibilityCheckResponse(
    val compatible: Boolean,
    val relationships: List<PlantRelationshipDTO>,
    val warnings: List<CompatibilityWarningDTO>,
    val suggestions: List<String>
)

/**
 * Relationship between two plants
 */
data class PlantRelationshipDTO(
    val plant1: String,
    val plant2: String,
    val relationship: String,
    val reason: String?,
    val mechanism: String?,
    val confidenceLevel: String,
    val severity: String? = null
)

/**
 * Compatibility warning
 */
data class CompatibilityWarningDTO(
    val severity: String,
    val message: String
)
