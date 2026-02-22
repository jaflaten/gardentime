package no.sogn.gardentime.repository

import no.sogn.gardentime.config.TestContainersConfig
import no.sogn.gardentime.db.GardenRepository
import no.sogn.gardentime.db.UserRepository
import no.sogn.gardentime.model.GardenEntity
import no.sogn.gardentime.model.UserEntity
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.context.annotation.Import
import java.util.UUID

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(TestContainersConfig::class)
class GardenRepositoryTest {
    @Autowired
    private lateinit var gardenRepository: GardenRepository
    
    @Autowired
    private lateinit var userRepository: UserRepository
    
    private lateinit var testUserId: UUID

    @BeforeEach
    fun setup() {
        gardenRepository.deleteAll()
        userRepository.deleteAll()
        
        // Create a test user to satisfy foreign key constraint
        val testUser = userRepository.save(
            UserEntity(
                email = "test-${UUID.randomUUID()}@example.com",
                _username = "testuser-${UUID.randomUUID()}",
                _password = "password123"
            )
        )
        testUserId = testUser.id!!
    }

    @Test
    fun `should save and retrieve an empty garden entity`() {
        val garden = gardenRepository.save(
            GardenEntity(
                id = null,
                name = "Test Garden",
                growAreas = mutableListOf(),
                userId = testUserId
            )
        )
        Assertions.assertTrue(garden.id != null, "Saved garden should have an ID")

        garden.id?.let { id ->
            val retrievedGarden = gardenRepository.findGardenEntityById(id)
            Assertions.assertNotNull(retrievedGarden, "Retrieved garden should not be null")
        }
    }
}