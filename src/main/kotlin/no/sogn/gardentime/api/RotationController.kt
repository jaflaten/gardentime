package no.sogn.gardentime.api

import no.sogn.gardentime.rotation.RotationRecommendationService
import no.sogn.gardentime.rotation.RotationScoringService
import no.sogn.gardentime.rotation.dto.*
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.util.UUID

/**
 * REST API endpoints for crop rotation planning.
 * 
 * Provides endpoints for:
 * - Validating proposed plantings
 * - Getting plant recommendations
 * - Analyzing rotation history
 */
@RestController
@RequestMapping("/api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation")
class RotationController(
    private val rotationScoringService: RotationScoringService,
    private val rotationRecommendationService: RotationRecommendationService
) {
    
    private val logger = LoggerFactory.getLogger(RotationController::class.java)
    
    /**
     * POST /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/validate
     * 
     * Validate a proposed planting for crop rotation compatibility.
     * 
     * Example request:
     * ```json
     * {
     *   "plantName": "Tomato",
     *   "plantingDate": "2025-05-15"
     * }
     * ```
     * 
     * Example response:
     * ```json
     * {
     *   "totalScore": 85,
     *   "grade": "EXCELLENT",
     *   "recommendation": "Excellent choice! This rotation follows best practices.",
     *   "components": {
     *     "familyRotation": 35,
     *     "nutrientBalance": 25,
     *     "diseaseRisk": 20,
     *     "rootDepthDiversity": 10,
     *     "companionCompatibility": 5
     *   },
     *   "issues": [],
     *   "benefits": [
     *     {
     *       "category": "Nutrient Balance",
     *       "message": "Nitrogen fixer after heavy feeder",
     *       "impact": "Will restore soil nitrogen"
     *     }
     *   ]
     * }
     * ```
     */
    @PostMapping("/validate")
    fun validateRotation(
        @PathVariable gardenId: UUID,
        @PathVariable growAreaId: Long,
        @RequestBody request: ValidateRotationRequest
    ): ResponseEntity<RotationScore> {
        
        logger.info("Validating rotation: {} in grow area {} (garden {})", 
            request.plantName, growAreaId, gardenId)
        
        val score = rotationScoringService.scoreRotation(
            growAreaId = growAreaId,
            plantName = request.plantName,
            plantingDate = request.plantingDate
        )
        
        logger.info("Rotation score for {}: {} ({})", 
            request.plantName, score.totalScore, score.grade)
        
        return ResponseEntity.ok(score)
    }
    
    /**
     * GET /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/recommendations
     * 
     * Get recommended plants for this grow area based on rotation analysis.
     * 
     * Query parameters:
     * - season: Optional season filter (SPRING, SUMMER, FALL, WINTER)
     * - maxResults: Maximum recommendations (default: 10)
     * - minScore: Minimum rotation score 0-100 (default: 60)
     * - grouped: Include grouped recommendations (default: false)
     * 
     * Example response:
     * ```json
     * {
     *   "growAreaId": 1,
     *   "recommendations": [
     *     {
     *       "plantName": "Pea",
     *       "family": "Fabaceae",
     *       "rotationScore": {
     *         "totalScore": 95,
     *         "grade": "EXCELLENT"
     *       },
     *       "suitabilityReason": "Proper family rotation, excellent nutrient balance",
     *       "primaryBenefits": [
     *         "Will restore nitrogen to soil",
     *         "Good root depth diversity"
     *       ],
     *       "warningFlags": []
     *     }
     *   ],
     *   "totalEvaluated": 250,
     *   "totalSuitable": 45
     * }
     * ```
     */
    @GetMapping("/recommendations")
    fun getRecommendations(
        @PathVariable gardenId: UUID,
        @PathVariable growAreaId: Long,
        @RequestParam(required = false) season: String?,
        @RequestParam(defaultValue = "10") maxResults: Int,
        @RequestParam(defaultValue = "60") minScore: Int,
        @RequestParam(defaultValue = "false") grouped: Boolean
    ): ResponseEntity<RecommendationResponse> {
        
        logger.info("=== ROTATION RECOMMENDATION REQUEST ===")
        logger.info("Getting recommendations for grow area {} (garden {}, season: {}, max: {}, grouped: {})",
            growAreaId, gardenId, season, maxResults, grouped)
        
        return try {
            val recommendations = rotationRecommendationService.getRecommendations(
                growAreaId = growAreaId,
                season = season,
                maxResults = maxResults,
                minScore = minScore
            )
            
            val response = if (grouped) {
                // Include grouped recommendations
                val soilBuilders = rotationRecommendationService.getSoilImprovingRecommendations(
                    growAreaId = growAreaId,
                    maxResults = 5
                )
                
                val byFamily = rotationRecommendationService.getRecommendationsByFamily(
                    growAreaId = growAreaId,
                    familiesPerGroup = 5,
                    plantsPerFamily = 3
                )
                
                val toAvoid = rotationRecommendationService.getPlantsToAvoid(
                    growAreaId = growAreaId,
                    maxResults = 5
                )
                
                RecommendationResponse(
                    growAreaId = growAreaId,
                    recommendations = recommendations,
                    totalEvaluated = 500,  // Approximate
                    totalSuitable = recommendations.size,
                    grouped = GroupedRecommendations(
                        topPicks = recommendations.take(5),
                        soilBuilders = soilBuilders,
                        byFamily = byFamily,
                        toAvoid = toAvoid
                    )
                )
            } else {
                RecommendationResponse(
                    growAreaId = growAreaId,
                    recommendations = recommendations,
                    totalEvaluated = 500,
                    totalSuitable = recommendations.size
                )
            }
            
            logger.info("=== ROTATION RECOMMENDATION RESPONSE ===")
            logger.info("Returning {} recommendations for grow area {}", 
                recommendations.size, growAreaId)
            
            ResponseEntity.ok(response)
        } catch (e: Exception) {
            logger.error("=== ROTATION RECOMMENDATION ERROR ===", e)
            logger.error("Error getting recommendations for grow area {}: {}", growAreaId, e.message)
            throw e
        }
    }
    
    /**
     * GET /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/recommendations/soil-improvement
     * 
     * Get recommendations specifically for soil improvement.
     * Prioritizes nitrogen fixers and soil-building crops.
     * 
     * Example response:
     * ```json
     * [
     *   {
     *     "plantName": "Pea",
     *     "family": "Fabaceae",
     *     "suitabilityReason": "Nitrogen fixer - excellent for soil restoration",
     *     "primaryBenefits": [
     *       "Fixes atmospheric nitrogen",
     *       "Improves soil structure"
     *     ]
     *   }
     * ]
     * ```
     */
    @GetMapping("/recommendations/soil-improvement")
    fun getSoilImprovingRecommendations(
        @PathVariable gardenId: UUID,
        @PathVariable growAreaId: Long,
        @RequestParam(defaultValue = "10") maxResults: Int
    ): ResponseEntity<List<PlantRecommendation>> {
        
        logger.info("Getting soil-improving recommendations for grow area {}", growAreaId)
        
        val recommendations = rotationRecommendationService.getSoilImprovingRecommendations(
            growAreaId = growAreaId,
            maxResults = maxResults
        )
        
        return ResponseEntity.ok(recommendations)
    }
    
    /**
     * GET /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/recommendations/by-family
     * 
     * Get recommendations grouped by plant family.
     * Useful for showing diversity of options.
     * 
     * Query parameters:
     * - families: Number of families to include (default: 5)
     * - perFamily: Plants per family (default: 3)
     * 
     * Example response:
     * ```json
     * {
     *   "Fabaceae": [
     *     { "plantName": "Pea", "rotationScore": { "totalScore": 95 } },
     *     { "plantName": "Bean", "rotationScore": { "totalScore": 92 } }
     *   ],
     *   "Brassicaceae": [
     *     { "plantName": "Kale", "rotationScore": { "totalScore": 88 } }
     *   ]
     * }
     * ```
     */
    @GetMapping("/recommendations/by-family")
    fun getRecommendationsByFamily(
        @PathVariable gardenId: UUID,
        @PathVariable growAreaId: Long,
        @RequestParam(defaultValue = "5") families: Int,
        @RequestParam(defaultValue = "3") perFamily: Int
    ): ResponseEntity<Map<String, List<PlantRecommendation>>> {
        
        logger.info("Getting family-grouped recommendations for grow area {}", growAreaId)
        
        val recommendations = rotationRecommendationService.getRecommendationsByFamily(
            growAreaId = growAreaId,
            familiesPerGroup = families,
            plantsPerFamily = perFamily
        )
        
        return ResponseEntity.ok(recommendations)
    }
    
    /**
     * GET /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/companions
     * 
     * Get companion planting recommendations for an existing plant.
     * 
     * Query parameters:
     * - plant: Name of the existing plant
     * - maxResults: Maximum recommendations (default: 10)
     * 
     * Example: GET .../companions?plant=Tomato
     * 
     * Example response:
     * ```json
     * [
     *   {
     *     "plantName": "Basil",
     *     "family": "Lamiaceae",
     *     "suitabilityReason": "Beneficial companion, proper family rotation",
     *     "primaryBenefits": [
     *       "Repels aphids and hornworms",
     *       "Improves tomato flavor"
     *     ]
     *   }
     * ]
     * ```
     */
    @GetMapping("/companions")
    fun getCompanionRecommendations(
        @PathVariable gardenId: UUID,
        @PathVariable growAreaId: Long,
        @RequestParam plant: String,
        @RequestParam(defaultValue = "10") maxResults: Int
    ): ResponseEntity<List<PlantRecommendation>> {
        
        logger.info("Getting companion recommendations for {} in grow area {}", 
            plant, growAreaId)
        
        val recommendations = rotationRecommendationService.getCompanionRecommendations(
            growAreaId = growAreaId,
            existingPlantName = plant,
            maxResults = maxResults
        )
        
        return ResponseEntity.ok(recommendations)
    }
    
    /**
     * GET /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/avoid
     * 
     * Get plants to AVOID in this grow area due to rotation concerns.
     * 
     * Useful for educational purposes - shows what NOT to plant and why.
     * 
     * Example response:
     * ```json
     * [
     *   {
     *     "plantName": "Tomato",
     *     "family": "Solanaceae",
     *     "rotationScore": {
     *       "totalScore": 25,
     *       "grade": "AVOID"
     *     },
     *     "suitabilityReason": "Not recommended for this location",
     *     "warningFlags": [
     *       "CRITICAL: Solanaceae planted in same location within 1 year",
     *       "WARNING: Disease risk - blight detected 0.5 years ago"
     *     ]
     *   }
     * ]
     * ```
     */
    @GetMapping("/avoid")
    fun getPlantsToAvoid(
        @PathVariable gardenId: UUID,
        @PathVariable growAreaId: Long,
        @RequestParam(defaultValue = "10") maxResults: Int
    ): ResponseEntity<List<PlantRecommendation>> {
        
        logger.info("Getting plants to avoid for grow area {}", growAreaId)
        
        val plantsToAvoid = rotationRecommendationService.getPlantsToAvoid(
            growAreaId = growAreaId,
            maxResults = maxResults
        )
        
        return ResponseEntity.ok(plantsToAvoid)
    }
}

/**
 * Request DTO for rotation validation
 */
data class ValidateRotationRequest(
    /** Name of the plant to validate */
    val plantName: String,
    
    /** Proposed planting date (defaults to today) */
    val plantingDate: LocalDate = LocalDate.now()
)
