# Crop Rotation Planner - Implementation Plan
## GardenTime Application

**Goal**: Implement intelligent crop rotation validation and recommendations that help users practice regenerative farming principles.

**Architecture**: GardenTime app tracks user's planting history and calls plant-data-aggregator API for reference data (plant families, diseases, companions, etc.)

---

## Phase 1: Foundation & API Client (Week 1)

### 1.1 Plant Data API Client
Create a REST client to communicate with plant-data-aggregator API.

**Files to Create:**
- [ ] `src/main/kotlin/no/sogn/gardentime/client/PlantDataApiClient.kt`
- [ ] `src/main/kotlin/no/sogn/gardentime/client/dto/PlantDataDTOs.kt` (mirror plant-data-aggregator DTOs)
- [ ] `src/main/kotlin/no/sogn/gardentime/config/PlantDataApiConfig.kt`

**Implementation:**
```kotlin
@Component
class PlantDataApiClient(
    private val restTemplate: RestTemplate
) {
    @Value("\${plantdata.api.url:http://localhost:8081}")
    private lateinit var apiUrl: String
    
    // GET /api/v1/plant-data/plants/{name}
    fun getPlantDetails(plantName: String): PlantDetailDTO?
    
    // GET /api/v1/plant-data/families
    fun getFamilies(): FamiliesResponseDTO
    
    // GET /api/v1/plant-data/diseases/soil-borne
    fun getSoilBorneDiseases(): SoilBorneDiseasesResponseDTO
    
    // GET /api/v1/plant-data/plants/{name}/companions
    fun getCompanions(plantName: String): CompanionListDTO?
}
```

**Configuration:**
- [ ] Add `plantdata.api.url` to `application.yml`
- [ ] Configure `RestTemplate` bean with error handling
- [ ] Add retry logic for API calls
- [ ] Add caching for plant data (TTL: 1 hour)

**Testing:**
- [ ] Unit tests for API client
- [ ] Integration tests with wiremock
- [ ] Test error handling and retries

---

## Phase 2: Planting History Enhancement (Week 1-2)

### 2.1 Enhance CropRecord Model
Track additional rotation-critical data.

**Files to Modify:**
- [ ] `src/main/kotlin/no/sogn/gardentime/model/CropRecord.kt`

**Add Fields:**
```kotlin
@Entity
class CropRecordEntity(
    // ... existing fields ...
    
    // NEW: Critical rotation data
    val plantFamily: String? = null,        // Cache from API
    val plantGenus: String? = null,         // Cache from API
    val feederType: String? = null,         // HEAVY, MODERATE, LIGHT
    val isNitrogenFixer: Boolean = false,   // Cache from API
    val rootDepth: String? = null,          // SHALLOW, MEDIUM, DEEP
    
    // Disease tracking
    val hadDiseases: Boolean = false,       // User marks if crop had diseases
    val diseaseNames: String? = null,       // Comma-separated disease names
    val diseaseNotes: String? = null,
    
    // Yield tracking
    val yieldRating: Int? = null,           // 1-5 stars for rotation scoring
    val soilQualityAfter: Int? = null,      // 1-5 user assessment
)
```

**Migration:**
- [ ] Create `V10__add_rotation_fields_to_crop_record.sql`
- [ ] Add new columns with nullable defaults
- [ ] Create indexes on `plantFamily`, `growZoneId`, `plantingDate`

### 2.2 Enhance CropRecord Service
Auto-populate plant data from API when creating crop records.

**Files to Modify:**
- [ ] `src/main/kotlin/no/sogn/gardentime/service/CropRecordService.kt`

**Implementation:**
```kotlin
@Transactional
fun createCropRecord(request: CreateCropRecordRequest): CropRecord {
    // 1. Fetch plant details from plant-data-aggregator API
    val plantData = plantDataApiClient.getPlantDetails(request.plantName)
        ?: throw PlantNotFoundException(request.plantName)
    
    // 2. Create crop record with cached plant data
    val cropRecord = CropRecordEntity(
        plantingDate = request.plantingDate,
        plant = findOrCreatePlantEntity(request.plantId),
        growZoneId = request.growAreaId,
        // Cache rotation-critical data
        plantFamily = plantData.family,
        plantGenus = plantData.genus,
        feederType = plantData.rotationData.feederType,
        isNitrogenFixer = plantData.rotationData.isNitrogenFixer,
        rootDepth = plantData.plantingDetails.rootDepth
    )
    
    return cropRecordRepository.save(cropRecord)
}
```

