package no.sogn.gardentime.rotation

import no.sogn.gardentime.rotation.dto.*
import org.springframework.stereotype.Service
import kotlin.math.roundToInt

/**
 * Service for generating detailed, educational messages for rotation recommendations.
 * 
 * This service creates user-friendly explanations with expandable "learn more" content
 * to help users understand rotation principles and make informed decisions.
 */
@Service
class RotationMessageService {
    
    /**
     * Generate detailed family rotation issue with educational content
     */
    fun generateFamilyRotationIssue(
        family: String,
        yearsSince: Double,
        recommendedInterval: Int,
        diseaseHistory: List<DiseaseIncident>
    ): RotationIssue {
        
        val severity = when {
            yearsSince < RotationRules.CRITICAL_INTERVAL -> IssueSeverity.CRITICAL
            yearsSince < (recommendedInterval - 1) -> IssueSeverity.WARNING
            else -> IssueSeverity.INFO
        }
        
        val yearsInt = yearsSince.roundToInt()
        
        val message = when (severity) {
            IssueSeverity.CRITICAL -> 
                "Same plant family planted ${yearsInt} year(s) ago - too soon!"
            IssueSeverity.WARNING -> 
                "Plant family rotation interval shorter than recommended (${yearsInt} vs $recommendedInterval years)"
            else -> 
                "Family rotation interval is adequate (${yearsInt} years)"
        }
        
        val suggestion = when (severity) {
            IssueSeverity.CRITICAL -> {
                val waitYears = recommendedInterval - yearsInt
                "Wait at least ${waitYears} more year(s) or choose a different plant family"
            }
            IssueSeverity.WARNING -> {
                val waitYears = recommendedInterval - yearsInt
                "Consider waiting ${waitYears} more year(s) for optimal results"
            }
            else -> null
        }
        
        val detailedExplanation = getFamilyExplanation(family, recommendedInterval)
        val learnMore = generateFamilyRotationLearnMore(family, diseaseHistory)
        
        return RotationIssue(
            severity = severity,
            category = "Family Rotation",
            message = message,
            suggestion = suggestion,
            detailedExplanation = detailedExplanation,
            learnMore = learnMore,
            affectedYears = listOf(yearsInt),
            relatedPlants = diseaseHistory.map { it.plantName }.distinct()
        )
    }
    
    /**
     * Get family-specific explanation
     */
    private fun getFamilyExplanation(family: String, interval: Int): String {
        return when (family) {
            "Solanaceae" -> 
                "Tomatoes, peppers, and eggplants (Solanaceae) are highly susceptible to soil-borne diseases like blight and verticillium wilt. These pathogens can persist in soil for $interval years. Planting too soon risks disease buildup and crop failure."
            "Brassicaceae" -> 
                "Cabbage family plants (Brassicaceae) can develop clubroot disease, which persists in soil for up to 20 years. A $interval-year rotation prevents spore buildup and maintains soil health."
            "Cucurbitaceae" -> 
                "Squash, cucumbers, and melons (Cucurbitaceae) are prone to wilt diseases and soil-borne fungi. A $interval-year rotation allows pathogen populations to decline naturally."
            "Fabaceae" -> 
                "Legumes (peas and beans) can suffer from root rot diseases. While they fix nitrogen, they also deplete specific micronutrients. A $interval-year rotation allows soil biology to rebalance."
            "Apiaceae" -> 
                "Carrots, celery, and parsnips (Apiaceae) are susceptible to root diseases and soil pests. A $interval-year rotation prevents pest and disease accumulation."
            "Alliaceae" -> 
                "Onions, garlic, and leeks (Alliaceae) can suffer from white rot, which persists in soil for 15+ years. A $interval-year rotation is critical for preventing this devastating disease."
            else -> 
                "$family plants should rotate every $interval years to prevent disease buildup and nutrient depletion. This interval allows soil to recover and pathogens to decline."
        }
    }
    
