package no.sogn.plantdata.controller

import no.sogn.plantdata.dto.TrefleSpeciesDetail
import no.sogn.plantdata.dto.TrefleSpeciesListResponse
import no.sogn.plantdata.service.TrefleService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * REST controller for Trefle API integration endpoints
 */
@RestController
@RequestMapping("/api/trefle")
class TrefleController(private val trefleService: TrefleService) {

    /**
     * Search for plants in Trefle API
     *
     * @param query Search query (common name, scientific name, etc.)
     * @param page Page number (default: 1)
     * @return List of matching plants
     */
    @GetMapping("/search")
    fun searchPlants(
        @RequestParam query: String,
        @RequestParam(defaultValue = "1") page: Int
    ): ResponseEntity<TrefleSpeciesListResponse> {
        if (!trefleService.isConfigured()) {
            return ResponseEntity.status(503)
                .body(TrefleSpeciesListResponse())
        }

        val response = trefleService.searchPlants(query, page)
        return ResponseEntity.ok(response)
    }

    /**
     * List all plants from Trefle API
     *
     * @param page Page number (default: 1)
     * @param filter Optional filter by common name
     * @return Paginated list of plants
     */
    @GetMapping("/plants")
    fun listPlants(
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(required = false) filter: String?
    ): ResponseEntity<TrefleSpeciesListResponse> {
        if (!trefleService.isConfigured()) {
            return ResponseEntity.status(503)
                .body(TrefleSpeciesListResponse())
        }

        val response = trefleService.listPlants(page, filter)
        return ResponseEntity.ok(response)
    }

    /**
     * Get detailed information about a specific plant
     *
     * @param id Trefle plant ID
     * @return Detailed plant information or 404 if not found
     */
    @GetMapping("/plants/{id}")
    fun getPlantDetail(@PathVariable id: Long): ResponseEntity<TrefleSpeciesDetail> {
        if (!trefleService.isConfigured()) {
            return ResponseEntity.status(503).build()
        }

        val detail = trefleService.getPlantDetail(id)
        return if (detail != null) {
            ResponseEntity.ok(detail)
        } else {
            ResponseEntity.notFound().build()
        }
    }

    /**
     * Get API call statistics
     */
    @GetMapping("/stats")
    fun getStats(): ResponseEntity<Map<String, Any>> {
        val stats = trefleService.getApiCallStats()
        return if (stats != null) {
            ResponseEntity.ok(mapOf(
                "apiName" to stats.apiName,
                "date" to stats.date.toString(),
                "callsMade" to stats.callsMade,
                "lastUpdated" to stats.lastUpdated.toString(),
                "configured" to trefleService.isConfigured()
            ))
        } else {
            ResponseEntity.ok(mapOf(
                "configured" to trefleService.isConfigured(),
                "callsMade" to 0
            ))
        }
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    fun health(): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.ok(mapOf(
            "service" to "trefle",
            "configured" to trefleService.isConfigured(),
            "status" to if (trefleService.isConfigured()) "ready" else "not_configured"
        ))
    }
}