---

## Phase 3: Rotation Scoring Engine (Week 2)

### 3.1 Rotation Rules Configuration
Define rotation rules based on research.

**Files to Create:**
- [ ] `src/main/kotlin/no/sogn/gardentime/rotation/RotationRules.kt`

**Implementation:**
```kotlin
object RotationRules {
    // Family rotation intervals (in years)
    val FAMILY_ROTATION_YEARS = mapOf(
        "Solanaceae" to 3..4,      // Tomatoes, peppers
        "Brassicaceae" to 3..4,    // Cabbage, broccoli
        "Fabaceae" to 2..3,        // Beans, peas
        "Cucurbitaceae" to 2..3,   // Cucumbers, squash
        "Apiaceae" to 2..3,        // Carrots, celery
        "Amaranthaceae" to 2..3,   // Beets, spinach
        "Asteraceae" to 2..2,      // Lettuce
        "Amaryllidaceae" to 2..3   // Onions, garlic
    )
    
    // Disease persistence from soil-borne diseases API
    data class DiseaseRisk(
        val diseaseName: String,
        val persistenceYears: Int,
        val affectedFamilies: List<String>,
        val severity: String
    )
    
    // Scoring weights (total = 100)
    const val FAMILY_ROTATION_WEIGHT = 35
    const val NUTRIENT_BALANCE_WEIGHT = 25
    const val DISEASE_RISK_WEIGHT = 20
    const val ROOT_DEPTH_WEIGHT = 10
    const val COMPANION_WEIGHT = 10
}
```

### 3.2 Rotation Scoring Service
Core business logic for rotation validation.

**Files to Create:**
- [ ] `src/main/kotlin/no/sogn/gardentime/rotation/RotationScoringService.kt`
- [ ] `src/main/kotlin/no/sogn/gardentime/rotation/dto/RotationScore.kt`
- [ ] `src/main/kotlin/no/sogn/gardentime/rotation/dto/RotationIssue.kt`
- [ ] `src/main/kotlin/no/sogn/gardentime/rotation/dto/RotationBenefit.kt`