    /**
     * Generate comprehensive "learn more" content for family rotation
     */
    private fun generateFamilyRotationLearnMore(
        family: String,
        diseaseHistory: List<DiseaseIncident>
    ): LearnMoreContent {
        
        val diseaseInfo = if (diseaseHistory.isNotEmpty()) {
            "\n\nIn your garden history, $family plants have experienced: ${diseaseHistory.joinToString(", ") { it.diseaseNames }}. This makes proper rotation even more critical."
        } else {
            ""
        }
        
        return LearnMoreContent(
            title = "Understanding Plant Family Rotation",
            content = """
                Plant families share similar genetic traits, which means they're vulnerable to the same pests and diseases. When you plant the same family in the same spot repeatedly, disease-causing organisms build up in the soil, leading to weakened plants and reduced yields.
                
                Crop rotation breaks this cycle. By waiting the recommended interval before replanting the same family, you starve soil pathogens and allow beneficial soil organisms to recover. This is especially important for disease-prone families like Solanaceae (tomatoes) and Brassicaceae (cabbage).
                $diseaseInfo
            """.trimIndent(),
            scientificBasis = """
                Research shows that soil-borne pathogens like Verticillium dahliae (affecting Solanaceae) and Plasmodiophora brassicae (clubroot in Brassicaceae) can persist as resistant spores for years. Studies demonstrate that 3-4 year rotations reduce disease incidence by 60-90% compared to continuous planting.
            """.trimIndent(),
            examples = listOf(
                "After tomatoes (Solanaceae), plant beans (Fabaceae) → then lettuce (Asteraceae) → then back to tomatoes",
                "After cabbage (Brassicaceae), plant corn (Poaceae) → then squash (Cucurbitaceae) → then beans → then back to cabbage",
                "Never plant tomatoes → peppers → eggplants in succession (all Solanaceae)"
            ),
            externalLinks = listOf(
                ExternalLink(
                    title = "Cornell University: Crop Rotation on Organic Farms",
                    url = "https://ecommons.cornell.edu/handle/1813/56161",
                    description = "Research-based guide to crop rotation principles"
                )
            )
        )
    }
    
    /**
     * Generate nutrient balance issue
     */
    fun generateNutrientBalanceIssue(
        previousFeeding: String,
        currentFeeding: String
    ): RotationIssue? {
        
        if (previousFeeding == "HEAVY" && currentFeeding == "HEAVY") {
            return RotationIssue(
                severity = IssueSeverity.WARNING,
                category = "Nutrient Balance",
                message = "Two heavy feeders in a row will deplete soil nutrients",
                suggestion = "Consider a nitrogen-fixing crop (beans, peas) or light feeder instead",
                detailedExplanation = """
                    Heavy feeders like tomatoes, corn, and brassicas extract large amounts of nitrogen and other nutrients from the soil. Planting heavy feeders consecutively exhausts the soil, requiring heavy fertilizer inputs and reducing soil health over time.
                """.trimIndent(),
                learnMore = LearnMoreContent(
                    title = "Nutrient-Balanced Crop Rotation",
                    content = """
                        Healthy soil has a balance of nutrients. Heavy feeders (tomatoes, corn, cabbage) take a lot of nitrogen. Light feeders (carrots, herbs) need less. Nitrogen fixers (beans, peas) actually add nitrogen to soil through their root nodules.
                        
                        The ideal rotation cycles through all three types: Heavy Feeder → Light Feeder → Nitrogen Fixer → Heavy Feeder. This creates a sustainable system where soil fertility is maintained naturally without excessive inputs.
                    """.trimIndent(),
                    scientificBasis = """
                        Legumes (Fabaceae) form symbiotic relationships with Rhizobium bacteria, which convert atmospheric nitrogen into plant-available forms. Studies show that a legume crop can add 40-200 lbs of nitrogen per acre, depending on species and growing conditions.
                    """.trimIndent(),
                    examples = listOf(
                        "Heavy: Tomatoes → Light: Carrots → Fixer: Beans → Heavy: Cabbage",
                        "Heavy: Corn → Light: Lettuce → Fixer: Peas → Heavy: Squash",
                        "Avoid: Tomatoes → Corn → Cabbage (all heavy feeders)"
                    )
                )
            )
        }
        
        return null
    }
    
