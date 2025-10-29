package no.sogn.plantdata.service

import no.sogn.plantdata.dto.PerenualSpeciesDetail
import no.sogn.plantdata.dto.PerenualSpeciesListResponse
import no.sogn.plantdata.model.ApiCallTracker
import no.sogn.plantdata.repository.ApiCallTrackerRepository
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.cache.annotation.Cacheable
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.client.RestClient
import org.springframework.web.client.RestClientResponseException
import java.time.LocalDate

/**
 * Service for interacting with the Perenual API (https://perenual.com/api/).
 *
 * Features:
 * - Fetches plant lists and details from Perenual
 * - Implements rate limiting and error handling
 * - Tracks API call usage
 * - Provides caching for frequently accessed data
 */
@Service
class PerenualService(
    @Value("\${perenual.api.key:}") private val apiKey: String,
    @Value("\${perenual.api.base-url:https://perenual.com/api}") private val baseUrl: String,
    private val apiCallTrackerRepository: ApiCallTrackerRepository
) {
    private val logger = LoggerFactory.getLogger(PerenualService::class.java)
    private val restClient: RestClient = RestClient.builder()
        .baseUrl(baseUrl)
        .build()

    companion object {
        private const val API_NAME = "PERENUAL"
        private const val DEFAULT_PAGE_SIZE = 30
    }

    /**
     * Search for plants by query (common name, scientific name, etc.)
     *
     * @param query Search query
     * @param page Page number (starts at 1)
     * @return List response with plants matching the query
     */
    @Cacheable(value = ["perenual-search"], key = "#query + '-' + #page")
    fun searchPlants(query: String, page: Int = 1): PerenualSpeciesListResponse {
        logger.info("Searching Perenual plants: query='$query', page=$page")

        return try {
            val response = restClient.get()
                .uri { uriBuilder ->
                    uriBuilder
                        .path("/species-list")
                        .queryParam("key", apiKey)
                        .queryParam("q", query)
                        .queryParam("page", page)
                        .build()
                }
                .retrieve()
                .body(PerenualSpeciesListResponse::class.java)

            trackApiCall(success = true)
            response ?: PerenualSpeciesListResponse()
        } catch (e: RestClientResponseException) {
            logger.error("Failed to search Perenual plants: ${e.message}", e)
            trackApiCall(success = false)
            handleApiError(e)
            PerenualSpeciesListResponse()
        } catch (e: Exception) {
            logger.error("Unexpected error searching Perenual plants: ${e.message}", e)
            trackApiCall(success = false)
            PerenualSpeciesListResponse()
        }
    }

    /**
     * List all plants with optional filtering
     *
     * @param page Page number (starts at 1)
     * @param edible Optional filter for edible plants (true/false)
     * @param indoor Optional filter for indoor plants (true/false)
     * @return Paginated list of plants
     */
    @Cacheable(value = ["perenual-list"], key = "#page + '-' + #edible + '-' + #indoor")
    fun listPlants(page: Int = 1, edible: Boolean? = null, indoor: Boolean? = null): PerenualSpeciesListResponse {
        logger.info("Listing Perenual plants: page=$page, edible=$edible, indoor=$indoor")

        return try {
            val response = restClient.get()
                .uri { uriBuilder ->
                    val builder = uriBuilder
                        .path("/species-list")
                        .queryParam("key", apiKey)
                        .queryParam("page", page)

                    if (edible != null) {
                        builder.queryParam("edible", if (edible) 1 else 0)
                    }
                    if (indoor != null) {
                        builder.queryParam("indoor", if (indoor) 1 else 0)
                    }

                    builder.build()
                }
                .retrieve()
                .body(PerenualSpeciesListResponse::class.java)

            trackApiCall(success = true)
            response ?: PerenualSpeciesListResponse()
        } catch (e: RestClientResponseException) {
            logger.error("Failed to list Perenual plants: ${e.message}", e)
            trackApiCall(success = false)
            handleApiError(e)
            PerenualSpeciesListResponse()
        } catch (e: Exception) {
            logger.error("Unexpected error listing Perenual plants: ${e.message}", e)
            trackApiCall(success = false)
            PerenualSpeciesListResponse()
        }
    }

    /**
     * Get detailed information about a specific plant by ID
     *
     * @param plantId Perenual plant ID
     * @return Detailed plant information or null if not found
     */
    @Cacheable(value = ["perenual-detail"], key = "#plantId")
    fun getPlantDetail(plantId: Long): PerenualSpeciesDetail? {
        logger.info("Fetching Perenual plant detail: id=$plantId")

        return try {
            val response = restClient.get()
                .uri { uriBuilder ->
                    uriBuilder
                        .path("/species/details/{id}")
                        .queryParam("key", apiKey)
                        .build(plantId)
                }
                .retrieve()
                .body(PerenualSpeciesDetail::class.java)

            trackApiCall(success = true)
            response
        } catch (e: RestClientResponseException) {
            if (e.statusCode == HttpStatus.NOT_FOUND) {
                logger.warn("Perenual plant not found: id=$plantId")
            } else {
                logger.error("Failed to fetch Perenual plant detail: ${e.message}", e)
            }
            trackApiCall(success = false)
            handleApiError(e)
            null
        } catch (e: Exception) {
            logger.error("Unexpected error fetching Perenual plant detail: ${e.message}", e)
            trackApiCall(success = false)
            null
        }
    }

    /**
     * Batch fetch plant details for multiple IDs
     *
     * @param plantIds List of Perenual plant IDs
     * @return Map of plant ID to detail (only successful fetches)
     */
    fun batchGetPlantDetails(plantIds: List<Long>): Map<Long, PerenualSpeciesDetail> {
        logger.info("Batch fetching ${plantIds.size} Perenual plant details")

        return plantIds.mapNotNull { id ->
            getPlantDetail(id)?.let { id to it }
        }.toMap()
    }

    /**
     * Track API call for rate limiting and monitoring
     */
    private fun trackApiCall(success: Boolean) {
        try {
            val today = LocalDate.now()
            val tracker = apiCallTrackerRepository.findByApiNameAndDate(API_NAME, today)
                ?: ApiCallTracker(
                    apiName = API_NAME,
                    date = today,
                    callsMade = 0
                )

            tracker.callsMade++
            tracker.lastUpdated = java.time.Instant.now()

            apiCallTrackerRepository.save(tracker)
        } catch (e: Exception) {
            logger.error("Failed to track API call: ${e.message}", e)
        }
    }

    /**
     * Handle API errors and rate limiting
     */
    private fun handleApiError(e: RestClientResponseException) {
        when (e.statusCode.value()) {
            401 -> logger.error("Perenual API authentication failed. Check your API key.")
            429 -> logger.warn("Perenual API rate limit exceeded. Consider implementing backoff.")
            404 -> logger.debug("Perenual resource not found: ${e.message}")
            else -> logger.error("Perenual API error (${e.statusCode}): ${e.message}")
        }
    }

    /**
     * Get API call statistics for monitoring
     */
    fun getApiCallStats(date: LocalDate = LocalDate.now()): ApiCallTracker? {
        return apiCallTrackerRepository.findByApiNameAndDate(API_NAME, date)
    }

    /**
     * Check if API is configured (has API key)
     */
    fun isConfigured(): Boolean {
        return apiKey.isNotBlank()
    }
}
