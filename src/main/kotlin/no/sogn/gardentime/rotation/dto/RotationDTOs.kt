package no.sogn.gardentime.rotation.dto

/**
 * Complete rotation score with breakdown and recommendations
 */
data class RotationScore(
    val totalScore: Int,  // 0-100
    val grade: String,    // EXCELLENT, GOOD, FAIR, POOR, AVOID
    val recommendation: String,  // Human-readable summary
    val components: ScoreComponents,
    val issues: List<RotationIssue>,
    val benefits: List<RotationBenefit>
)

/**
 * Breakdown of score components
 */
data class ScoreComponents(
    val familyRotation: ScoreComponent,
    val nutrientBalance: ScoreComponent,
    val diseaseRisk: ScoreComponent,
    val rootDepthDiversity: ScoreComponent,
    val companionCompatibility: ScoreComponent
)

/**
 * Individual score component
 */
data class ScoreComponent(
    val score: Int,
    val maxScore: Int,
    val label: String,
    val description: String
)

/**
 * Rotation issue (warning or critical)
 */
data class RotationIssue(
    val severity: IssueSeverity,
    val category: String,
    val message: String,
    val suggestion: String?
)

enum class IssueSeverity {
    CRITICAL,  // Major problem - strongly recommend not planting
    WARNING,   // Minor concern - proceed with caution
    INFO       // Informational note
}

/**
 * Rotation benefit
 */
data class RotationBenefit(
    val category: String,
    val message: String,
    val impact: String  // Expected positive outcome
)

/**
 * Planting history response
 */
data class PlantingHistoryResponse(
    val growAreaId: Long,
    val yearsBack: Int,
    val records: List<HistoricalCropRecord>,
    val familySummary: Map<String, Int>,  // Family -> count
    val diseaseHistory: List<DiseaseIncident>
)

/**
 * Historical crop record (simplified)
 */
data class HistoricalCropRecord(
    val plantName: String,
    val plantFamily: String?,
    val plantingDate: String,  // ISO date
    val harvestDate: String?,
    val hadDiseases: Boolean,
    val yieldRating: Int?
)

/**
 * Disease incident in history
 */
data class DiseaseIncident(
    val plantName: String,
    val plantFamily: String?,
    val diseaseNames: String,
    val plantingDate: String,
    val yearsAgo: Double
)
