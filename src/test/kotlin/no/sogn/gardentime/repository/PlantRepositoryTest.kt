package no.sogn.gardentime.repository

import no.sogn.gardentime.config.TestContainersConfig
import no.sogn.gardentime.db.PlantRepository
import no.sogn.gardentime.model.GrowingSeason
import no.sogn.gardentime.model.PlantEntity
import no.sogn.gardentime.model.PlantType
import no.sogn.gardentime.model.mapPlantToDomain
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.context.annotation.Import

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(TestContainersConfig::class)
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
    fun `should find plants by name`() {
        plantRepository.save(testCarrotEntity())
        plantRepository.save(testGarlicEntity())

        val plants = plantRepository.findPlantEntityByName("Carrot")

        Assertions.assertFalse(plants.isEmpty(), "Expected to find carrot plant")
        Assertions.assertEquals("Carrot", plants.first().name)
    }

    @Test
    fun `map a plant entity to domain`() {
        val carrotEntity = plantRepository.save(testCarrotEntity())
        Assertions.assertNotNull(carrotEntity)
        val carrotDomain = mapPlantToDomain(carrotEntity)
        Assertions.assertNotNull(carrotDomain)
        Assertions.assertEquals(carrotDomain.id, carrotEntity.id)
        Assertions.assertEquals(carrotDomain.maturityTime, 75)
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