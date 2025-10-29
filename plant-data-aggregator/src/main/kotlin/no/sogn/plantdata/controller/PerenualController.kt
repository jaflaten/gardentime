package no.sogn.plantdata.controller

import no.sogn.plantdata.dto.PerenualSpeciesDetail
import no.sogn.plantdata.dto.PerenualSpeciesListResponse
import no.sogn.plantdata.service.PerenualService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * REST controller for Perenual API operations.
 * Provides endpoints for searching, listing, and retrieving detailed plant data from Perenual.
 */
@RestController
@RequestMapping("/api/perenual")
class PerenualController(private val perenualService: PerenualService) {

    /**
     * Health check endpoint
     * GET /api/perenual/health
     */
    @GetMapping("/health")
    fun health(): ResponseEntity<Map<String, Any>> {
        val configured = perenualService.isConfigured()
        return ResponseEntity.ok(
            mapOf(
                "service" to "perenual",
                "configured" to configured,
                "status" to if (configured) "ready" else "not configured"
            )
        )
    }

    /**
     * Search plants by query
     * GET /api/perenual/search?query=tomato&page=1
     */
    @GetMapping("/search")
    fun searchPlants(
        @RequestParam query: String,
        @RequestParam(defaultValue = "1") page: Int
    ): ResponseEntity<PerenualSpeciesListResponse> {
        if (!perenualService.isConfigured()) {
            return ResponseEntity.status(503).body(PerenualSpeciesListResponse())
        }
        val result = perenualService.searchPlants(query, page)
        return ResponseEntity.ok(result)
    }

    /**
     * List all plants with optional filters
     * GET /api/perenual/plants?page=1&edible=true&indoor=false
     */
    @GetMapping("/plants")
    fun listPlants(
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(required = false) edible: Boolean?,
        @RequestParam(required = false) indoor: Boolean?
    ): ResponseEntity<PerenualSpeciesListResponse> {
        if (!perenualService.isConfigured()) {
            return ResponseEntity.status(503).body(PerenualSpeciesListResponse())
        }
        val result = perenualService.listPlants(page, edible, indoor)
        return ResponseEntity.ok(result)
    }

    /**
     * Get detailed information for a specific plant
     * GET /api/perenual/plants/{id}
     */
    @GetMapping("/plants/{id}")
    fun getPlantDetail(@PathVariable id: Long): ResponseEntity<PerenualSpeciesDetail> {
        if (!perenualService.isConfigured()) {
            return ResponseEntity.status(503).build()
        }
        val plant = perenualService.getPlantDetail(id)
        return if (plant != null) {
            ResponseEntity.ok(plant)
        } else {
            ResponseEntity.notFound().build()
        }
    }

    /**
     * Batch fetch plant details
     * POST /api/perenual/plants/batch
     * Body: {"ids": [1, 2, 3, ...]}
     */
    @PostMapping("/plants/batch")
    fun batchGetPlants(@RequestBody request: BatchRequest): ResponseEntity<Map<Long, PerenualSpeciesDetail>> {
        if (!perenualService.isConfigured()) {
            return ResponseEntity.status(503).body(emptyMap())
        }
        val result = perenualService.batchGetPlantDetails(request.ids)
        return ResponseEntity.ok(result)
    }

    /**
     * Get API usage statistics
     * GET /api/perenual/stats
     */
    @GetMapping("/stats")
    fun getStats(): ResponseEntity<Map<String, Any>> {
        val stats = perenualService.getApiCallStats()
        return ResponseEntity.ok(
            mapOf(
                "apiName" to (stats?.apiName ?: "PERENUAL"),
                "date" to (stats?.date?.toString() ?: "N/A"),
                "callsMade" to (stats?.callsMade ?: 0),
                "lastUpdated" to (stats?.lastUpdated?.toString() ?: "N/A"),
                "configured" to perenualService.isConfigured()
            )
        )
    }

    data class BatchRequest(val ids: List<Long>)
}