**Implementation:**
```kotlin
@Service
class RotationScoringService(
    private val cropRecordRepository: CropRecordRepository,
    private val plantDataApiClient: PlantDataApiClient
) {
    /**
     * Score a proposed planting in a grow area
     * Returns score 0-100 with issues and benefits
     */
    fun scoreRotation(
        growAreaId: Long,
        proposedPlantName: String,
        proposedPlantingDate: LocalDate
    ): RotationScore {
        
        // 1. Get planting history for this grow area
        val history = getPlantingHistory(growAreaId, yearsBack = 5)
        
        // 2. Get proposed plant details from API
        val plantData = plantDataApiClient.getPlantDetails(proposedPlantName)
            ?: throw PlantNotFoundException(proposedPlantName)
        
        // 3. Calculate family rotation score (35 points)
        val familyScore = scoreFamilyRotation(
            plantData.family,
            history,
            proposedPlantingDate
        )
        
        // 4. Calculate nutrient balance score (25 points)
        val nutrientScore = scoreNutrientBalance(
            plantData.rotationData.feederType,
            plantData.rotationData.isNitrogenFixer,
            history
        )
        
        // 5. Calculate disease risk score (20 points)
        val diseaseScore = scoreDiseaseRisk(
            plantData.family,
            history,
            proposedPlantingDate
        )
        
        // 6. Calculate root depth diversity score (10 points)
        val rootDepthScore = scoreRootDepthDiversity(
            plantData.plantingDetails.rootDepth,
            history
        )
        
        // 7. Calculate companion compatibility (10 points)
        val companionScore = scoreCompanionCompatibility(
            proposedPlantName,
            getCurrentCrops(growAreaId)
        )
        
        val totalScore = familyScore.points + nutrientScore.points + 
                        diseaseScore.points + rootDepthScore.points + 
                        companionScore.points
        
        return RotationScore(
            totalScore = totalScore,
            grade = calculateGrade(totalScore),
            familyRotation = familyScore,
            nutrientBalance = nutrientScore,
            diseaseRisk = diseaseScore,
            rootDepthDiversity = rootDepthScore,
            companionCompatibility = companionScore,
            issues = collectIssues(familyScore, diseaseScore, companionScore),
            benefits = collectBenefits(nutrientScore, rootDepthScore),
            recommendation = generateRecommendation(totalScore)
        )
    }
    
    private fun scoreFamilyRotation(
        family: String?,
        history: List<CropRecord>,
        proposedDate: LocalDate
    ): ScoreComponent {
        if (family == null) {
            return ScoreComponent(
                points = 20,  // Neutral if family unknown
                maxPoints = 35,
                details = "Plant family unknown",
                issues = emptyList()
            )
        }
        
        // Find most recent planting of same family
        val lastSameFamily = history
            .filter { it.plantFamily == family }
            .maxByOrNull { it.plantingDate }
        
        if (lastSameFamily == null) {
            return ScoreComponent(
                points = 35,
                maxPoints = 35,
                details = "First time planting $family in this area",
                issues = emptyList()
            )
        }
        
        val yearsSince = ChronoUnit.YEARS.between(
            lastSameFamily.plantingDate,
            proposedDate
        )
        
        val minYears = RotationRules.FAMILY_ROTATION_YEARS[family]?.first ?: 2
        val maxYears = RotationRules.FAMILY_ROTATION_YEARS[family]?.last ?: 4
        
        return when {
            yearsSince < 1 -> ScoreComponent(
                points = 0,
                maxPoints = 35,
                details = "Same family planted less than 1 year ago",
                issues = listOf(
                    RotationIssue(
                        severity = "CRITICAL",
                        category = "FAMILY_ROTATION",
                        message = "Planting $family too soon! Last planted ${lastSameFamily.plantingDate}. Risk of disease buildup.",
                        suggestion = "Wait at least $minYears years before replanting $family"
                    )
                )
            )
            yearsSince < 2 -> ScoreComponent(
                points = 10,
                maxPoints = 35,
                details = "$yearsSince year since last $family",
                issues = listOf(
                    RotationIssue(
                        severity = "WARNING",
                        category = "FAMILY_ROTATION",
                        message = "Short rotation for $family (only $yearsSince year)",
                        suggestion = "Minimum $minYears years recommended"
                    )
                )
            )
            yearsSince < minYears -> ScoreComponent(
                points = 20,
                maxPoints = 35,
                details = "$yearsSince years since last $family",
                issues = listOf(
                    RotationIssue(
                        severity = "INFO",
                        category = "FAMILY_ROTATION",
                        message = "Approaching minimum rotation for $family",
                        suggestion = "Ideal rotation is $minYears-$maxYears years"
                    )
                )
            )
            else -> ScoreComponent(
                points = 35,
                maxPoints = 35,
                details = "$yearsSince years since last $family (excellent!)",
                issues = emptyList()
            )
        }
    }
    
    private fun scoreDiseaseRisk(
        family: String?,
        history: List<CropRecord>,
        proposedDate: LocalDate
    ): ScoreComponent {
        // 1. Get soil-borne diseases from API
        val soilBorneDiseases = plantDataApiClient.getSoilBorneDiseases()
        
        // 2. Check if this family is affected by persistent diseases
        val riskyDiseases = soilBorneDiseases.diseases.filter { disease ->
            family != null && 
            disease.affectedFamilies.contains(family) &&
            disease.disease.persistenceYears > 0
        }
        
        if (riskyDiseases.isEmpty()) {
            return ScoreComponent(
                points = 20,
                maxPoints = 20,
                details = "No major disease concerns for $family",
                issues = emptyList()
            )
        }
        
        // 3. Check if any crops in history had diseases
        val diseasedCrops = history.filter { 
            it.hadDiseases && 
            it.plantFamily == family 
        }
        
        val issues = mutableListOf<RotationIssue>()
        var points = 20
        
        for (disease in riskyDiseases) {
            // Find if this disease affected crops in history
            val affectedCrop = diseasedCrops.firstOrNull { crop ->
                crop.diseaseNames?.contains(disease.disease.name, ignoreCase = true) == true
            }
            
            if (affectedCrop != null) {
                val yearsSince = ChronoUnit.YEARS.between(
                    affectedCrop.plantingDate,
                    proposedDate
                )
                
                if (yearsSince < disease.disease.persistenceYears) {
                    points -= 10
                    issues.add(
                        RotationIssue(
                            severity = "HIGH",
                            category = "DISEASE_RISK",
                            message = "${disease.disease.name} risk: Only $yearsSince years since infected crop",
                            suggestion = "Disease persists ${disease.disease.persistenceYears} years. Wait ${disease.disease.persistenceYears - yearsSince} more years or choose different family"
                        )
                    )
                }
            }
        }
        
        return ScoreComponent(
            points = maxOf(0, points),
            maxPoints = 20,
            details = if (issues.isEmpty()) "No disease history concerns" else "Disease risk detected",
            issues = issues
        )
    }
    
    private fun scoreNutrientBalance(
        feederType: String?,
        isNitrogenFixer: Boolean,
        history: List<CropRecord>
    ): ScoreComponent {
        if (history.isEmpty()) {
            return ScoreComponent(
                points = 15,
                maxPoints = 25,
                details = "No history to assess nutrient balance",
                issues = emptyList()
            )
        }
        
        val lastCrop = history.maxByOrNull { it.plantingDate }!!
        val benefits = mutableListOf<RotationBenefit>()
        
        val points = when {
            // Nitrogen fixer after heavy feeder = EXCELLENT
            isNitrogenFixer && lastCrop.feederType == "HEAVY" -> {
                benefits.add(
                    RotationBenefit(
                        category = "NUTRIENT_BALANCE",
                        message = "Nitrogen fixer after heavy feeder - excellent soil restoration!",
                        impact = "Replenishes nitrogen depleted by ${lastCrop.plant.name}"
                    )
                )
                25
            }
            // Light feeder after heavy feeder = GOOD
            feederType == "LIGHT" && lastCrop.feederType == "HEAVY" -> {
                benefits.add(
                    RotationBenefit(
                        category = "NUTRIENT_BALANCE",
                        message = "Light feeder after heavy feeder - good rotation",
                        impact = "Allows soil to recover"
                    )
                )
                20
            }
            // Heavy after nitrogen fixer = EXCELLENT
            feederType == "HEAVY" && lastCrop.isNitrogenFixer -> {
                benefits.add(
                    RotationBenefit(
                        category = "NUTRIENT_BALANCE",
                        message = "Heavy feeder after nitrogen fixer - perfect timing!",
                        impact = "Takes advantage of nitrogen-enriched soil"
                    )
                )
                25
            }
            // Heavy after heavy = WARNING
            feederType == "HEAVY" && lastCrop.feederType == "HEAVY" -> {
                10
            }
            else -> 15
        }
        
        return ScoreComponent(
            points = points,
            maxPoints = 25,
            details = "Nutrient balance score",
            issues = emptyList(),
            benefits = benefits
        )
    }
    
    private fun scoreRootDepthDiversity(
        rootDepth: String?,
        history: List<CropRecord>
    ): ScoreComponent {
        if (history.isEmpty() || rootDepth == null) {
            return ScoreComponent(points = 5, maxPoints = 10, details = "No history")
        }
        
        val recentCrops = history.sortedByDescending { it.plantingDate }.take(3)
        val allSameDepth = recentCrops.all { it.rootDepth == rootDepth }
        
        return when {
            allSameDepth -> ScoreComponent(
                points = 3,
                maxPoints = 10,
                details = "Same root depth as recent crops"
            )
            else -> ScoreComponent(
                points = 10,
                maxPoints = 10,
                details = "Good root depth diversity",
                benefits = listOf(
                    RotationBenefit(
                        category = "ROOT_DEPTH",
                        message = "Varying root depths improves soil structure",
                        impact = "Different depths access different nutrients"
                    )
                )
            )
        }
    }
    
    private fun scoreCompanionCompatibility(
        proposedPlantName: String,
        currentCrops: List<CropRecord>
    ): ScoreComponent {
        if (currentCrops.isEmpty()) {
            return ScoreComponent(points = 10, maxPoints = 10, details = "No current crops")
        }
        
        val companions = plantDataApiClient.getCompanions(proposedPlantName)
            ?: return ScoreComponent(points = 5, maxPoints = 10, details = "No companion data")
        
        val antagonistic = currentCrops.filter { crop ->
            companions.companions.antagonistic.any { 
                it.name.equals(crop.plant.name, ignoreCase = true) 
            }
        }
        
        val beneficial = currentCrops.filter { crop ->
            companions.companions.beneficial.any { 
                it.name.equals(crop.plant.name, ignoreCase = true) 
            }
        }
        
        return when {
            antagonistic.isNotEmpty() -> ScoreComponent(
                points = 0,
                maxPoints = 10,
                details = "Incompatible with current crops",
                issues = antagonistic.map { crop ->
                    RotationIssue(
                        severity = "WARNING",
                        category = "COMPANION",
                        message = "Not compatible with nearby ${crop.plant.name}",
                        suggestion = "Plant elsewhere or remove ${crop.plant.name}"
                    )
                }
            )
            beneficial.isNotEmpty() -> ScoreComponent(
                points = 10,
                maxPoints = 10,
                details = "Great companions nearby!",
                benefits = beneficial.map { crop ->
                    RotationBenefit(
                        category = "COMPANION",
                        message = "Beneficial with nearby ${crop.plant.name}",
                        impact = "Mutual benefits for growth and pest control"
                    )
                }
            )
            else -> ScoreComponent(points = 5, maxPoints = 10, details = "Neutral companions")
        }
    }
    
    private fun getPlantingHistory(
        growAreaId: Long,
        yearsBack: Int
    ): List<CropRecord> {
        val cutoffDate = LocalDate.now().minusYears(yearsBack.toLong())
        return cropRecordRepository
            .findByGrowZoneIdAndPlantingDateAfter(growAreaId, cutoffDate)
            .map { mapCropRecordEntityToDomain(it) }
            .sortedByDescending { it.plantingDate }
    }
    
    private fun getCurrentCrops(growAreaId: Long): List<CropRecord> {
        // Crops planted in last 6 months without harvest date
        val sixMonthsAgo = LocalDate.now().minusMonths(6)
        return cropRecordRepository
            .findByGrowZoneIdAndPlantingDateAfterAndHarvestDateIsNull(
                growAreaId,
                sixMonthsAgo
            )
            .map { mapCropRecordEntityToDomain(it) }
    }
    
    private fun calculateGrade(score: Int): String {
        return when {
            score >= 90 -> "EXCELLENT"
            score >= 75 -> "GOOD"
            score >= 60 -> "FAIR"
            score >= 40 -> "POOR"
            else -> "AVOID"
        }
    }
    
    private fun generateRecommendation(score: Int): String {
        return when {
            score >= 90 -> "Excellent choice! This rotation follows best practices."
            score >= 75 -> "Good rotation. Plant with confidence."
            score >= 60 -> "Acceptable rotation with minor concerns. Review issues."
            score >= 40 -> "Questionable rotation. Consider alternatives."
            else -> "NOT RECOMMENDED. High risk of problems. Choose different plant or location."
        }
    }
}

// DTOs
data class RotationScore(
    val totalScore: Int,  // 0-100
    val grade: String,    // EXCELLENT, GOOD, FAIR, POOR, AVOID
    val familyRotation: ScoreComponent,
    val nutrientBalance: ScoreComponent,
    val diseaseRisk: ScoreComponent,
    val rootDepthDiversity: ScoreComponent,
    val companionCompatibility: ScoreComponent,
    val issues: List<RotationIssue>,
    val benefits: List<RotationBenefit>,
    val recommendation: String
)

data class ScoreComponent(
    val points: Int,
    val maxPoints: Int,
    val details: String,
    val issues: List<RotationIssue> = emptyList(),
    val benefits: List<RotationBenefit> = emptyList()
)

data class RotationIssue(
    val severity: String,  // CRITICAL, HIGH, WARNING, INFO
    val category: String,  // FAMILY_ROTATION, DISEASE_RISK, COMPANION, etc.
    val message: String,
    val suggestion: String
)

data class RotationBenefit(
    val category: String,
    val message: String,
    val impact: String
)
```

