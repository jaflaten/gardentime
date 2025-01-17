package no.sogn.gardentime.repository

import no.sogn.gardentime.db.GardenRepository
import no.sogn.gardentime.model.GardenEntity
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.test.context.junit.jupiter.SpringExtension

@DataJpaTest
@ExtendWith(SpringExtension::class)
class GardenRepositoryTest {
    @Autowired
    private lateinit var gardenRepository: GardenRepository

    @BeforeEach
    fun setup() {
        gardenRepository.deleteAll()
    }

    @Test
    fun `should save and retrieve an empty garden entity`() {
        val garden = gardenRepository.save(testEmptyGardenEntity())
        Assertions.assertTrue(garden.id != null, "Saved garden should have an ID")

        garden.id?.let { id ->
            val retrievedGarden = gardenRepository.findGardenEntityById(id)
            Assertions.assertNotNull(retrievedGarden, "Retrieved garden should not be null")
        }

    }


}

fun testEmptyGardenEntity(): GardenEntity {
    return GardenEntity(
        id = null,
        name = "Test Garden",
        growZones = mutableListOf()
        )
}