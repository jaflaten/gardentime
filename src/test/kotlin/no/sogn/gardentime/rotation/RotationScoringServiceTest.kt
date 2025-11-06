package no.sogn.gardentime.rotation

import no.sogn.gardentime.client.PlantDataApiClient
import no.sogn.gardentime.client.dto.*
import no.sogn.gardentime.db.CropRecordRepository
import no.sogn.gardentime.model.CropRecordEntity
import no.sogn.gardentime.model.PlantEntity
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.kotlin.*
import java.time.LocalDate
import java.util.UUID

/**
 * Tests for RotationScoringService
 */
class RotationScoringServiceTest {
    
    private lateinit var cropRecordRepository: CropRecordRepository
    private lateinit var plantDataApiClient: PlantDataApiClient
    private lateinit var service: RotationScoringService
    
    @BeforeEach
    fun setup() {
        cropRecordRepository = mock()
        plantDataApiClient = mock()
        service = RotationScoringService(cropRecordRepository, plantDataApiClient)
    }
    
    @Test
    fun `scoreRotation returns excellent score for first crop in area`() {
        // Given
        val growAreaId = 1L
        val plantName = "Tomato"
        val plantData = createTomatoPlantData()
        
        whenever(plantDataApiClient.getPlantDetails(plantName)).thenReturn(plantData)
        whenever(cropRecordRepository.findByGrowZoneIdAndPlantingDateAfter(any(), any()))
            .thenReturn(emptyList())
        whenever(cropRecordRepository.findByGrowZoneIdAndPlantingDateAfterAndHarvestDateIsNull(any(), any()))
            .thenReturn(emptyList())
        whenever(plantDataApiClient.getSoilBorneDiseases())
            .thenReturn(SoilBorneDiseasesResponseDTO(emptyList()))
        
        // When
        val score = service.scoreRotation(growAreaId, plantName)
        
        // Then
        assertNotNull(score)
        assertTrue(score.totalScore >= 85, "First crop should score excellent")
        assertEquals("EXCELLENT", score.grade)
        assertTrue(score.issues.isEmpty(), "Should have no issues")
    }
    
    @Test
    fun `scoreRotation gives critical warning for same family within 1 year`() {
        // Given
        val growAreaId = 1L
        val plantName = "Tomato"
        val plantData = createTomatoPlantData()
        
        // Previous tomato planted 6 months ago
        val previousCrop = createCropRecord(
            plantName = "Pepper",
            family = "Solanaceae",
            plantingDate = LocalDate.now().minusMonths(6),
            feederType = "HEAVY"
        )
        
        whenever(plantDataApiClient.getPlantDetails(plantName)).thenReturn(plantData)
        whenever(cropRecordRepository.findByGrowZoneIdAndPlantingDateAfter(any(), any()))
            .thenReturn(listOf(previousCrop))
        whenever(cropRecordRepository.findByGrowZoneIdAndPlantingDateAfterAndHarvestDateIsNull(any(), any()))
            .thenReturn(emptyList())
        whenever(plantDataApiClient.getSoilBorneDiseases())
            .thenReturn(SoilBorneDiseasesResponseDTO(emptyList()))
        
        // When
        val score = service.scoreRotation(growAreaId, plantName)
        
        // Then
        assertTrue(score.totalScore < 40, "Same family within 1 year should score AVOID")
        assertEquals("AVOID", score.grade)
        
        val criticalIssues = score.issues.filter { it.severity.name == "CRITICAL" }
        assertTrue(criticalIssues.isNotEmpty(), "Should have critical issues")
        assertTrue(criticalIssues.any { it.category == "Family Rotation" })
    }
    
    @Test
    fun `scoreRotation rewards nitrogen fixer after heavy feeder`() {
        // Given
        val growAreaId = 1L
        val plantName = "Pea"  // Nitrogen fixer
        val plantData = createPeaPlantData()
        
        // Previous heavy feeder
        val previousCrop = createCropRecord(
            plantName = "Tomato",
            family = "Solanaceae",
            plantingDate = LocalDate.now().minusYears(1),
            feederType = "HEAVY"
        )
        
        whenever(plantDataApiClient.getPlantDetails(plantName)).thenReturn(plantData)
        whenever(cropRecordRepository.findByGrowZoneIdAndPlantingDateAfter(any(), any()))
            .thenReturn(listOf(previousCrop))
        whenever(cropRecordRepository.findByGrowZoneIdAndPlantingDateAfterAndHarvestDateIsNull(any(), any()))
            .thenReturn(emptyList())
        whenever(plantDataApiClient.getSoilBorneDiseases())
            .thenReturn(SoilBorneDiseasesResponseDTO(emptyList()))
        
        // When
        val score = service.scoreRotation(growAreaId, plantName)
        
        // Then
        assertTrue(score.totalScore >= 85, "Nitrogen fixer after heavy feeder should score excellent")
        
        val nutrientBenefits = score.benefits.filter { it.category == "Nutrient Balance" }
        assertTrue(nutrientBenefits.isNotEmpty(), "Should have nutrient balance benefits")
    }
    