---

## Phase 4: Rotation Recommendation Engine (Week 3)

### 4.1 Recommendation Service
Suggest what to plant next in a grow area.

**Files to Create:**
- [ ] `src/main/kotlin/no/sogn/gardentime/rotation/RotationRecommendationService.kt`
- [ ] `src/main/kotlin/no/sogn/gardentime/rotation/dto/PlantRecommendation.kt`

**Implementation:**
```kotlin
@Service
class RotationRecommendationService(
    private val cropRecordRepository: CropRecordRepository,
    private val plantDataApiClient: PlantDataApiClient,
    private val rotationScoringService: RotationScoringService
) {
    /**
     * Recommend plants for a grow area
     * Returns ranked list of suitable plants
     */
    fun getRecommendations(
        growAreaId: Long,
        season: String? = null,
        maxResults: Int = 10
    ): List<PlantRecommendation> {
        
        // 1. Get planting history
        val history = rotationScoringService.getPlantingHistory(growAreaId, 5)
        
        // 2. Get all plants from API
        val allPlants = plantDataApiClient.getPlants(
            page = 0,
            size = 200  // Get comprehensive list
        )
        
        // 3. Score each plant
        val recommendations = allPlants.plants.mapNotNull { plant ->
            try {
                val score = rotationScoringService.scoreRotation(
                    growAreaId = growAreaId,
                    proposedPlantName = plant.name,
                    proposedPlantingDate = LocalDate.now()
                )
                
                // Filter: only recommend plants with score >= 60
                if (score.totalScore >= 60) {
                    PlantRecommendation(
                        plant = plant,
                        rotationScore = score,
                        suitabilityReason = generateSuitabilityReason(score, history)
                    )
                } else null
            } catch (e: Exception) {
                null  // Skip plants that can't be scored
            }
        }
        
        // 4. Sort by score and return top results
        return recommendations
            .sortedByDescending { it.rotationScore.totalScore }
            .take(maxResults)
    }
    
    private fun generateSuitabilityReason(
        score: RotationScore,
        history: List<CropRecord>
    ): String {
        val reasons = mutableListOf<String>()
        
        if (score.familyRotation.points >= 30) {
            reasons.add("Good family rotation")
        }
        
        if (score.nutrientBalance.points >= 20) {
            reasons.add("Excellent nutrient balance")
        }
        
        if (score.diseaseRisk.points >= 18) {
            reasons.add("Low disease risk")
        }
        
        return reasons.joinToString("; ")
    }
}

data class PlantRecommendation(
    val plant: PlantSummaryDTO,
    val rotationScore: RotationScore,
    val suitabilityReason: String,
    val bestPlantingWindow: String? = null
)
```

