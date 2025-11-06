package no.sogn.gardentime.rotation.dto

import java.util.UUID

/**
 * Represents a plant recommendation for a grow area.
 * 
 * Contains the plant details, rotation score, and human-readable
 * explanations of why this plant is recommended.
 */
data class PlantRecommendation(
    /** Unique identifier of the plant */
    val plantId: UUID,
    
    /** Common name of the plant */
    val plantName: String,
    
    /** Scientific name (Latin) */
    val scientificName: String?,
    
    /** Plant family (e.g., "Solanaceae") */
    val family: String,
    
    /** Complete rotation score with all components */
    val rotationScore: RotationScore,
    
    /** Short human-readable explanation of suitability */
    val suitabilityReason: String,
    
    /** Top 3 benefits of planting this (from rotation score benefits) */
    val primaryBenefits: List<String> = emptyList(),
    
    /** Warning flags if any (from rotation score issues) */
    val warningFlags: List<String> = emptyList()
) {
    /**
     * Quick summary for display
     */
    val summary: String
        get() = "$plantName (${rotationScore.grade}): $suitabilityReason"
    
    /**
     * Is this an excellent choice?
     */
    val isExcellent: Boolean
        get() = rotationScore.totalScore >= 85
    
    /**
     * Is this a good choice?
     */
    val isGood: Boolean
        get() = rotationScore.totalScore >= 70
    
    /**
     * Has any warnings?
     */
    val hasWarnings: Boolean
        get() = warningFlags.isNotEmpty()
}

/**
 * Grouped recommendations by category
 */
data class GroupedRecommendations(
    /** Best overall choices */
    val topPicks: List<PlantRecommendation>,
    
    /** Best for soil improvement */
    val soilBuilders: List<PlantRecommendation>,
    
    /** Grouped by plant family for diversity */
    val byFamily: Map<String, List<PlantRecommendation>>,
    
    /** Plants to avoid in this area */
    val toAvoid: List<PlantRecommendation>
)

/**
 * Recommendation request parameters
 */
data class RecommendationRequest(
    /** The grow area ID */
    val growAreaId: Long,
    
    /** Optional season filter */
    val season: String? = null,
    
    /** Maximum results to return */
    val maxResults: Int = 10,
    
    /** Minimum rotation score (0-100) */
    val minScore: Int = 60,
    
    /** Include soil improvement recommendations */
    val includeSoilBuilders: Boolean = false,
    
    /** Include family grouping */
    val groupByFamily: Boolean = false,
    
    /** Include plants to avoid */
    val includePlantsToAvoid: Boolean = false
)

/**
 * Comprehensive recommendation response
 */
data class RecommendationResponse(
    /** Grow area being analyzed */
    val growAreaId: Long,
    
    /** All recommendations meeting criteria */
    val recommendations: List<PlantRecommendation>,
    
    /** Total plants evaluated */
    val totalEvaluated: Int,
    
    /** Number of plants meeting minimum score */
    val totalSuitable: Int,
    
    /** Optional grouped recommendations */
    val grouped: GroupedRecommendations? = null
)
