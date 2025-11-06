package no.sogn.gardentime.rotation

import no.sogn.gardentime.client.PlantDataApiClient
import no.sogn.gardentime.db.CropRecordRepository
import no.sogn.gardentime.rotation.dto.IssueSeverity
import no.sogn.gardentime.rotation.dto.PlantRecommendation
import no.sogn.gardentime.rotation.dto.RotationScore
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.LocalDate

/**
 * Service for generating plant recommendations based on crop rotation analysis.
 * 
 * This service scores all available plants for a given grow area and returns
 * the top recommendations that follow regenerative farming principles.
 */
@Service
class RotationRecommendationService(
    private val cropRecordRepository: CropRecordRepository,
    private val plantDataApiClient: PlantDataApiClient,
    private val rotationScoringService: RotationScoringService
) {
    
    private val logger = LoggerFactory.getLogger(RotationRecommendationService::class.java)
    
    /**
     * Get plant recommendations for a grow area.
     * 
     * Scores all plants and returns those with score >= 60 (FAIR or better),
     * sorted by total score descending.
     * 
     * @param growAreaId The grow area to analyze
     * @param season Optional season filter (SPRING, SUMMER, FALL, WINTER)
     * @param plantingDate The proposed planting date (defaults to today)
     * @param maxResults Maximum number of recommendations to return
     * @param minScore Minimum rotation score (0-100) to include
     * @return List of plant recommendations sorted by suitability
     */
    fun getRecommendations(
        growAreaId: Long,
        season: String? = null,
        plantingDate: LocalDate = LocalDate.now(),
        maxResults: Int = 10,
        minScore: Int = 60
    ): List<PlantRecommendation> {
        
        logger.info("Generating recommendations for grow area $growAreaId (season: $season, max: $maxResults)")
        
        // 1. Get planting history
        val history = getPlantingHistory(growAreaId)
        logger.debug("Found ${history.size} historical plantings in last 5 years")
        
        // 2. Get all plants from API
        val allPlants = try {
            plantDataApiClient.getPlants(
                page = 0,
                size = 500  // Get comprehensive list
            )
        } catch (e: Exception) {
            logger.error("Failed to fetch plants from API", e)
            return emptyList()
        }
        
        logger.debug("Evaluating ${allPlants.pagination.totalElements} plants")
        
        // 3. Score each plant
        val recommendations = allPlants.plants.mapNotNull { plant ->
            try {
                val score = rotationScoringService.scoreRotation(
                    growAreaId = growAreaId,
                    plantName = plant.name,
                    plantingDate = plantingDate
                )
                
                // Filter by minimum score
                if (score.totalScore >= minScore) {
                    PlantRecommendation(
                        plantId = plant.id,
                        plantName = plant.name,
                        scientificName = plant.scientificName,
                        family = plant.family ?: "Unknown",
                        rotationScore = score,
                        suitabilityReason = generateSuitabilityReason(score),
                        primaryBenefits = extractPrimaryBenefits(score),
                        warningFlags = extractWarningFlags(score)
                    )
                } else {
                    null
                }
            } catch (e: Exception) {
                logger.warn("Failed to score plant ${plant.name}: ${e.message}")
                null  // Skip plants that can't be scored
            }
        }
        
        logger.info("Generated ${recommendations.size} recommendations with score >= $minScore")
        
        // 4. Sort by score and return top results
        return recommendations
            .sortedByDescending { it.rotationScore.totalScore }
            .take(maxResults)
    }
    
    /**
     * Get recommendations grouped by plant family.
     * 
     * Useful for showing diversity of options across families.
     * 
     * @param growAreaId The grow area to analyze
     * @param familiesPerGroup Maximum families to include
     * @param plantsPerFamily Maximum plants per family
     * @return Map of family name to list of recommendations
     */
    fun getRecommendationsByFamily(
        growAreaId: Long,
        plantingDate: LocalDate = LocalDate.now(),
        familiesPerGroup: Int = 5,
        plantsPerFamily: Int = 3
    ): Map<String, List<PlantRecommendation>> {
        
        logger.info("Generating family-grouped recommendations for grow area $growAreaId")
        
        // Get all good recommendations
        val allRecommendations = getRecommendations(
            growAreaId = growAreaId,
            plantingDate = plantingDate,
            maxResults = 100,
            minScore = 70  // Only GOOD or better
        )
        
        // Group by family
        val byFamily = allRecommendations
            .filter { it.family != "Unknown" }  // Filter out unknowns
            .groupBy { it.family }
        
        // Take top families (by best score in each family)
        return byFamily
            .map { (family, plants) ->
                family to plants.sortedByDescending { it.rotationScore.totalScore }
            }
            .sortedByDescending { (_, plants) -> 
                plants.firstOrNull()?.rotationScore?.totalScore ?: 0 
            }
            .take(familiesPerGroup)
            .associate { (family, plants) ->
                family to plants.take(plantsPerFamily)
            }
    }
    
    /**
     * Get recommendations specifically for soil improvement.
     * 
     * Prioritizes nitrogen fixers and soil-building crops.
     * 
     * @param growAreaId The grow area to analyze
     * @param maxResults Maximum recommendations
     * @return List of soil-improving plant recommendations
     */
    fun getSoilImprovingRecommendations(
        growAreaId: Long,
        plantingDate: LocalDate = LocalDate.now(),
        maxResults: Int = 10
    ): List<PlantRecommendation> {
        
        logger.info("Generating soil-improving recommendations for grow area $growAreaId")
        
        val allRecommendations = getRecommendations(
            growAreaId = growAreaId,
            plantingDate = plantingDate,
            maxResults = 100,
            minScore = 60
        )
        
        // Prioritize nitrogen fixers and plants with high nutrient balance scores
        return allRecommendations
            .filter { rec ->
                // Look for nitrogen fixer benefits
                rec.rotationScore.benefits.any { 
                    it.category == "Nutrient Balance" && 
                    it.message.contains("nitrogen", ignoreCase = true)
                } ||
                // Or high nutrient balance score
                rec.rotationScore.components.nutrientBalance.score >= 20
            }
            .sortedByDescending { rec -> rec.rotationScore.components.nutrientBalance.score }
            .take(maxResults)
    }
    
    /**
     * Get companion planting recommendations.
     * 
     * Given a plant that's already growing, suggest beneficial companions.
     * 
     * @param growAreaId The grow area
     * @param existingPlantName The plant already growing
     * @param maxResults Maximum recommendations
     * @return List of compatible companion plants
     */
    fun getCompanionRecommendations(
        growAreaId: Long,
        existingPlantName: String,
        plantingDate: LocalDate = LocalDate.now(),
        maxResults: Int = 10
    ): List<PlantRecommendation> {
        
        logger.info("Generating companion recommendations for $existingPlantName in grow area $growAreaId")
        
        // Get companions from API
        val companions = try {
            plantDataApiClient.getCompanions(existingPlantName)
        } catch (e: Exception) {
            logger.error("Failed to fetch companions for $existingPlantName", e)
            return emptyList()
        }
        
        if (companions == null) {
            logger.warn("No companion data found for $existingPlantName")
            return emptyList()
        }
        
        // Get all recommendations
        val allRecommendations = getRecommendations(
            growAreaId = growAreaId,
            plantingDate = plantingDate,
            maxResults = 100,
            minScore = 60
        )
        
        // Filter to beneficial companions
        val beneficialNames = companions.companions.beneficial.map { it.name.lowercase() }.toSet()
        
        return allRecommendations
            .filter { rec ->
                beneficialNames.contains(rec.plantName.lowercase())
            }
            .sortedByDescending { it.rotationScore.totalScore }
            .take(maxResults)
    }
    
    /**
     * Analyze what NOT to plant in a grow area.
     * 
     * Returns plants that would score poorly due to rotation violations.
     * Useful for educational purposes.
     * 
     * @param growAreaId The grow area to analyze
     * @param maxResults Maximum items to return
     * @return List of plants to avoid with reasons
     */
    fun getPlantsToAvoid(
        growAreaId: Long,
        plantingDate: LocalDate = LocalDate.now(),
        maxResults: Int = 10
    ): List<PlantRecommendation> {
        
        logger.info("Generating 'avoid' list for grow area $growAreaId")
        
        val allPlants = try {
            plantDataApiClient.getPlants(
                page = 0,
                size = 200
            )
        } catch (e: Exception) {
            logger.error("Failed to fetch plants from API", e)
            return emptyList()
        }
        
        // Score all plants and keep only poor scores
        val toAvoid = allPlants.plants.mapNotNull { plant ->
            try {
                val score = rotationScoringService.scoreRotation(
                    growAreaId = growAreaId,
                    plantName = plant.name,
                    plantingDate = plantingDate
                )
                
                // Keep only AVOID grade (score < 40)
                if (score.totalScore < 40) {
                    PlantRecommendation(
                        plantId = plant.id,
                        plantName = plant.name,
                        scientificName = plant.scientificName,
                        family = plant.family ?: "Unknown",
                        rotationScore = score,
                        suitabilityReason = "Not recommended for this location",
                        primaryBenefits = emptyList(),
                        warningFlags = extractWarningFlags(score)
                    )
                } else {
                    null
                }
            } catch (e: Exception) {
                null
            }
        }
        
        return toAvoid
            .sortedBy { it.rotationScore.totalScore }  // Worst first
            .take(maxResults)
    }
    
    // Private helper methods
    
    private fun getPlantingHistory(growAreaId: Long): List<String> {
        val cutoffDate = LocalDate.now().minusYears(5)
        return cropRecordRepository
            .findByGrowZoneIdAndPlantingDateAfter(growAreaId, cutoffDate)
            .mapNotNull { it.name }
    }
    
    private fun generateSuitabilityReason(score: RotationScore): String {
        val reasons = mutableListOf<String>()
        
        // Family rotation
        if (score.components.familyRotation.score >= 30) {
            reasons.add("proper family rotation")
        }
        
        // Nutrient balance
        if (score.components.nutrientBalance.score >= 20) {
            reasons.add("excellent nutrient balance")
        }
        
        // Disease risk
        if (score.components.diseaseRisk.score >= 18) {
            reasons.add("low disease risk")
        }
        
        // Root depth
        if (score.components.rootDepthDiversity.score >= 8) {
            reasons.add("good root diversity")
        }
        
        // Companions
        if (score.components.companionCompatibility.score >= 8) {
            reasons.add("compatible neighbors")
        }
        
        return if (reasons.isEmpty()) {
            "Acceptable choice with some considerations"
        } else {
            reasons.joinToString(", ").replaceFirstChar { it.uppercase() }
        }
    }
    
    private fun extractPrimaryBenefits(score: RotationScore): List<String> {
        return score.benefits
            .sortedByDescending { benefit ->
                // Prioritize nutrient and disease benefits
                when (benefit.category) {
                    "Nutrient Balance" -> 3
                    "Disease Prevention" -> 2
                    else -> 1
                }
            }
            .take(3)
            .map { it.message }
    }
    
    private fun extractWarningFlags(score: RotationScore): List<String> {
        return score.issues
            .filter { it.severity == IssueSeverity.CRITICAL || it.severity == IssueSeverity.WARNING }
            .take(3)
            .map { "${it.severity}: ${it.message}" }
    }
}