---

## Phase 5: REST API Endpoints (Week 3)

### 5.1 Rotation Controller
Expose rotation functionality via REST API.

**Files to Create:**
- [ ] `src/main/kotlin/no/sogn/gardentime/api/RotationController.kt`

**Endpoints:**
```kotlin
@RestController
@RequestMapping("/api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation")
class RotationController(
    private val rotationScoringService: RotationScoringService,
    private val rotationRecommendationService: RotationRecommendationService
) {
    
    /**
     * POST /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/validate
     * Validate a proposed planting
     */
    @PostMapping("/validate")
    fun validateRotation(
        @PathVariable gardenId: UUID,
        @PathVariable growAreaId: Long,
        @RequestBody request: ValidateRotationRequest
    ): ResponseEntity<RotationScore> {
        val score = rotationScoringService.scoreRotation(
            growAreaId = growAreaId,
            proposedPlantName = request.plantName,
            proposedPlantingDate = request.plantingDate
        )
        return ResponseEntity.ok(score)
    }
    
    /**
     * GET /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/recommendations
     * Get recommended plants for this grow area
     */
    @GetMapping("/recommendations")
    fun getRecommendations(
        @PathVariable gardenId: UUID,
        @PathVariable growAreaId: Long,
        @RequestParam(required = false) season: String?,
        @RequestParam(defaultValue = "10") maxResults: Int
    ): ResponseEntity<List<PlantRecommendation>> {
        val recommendations = rotationRecommendationService.getRecommendations(
            growAreaId = growAreaId,
            season = season,
            maxResults = maxResults
        )
        return ResponseEntity.ok(recommendations)
    }
    
    /**
     * GET /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/history
     * Get planting history for rotation analysis
     */
    @GetMapping("/history")
    fun getRotationHistory(
        @PathVariable gardenId: UUID,
        @PathVariable growAreaId: Long,
        @RequestParam(defaultValue = "5") yearsBack: Int
    ): ResponseEntity<PlantingHistoryResponse> {
        val history = cropRecordRepository
            .findByGrowZoneIdAndPlantingDateAfter(
                growAreaId,
                LocalDate.now().minusYears(yearsBack.toLong())
            )
            .map { mapCropRecordEntityToDTO(it) }
            .sortedByDescending { it.datePlanted }
        
        return ResponseEntity.ok(
            PlantingHistoryResponse(
                growAreaId = growAreaId,
                yearsAnalyzed = yearsBack,
                cropRecords = history
            )
        )
    }
}

data class ValidateRotationRequest(
    val plantName: String,
    val plantingDate: LocalDate = LocalDate.now()
)

data class PlantingHistoryResponse(
    val growAreaId: Long,
    val yearsAnalyzed: Int,
    val cropRecords: List<CropRecordDTO>
)
```

