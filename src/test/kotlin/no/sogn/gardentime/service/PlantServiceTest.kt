package no.sogn.gardentime.service

import no.sogn.gardentime.db.PlantRepository
import no.sogn.gardentime.model.GrowingSeason
import no.sogn.gardentime.model.PlantEntity
import no.sogn.gardentime.model.PlantType
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.bean.override.mockito.MockitoBean

@SpringBootTest
class PlantServiceTest {

    @Autowired
    lateinit var plantService: PlantService

    @MockitoBean
    lateinit var plantRepository: PlantRepository


    val plants = mutableListOf(
        testCarrotEntity(),
        testPotatoEntity(),
        testBeetrootEntity()
    )

    @Test
    fun `should return a list of plants`() {
        Mockito.`when`(plantRepository.findAll()).thenReturn(plants)

        val plantList = plantService.getPlants()
        Assertions.assertTrue(plantList.isNotEmpty(), "Plant list should not be empty")
        Assertions.assertEquals(plants.size, plantList.size, "Plant list should have the same size as the repository")

    }

    @Test
    fun `should return an empty list`() {
        Mockito.`when`(plantRepository.findAll()).thenReturn(emptyList())

        val plantList = plantService.getPlants()
        Assertions.assertTrue(plantList.isEmpty(), "Plant list should be empty")
    }
}


fun testCarrotEntity(): PlantEntity {
    return PlantEntity(
        name = "Carrot",
        scientificName = "Daucus carota",
        plantType = PlantType.ROOT_VEGETABLE,
        maturityTime = 75,
        growingSeason = GrowingSeason.SPRING,
        sunReq = "Full Sun",
        waterReq = "Moderate",
        soilType = "Loamy",
        spaceReq = "5 cm"
    )
}

fun testPotatoEntity(): PlantEntity {
    return PlantEntity(
        name = "Potato",
        scientificName = "Solanum tuberosum",
        plantType = PlantType.TUBER,
        maturityTime = 120,
        growingSeason = GrowingSeason.SUMMER,
        sunReq = "Full Sun",
        waterReq = "High",
        soilType = "Sandy",
        spaceReq = "30 cm"
    )
}

fun testBeetrootEntity(): PlantEntity {
    return PlantEntity(
        name = "Beetroot",
        scientificName = "Beta vulgaris",
        plantType = PlantType.ROOT_VEGETABLE,
        maturityTime = 60,
        growingSeason = GrowingSeason.SUMMER,
        sunReq = "Full Sun",
        waterReq = "High",
        soilType = "Loamy",
        spaceReq = "10 cm"
    )
}