    /**
     * Generate root depth diversity issue
     */
    fun generateRootDepthIssue(
        currentDepth: String,
        recentDepths: List<String>
    ): RotationIssue? {
        
        if (recentDepths.size >= 2 && recentDepths.all { it == currentDepth }) {
            return RotationIssue(
                severity = IssueSeverity.INFO,
                category = "Root Depth Diversity",
                message = "Same root depth repeated - soil compaction risk",
                suggestion = "Vary root depths to improve soil structure (shallow → medium → deep)",
                detailedExplanation = """
                    Planting crops with the same root depth repeatedly can lead to soil compaction in that layer and underutilization of other soil layers. Varying root depths helps break up compacted layers, improves drainage, and accesses nutrients from different soil zones.
                """.trimIndent(),
                learnMore = LearnMoreContent(
                    title = "Root Depth and Soil Structure",
                    content = """
                        Different crops explore different soil layers. Shallow-rooted plants (lettuce, herbs) work the top 6-12 inches. Medium-rooted plants (beans, brassicas) reach 12-24 inches. Deep-rooted plants (tomatoes, carrots) can go 24-48 inches or more.
                        
                        Rotating through different root depths naturally aerates the soil, breaks up hardpan layers, and brings nutrients from deeper layers to the surface as roots decompose. This is especially valuable for heavy clay soils prone to compaction.
                    """.trimIndent(),
                    scientificBasis = """
                        Research demonstrates that diverse root architectures improve soil aggregate stability and water infiltration. Deep-rooted crops can break through compacted layers, creating channels that benefit subsequent shallow-rooted crops.
                    """.trimIndent(),
                    examples = listOf(
                        "Shallow: Lettuce → Deep: Tomatoes → Medium: Beans",
                        "Deep: Carrots → Shallow: Radishes → Medium: Cabbage",
                        "Use cover crops like daikon radish (biodrilling) to break compaction"
                    )
                )
            )
        }
        
        return null
    }
    
    /**
     * Generate disease risk issue based on history
     */
    fun generateDiseaseRiskIssue(
        diseaseHistory: List<DiseaseIncident>
    ): RotationIssue? {
        
        val recentDiseases = diseaseHistory.filter { it.yearsAgo < 3 }
        
        if (recentDiseases.isNotEmpty()) {
            val diseaseNames = recentDiseases.joinToString(", ") { it.diseaseNames }
            
            return RotationIssue(
                severity = IssueSeverity.WARNING,
                category = "Disease Risk",
                message = "Disease history detected in this area",
                suggestion = "Monitor closely for symptoms; consider resistant varieties",
                detailedExplanation = """
                    This growing area has a history of $diseaseNames within the last 3 years. Some disease organisms can persist in soil, increasing risk for susceptible plants. Extra monitoring and prevention strategies are recommended.
                """.trimIndent(),
                learnMore = LearnMoreContent(
                    title = "Managing Disease History",
                    content = """
                        Once a disease appears in your garden, it's important to track it because some pathogens persist in soil for years. However, this doesn't mean you can never grow susceptible plants again - it means you need to be smart about it.
                        
                        Strategies for managing disease-prone areas: (1) Choose disease-resistant varieties, (2) Improve soil health with compost and beneficial microbes, (3) Practice excellent garden hygiene, (4) Consider solarization or biological soil amendments, (5) Monitor plants closely for early symptoms.
                    """.trimIndent(),
                    scientificBasis = """
                        Soil biodiversity is key to disease suppression. Research shows that healthy, biologically active soils can suppress soil-borne pathogens through competition and antagonism from beneficial microorganisms. Adding compost and reducing tillage supports this natural defense.
                    """.trimIndent(),
                    examples = diseaseHistory.map { 
                        "${it.plantName} - ${it.diseaseNames} (${it.yearsAgo.roundToInt()} years ago)"
                    }
                ),
                affectedYears = recentDiseases.map { it.yearsAgo.roundToInt() },
                relatedPlants = recentDiseases.map { it.plantName }.distinct()
            )
        }
        
        return null
    }
    
