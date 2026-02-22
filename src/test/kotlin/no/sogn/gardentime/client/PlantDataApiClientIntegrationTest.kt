package no.sogn.gardentime.client

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assumptions
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import no.sogn.gardentime.config.TestContainersConfig

/**
 * Integration tests for PlantDataApiClient.
 * These tests require the plant-data-aggregator API to be running at localhost:8081
 * with proper API key authentication.
 * 
 * To run these tests:
 * 1. Start plant-data-aggregator: cd plant-data-aggregator && ./gradlew bootRun
 * 2. Ensure plantdata.api.key in test application.yml matches the API key in plant-data-aggregator
 * 
 * Tests are automatically skipped if the API is unavailable or auth fails.
 */
@SpringBootTest
@Import(TestContainersConfig::class)
class PlantDataApiClientIntegrationTest {
    
    @Autowired
    private lateinit var apiClient: PlantDataApiClient
    
    private fun skipIfApiUnavailable(apiCheck: () -> Any?) {
        try {
            apiCheck()
        } catch (e: Exception) {
            Assumptions.assumeTrue(false, 
                "Plant-data-aggregator API not available or auth failed: ${e.message}")
        }
    }
    
    @Test
    fun `can fetch plant details from real API`() {
        val result = try {
            apiClient.getPlantDetails("Tomato")
        } catch (e: Exception) {
            Assumptions.assumeTrue(false, 
                "Plant-data-aggregator API not available: ${e.message}")
            return
        }
        
        assertNotNull(result)
        assertEquals("Tomato", result?.name)
        assertNotNull(result?.family)
        assertNotNull(result?.rotationData)
    }
    
    @Test
    fun `can fetch families from real API`() {
        val result = try {
            apiClient.getFamilies()
        } catch (e: Exception) {
            Assumptions.assumeTrue(false, 
                "Plant-data-aggregator API not available: ${e.message}")
            return
        }
        
        assertNotNull(result)
        assertTrue(result.families.isNotEmpty())
    }
    
    @Test
    fun `can fetch soil-borne diseases from real API`() {
        val result = try {
            apiClient.getSoilBorneDiseases()
        } catch (e: Exception) {
            Assumptions.assumeTrue(false, 
                "Plant-data-aggregator API not available: ${e.message}")
            return
        }
        
        assertNotNull(result)
        assertTrue(result.diseases.isNotEmpty())
    }
}