---

## Phase 6: Frontend Integration (Week 4)

### 6.1 Rotation Planner UI Component
Create React/Next.js component for rotation planning.

**Files to Create (in client-next):**
- [ ] `components/rotation/RotationPlanner.tsx`
- [ ] `components/rotation/RotationScore.tsx`
- [ ] `components/rotation/PlantRecommendations.tsx`
- [ ] `components/rotation/PlantingHistory.tsx`

**Features:**
- Visual timeline of past plantings by family
- Color-coded rotation calendar
- Interactive rotation score visualization
- Plant recommendation cards with scores
- "What can I plant here?" search
- Disease risk warnings
- Companion planting suggestions

---

## Phase 7: Enhanced Features (Week 4-5)

### 7.1 Rotation Plan Templates
Pre-configured rotation plans for common scenarios.

**Examples:**
- Classic 4-year rotation
- 3-bed rotation system
- Intensive raised bed rotation
- Permaculture guild rotation

### 7.2 Multi-Year Planning
Plan rotations 3-5 years in advance.

### 7.3 Rotation Analytics
- Soil health trends over time
- Family diversity metrics
- Nutrient balance tracking
- Disease pressure heat maps

---

## Testing Strategy

### Unit Tests
- [ ] API client tests with wiremock
- [ ] Rotation scoring logic tests
- [ ] Each scoring component independently
- [ ] Edge cases (no history, unknown plants, etc.)