    /**
     * Generate benefits with detailed explanations
     */
    fun generateBenefits(
        familyScore: Int,
        nutrientScore: Int,
        rootDiversityScore: Int,
        isNitrogenFixer: Boolean
    ): List<RotationBenefit> {
        
        val benefits = mutableListOf<RotationBenefit>()
        
        // Good family rotation
        if (familyScore >= 30) {
            benefits.add(RotationBenefit(
                category = "Disease Prevention",
                message = "Excellent family rotation interval",
                impact = "Significantly reduced disease risk",
                detailedExplanation = "The time since last planting this family allows soil pathogens to die off and beneficial organisms to recover.",
                expectedResults = listOf(
                    "60-90% reduction in soil-borne disease incidence",
                    "Healthier plants with stronger immune systems",
                    "Reduced need for disease management interventions"
                ),
                timeframe = "Benefits appear immediately this season"
            ))
        }
        
        // Good nutrient balance
        if (nutrientScore >= 20) {
            benefits.add(RotationBenefit(
                category = "Soil Fertility",
                message = "Great nutrient balance in rotation",
                impact = "Improved soil fertility and structure",
                detailedExplanation = "This rotation sequence maintains balanced soil nutrients without depleting specific elements.",
                expectedResults = listOf(
                    "Reduced fertilizer requirements (20-40% savings)",
                    "Better soil structure and water retention",
                    "Improved long-term productivity"
                ),
                timeframe = "Cumulative benefits build over 2-3 years"
            ))
        }
        
        // Nitrogen fixer bonus
        if (isNitrogenFixer) {
            benefits.add(RotationBenefit(
                category = "Soil Enrichment",
                message = "Nitrogen-fixing crop builds soil fertility",
                impact = "Adds free nitrogen for next crop",
                detailedExplanation = "This legume will add nitrogen to the soil through symbiotic bacteria in its root nodules.",
                expectedResults = listOf(
                    "40-200 lbs nitrogen per acre added naturally",
                    "Next heavy feeder will thrive with minimal fertilizer",
                    "Improved soil biology and microbial diversity"
                ),
                timeframe = "Nitrogen available for next season's crop"
            ))
        }
        
        // Root diversity
        if (rootDiversityScore >= 8) {
            benefits.add(RotationBenefit(
                category = "Soil Structure",
                message = "Good root depth diversity",
                impact = "Improved soil aeration and structure",
                detailedExplanation = "Varying root depths naturally aerates soil and accesses nutrients from different layers.",
                expectedResults = listOf(
                    "Better water infiltration and drainage",
                    "Reduced soil compaction",
                    "Access to nutrients from multiple soil layers"
                ),
                timeframe = "Improvements visible within 1-2 seasons"
            ))
        }
        
        return benefits
    }
    
    /**
     * Get severity label for display
     */
    fun getSeverityLabel(severity: IssueSeverity): String {
        return when (severity) {
            IssueSeverity.CRITICAL -> "Critical Issue"
            IssueSeverity.WARNING -> "Warning"
            IssueSeverity.INFO -> "Information"
        }
    }
    
    /**
     * Get grade description
     */
    fun getGradeDescription(grade: String): String {
        return when (grade) {
            "EXCELLENT" -> "This is an ideal choice for this growing area based on rotation principles."
            "GOOD" -> "This is a good choice that follows solid rotation practices."
            "FAIR" -> "This choice is acceptable but could be improved."
            "POOR" -> "This choice has significant concerns - consider alternatives."
            "AVOID" -> "This choice is not recommended - serious rotation issues detected."
            else -> "Unknown rating"
        }
    }
}
