package no.sogn.gardentime.client

import no.sogn.gardentime.client.dto.PlantDetailDTO
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.condition.EnabledIf
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.TestPropertySource

/**
 * Integration tests for PlantDataApiClient
 * Only runs if plant-data-aggregator API is available
 */
@SpringBootTest
@TestPropertySource(properties = ["plantdata.api.url=http://localhost:8081"])
class PlantDataApiClientIntegrationTest {
    
    @Autowired
    private lateinit var apiClient: PlantDataApiClient
    
    @Test
    @EnabledIf("isApiAvailable")
    fun `can fetch plant details from real API`() {
        // When
        val result = apiClient.getPlantDetails("Tomato")
        
        // Then
        assertNotNull(result)
        assertEquals("Tomato", result?.name)
        assertNotNull(result?.family)
        assertNotNull(result?.rotationData)
    }
    
    @Test
    @EnabledIf("isApiAvailable")
    fun `can fetch families from real API`() {
        // When
        val result = apiClient.getFamilies()
        
        // Then
        assertNotNull(result)
        assertTrue(result.families.isNotEmpty())
    }
    
    @Test
    @EnabledIf("isApiAvailable")
    fun `can fetch soil-borne diseases from real API`() {
        // When
        val result = apiClient.getSoilBorneDiseases()
        
        // Then
        assertNotNull(result)
        // Should have at least some diseases
        assertTrue(result.diseases.isNotEmpty())
    }
    
    companion object {
        @JvmStatic
        fun isApiAvailable(): Boolean {
            return try {
                val url = java.net.URL("http://localhost:8081/actuator/health")
                val connection = url.openConnection()
                connection.connectTimeout = 1000
                connection.readTimeout = 1000
                connection.connect()
                true
            } catch (e: Exception) {
                println("plant-data-aggregator API not available, skipping integration tests")
                false
            }
        }
    }
}
