package no.sogn.gardentime.service

import no.sogn.gardentime.client.PlantDataApiClient
import no.sogn.gardentime.db.CropRecordRepository
import no.sogn.gardentime.db.GardenRepository
import no.sogn.gardentime.db.PlantRepository
import no.sogn.gardentime.exceptions.GardenIdNotFoundException
import no.sogn.gardentime.model.CropRecordEntity
import no.sogn.gardentime.model.CropStatus
import no.sogn.gardentime.model.GardenEntity
import no.sogn.gardentime.model.GrowAreaEntity
import no.sogn.gardentime.security.SecurityUtils
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.kotlin.*
import java.time.LocalDate
import java.util.*

class CropRecordServiceTest {

    private lateinit var cropRecordRepository: CropRecordRepository
    private lateinit var gardenRepository: GardenRepository
    private lateinit var plantRepository: PlantRepository
    private lateinit var securityUtils: SecurityUtils
    private lateinit var plantDataApiClient: PlantDataApiClient
    private lateinit var service: CropRecordService

    private val testUserId = UUID.randomUUID()
    private val testGardenId = UUID.randomUUID()

    @BeforeEach
    fun setup() {
        cropRecordRepository = mock()
        gardenRepository = mock()
        plantRepository = mock()
        securityUtils = mock()
        plantDataApiClient = mock()

        whenever(securityUtils.getCurrentUserId()).thenReturn(testUserId)

        service = CropRecordService(
            cropRecordRepository,
            gardenRepository,
            plantRepository,
            securityUtils,
            plantDataApiClient
        )
    }

    @Test
    fun `getCropRecordsByGardenId returns all crop records for garden grow areas`() {
        // Given
        val growArea1 = GrowAreaEntity(id = 1L, name = "Bed 1", gardenId = testGardenId)
        val growArea2 = GrowAreaEntity(id = 2L, name = "Bed 2", gardenId = testGardenId)
        val gardenEntity = GardenEntity(
            id = testGardenId,
            name = "Test Garden",
            growAreas = mutableListOf(growArea1, growArea2),
            userId = testUserId
        )

        val cropRecord1 = createCropRecord(growZoneId = 1L, plantName = "Tomato")
        val cropRecord2 = createCropRecord(growZoneId = 1L, plantName = "Basil")
        val cropRecord3 = createCropRecord(growZoneId = 2L, plantName = "Carrot")

        whenever(gardenRepository.findGardenEntityById(testGardenId)).thenReturn(gardenEntity)
        whenever(cropRecordRepository.findByGrowZoneIdIn(listOf(1L, 2L)))
            .thenReturn(listOf(cropRecord1, cropRecord2, cropRecord3))

        // When
        val result = service.getCropRecordsByGardenId(testGardenId)

        // Then
        assertEquals(3, result.size)
        assertTrue(result.any { it.plantName == "Tomato" })
        assertTrue(result.any { it.plantName == "Basil" })
        assertTrue(result.any { it.plantName == "Carrot" })
        verify(cropRecordRepository).findByGrowZoneIdIn(listOf(1L, 2L))
    }

    @Test
    fun `getCropRecordsByGardenId returns empty list for garden with no grow areas`() {
        // Given
        val gardenEntity = GardenEntity(
            id = testGardenId,
            name = "Empty Garden",
            growAreas = mutableListOf(),
            userId = testUserId
        )

        whenever(gardenRepository.findGardenEntityById(testGardenId)).thenReturn(gardenEntity)

        // When
        val result = service.getCropRecordsByGardenId(testGardenId)

        // Then
        assertTrue(result.isEmpty())
        verify(cropRecordRepository, never()).findByGrowZoneIdIn(any())
    }

    @Test
    fun `getCropRecordsByGardenId throws exception for non-existent garden`() {
        // Given
        val nonExistentGardenId = UUID.randomUUID()
        whenever(gardenRepository.findGardenEntityById(nonExistentGardenId)).thenReturn(null)

        // When/Then
        assertThrows(GardenIdNotFoundException::class.java) {
            service.getCropRecordsByGardenId(nonExistentGardenId)
        }
    }

    @Test
    fun `getCropRecordsByGardenId throws exception when user does not own garden`() {
        // Given
        val otherUserId = UUID.randomUUID()
        val gardenEntity = GardenEntity(
            id = testGardenId,
            name = "Someone Else's Garden",
            growAreas = mutableListOf(),
            userId = otherUserId
        )

        whenever(gardenRepository.findGardenEntityById(testGardenId)).thenReturn(gardenEntity)

        // When/Then
        assertThrows(IllegalAccessException::class.java) {
            service.getCropRecordsByGardenId(testGardenId)
        }
    }

    @Test
    fun `getCropRecordsByGardenId returns crop records with correct growAreaId mapping`() {
        // Given
        val growArea1 = GrowAreaEntity(id = 100L, name = "Area A", gardenId = testGardenId)
        val growArea2 = GrowAreaEntity(id = 200L, name = "Area B", gardenId = testGardenId)
        val gardenEntity = GardenEntity(
            id = testGardenId,
            name = "Test Garden",
            growAreas = mutableListOf(growArea1, growArea2),
            userId = testUserId
        )

        val cropRecord1 = createCropRecord(growZoneId = 100L, plantName = "Peas")
        val cropRecord2 = createCropRecord(growZoneId = 200L, plantName = "Beans")

        whenever(gardenRepository.findGardenEntityById(testGardenId)).thenReturn(gardenEntity)
        whenever(cropRecordRepository.findByGrowZoneIdIn(listOf(100L, 200L)))
            .thenReturn(listOf(cropRecord1, cropRecord2))

        // When
        val result = service.getCropRecordsByGardenId(testGardenId)

        // Then
        assertEquals(2, result.size)
        val peasRecord = result.find { it.plantName == "Peas" }
        val beansRecord = result.find { it.plantName == "Beans" }
        assertNotNull(peasRecord)
        assertNotNull(beansRecord)
        assertEquals(100L, peasRecord!!.growAreaId)
        assertEquals(200L, beansRecord!!.growAreaId)
    }

    private fun createCropRecord(
        growZoneId: Long,
        plantName: String,
        status: CropStatus = CropStatus.PLANTED
    ) = CropRecordEntity(
        id = UUID.randomUUID(),
        name = plantName,
        plantingDate = LocalDate.now(),
        plantId = UUID.randomUUID().toString(),
        plantName = plantName,
        growZoneId = growZoneId,
        status = status
    )
}