package no.sogn.gardentime.client

import no.sogn.gardentime.client.dto.*
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.cache.annotation.Cacheable
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.client.HttpClientErrorException
import org.springframework.web.client.RestTemplate
import org.springframework.web.util.UriComponentsBuilder

/**
 * Client for plant-data-aggregator API
 * Provides access to plant reference data for rotation planning
 */
@Component
class PlantDataApiClient(
    private val restTemplate: RestTemplate
) {
    
    @Value("\${plantdata.api.url:http://localhost:8081}")
    private lateinit var apiUrl: String
    
    private val logger = LoggerFactory.getLogger(PlantDataApiClient::class.java)
    
    companion object {
        private const val API_BASE_PATH = "/api/v1/plant-data"
    }
    
    /**
     * Get detailed plant information by name
     * Cached for 1 hour to reduce API calls
     */
    @Cacheable(value = ["plantDetails"], key = "#plantName")
    fun getPlantDetails(plantName: String): PlantDetailDTO? {
        return try {
            val url = "$apiUrl$API_BASE_PATH/plants/{name}"
            logger.debug("Fetching plant details for: {}", plantName)
            
            restTemplate.getForObject(url, PlantDetailDTO::class.java, plantName)
        } catch (e: HttpClientErrorException) {
            when (e.statusCode) {
                HttpStatus.NOT_FOUND -> {
                    logger.warn("Plant not found: {}", plantName)
                    null
                }
                else -> {
                    logger.error("Error fetching plant details for {}: {}", plantName, e.message)
                    throw PlantDataApiException("Failed to fetch plant details for $plantName", e)
                }
            }
        } catch (e: Exception) {
            logger.error("Unexpected error fetching plant details: {}", e.message)
            throw PlantDataApiException("Failed to fetch plant details", e)
        }
    }
    
    /**
     * Get list of plants with optional filtering
     * Cached for 1 hour
     */
    @Cacheable(value = ["plantList"], key = "#page + '_' + #size + '_' + (#family ?: 'all')")
    fun getPlants(
        page: Int = 0,
        size: Int = 50,
        family: String? = null,
        feederType: String? = null,
        cycle: String? = null,
        search: String? = null
    ): PlantListResponseDTO {
        return try {
            val uriBuilder = UriComponentsBuilder.fromHttpUrl("$apiUrl$API_BASE_PATH/plants")
                .queryParam("page", page)
                .queryParam("size", size)
            
            family?.let { uriBuilder.queryParam("family", it) }
            feederType?.let { uriBuilder.queryParam("feederType", it) }
            cycle?.let { uriBuilder.queryParam("cycle", it) }
            search?.let { uriBuilder.queryParam("search", it) }
            
            val url = uriBuilder.toUriString()
            logger.debug("Fetching plant list: {}", url)
            
            restTemplate.getForObject(url, PlantListResponseDTO::class.java)
                ?: PlantListResponseDTO(emptyList(), PaginationDTO(0, 0, 0, 0))
        } catch (e: Exception) {
            logger.error("Error fetching plant list: {}", e.message)
            throw PlantDataApiException("Failed to fetch plant list", e)
        }
    }
    
    /**
     * Search plants by name
     */
    @Cacheable(value = ["plantSearch"], key = "#query")
    fun searchPlants(query: String): List<PlantSummaryDTO> {
        return try {
            val url = UriComponentsBuilder.fromHttpUrl("$apiUrl$API_BASE_PATH/plants/search")
                .queryParam("q", query)
                .toUriString()
            
            logger.debug("Searching plants: {}", query)
            
            restTemplate.getForObject(url, Array<PlantSummaryDTO>::class.java)
                ?.toList() ?: emptyList()
        } catch (e: Exception) {
            logger.error("Error searching plants: {}", e.message)
            throw PlantDataApiException("Failed to search plants", e)
        }
    }
    
    /**
     * Get all plant families
     * Cached for 24 hours (families change rarely)
     */
    @Cacheable(value = ["families"])
    fun getFamilies(): FamiliesResponseDTO {
        return try {
            val url = "$apiUrl$API_BASE_PATH/families"
            logger.debug("Fetching plant families")
            
            restTemplate.getForObject(url, FamiliesResponseDTO::class.java)
                ?: FamiliesResponseDTO(emptyList())
        } catch (e: Exception) {
            logger.error("Error fetching families: {}", e.message)
            throw PlantDataApiException("Failed to fetch plant families", e)
        }
    }
    
    /**
     * Get plants by family name
     */
    @Cacheable(value = ["familyPlants"], key = "#familyName")
    fun getPlantsByFamily(familyName: String): FamilyWithPlantsDTO? {
        return try {
            val url = "$apiUrl$API_BASE_PATH/families/{familyName}/plants"
            logger.debug("Fetching plants for family: {}", familyName)
            
            restTemplate.getForObject(url, FamilyWithPlantsDTO::class.java, familyName)
        } catch (e: HttpClientErrorException) {
            when (e.statusCode) {
                HttpStatus.NOT_FOUND -> {
                    logger.warn("Family not found: {}", familyName)
                    null
                }
                else -> {
                    logger.error("Error fetching plants for family {}: {}", familyName, e.message)
                    throw PlantDataApiException("Failed to fetch plants for family $familyName", e)
                }
            }
        } catch (e: Exception) {
            logger.error("Unexpected error fetching family plants: {}", e.message)
            throw PlantDataApiException("Failed to fetch family plants", e)
        }
    }
    
    /**
     * Get soil-borne diseases (critical for rotation planning)
     * Cached for 24 hours
     */
    @Cacheable(value = ["soilBorneDiseases"])
    fun getSoilBorneDiseases(): SoilBorneDiseasesResponseDTO {
        return try {
            val url = "$apiUrl$API_BASE_PATH/diseases/soil-borne"
            logger.debug("Fetching soil-borne diseases")
            
            restTemplate.getForObject(url, SoilBorneDiseasesResponseDTO::class.java)
                ?: SoilBorneDiseasesResponseDTO(emptyList())
        } catch (e: Exception) {
            logger.error("Error fetching soil-borne diseases: {}", e.message)
            throw PlantDataApiException("Failed to fetch soil-borne diseases", e)
        }
    }
    
    /**
     * Get companion plants for a specific plant
     * Cached for 1 hour
     */
    @Cacheable(value = ["companions"], key = "#plantName")
    fun getCompanions(plantName: String): CompanionListDTO? {
        return try {
            val url = "$apiUrl$API_BASE_PATH/plants/{name}/companions"
            logger.debug("Fetching companions for: {}", plantName)
            
            restTemplate.getForObject(url, CompanionListDTO::class.java, plantName)
        } catch (e: HttpClientErrorException) {
            when (e.statusCode) {
                HttpStatus.NOT_FOUND -> {
                    logger.warn("No companion data for plant: {}", plantName)
                    null
                }
                else -> {
                    logger.error("Error fetching companions for {}: {}", plantName, e.message)
                    throw PlantDataApiException("Failed to fetch companions for $plantName", e)
                }
            }
        } catch (e: Exception) {
            logger.error("Unexpected error fetching companions: {}", e.message)
            throw PlantDataApiException("Failed to fetch companions", e)
        }
    }
    
    /**
     * Get pests that affect a specific plant
     */
    @Cacheable(value = ["plantPests"], key = "#plantName")
    fun getPlantPests(plantName: String): PlantPestsResponseDTO? {
        return try {
            val url = "$apiUrl$API_BASE_PATH/plants/{name}/pests"
            logger.debug("Fetching pests for: {}", plantName)
            
            restTemplate.getForObject(url, PlantPestsResponseDTO::class.java, plantName)
        } catch (e: HttpClientErrorException) {
            when (e.statusCode) {
                HttpStatus.NOT_FOUND -> {
                    logger.warn("No pest data for plant: {}", plantName)
                    null
                }
                else -> {
                    logger.error("Error fetching pests for {}: {}", plantName, e.message)
                    null
                }
            }
        } catch (e: Exception) {
            logger.error("Unexpected error fetching pests: {}", e.message)
            null
        }
    }
    
    /**
     * Get diseases that affect a specific plant
     */
    @Cacheable(value = ["plantDiseases"], key = "#plantName")
    fun getPlantDiseases(plantName: String): PlantDiseasesResponseDTO? {
        return try {
            val url = "$apiUrl$API_BASE_PATH/plants/{name}/diseases"
            logger.debug("Fetching diseases for: {}", plantName)
            
            restTemplate.getForObject(url, PlantDiseasesResponseDTO::class.java, plantName)
        } catch (e: HttpClientErrorException) {
            when (e.statusCode) {
                HttpStatus.NOT_FOUND -> {
                    logger.warn("No disease data for plant: {}", plantName)
                    null
                }
                else -> {
                    logger.error("Error fetching diseases for {}: {}", plantName, e.message)
                    null
                }
            }
        } catch (e: Exception) {
            logger.error("Unexpected error fetching diseases: {}", e.message)
            null
        }
    }
}

/**
 * Exception thrown when plant-data-aggregator API calls fail
 */
class PlantDataApiException(message: String, cause: Throwable? = null) : RuntimeException(message, cause)
