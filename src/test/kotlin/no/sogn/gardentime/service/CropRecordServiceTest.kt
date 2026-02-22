package no.sogn.gardentime.service

import no.sogn.gardentime.client.PlantDataApiClient
import no.sogn.gardentime.config.TestContainersConfig
import no.sogn.gardentime.db.CropRecordRepository
import no.sogn.gardentime.db.GardenRepository
import no.sogn.gardentime.db.GrowAreaRepository
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.test.context.bean.override.mockito.MockitoBean

@SpringBootTest
@Import(TestContainersConfig::class)
class CropRecordServiceTest {

    @Autowired
    private lateinit var cropRecordService: CropRecordService

    @MockitoBean
    lateinit var cropRecordRepository: CropRecordRepository

    @MockitoBean
    lateinit var gardenRepository: GardenRepository

    @MockitoBean
    lateinit var growAreaRepository: GrowAreaRepository

    @MockitoBean
    lateinit var plantDataApiClient: PlantDataApiClient

    @Test
    fun `service loads correctly`() {
        assertNotNull(cropRecordService, "CropRecordService should be injected")
    }
}