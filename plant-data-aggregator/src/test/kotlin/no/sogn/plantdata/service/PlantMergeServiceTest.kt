package no.sogn.plantdata.service

import no.sogn.plantdata.dto.PerenualSpeciesDetail
import no.sogn.plantdata.dto.TrefleSpeciesDetail
import no.sogn.plantdata.repository.PlantMergeConflictRepository
import no.sogn.plantdata.repository.PlantRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.springframework.transaction.annotation.Transactional
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers

@SpringBootTest
@Testcontainers
class PlantMergeServiceTest {

    companion object {
        @Container
        private val postgres = PostgreSQLContainer("postgres:16.3-alpine").apply {
            withDatabaseName("aggregator_test")
            withUsername("postgres")
            withPassword("postgres")
        }

        @JvmStatic
        @DynamicPropertySource
        fun registerProps(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url") { postgres.jdbcUrl }
            registry.add("spring.datasource.username") { postgres.username }
            registry.add("spring.datasource.password") { postgres.password }
            registry.add("spring.datasource.driver-class-name") { postgres.driverClassName }
        }
    }

    @Autowired lateinit var plantRepository: PlantRepository
    @Autowired lateinit var conflictRepository: PlantMergeConflictRepository
    @Autowired lateinit var mergeService: PlantMergeService

    @Test
    @Transactional
    fun `should merge plant and create conflicts for differing taxonomy`() {
        val trefle = TrefleSpeciesDetail(
            id = 100L,
            scientificName = "Sample plantus",
            commonName = "Sample",
            family = "FamilyA",
            genus = "GenusA"
        )
        val perenual = PerenualSpeciesDetail(
            id = 200L,
            scientificName = "Sample plantus",
            commonName = "Sample",
            otherNames = listOf("Alias"),
            family = "FamilyB",
            genus = "GenusB"
        )

        val result = mergeService.merge(trefle, perenual)
        assertNotNull(result.plant.id)
        assertEquals("sample plantus", result.plant.canonicalScientificName)
        // Expect two conflicts (family + genus)
        assertEquals(2, result.conflicts.size)
        val fields = result.conflicts.map { it.fieldName }.sorted()
        assertEquals(listOf("family", "genus"), fields)
    }
}
