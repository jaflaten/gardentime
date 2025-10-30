package no.sogn.plantdata.dto

import com.fasterxml.jackson.annotation.JsonProperty

/**
 * DTO for parsed plant attributes from LLM
 * This is the structure returned by the LLM when parsing scraped data
 */
data class ParsedPlantAttributesDto(
    val commonName: String,
    val cycle: String,  // ANNUAL, PERENNIAL, BIENNIAL
    val sunNeeds: String,  // FULL_SUN, PART_SHADE, SHADE
    val waterNeeds: String,  // LOW, MODERATE, HIGH, FREQUENT
    val rootDepth: String,  // SHALLOW, MEDIUM, DEEP
    val growthHabit: String,  // BUSH, VINE, CLIMBER, ROOT, LEAF, FRUITING
    val soilTempMinF: Int?,
    val soilTempOptimalF: Int?,
    val frostTolerant: Boolean,
    val spacingMin: Int?,
    val spacingMax: Int?,
    val plantingDepthInches: Double?,
    val containerSuitable: Boolean,
    val requiresStaking: Boolean,
    val requiresPruning: Boolean,
    val edibleParts: List<String>,
    val daysToMaturityMin: Int?,
    val daysToMaturityMax: Int?,
    val wateringInchesPerWeek: Int?,
    val fertilizingFrequencyWeeks: Int?,
    val mulchRecommended: Boolean,
    val notes: String?
)

/**
 * Request DTO for importing plant attributes
 */
data class ImportPlantAttributesRequest(
    val attributes: ParsedPlantAttributesDto,
    val scientificName: String? = null,  // Optional - will fetch from Trefle if not provided
    val source: String = "Almanac.com"
)

/**
 * Request for bulk import
 */
data class BulkImportRequest(
    val directory: String
)

/**
 * Response DTO for import operations
 */
data class ImportResponse(
    val success: Boolean,
    val plantId: String?,
    val commonName: String,
    val message: String,
    val warnings: List<String> = emptyList()
)

/**
 * Response for bulk import
 */
data class BulkImportResponse(
    val totalProcessed: Int,
    val successful: Int,
    val failed: Int,
    val results: List<ImportResponse>
)
