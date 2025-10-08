package no.sogn.gardentime.config

import no.sogn.gardentime.db.GardenRepository
import no.sogn.gardentime.db.UserRepository
import no.sogn.gardentime.model.Garden
import no.sogn.gardentime.model.UserEntity
import no.sogn.gardentime.model.UserRole
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
        gardenRepository: GardenRepository
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
        }
    }
}