    @Test
    fun `scoreRotation detects disease risk from previous crops`() {
        // Given
        val growAreaId = 1L
        val plantName = "Tomato"
        val plantData = createTomatoPlantData()
        
        // Previous diseased Solanaceae crop 1 year ago
        val diseasedCrop = createCropRecord(
            plantName = "Pepper",
            family = "Solanaceae",
            plantingDate = LocalDate.now().minusYears(1),
            hadDiseases = true,
            diseaseNames = "Blight"
        )
        
        val blightDisease = createBlightDisease()
        
        whenever(plantDataApiClient.getPlantDetails(plantName)).thenReturn(plantData)
        whenever(cropRecordRepository.findByGrowZoneIdAndPlantingDateAfter(any(), any()))
            .thenReturn(listOf(diseasedCrop))
        whenever(cropRecordRepository.findByGrowZoneIdAndPlantingDateAfterAndHarvestDateIsNull(any(), any()))
            .thenReturn(emptyList())
        whenever(plantDataApiClient.getSoilBorneDiseases())
            .thenReturn(SoilBorneDiseasesResponseDTO(listOf(blightDisease)))
        
        // When
        val score = service.scoreRotation(growAreaId, plantName)
        
        // Then
        assertTrue(score.totalScore < 70, "Disease risk should lower score")
        
        val diseaseIssues = score.issues.filter { it.category == "Disease History" }
        assertTrue(diseaseIssues.isNotEmpty(), "Should have disease warnings")
    }
    
    @Test
    fun `scoreRotation rewards root depth diversity`() {
        // Given
        val growAreaId = 1L
        val plantName = "Carrot"  // Deep roots
        val plantData = createCarrotPlantData()
        
        // Previous crops with varying depths
        val crop1 = createCropRecord(
            plantName = "Lettuce",
            family = "Asteraceae",
            plantingDate = LocalDate.now().minusMonths(3),
            rootDepth = "SHALLOW"
        )
        val crop2 = createCropRecord(
            plantName = "Tomato",
            family = "Solanaceae",
            plantingDate = LocalDate.now().minusMonths(9),
            rootDepth = "MEDIUM"
        )
        
        whenever(plantDataApiClient.getPlantDetails(plantName)).thenReturn(plantData)
        whenever(cropRecordRepository.findByGrowZoneIdAndPlantingDateAfter(any(), any()))
            .thenReturn(listOf(crop1, crop2))
        whenever(cropRecordRepository.findByGrowZoneIdAndPlantingDateAfterAndHarvestDateIsNull(any(), any()))
            .thenReturn(emptyList())
        whenever(plantDataApiClient.getSoilBorneDiseases())
            .thenReturn(SoilBorneDiseasesResponseDTO(emptyList()))
        
        // When
        val score = service.scoreRotation(growAreaId, plantName)
        
        // Then
        val depthBenefits = score.benefits.filter { it.category == "Root Depth Diversity" }
        assertTrue(depthBenefits.isNotEmpty(), "Should reward depth diversity")
    }
    
    @Test
    fun `scoreRotation detects antagonistic companions`() {
        // Given
        val growAreaId = 1L
        val plantName = "Tomato"
        val plantData = createTomatoPlantData()
        
        // Fennel is antagonistic to tomatoes
        val currentFennel = createCropRecord(
            plantName = "Fennel",
            family = "Apiaceae",
            plantingDate = LocalDate.now().minusMonths(1)
        )
        
        val companions = createTomatoCompanions()
        
        whenever(plantDataApiClient.getPlantDetails(plantName)).thenReturn(plantData)
        whenever(cropRecordRepository.findByGrowZoneIdAndPlantingDateAfter(any(), any()))
            .thenReturn(emptyList())
        whenever(cropRecordRepository.findByGrowZoneIdAndPlantingDateAfterAndHarvestDateIsNull(any(), any()))
            .thenReturn(listOf(currentFennel))
        whenever(plantDataApiClient.getSoilBorneDiseases())
            .thenReturn(SoilBorneDiseasesResponseDTO(emptyList()))
        whenever(plantDataApiClient.getCompanions(plantName))
            .thenReturn(companions)
        
        // When
        val score = service.scoreRotation(growAreaId, plantName)
        
        // Then
        val companionIssues = score.issues.filter { it.category == "Companion Planting" }
        assertTrue(companionIssues.isNotEmpty(), "Should detect antagonistic companions")
    }
    
    @Test
    fun `scoreRotation handles missing plant data gracefully`() {
        // Given
        val growAreaId = 1L
        val plantName = "UnknownPlant"
        
        whenever(plantDataApiClient.getPlantDetails(plantName)).thenReturn(null)
        
        // When
        val score = service.scoreRotation(growAreaId, plantName)
        
        // Then
        assertNotNull(score)
        assertEquals("FAIR", score.grade)
        assertEquals(50, score.totalScore)
        assertTrue(score.issues.any { it.message.contains("Plant data not found") })
    }
    
