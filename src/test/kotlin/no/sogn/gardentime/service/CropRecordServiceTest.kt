package no.sogn.gardentime.service

import no.sogn.gardentime.client.PlantDataApiClient
import no.sogn.gardentime.db.CropRecordRepository
import no.sogn.gardentime.db.GardenRepository
import no.sogn.gardentime.db.GrowZoneRepository
import no.sogn.gardentime.dto.PlantSummaryDTO
import no.sogn.gardentime.model.CropRecordEntity
import no.sogn.gardentime.model.GardenEntity
import no.sogn.gardentime.model.GrowZoneEntity
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.anyOrNull
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.bean.override.mockito.MockitoBean
import java.time.LocalDate
import java.util.*

@SpringBootTest
@ExtendWith(MockitoExtension::class)
class CropRecordServiceTest {

    @Autowired
    private lateinit var cropRecordService: CropRecordService

    @MockitoBean
    lateinit var cropRecordRepository: CropRecordRepository

    @MockitoBean
    lateinit var gardenRepository: GardenRepository

    @MockitoBean
    lateinit var growZoneRepository: GrowZoneRepository

    @MockitoBean
    lateinit var plantDataApiClient: PlantDataApiClient

    @BeforeEach
    fun setup() {
    }

    @AfterEach
    fun tearDown() {
//        cropRecordRepository.deleteAll()
//        gardenRepository.deleteAll()
    }

    // kan ikkje lagre ting i databasen når dei er mocks, må mocke respons. Ser ut til å ikkje få SO slik..
    @Test
    fun `add new crop record`() {
        val garden = testGardenEntity("my test garden")

        val growZone = emptyTestGrowZoneEntity(garden.id!!)
        garden.growZones.add(growZone)
        Mockito.`when`(growZoneRepository.save(any())).thenReturn(growZone)
        Mockito.`when`(gardenRepository.save(any())).thenReturn(garden)


        Assertions.assertTrue(garden.growZones.size == 1, "Garden should have one grow zone")
        Assertions.assertNotNull(garden.id, "Garden should have an ID")
        Mockito.`when`(gardenRepository.findGardenEntityById(anyOrNull())).thenReturn(garden)

        val testPlantId = UUID.randomUUID().toString()
        val testPlant = PlantSummaryDTO(
            id = testPlantId,
            name = "Carrot",
            scientificName = "Daucus carota",
            family = "Apiaceae"
        )
        Mockito.`when`(plantDataApiClient.getPlantByName("Carrot")).thenReturn(testPlant)

        val cropRecord = testCropRecordEntity(growZone.id!!, testPlantId, "Carrot")
        Mockito.`when`(cropRecordRepository.save(any())).thenReturn(cropRecord)

        val res = cropRecordService.addCropRecord("Carrot", garden.id!!, growZone.id!!)
        Assertions.assertNotNull(res, "Crop record should not be null")

        Assertions.assertEquals(res.plantName, cropRecord.plantName, "Crop record should have name Carrot")
    }

}

fun testGardenEntity(name: String): GardenEntity {
    return GardenEntity(
        id = UUID.randomUUID(),
        name = name,
        growZones = mutableListOf(
        )
    )
}


fun emptyTestGrowZoneEntity(gardenId: UUID): GrowZoneEntity {
    return GrowZoneEntity(
        id = 1,
        name = "Test Grow Zone empty initially",
        gardenId = gardenId,
    )
}

fun testCropRecordEntity(growZoneId: Long, plantId: String, plantName: String): CropRecordEntity {
    return CropRecordEntity(
        id = UUID.randomUUID(),
        plantingDate = LocalDate.now(),
        plantId = plantId,
        plantName = plantName,
        growZoneId = growZoneId
    )
}