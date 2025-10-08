package no.sogn.gardentime.config

import no.sogn.gardentime.db.GardenRepository
import no.sogn.gardentime.db.PlantRepository
import no.sogn.gardentime.db.UserRepository
import no.sogn.gardentime.model.*
import no.sogn.gardentime.model.mapToGardenEntity
import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.crypto.password.PasswordEncoder
import java.time.LocalDateTime

@Configuration
class DataInitializer {

    private val logger = LoggerFactory.getLogger(DataInitializer::class.java)

    @Bean
    fun initTestUser(
        userRepository: UserRepository,
        passwordEncoder: PasswordEncoder,
        gardenRepository: GardenRepository,
        plantRepository: PlantRepository
    ): CommandLineRunner {
        return CommandLineRunner {
            // Create test user if it doesn't exist
            val testUser = if (!userRepository.existsByUsername("testuser")) {
                val user = UserEntity(
                    email = "test@gardentime.com",
                    _username = "testuser",
                    _password = passwordEncoder.encode("password123"),
                    firstName = "Test",
                    lastName = "User",
                    role = UserRole.USER,
                    enabled = true,
                    createdAt = LocalDateTime.now(),
                    updatedAt = LocalDateTime.now()
                )
                val savedUser = userRepository.save(user)
                logger.info("✅ Test user created successfully!")
                logger.info("   Username: testuser")
                logger.info("   Password: password123")
                logger.info("   Email: test@gardentime.com")
                savedUser
            } else {
                logger.info("Test user already exists")
                userRepository.findByUsername("testuser").get()
            }

            // Create a test garden for the test user
            if (gardenRepository.findAllByUserId(testUser.id!!).isEmpty()) {
                val testGarden = Garden(
                    name = "My First Garden",
                    userId = testUser.id
                )
                gardenRepository.save(mapToGardenEntity(testGarden))
                logger.info("✅ Test garden created for test user!")
                logger.info("   Garden: My First Garden")
            } else {
                logger.info("Test garden already exists for test user")
            }

            // Initialize common plants if database is empty
            if (plantRepository.count() == 0L) {
                val commonPlants = listOf(
                    PlantEntity(name = "Tomato", plantType = PlantType.FRUIT_VEGETABLE, growingSeason = GrowingSeason.SUMMER),
                    PlantEntity(name = "Lettuce", plantType = PlantType.LEAFY_GREEN, growingSeason = GrowingSeason.SPRING),
                    PlantEntity(name = "Carrot", plantType = PlantType.ROOT_VEGETABLE, growingSeason = GrowingSeason.SPRING),
                    PlantEntity(name = "Cucumber", plantType = PlantType.FRUIT_VEGETABLE, growingSeason = GrowingSeason.SUMMER),
                    PlantEntity(name = "Pepper", plantType = PlantType.FRUIT_VEGETABLE, growingSeason = GrowingSeason.SUMMER),
                    PlantEntity(name = "Spinach", plantType = PlantType.LEAFY_GREEN, growingSeason = GrowingSeason.SPRING),
                    PlantEntity(name = "Radish", plantType = PlantType.ROOT_VEGETABLE, growingSeason = GrowingSeason.SPRING),
                    PlantEntity(name = "Beans", plantType = PlantType.LEGUME, growingSeason = GrowingSeason.SUMMER),
                    PlantEntity(name = "Peas", plantType = PlantType.LEGUME, growingSeason = GrowingSeason.SPRING),
                    PlantEntity(name = "Zucchini", plantType = PlantType.FRUIT_VEGETABLE, growingSeason = GrowingSeason.SUMMER),
                    PlantEntity(name = "Broccoli", plantType = PlantType.FLOWERING_PLANT, growingSeason = GrowingSeason.AUTUMN),
                    PlantEntity(name = "Cabbage", plantType = PlantType.LEAFY_GREEN, growingSeason = GrowingSeason.AUTUMN),
                    PlantEntity(name = "Kale", plantType = PlantType.LEAFY_GREEN, growingSeason = GrowingSeason.AUTUMN),
                    PlantEntity(name = "Onion", plantType = PlantType.ALLIUM, growingSeason = GrowingSeason.SPRING),
                    PlantEntity(name = "Garlic", plantType = PlantType.ALLIUM, growingSeason = GrowingSeason.AUTUMN),
                    PlantEntity(name = "Basil", plantType = PlantType.HERB, growingSeason = GrowingSeason.SUMMER),
                    PlantEntity(name = "Parsley", plantType = PlantType.HERB, growingSeason = GrowingSeason.SPRING),
                    PlantEntity(name = "Cilantro", plantType = PlantType.HERB, growingSeason = GrowingSeason.SPRING),
                    PlantEntity(name = "Potato", plantType = PlantType.TUBER, growingSeason = GrowingSeason.SPRING),
                    PlantEntity(name = "Corn", plantType = PlantType.GRAIN, growingSeason = GrowingSeason.SUMMER)
                )

                plantRepository.saveAll(commonPlants)
                logger.info("✅ Initialized ${commonPlants.size} common plants!")
                logger.info("   Plants available: ${commonPlants.joinToString(", ") { it.name }}")
            } else {
                logger.info("Plants database already populated (${plantRepository.count()} plants)")
            }
        }
    }
}
