package no.sogn.gardentime.client

import com.github.tomakehurst.wiremock.WireMockServer
import com.github.tomakehurst.wiremock.client.WireMock.*
import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import no.sogn.gardentime.client.dto.*
import org.junit.jupiter.api.*
import org.junit.jupiter.api.Assertions.*
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.web.client.RestTemplateBuilder
import org.springframework.web.client.RestTemplate
import java.util.UUID

/**
 * Unit tests for PlantDataApiClient using WireMock
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class PlantDataApiClientTest {
    
    private lateinit var wireMockServer: WireMockServer
    private lateinit var apiClient: PlantDataApiClient
    private lateinit var restTemplate: RestTemplate
    
    @BeforeAll
    fun setup() {
        wireMockServer = WireMockServer(WireMockConfiguration.options().dynamicPort())
        wireMockServer.start()
        
        restTemplate = RestTemplateBuilder().build()
        apiClient = PlantDataApiClient(restTemplate)
        
        // Use reflection to set the API URL since @Value won't work in unit test
        val field = PlantDataApiClient::class.java.getDeclaredField("apiUrl")
        field.isAccessible = true
        field.set(apiClient, "http://localhost:${wireMockServer.port()}")
    }
    
    @AfterAll
    fun teardown() {
        wireMockServer.stop()
    }
    
    @BeforeEach
    fun resetWireMock() {
        wireMockServer.resetAll()
    }
    
    @Test
    fun `getPlantDetails returns plant when found`() {
        // Given
        val plantName = "Tomato"
        val responseJson = """
        {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "Tomato",
            "scientificName": "Solanum lycopersicum",
            "family": "Solanaceae",
            "genus": "Solanum",
            "cycle": "ANNUAL",
            "growthRequirements": {
                "sunNeeds": "FULL_SUN",
                "waterNeeds": "MODERATE",
                "phMin": 6.0,
                "phMax": 6.8,
                "droughtTolerant": false
            },
            "plantingDetails": {
                "rootDepth": "DEEP",
                "growthHabit": "BUSH",
                "daysToMaturityMin": 60,
                "daysToMaturityMax": 90,
                "successionIntervalDays": 14,
                "edibleParts": ["fruit"]
            },
            "rotationData": {
                "feederType": "HEAVY",
                "isNitrogenFixer": false,
                "primaryNutrientContribution": "NONE"
            },
            "companionCount": {
                "beneficial": 15,
                "antagonistic": 8,
                "neutral": 3
            },
            "pestCount": 5,
            "diseaseCount": 4,
            "synonyms": []
        }
        """.trimIndent()
        
        wireMockServer.stubFor(get(urlEqualTo("/api/v1/plant-data/plants/$plantName"))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody(responseJson)))
        
        // When
        val result = apiClient.getPlantDetails(plantName)
        
        // Then
        assertNotNull(result)
        assertEquals("Tomato", result?.name)
        assertEquals("Solanaceae", result?.family)
        assertEquals("HEAVY", result?.rotationData?.feederType)
        assertEquals(false, result?.rotationData?.isNitrogenFixer)
    }
    
    @Test
    fun `getPlantDetails returns null when plant not found`() {
        // Given
        val plantName = "NonExistentPlant"
        
        wireMockServer.stubFor(get(urlEqualTo("/api/v1/plant-data/plants/$plantName"))
            .willReturn(aResponse()
                .withStatus(404)))
        
        // When
        val result = apiClient.getPlantDetails(plantName)
        
        // Then
        assertNull(result)
    }
    
    @Test
    fun `getSoilBorneDiseases returns diseases`() {
        // Given
        val responseJson = """
        {
            "diseases": [
                {
                    "disease": {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "name": "Clubroot",
                        "scientificName": "Plasmodiophora brassicae",
                        "description": "Soil-borne disease causing swollen roots",
                        "treatmentOptions": "Crop rotation, lime soil",
                        "severity": "CRITICAL",
                        "isSoilBorne": true,
                        "persistenceYears": 20
                    },
                    "affectedFamilies": ["Brassicaceae"],
                    "affectedPlantCount": 30
                }
            ]
        }
        """.trimIndent()
        
        wireMockServer.stubFor(get(urlEqualTo("/api/v1/plant-data/diseases/soil-borne"))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody(responseJson)))
        
        // When
        val result = apiClient.getSoilBorneDiseases()
        
        // Then
        assertNotNull(result)
        assertEquals(1, result.diseases.size)
        assertEquals("Clubroot", result.diseases[0].disease.name)
        assertEquals(20, result.diseases[0].disease.persistenceYears)
        assertEquals(true, result.diseases[0].disease.isSoilBorne)
        assertTrue(result.diseases[0].affectedFamilies.contains("Brassicaceae"))
    }
    
    @Test
    fun `getFamilies returns family list`() {
        // Given
        val responseJson = """
        {
            "families": [
                {
                    "name": "Solanaceae",
                    "plantCount": 25,
                    "examplePlants": ["Tomato", "Pepper", "Eggplant"]
                },
                {
                    "name": "Brassicaceae",
                    "plantCount": 30,
                    "examplePlants": ["Broccoli", "Cabbage", "Kale"]
                }
            ]
        }
        """.trimIndent()
        
        wireMockServer.stubFor(get(urlEqualTo("/api/v1/plant-data/families"))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody(responseJson)))
        
        // When
        val result = apiClient.getFamilies()
        
        // Then
        assertNotNull(result)
        assertEquals(2, result.families.size)
        assertEquals("Solanaceae", result.families[0].name)
        assertEquals(25, result.families[0].plantCount)
    }
    
    @Test
    fun `getCompanions returns companion data`() {
        // Given
        val plantName = "Tomato"
        val responseJson = """
        {
            "plant": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "Tomato",
                "scientificName": "Solanum lycopersicum"
            },
            "companions": {
                "beneficial": [
                    {
                        "id": "660e8400-e29b-41d4-a716-446655440000",
                        "name": "Basil",
                        "scientificName": "Ocimum basilicum",
                        "relationship": "BENEFICIAL",
                        "reason": "Repels aphids and hornworms",
                        "mechanism": "Aromatic pest deterrent",
                        "confidenceLevel": "HIGH",
                        "evidenceType": "TRADITIONAL"
                    }
                ],
                "antagonistic": [],
                "neutral": []
            },
            "summary": {
                "beneficial": 1,
                "antagonistic": 0,
                "neutral": 0
            }
        }
        """.trimIndent()
        
        wireMockServer.stubFor(get(urlEqualTo("/api/v1/plant-data/plants/$plantName/companions"))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody(responseJson)))
        
        // When
        val result = apiClient.getCompanions(plantName)
        
        // Then
        assertNotNull(result)
        assertEquals("Tomato", result?.plant?.name)
        assertEquals(1, result?.companions?.beneficial?.size)
        assertEquals("Basil", result?.companions?.beneficial?.get(0)?.name)
        assertEquals("HIGH", result?.companions?.beneficial?.get(0)?.confidenceLevel)
    }
    
    @Test
    fun `getCompanions returns null when plant not found`() {
        // Given
        val plantName = "NonExistentPlant"
        
        wireMockServer.stubFor(get(urlEqualTo("/api/v1/plant-data/plants/$plantName/companions"))
            .willReturn(aResponse()
                .withStatus(404)))
        
        // When
        val result = apiClient.getCompanions(plantName)
        
        // Then
        assertNull(result)
    }
    
    @Test
    fun `getPlants with filters constructs correct URL`() {
        // Given
        val responseJson = """
        {
            "plants": [],
            "pagination": {
                "page": 0,
                "size": 10,
                "totalElements": 0,
                "totalPages": 0
            }
        }
        """.trimIndent()
        
        wireMockServer.stubFor(get(urlMatching("/api/v1/plant-data/plants.*"))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody(responseJson)))
        
        // When
        val result = apiClient.getPlants(
            page = 0,
            size = 10,
            family = "Solanaceae",
            feederType = "HEAVY"
        )
        
        // Then
        assertNotNull(result)
        
        // Verify the request was made with correct query parameters
        wireMockServer.verify(getRequestedFor(urlPathEqualTo("/api/v1/plant-data/plants"))
            .withQueryParam("page", equalTo("0"))
            .withQueryParam("size", equalTo("10"))
            .withQueryParam("family", equalTo("Solanaceae"))
            .withQueryParam("feederType", equalTo("HEAVY")))
    }
}
