package no.sogn.gardentime.rotation

import no.sogn.gardentime.client.PlantDataApiClient
import no.sogn.gardentime.db.CropRecordRepository
import no.sogn.gardentime.model.CropRecordEntity
import no.sogn.gardentime.rotation.dto.*
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.time.temporal.ChronoUnit

/**
 * Service for scoring crop rotation suitability
 * Implements intelligent rotation validation based on regenerative farming principles
 */
@Service
class RotationScoringService(
    private val cropRecordRepository: CropRecordRepository,
    private val plantDataApiClient: PlantDataApiClient,
    private val messageService: RotationMessageService
) {
    private val logger = LoggerFactory.getLogger(RotationScoringService::class.java)
    
    /**
     * Score how suitable a plant is for a grow area
     * Returns 0-100 score with detailed breakdown
     */
    fun scoreRotation(
        growAreaId: Long,
        plantName: String,
        plantingDate: LocalDate = LocalDate.now()
    ): RotationScore {
        logger.info("Scoring rotation for $plantName in grow area $growAreaId")
        
        // Get plant data from API
        val plantData = plantDataApiClient.getPlantDetails(plantName)
        if (plantData == null) {
            logger.warn("Plant data not found for $plantName, using defaults")
            return createDefaultScore(plantName)
        }
        
        val plantFamily = plantData.family
        val feederType = plantData.rotationData.feederType
        val isNitrogenFixer = plantData.rotationData.isNitrogenFixer
        val rootDepth = plantData.plantingDetails.rootDepth
        
        // Get planting history (5 years)
        val history = getPlantingHistory(growAreaId, 5)
        val currentCrops = getCurrentCrops(growAreaId)
        
        // Calculate each component
        val familyScore = scoreFamilyRotation(plantFamily, history, plantingDate)
        val nutrientScore = scoreNutrientBalance(feederType, isNitrogenFixer, history)
        val diseaseScore = scoreDiseaseRisk(plantFamily, plantName, history, plantingDate)
        val rootDepthScore = scoreRootDepthDiversity(rootDepth, history)
        val companionScore = scoreCompanionCompatibility(plantName, currentCrops)
        
        // Calculate total score
        val totalScore = familyScore.score + nutrientScore.score + 
                        diseaseScore.score + rootDepthScore.score + companionScore.score
        
        // Determine grade and recommendation
        val grade = RotationRules.RotationGrade.fromScore(totalScore)
        val recommendation = generateRecommendation(totalScore, grade)
        
        // Collect issues and benefits
        val issues = mutableListOf<RotationIssue>()
        val benefits = mutableListOf<RotationBenefit>()
        
        collectFamilyIssues(plantFamily, history, plantingDate, issues, benefits)
        collectNutrientIssues(feederType, isNitrogenFixer, history, issues, benefits)
        collectDiseaseIssues(plantFamily, plantName, history, issues)
        collectRootDepthIssues(rootDepth, history, issues, benefits)
        collectCompanionIssues(plantName, currentCrops, issues, benefits)
        
        return RotationScore(
            totalScore = totalScore,
            grade = grade.name,
            recommendation = recommendation,
            components = ScoreComponents(
                familyRotation = familyScore,
                nutrientBalance = nutrientScore,
                diseaseRisk = diseaseScore,
                rootDepthDiversity = rootDepthScore,
                companionCompatibility = companionScore
            ),
            issues = issues,
            benefits = benefits
        )
    }
    
    /**
     * Score family rotation (0-35 points)
     */
    private fun scoreFamilyRotation(
        family: String?,
        history: List<CropRecordEntity>,
        plantingDate: LocalDate
    ): ScoreComponent {
        if (family == null) {
            return ScoreComponent(20, 35, "Family Rotation", "No family data available")
        }
        
        // Find last planting of this family
        val lastSameFamily = history
            .filter { it.plantFamily == family }
            .maxByOrNull { it.plantingDate }
        
        val score = if (lastSameFamily == null) {
            // Never planted this family here - excellent!
            35
        } else {
            val yearsSince = ChronoUnit.DAYS.between(
                lastSameFamily.plantingDate, 
                plantingDate
            ) / 365.0
            
            val recommendedInterval = RotationRules.getRecommendedInterval(family)
            
            when {
                yearsSince < 1 -> 0  // Critical - same year
                yearsSince < 2 -> 10 // Warning - too soon
                yearsSince < recommendedInterval -> {
                    // Partial credit based on progress toward recommended interval
                    (yearsSince / recommendedInterval * 35).toInt()
                }
                else -> 35  // Full points - met or exceeded interval
            }
        }
        
        val description = if (lastSameFamily == null) {
            "No recent $family crops in this area"
        } else {
            val yearsSince = ChronoUnit.DAYS.between(
                lastSameFamily.plantingDate, 
                plantingDate
            ) / 365.0
            "Last $family crop was ${String.format("%.1f", yearsSince)} years ago (${lastSameFamily.name})"
        }
        
        return ScoreComponent(score, 35, "Family Rotation", description)
    }
    
    /**
     * Score nutrient balance (0-25 points)
     */
    private fun scoreNutrientBalance(
        currentFeederType: String?,
        isNitrogenFixer: Boolean,
        history: List<CropRecordEntity>
    ): ScoreComponent {
        val lastCrop = history.maxByOrNull { it.plantingDate }
        val previousFeederType = lastCrop?.feederType
        
        val score = RotationRules.NutrientBalance.scoreSequence(
            previousFeederType, 
            currentFeederType, 
            isNitrogenFixer
        )
        
        val description = when {
            lastCrop == null -> "First crop in this area"
            isNitrogenFixer && previousFeederType == "HEAVY" -> 
                "Nitrogen fixer after heavy feeder - ideal for soil replenishment"
            currentFeederType == "HEAVY" && previousFeederType == "LIGHT" -> 
                "Heavy feeder after light feeder - good nutrient utilization"
            currentFeederType == "HEAVY" && previousFeederType == "HEAVY" -> 
                "Heavy feeder after heavy feeder - may deplete soil"
            else -> "Previous: ${previousFeederType ?: "unknown"}, Current: ${currentFeederType ?: "unknown"}"
        }
        
        return ScoreComponent(score, 25, "Nutrient Balance", description)
    }
    
    /**
     * Score disease risk (0-20 points)
     */
    private fun scoreDiseaseRisk(
        family: String?,
        plantName: String,
        history: List<CropRecordEntity>,
        plantingDate: LocalDate
    ): ScoreComponent {
        if (family == null) {
            return ScoreComponent(15, 20, "Disease Risk", "No family data for disease assessment")
        }
        
        // Check for diseased crops in this family
        val diseasedCrops = history.filter { 
            it.hadDiseases && it.plantFamily == family 
        }
        
        if (diseasedCrops.isEmpty()) {
            return ScoreComponent(20, 20, "Disease Risk", "No disease history for $family family")
        }
        
        // Get soil-borne diseases for this family
        val soilDiseases = try {
            plantDataApiClient.getSoilBorneDiseases()
        } catch (e: Exception) {
            logger.warn("Failed to fetch soil-borne diseases: ${e.message}")
            null
        }
        
        val familyDiseases = soilDiseases?.diseases?.filter { 
            it.affectedFamilies.contains(family)
        } ?: emptyList()
        
        // Calculate risk based on most recent diseased crop
        val mostRecentDisease = diseasedCrops.maxByOrNull { it.plantingDate }!!
        val yearsSinceDisease = ChronoUnit.DAYS.between(
            mostRecentDisease.plantingDate,
            plantingDate
        ) / 365.0
        
        // Use worst-case persistence from API data or defaults
        val maxPersistence = familyDiseases.maxOfOrNull { 
            it.disease.persistenceYears ?: 3 
        } ?: 3
        
        val score = when {
            yearsSinceDisease < 1 -> 0   // Critical risk
            yearsSinceDisease < maxPersistence / 2 -> 5  // High risk
            yearsSinceDisease < maxPersistence -> 12  // Moderate risk
            else -> 20  // Low risk - beyond persistence period
        }
        
        val description = "Last disease in $family was ${String.format("%.1f", yearsSinceDisease)} " +
                         "years ago (max persistence: $maxPersistence years)"
        
        return ScoreComponent(score, 20, "Disease Risk", description)
    }
    
    /**
     * Score root depth diversity (0-10 points)
     */
    private fun scoreRootDepthDiversity(
        currentDepth: String,
        history: List<CropRecordEntity>
    ): ScoreComponent {
        // Get last 3 crops' root depths
        val recentDepths = history
            .sortedByDescending { it.plantingDate }
            .take(3)
            .mapNotNull { it.rootDepth }
        
        val score = RotationRules.RootDepth.scoreDiversity(currentDepth, recentDepths)
        
        val description = if (recentDepths.isEmpty()) {
            "First crop - no depth history"
        } else {
            val uniqueDepths = (recentDepths + currentDepth).distinct().size
            when {
                uniqueDepths >= 3 -> "Excellent depth diversity (3 different depths)"
                uniqueDepths == 2 -> "Good depth variation (2 different depths)"
                else -> "Same depth repeatedly - may cause compaction"
            }
        }
        
        return ScoreComponent(score, 10, "Root Depth Diversity", description)
    }
    
    /**
     * Score companion compatibility (0-10 points)
     */
    private fun scoreCompanionCompatibility(
        plantName: String,
        currentCrops: List<CropRecordEntity>
    ): ScoreComponent {
        if (currentCrops.isEmpty()) {
            return ScoreComponent(10, 10, "Companion Compatibility", "No current neighbors")
        }
        
        // Get companion data from API
        val companions = try {
            plantDataApiClient.getCompanions(plantName)
        } catch (e: Exception) {
            logger.warn("Failed to fetch companions for $plantName: ${e.message}")
            null
        }
        
        if (companions == null) {
            return ScoreComponent(7, 10, "Companion Compatibility", "No companion data available")
        }
        
        val beneficialNames = companions.companions.beneficial.map { it.name }
        val antagonisticNames = companions.companions.antagonistic.map { it.name }
        
        val currentNames = currentCrops.map { it.name }
        
        val beneficialCount = currentNames.count { it in beneficialNames }
        val antagonisticCount = currentNames.count { it in antagonisticNames }
        
        val score = when {
            antagonisticCount > 0 -> 0  // Has antagonistic neighbors
            beneficialCount >= 2 -> 10  // Multiple beneficial neighbors
            beneficialCount == 1 -> 8   // One beneficial neighbor
            else -> 7  // Neutral neighbors
        }
        
        val description = when {
            antagonisticCount > 0 -> "Warning: ${antagonisticCount} antagonistic neighbor(s)"
            beneficialCount > 0 -> "$beneficialCount beneficial neighbor(s)"
            else -> "Neutral companion relationships"
        }
        
        return ScoreComponent(score, 10, "Companion Compatibility", description)
    }
    
    /**
     * Get planting history for a grow area
     */
    private fun getPlantingHistory(growAreaId: Long, yearsBack: Int): List<CropRecordEntity> {
        val cutoffDate = LocalDate.now().minusYears(yearsBack.toLong())
        return cropRecordRepository.findByGrowZoneIdAndPlantingDateAfter(growAreaId, cutoffDate)
            .sortedByDescending { it.plantingDate }
    }
    
    /**
     * Get currently growing crops (no harvest date)
     */
    private fun getCurrentCrops(growAreaId: Long): List<CropRecordEntity> {
        val oneYearAgo = LocalDate.now().minusYears(1)
        return cropRecordRepository
            .findByGrowZoneIdAndPlantingDateAfterAndHarvestDateIsNull(growAreaId, oneYearAgo)
    }
    
    /**
     * Generate human-readable recommendation
     */
    private fun generateRecommendation(score: Int, grade: RotationRules.RotationGrade): String {
        return when (grade) {
            RotationRules.RotationGrade.EXCELLENT -> 
                "Excellent choice! This rotation follows best practices and will support healthy plant growth."
            RotationRules.RotationGrade.GOOD -> 
                "Good rotation choice. This planting should perform well with proper care."
            RotationRules.RotationGrade.FAIR -> 
                "Acceptable rotation, but not ideal. Consider addressing the issues noted below."
            RotationRules.RotationGrade.POOR -> 
                "Not recommended. This rotation has several concerning issues that may affect plant health."
            RotationRules.RotationGrade.AVOID -> 
                "Strongly not recommended. Planting here may result in disease, poor yields, or crop failure."
        }
    }
    
    /**
     * Create default score when plant data is unavailable
     */
    private fun createDefaultScore(plantName: String): RotationScore {
        return RotationScore(
            totalScore = 50,
            grade = "FAIR",
            recommendation = "Plant data unavailable for $plantName. Proceeding with limited information.",
            components = ScoreComponents(
                familyRotation = ScoreComponent(20, 35, "Family Rotation", "No data"),
                nutrientBalance = ScoreComponent(15, 25, "Nutrient Balance", "No data"),
                diseaseRisk = ScoreComponent(10, 20, "Disease Risk", "No data"),
                rootDepthDiversity = ScoreComponent(5, 10, "Root Depth", "No data"),
                companionCompatibility = ScoreComponent(0, 10, "Companions", "No data")
            ),
            issues = listOf(
                RotationIssue(
                    IssueSeverity.WARNING,
                    "Data Availability",
                    "Plant data not found in database",
                    "Consider adding plant to database for better rotation planning"
                )
            ),
            benefits = emptyList()
        )
    }
    
    // Issue and benefit collection methods follow...
    private fun collectFamilyIssues(
        family: String?,
        history: List<CropRecordEntity>,
        plantingDate: LocalDate,
        issues: MutableList<RotationIssue>,
        benefits: MutableList<RotationBenefit>
    ) {
        if (family == null) return
        
        val lastSameFamily = history
            .filter { it.plantFamily == family }
            .maxByOrNull { it.plantingDate }
        
        if (lastSameFamily != null) {
            val yearsSince = ChronoUnit.DAYS.between(
                lastSameFamily.plantingDate, 
                plantingDate
            ) / 365.0
            
            val recommendedInterval = RotationRules.getRecommendedInterval(family)
            
            // Get disease history for this family
            val diseaseHistory = extractDiseaseHistory(history.filter { it.plantFamily == family }, plantingDate)
            
            // Generate detailed issue using message service
            if (yearsSince < recommendedInterval) {
                val issue = messageService.generateFamilyRotationIssue(
                    family, yearsSince, recommendedInterval, diseaseHistory
                )
                issues.add(issue)
            } else {
                // Add benefit for good rotation
                benefits.add(
                    RotationBenefit(
                        "Family Rotation",
                        "Proper $family rotation interval met (${String.format("%.1f", yearsSince)} years)",
                        "Reduced disease pressure and soil depletion",
                        detailedExplanation = "Waiting the full ${recommendedInterval}-year interval allows soil pathogens to decline naturally.",
                        expectedResults = listOf(
                            "Healthier plants with better disease resistance",
                            "Improved yields compared to short rotations",
                            "Reduced need for chemical interventions"
                        ),
                        timeframe = "Benefits realized this growing season"
                    )
                )
            }
        } else {
            benefits.add(
                RotationBenefit(
                    "Family Rotation",
                    "No recent $family crops in this area",
                    "Fresh soil for this family - optimal conditions"
                )
            )
        }
    }
    
    private fun collectNutrientIssues(
        currentFeederType: String?,
        isNitrogenFixer: Boolean,
        history: List<CropRecordEntity>,
        issues: MutableList<RotationIssue>,
        benefits: MutableList<RotationBenefit>
    ) {
        val lastCrop = history.maxByOrNull { it.plantingDate }
        if (lastCrop == null) return
        
        val previousFeederType = lastCrop.feederType ?: "MODERATE"
        val currentType = currentFeederType ?: "MODERATE"
        
        // Check for heavy-heavy succession using message service
        val nutrientIssue = messageService.generateNutrientBalanceIssue(previousFeederType, currentType)
        if (nutrientIssue != null) {
            issues.add(nutrientIssue)
        } else {
            // Add benefits for good sequences
            when {
                isNitrogenFixer && previousFeederType == "HEAVY" -> benefits.add(
                    RotationBenefit(
                        "Nutrient Balance",
                        "Nitrogen-fixing crop after heavy feeder",
                        "Will restore nitrogen levels and improve soil fertility",
                        detailedExplanation = "Legumes form symbiotic relationships with soil bacteria to fix atmospheric nitrogen.",
                        expectedResults = listOf(
                            "40-200 lbs nitrogen added per acre",
                            "Reduced fertilizer needs for next crop",
                            "Improved soil structure"
                        ),
                        timeframe = "Nitrogen available next season"
                    )
                )
                currentType == "LIGHT" && previousFeederType == "HEAVY" -> benefits.add(
                    RotationBenefit(
                        "Nutrient Balance",
                        "Light feeder after heavy feeder",
                        "Allows soil to recover nutrient levels",
                        timeframe = "Soil recovery begins this season"
                    )
                )
            }
        }
    }
    
    private fun collectDiseaseIssues(
        family: String?,
        plantName: String,
        history: List<CropRecordEntity>,
        issues: MutableList<RotationIssue>
    ) {
        if (family == null) return
        
        val diseaseHistory = extractDiseaseHistory(history.filter { it.plantFamily == family }, LocalDate.now())
        
        if (diseaseHistory.isNotEmpty()) {
            val diseaseIssue = messageService.generateDiseaseRiskIssue(diseaseHistory)
            if (diseaseIssue != null) {
                issues.add(diseaseIssue)
            }
        }
    }
    
    /**
     * Extract disease history from crop records
     */
    private fun extractDiseaseHistory(
        crops: List<CropRecordEntity>,
        currentDate: LocalDate
    ): List<DiseaseIncident> {
        return crops
            .filter { it.hadDiseases && it.name != null }
            .map { crop ->
                val yearsSince = ChronoUnit.DAYS.between(crop.plantingDate, currentDate) / 365.0
                DiseaseIncident(
                    plantName = crop.name!!,
                    plantFamily = crop.plantFamily,
                    diseaseNames = crop.diseaseNames ?: "Unknown disease",
                    plantingDate = crop.plantingDate.toString(),
                    yearsAgo = yearsSince
                )
            }
    }
    
    private fun collectRootDepthIssues(
        currentDepth: String,
        history: List<CropRecordEntity>,
        issues: MutableList<RotationIssue>,
        benefits: MutableList<RotationBenefit>
    ) {
        val recentDepths = history
            .sortedByDescending { it.plantingDate }
            .take(3)
            .mapNotNull { it.rootDepth }
        
        // Check for root depth issue using message service
        val rootIssue = messageService.generateRootDepthIssue(currentDepth, recentDepths)
        if (rootIssue != null) {
            issues.add(rootIssue)
        } else if (recentDepths.isNotEmpty()) {
            val uniqueDepths = (recentDepths + currentDepth).distinct().size
            if (uniqueDepths >= 3) {
                benefits.add(
                    RotationBenefit(
                        "Root Depth Diversity",
                        "Good variation in root depths",
                        "Improves soil structure and nutrient access at different levels",
                        detailedExplanation = "Different root depths naturally aerate soil and access nutrients from multiple layers.",
                        expectedResults = listOf(
                            "Improved water infiltration",
                            "Reduced soil compaction",
                            "Better overall soil structure"
                        ),
                        timeframe = "Gradual improvement over 1-2 seasons"
                    )
                )
            }
        }
    }
    
    private fun collectCompanionIssues(
        plantName: String,
        currentCrops: List<CropRecordEntity>,
        issues: MutableList<RotationIssue>,
        benefits: MutableList<RotationBenefit>
    ) {
        if (currentCrops.isEmpty()) return
        
        val companions = try {
            plantDataApiClient.getCompanions(plantName)
        } catch (e: Exception) {
            return
        }
        
        if (companions == null) return
        
        val antagonisticNames = companions.companions.antagonistic.map { it.name }
        val beneficialNames = companions.companions.beneficial.map { it.name }
        
        currentCrops.forEach { crop ->
            if (crop.name in antagonisticNames) {
                val companion = companions.companions.antagonistic.find { it.name == crop.name }
                issues.add(
                    RotationIssue(
                        IssueSeverity.WARNING,
                        "Companion Planting",
                        "${crop.name} is antagonistic to $plantName",
                        companion?.reason ?: "May compete for resources or inhibit growth"
                    )
                )
            } else if (crop.name in beneficialNames) {
                val companion = companions.companions.beneficial.find { it.name == crop.name }
                benefits.add(
                    RotationBenefit(
                        "Companion Planting",
                        "${crop.name} is beneficial to $plantName",
                        companion?.reason ?: "May improve growth or pest resistance"
                    )
                )
            }
        }
    }
}