    // Helper methods to create test data
    
    private fun createTomatoPlantData() = PlantDetailDTO(
        id = UUID.randomUUID(),
        name = "Tomato",
        scientificName = "Solanum lycopersicum",
        family = "Solanaceae",
        genus = "Solanum",
        cycle = "ANNUAL",
        growthRequirements = GrowthRequirementsDTO("FULL_SUN", "MODERATE", 6.0, 6.8, false),
        plantingDetails = PlantingDetailsDTO("DEEP", "BUSH", 60, 90, 14, listOf("fruit")),
        rotationData = RotationDataDTO("HEAVY", false, "NONE"),
        companionCount = CompanionCountDTO(15, 8, 3),
        pestCount = 5,
        diseaseCount = 4,
        synonyms = emptyList()
    )
    
    private fun createPeaPlantData() = PlantDetailDTO(
        id = UUID.randomUUID(),
        name = "Pea",
        scientificName = "Pisum sativum",
        family = "Fabaceae",
        genus = "Pisum",
        cycle = "ANNUAL",
        growthRequirements = GrowthRequirementsDTO("FULL_SUN", "MODERATE", 6.0, 7.0, false),
        plantingDetails = PlantingDetailsDTO("MEDIUM", "VINE", 50, 70, 14, listOf("seed")),
        rotationData = RotationDataDTO("LIGHT", true, "NITROGEN"),
        companionCount = CompanionCountDTO(10, 5, 2),
        pestCount = 3,
        diseaseCount = 2,
        synonyms = emptyList()
    )
    
    private fun createCarrotPlantData() = PlantDetailDTO(
        id = UUID.randomUUID(),
        name = "Carrot",
        scientificName = "Daucus carota",
        family = "Apiaceae",
        genus = "Daucus",
        cycle = "BIENNIAL",
        growthRequirements = GrowthRequirementsDTO("FULL_SUN", "MODERATE", 5.5, 6.8, false),
        plantingDetails = PlantingDetailsDTO("DEEP", "ROSETTE", 70, 80, 21, listOf("root")),
        rotationData = RotationDataDTO("LIGHT", false, "NONE"),
        companionCount = CompanionCountDTO(8, 3, 2),
        pestCount = 4,
        diseaseCount = 3,
        synonyms = emptyList()
    )
    
    private fun createCropRecord(
        plantName: String,
        family: String,
        plantingDate: LocalDate,
        feederType: String = "MODERATE",
        rootDepth: String = "MEDIUM",
        hadDiseases: Boolean = false,
        diseaseNames: String? = null
    ) = CropRecordEntity(
        id = UUID.randomUUID(),
        name = plantName,
        plantingDate = plantingDate,
        plant = PlantEntity(id = 1L, name = plantName),
        growZoneId = 1L,
        plantFamily = family,
        feederType = feederType,
        rootDepth = rootDepth,
        hadDiseases = hadDiseases,
        diseaseNames = diseaseNames
    )
    
    private fun createBlightDisease() = SoilBorneDiseaseDTO(
        disease = DiseaseDTO(
            id = UUID.randomUUID(),
            name = "Blight",
            scientificName = "Phytophthora infestans",
            description = "Late blight",
            treatmentOptions = "Crop rotation",
            severity = "CRITICAL",
            isSoilBorne = true,
            persistenceYears = 3
        ),
        affectedFamilies = listOf("Solanaceae"),
        affectedPlantCount = 5
    )
    
    private fun createTomatoCompanions() = CompanionListDTO(
        plant = PlantBasicDTO(
            id = UUID.randomUUID(),
            name = "Tomato",
            scientificName = "Solanum lycopersicum"
        ),
        companions = CompanionsByRelationshipDTO(
            beneficial = listOf(
                CompanionDTO(
                    id = UUID.randomUUID(),
                    name = "Basil",
                    scientificName = "Ocimum basilicum",
                    relationship = "BENEFICIAL",
                    reason = "Repels aphids and hornworms",
                    mechanism = "Aromatic pest deterrent",
                    confidenceLevel = "HIGH",
                    evidenceType = "TRADITIONAL"
                )
            ),
            antagonistic = listOf(
                CompanionDTO(
                    id = UUID.randomUUID(),
                    name = "Fennel",
                    scientificName = "Foeniculum vulgare",
                    relationship = "ANTAGONISTIC",
                    reason = "Inhibits tomato growth",
                    mechanism = "Allelopathic compounds",
                    confidenceLevel = "MEDIUM",
                    evidenceType = "TRADITIONAL"
                )
            ),
            neutral = emptyList()
        ),
        summary = CompanionCountDTO(1, 1, 0)
    )
}