### Integration Tests
- [ ] End-to-end rotation validation flow
- [ ] Recommendation generation with real data
- [ ] API endpoint tests

### User Acceptance Tests
- [ ] Test with real garden scenarios
- [ ] Validate rotation rules accuracy
- [ ] Ensure recommendations make sense to gardeners

---

## Success Metrics

### Functional
- [ ] Can validate any plant in any grow area
- [ ] Recommendations score >= 75 average
- [ ] Catches critical rotation violations (< 2 year family rotation)
- [ ] Properly handles disease history
- [ ] Accurate nutrient balance tracking

### Performance
- [ ] Rotation validation < 500ms
- [ ] Recommendations generation < 2 seconds
- [ ] API calls cached appropriately
- [ ] Handles 50+ years of history per grow area

### User Experience
- [ ] Clear, actionable recommendations
- [ ] Visual rotation calendar intuitive
- [ ] Easy to understand scoring
- [ ] Helpful error messages and suggestions

---

## Dependencies

### External APIs
- plant-data-aggregator API must be running
- Requires complete plant family data
- Requires soil-borne disease data

### Database
- CropRecord must track planting history
- Need at least 2-3 years of data for meaningful rotation

### Configuration
- API URL configuration
- Rotation rules tunable
- Scoring weights adjustable

---

## Documentation

### Developer Documentation
- [ ] API client usage guide
- [ ] Rotation scoring algorithm explained
- [ ] How to add new rotation rules
- [ ] Extending scoring components

### User Documentation
- [ ] Crop rotation principles explained
- [ ] How to interpret rotation scores
- [ ] Understanding recommendations
- [ ] Best practices guide

---

## Timeline Summary

**Week 1**: API Client + History Enhancement  
**Week 2**: Rotation Scoring Engine  
**Week 3**: Recommendation Engine + REST API  
**Week 4**: Frontend Integration  
**Week 5**: Enhanced Features + Testing  

**Total**: 5 weeks to production-ready rotation planner

---

## Notes

This rotation planner will be a **differentiating feature** for GardenTime - very few garden planning apps have intelligent rotation validation based on real agronomic principles. The scoring system is based on proven regenerative farming practices and will genuinely help users grow healthier, more productive gardens.
