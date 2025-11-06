package no.sogn.gardentime.rotation

/**
 * Rotation rules based on regenerative farming best practices
 * All intervals are in years
 */
object RotationRules {
    
    /**
     * Scoring weights (must sum to 100)
     */
    object Weights {
        const val FAMILY_ROTATION = 35  // Most critical - prevents disease buildup
        const val NUTRIENT_BALANCE = 25  // Soil fertility management
        const val DISEASE_RISK = 20      // Soil-borne disease prevention
        const val ROOT_DEPTH_DIVERSITY = 10  // Soil structure improvement
        const val COMPANION_COMPATIBILITY = 10  // Beneficial/antagonistic relationships
    }
    
    /**
     * Family rotation intervals (years)
     * Based on disease pressure and soil depletion patterns
     */
    val familyIntervals = mapOf(
        // High disease pressure families - need longer rotations
        "Solanaceae" to 4,      // Tomatoes, peppers, eggplants (blight, verticillium)
        "Brassicaceae" to 4,    // Cabbage, broccoli, kale (clubroot)
        "Cucurbitaceae" to 3,   // Squash, cucumbers, melons (wilt diseases)
        "Fabaceae" to 3,        // Beans, peas (root rots)
        "Apiaceae" to 3,        // Carrots, celery, parsnips (root diseases)
        "Alliaceae" to 3,       // Onions, garlic, leeks (white rot)
        
        // Moderate disease pressure
        "Asteraceae" to 2,      // Lettuce, sunflowers (downy mildew)
        "Chenopodiaceae" to 2,  // Beets, chard, spinach
        "Amaranthaceae" to 2,   // Amaranth, quinoa (includes former Chenopodiaceae)
        
        // Lower pressure families
        "Poaceae" to 2,         // Corn, grains
        "Lamiaceae" to 2        // Basil, mint, oregano
    )
    
    /**
     * Default interval for families not in the map
     */
    const val DEFAULT_FAMILY_INTERVAL = 3
    
    /**
     * Minimum interval for any family (critical threshold)
     */
    const val CRITICAL_INTERVAL = 1
    
    /**
     * Disease persistence in soil (years)
     * Used when API data is unavailable
     */
    val defaultDiseasePersistence = mapOf(
        "Blight" to 3,
        "Fusarium Wilt" to 7,
        "Verticillium Wilt" to 10,
        "Clubroot" to 20,
        "White Rot" to 15,
        "Root Rot" to 3,
        "Bacterial Wilt" to 3,
        "Downy Mildew" to 1,
        "Powdery Mildew" to 1
    )
    
    /**
     * Get recommended interval for a plant family
     */
    fun getRecommendedInterval(family: String?): Int {
        if (family == null) return DEFAULT_FAMILY_INTERVAL
        return familyIntervals[family] ?: DEFAULT_FAMILY_INTERVAL
    }
    
    /**
     * Check if interval is critical (too short)
     */
    fun isCriticalInterval(yearsSinceLastPlanting: Double): Boolean {
        return yearsSinceLastPlanting < CRITICAL_INTERVAL
    }
    
    /**
     * Check if interval is warning level
     */
    fun isWarningInterval(yearsSinceLastPlanting: Double, family: String?): Boolean {
        val recommended = getRecommendedInterval(family)
        return yearsSinceLastPlanting < (recommended - 1)
    }
    
    /**
     * Nutrient balance scoring rules
     */
    object NutrientBalance {
        // Ideal sequences (full points)
        val idealSequences = listOf(
            "HEAVY" to "NITROGEN_FIXER",  // Heavy feeder followed by nitrogen fixer
            "NITROGEN_FIXER" to "HEAVY",  // Nitrogen fixer enriches for heavy feeder
            "HEAVY" to "LIGHT"            // Heavy feeder followed by light feeder
        )
        
        // Poor sequences (penalty)
        val poorSequences = listOf(
            "HEAVY" to "HEAVY"  // Depletes soil rapidly
        )
        
        /**
         * Score nutrient sequence (0-25 points)
         */
        fun scoreSequence(previous: String?, current: String?, isCurrentNitrogenFixer: Boolean): Int {
            // If we don't have data, give neutral score
            if (previous == null || current == null) return 15
            
            // Nitrogen fixer after heavy feeder is ideal
            if (isCurrentNitrogenFixer && previous == "HEAVY") return 25
            
            // Heavy feeder after nitrogen fixer is ideal
            if (current == "HEAVY" && previous == "LIGHT" && isCurrentNitrogenFixer) return 25
            
            // Light feeder after heavy is good
            if (previous == "HEAVY" && current == "LIGHT") return 20
            
            // Heavy after heavy is poor
            if (previous == "HEAVY" && current == "HEAVY") return 10
            
            // Moderate sequences
            if (previous == "MODERATE" || current == "MODERATE") return 15
            
            // Light after light is okay
            if (previous == "LIGHT" && current == "LIGHT") return 12
            
            // Default neutral
            return 15
        }
    }
    
    /**
     * Root depth diversity rules
     */
    object RootDepth {
        /**
         * Score root depth diversity (0-10 points)
         * Checks last 3 crops for depth variation
         */
        fun scoreDiversity(currentDepth: String?, recentDepths: List<String>): Int {
            if (currentDepth == null || recentDepths.isEmpty()) return 5
            
            // Count unique depths in recent history
            val uniqueDepths = (recentDepths + currentDepth).distinct()
            
            return when {
                uniqueDepths.size >= 3 -> 10  // All three depths represented
                uniqueDepths.size == 2 -> 7   // Two different depths
                else -> 3  // Same depth repeatedly (compaction risk)
            }
        }
        
        /**
         * Check if same depth is repeated too often
         */
        fun isDepthRepeated(currentDepth: String?, recentDepths: List<String>): Boolean {
            if (currentDepth == null || recentDepths.isEmpty()) return false
            return recentDepths.all { it == currentDepth }
        }
    }
    
    /**
     * Rotation grade thresholds
     */
    enum class RotationGrade {
        EXCELLENT,  // 85-100
        GOOD,       // 70-84
        FAIR,       // 60-69
        POOR,       // 40-59
        AVOID;      // 0-39
        
        companion object {
            fun fromScore(score: Int): RotationGrade {
                return when {
                    score >= 85 -> EXCELLENT
                    score >= 70 -> GOOD
                    score >= 60 -> FAIR
                    score >= 40 -> POOR
                    else -> AVOID
                }
            }
        }
    }
}
