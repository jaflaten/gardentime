package no.sogn.plantdata.service

import no.sogn.plantdata.dto.TreflePlantDetailResponse
import no.sogn.plantdata.dto.TrefleSpeciesDetail
import no.sogn.plantdata.dto.TrefleSpeciesListResponse
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
 * Service for interacting with the Trefle API (https://docs.trefle.io).
 *
 * Features:
 * - Fetches plant lists and details from Trefle
 * - Implements rate limiting and error handling
 * - Tracks API call usage
 * - Provides caching for frequently accessed data
 */
@Service
class TrefleService(
    @Value("\${trefle.api.key:}") private val apiKey: String,
    @Value("\${trefle.api.base-url:https://trefle.io/api/v1}") private val baseUrl: String,
    private val apiCallTrackerRepository: ApiCallTrackerRepository
) {
    private val logger = LoggerFactory.getLogger(TrefleService::class.java)
    private val restClient: RestClient = RestClient.builder()
        .baseUrl(baseUrl)
        .build()

    companion object {
        private const val API_NAME = "TREFLE"
        private const val DEFAULT_PAGE_SIZE = 20
    }

    /**
     * Search for plants by query (common name, scientific name, etc.)
     *
     * @param query Search query
     * @param page Page number (starts at 1)
     * @return List response with plants matching the query
     */
    @Cacheable(value = ["trefle-search"], key = "#query + '-' + #page")
    fun searchPlants(query: String, page: Int = 1): TrefleSpeciesListResponse {
        logger.info("Searching Trefle plants: query='$query', page=$page")

        return try {
            val response = restClient.get()
                .uri { uriBuilder ->
                    uriBuilder
                        .path("/plants/search")
                        .queryParam("token", apiKey)
                        .queryParam("q", query)
                        .queryParam("page", page)
                        .build()
                }
                .retrieve()
                .body(TrefleSpeciesListResponse::class.java)

            trackApiCall(success = true)
            response ?: TrefleSpeciesListResponse()
        } catch (e: RestClientResponseException) {
            logger.error("Failed to search Trefle plants: ${e.message}", e)
            trackApiCall(success = false)
            handleApiError(e)
            TrefleSpeciesListResponse()
        } catch (e: Exception) {
            logger.error("Unexpected error searching Trefle plants: ${e.message}", e)
            trackApiCall(success = false)
            TrefleSpeciesListResponse()
        }
    }

    /**
     * List all plants with optional filtering
     *
     * @param page Page number (starts at 1)
     * @param filter Optional filter parameter
     * @return Paginated list of plants
     */
    @Cacheable(value = ["trefle-list"], key = "#page + '-' + #filter")
    fun listPlants(page: Int = 1, filter: String? = null): TrefleSpeciesListResponse {
        logger.info("Listing Trefle plants: page=$page, filter=$filter")

        return try {
            val response = restClient.get()
                .uri { uriBuilder ->
                    val builder = uriBuilder
                        .path("/plants")
                        .queryParam("token", apiKey)
                        .queryParam("page", page)

                    if (!filter.isNullOrBlank()) {
                        builder.queryParam("filter[common_name]", filter)
                    }

                    builder.build()
                }
                .retrieve()
                .body(TrefleSpeciesListResponse::class.java)

            trackApiCall(success = true)
            response ?: TrefleSpeciesListResponse()
        } catch (e: RestClientResponseException) {
            logger.error("Failed to list Trefle plants: ${e.message}", e)
            trackApiCall(success = false)
            handleApiError(e)
            TrefleSpeciesListResponse()
        } catch (e: Exception) {
            logger.error("Unexpected error listing Trefle plants: ${e.message}", e)
            trackApiCall(success = false)
            TrefleSpeciesListResponse()
        }
    }

    /**
     * Get detailed information about a specific plant by ID
     *
     * @param plantId Trefle plant ID
     * @return Detailed plant information or null if not found
     */
    @Cacheable(value = ["trefle-detail"], key = "#plantId")
    fun getPlantDetail(plantId: Long): TrefleSpeciesDetail? {
        logger.info("Fetching Trefle plant detail: id=$plantId")

        return try {
            val response = restClient.get()
                .uri { uriBuilder ->
                    uriBuilder
                        .path("/plants/{id}")
                        .queryParam("token", apiKey)
                        .build(plantId)
                }
                .retrieve()
                .body(TreflePlantDetailResponse::class.java)

            trackApiCall(success = true)
            response?.data?.let { TrefleSpeciesDetail.fromPlantDetail(it) }
        } catch (e: RestClientResponseException) {
            if (e.statusCode == HttpStatus.NOT_FOUND) {
                logger.warn("Trefle plant not found: id=$plantId")
            } else {
                logger.error("Failed to fetch Trefle plant detail: ${e.message}", e)
            }
            trackApiCall(success = false)
            handleApiError(e)
            null
        } catch (e: Exception) {
            logger.error("Unexpected error fetching Trefle plant detail: ${e.message}", e)
            trackApiCall(success = false)
            null
        }
    }

    /**
     * Batch fetch plant details for multiple IDs
     *
     * @param plantIds List of Trefle plant IDs
     * @return Map of plant ID to detail (only successful fetches)
     */
    fun batchGetPlantDetails(plantIds: List<Long>): Map<Long, TrefleSpeciesDetail> {
        logger.info("Batch fetching ${plantIds.size} Trefle plant details")

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
            401 -> logger.error("Trefle API authentication failed. Check your API key.")
            429 -> logger.warn("Trefle API rate limit exceeded. Consider implementing backoff.")
            404 -> logger.debug("Trefle resource not found: ${e.message}")
            else -> logger.error("Trefle API error (${e.statusCode}): ${e.message}")
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
