package no.sogn.gardentime.repository

import no.sogn.gardentime.db.PlantRepository
import no.sogn.gardentime.model.GrowingSeason
import no.sogn.gardentime.model.PlantEntity
import no.sogn.gardentime.model.PlantType
import no.sogn.gardentime.model.mapPlantToDomain
import no.sogn.gardentime.model.mapPlantToEntity
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mockito
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.test.context.junit.jupiter.SpringExtension

@DataJpaTest
@ExtendWith(SpringExtension::class)
class PlantRepositoryTest {

    @Autowired
    private lateinit var plantRepository: PlantRepository

    @BeforeEach
    fun setup() {
        plantRepository.deleteAll()
    }

    @Test
    fun `should save and retrieve a plant entity`() {
        val plant = testCarrotEntity()
        val savedPlant = plantRepository.save(plant)
        val retrievedPlant = plantRepository.findById(savedPlant.id!!).orElse(null)

        Assertions.assertNotNull(savedPlant.id, "Saved plant should have an ID")
        Assertions.assertNotNull(retrievedPlant, "Retrieved plant should not be null")
        Assertions.assertEquals(plant.name, retrievedPlant?.name, "Names should match")
        Assertions.assertEquals(plant.growingSeason, retrievedPlant?.growingSeason, "Growing seasons should match")
    }

    @Test
    fun `should find plants by plant type`() {
        plantRepository.save(testCarrotEntity())
        plantRepository.save(testBeetrootEntity())
        plantRepository.save(testPotatoEntity())
        plantRepository.save(testTomatoEntity())
        plantRepository.save(testCucumberEntity())

        val plantType = PlantType.ROOT_VEGETABLE
        val actualPlants = plantRepository.findPlantsByPlantType(plantType)

        Assertions.assertFalse(actualPlants.isEmpty(), "Expected some plants of type $plantType")
        actualPlants.forEach { plant ->
            Assertions.assertEquals(plantType, plant.plantType, "Plant ${plant.name} does not match the expected type $plantType")
        }
    }

    @Test
    fun `map an plant entity to domain and back`() {
        val carrotEntity = plantRepository.save(testCarrotEntity())
        Assertions.assertNotNull(carrotEntity)
        val carrotDomain = mapPlantToDomain(carrotEntity)
        Assertions.assertNotNull(carrotDomain)
        Assertions.assertEquals(carrotDomain.id, carrotEntity.id)
        Assertions.assertEquals(carrotDomain.maturityTime, 75)
        val newMaturityTime = 80
        val updatedCarrotDomain = carrotDomain.copy(
            maturityTime = newMaturityTime
        )

        println("carrotEntity maturityTime: " + carrotEntity.maturityTime)
        val savedEntity = plantRepository.save(mapPlantToEntity(updatedCarrotDomain))
        Assertions.assertEquals(carrotEntity.id, savedEntity.id)
        Assertions.assertEquals(carrotDomain.id, savedEntity.id)
        Assertions.assertEquals(savedEntity.maturityTime, newMaturityTime)
        println("savedEntity maturityTime:" + savedEntity.maturityTime)
    }

    @Test
    fun `add new plant and verify it is saved`() {
        val noPlants = plantRepository.findAll().toList()
        Assertions.assertTrue(noPlants.isEmpty(), "Plant repository should be empty")
        plantRepository.save(testGarlicEntity())
        val allPlants = plantRepository.findAll().toList()
        Assertions.assertFalse(allPlants.isEmpty(), "Plant repository should not be empty")
        Assertions.assertEquals(1, allPlants.size, "Plant repository should have one plant")
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

fun testTomatoEntity(): PlantEntity {
    return PlantEntity(
        name = "Tomato",
        scientificName = "Solanum lycopersicum",
        plantType = PlantType.FRUIT_VEGETABLE,
        maturityTime = 85,
        growingSeason = GrowingSeason.SUMMER,
        sunReq = "Full Sun",
        waterReq = "Moderate",
        soilType = "Loamy",
        spaceReq = "30 cm"
    )
}

fun testCucumberEntity(): PlantEntity {
    return PlantEntity(
        name = "Cucumber",
        scientificName = "Cucumis sativus",
        plantType = PlantType.FRUIT_VEGETABLE,
        maturityTime = 60,
        growingSeason = GrowingSeason.SUMMER,
        sunReq = "Full Sun",
        waterReq = "High",
        soilType = "Loamy",
        spaceReq = "30 cm"
    )

    }
fun testGarlicEntity(): PlantEntity {
    return PlantEntity(
        name = "Garlic",
        scientificName = "Allium sativum",
        plantType = PlantType.ALLIUM,
        maturityTime = 90,
        growingSeason = GrowingSeason.SUMMER,
        sunReq = "Full Sun",
        waterReq = "Moderate",
        soilType = "Loamy",
        spaceReq = "10 cm"
    )
}