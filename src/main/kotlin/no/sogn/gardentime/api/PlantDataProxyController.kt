package no.sogn.gardentime.api

import no.sogn.gardentime.client.PlantDataApiClient
import no.sogn.gardentime.client.dto.*
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = ["*"])
class PlantDataProxyController(
    private val plantDataApiClient: PlantDataApiClient
) {
    
    private val logger = LoggerFactory.getLogger(PlantDataProxyController::class.java)
    
    /**
     * Search plants by name
     * GET /api/plants/search?q={query}&limit={limit}
     */
    @GetMapping("/plants/search")
    fun searchPlants(
        @RequestParam q: String,
        @RequestParam(defaultValue = "20") limit: Int
    ): ResponseEntity<List<PlantSummaryDTO>> {
        logger.info("=== PLANT SEARCH REQUEST ===")
        logger.info("Searching plants: query='{}', limit={}", q, limit)
        
        return try {
            val results = plantDataApiClient.searchPlants(q)
            val limited = results.take(limit)
            logger.info("=== PLANT SEARCH RESPONSE ===")
            logger.info("Found {} plants for query '{}'", limited.size, q)
            ResponseEntity.ok(limited)
        } catch (e: Exception) {
            logger.error("=== PLANT SEARCH ERROR ===", e)
            logger.error("Error searching plants for query '{}': {}", q, e.message)
            throw e
        }
    }
    
    /**
     * Get detailed plant information
     * GET /api/plants/{name}
     */
    @GetMapping("/plants/{name}")
    fun getPlantDetails(@PathVariable name: String): ResponseEntity<PlantDetailDTO> {
        logger.info("Getting plant details for: {}", name)
        val plant = plantDataApiClient.getPlantDetails(name)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(plant)
    }
    
    /**
     * Get all plants with filtering
     * GET /api/plants?family={family}&page={page}&size={size}
     */
    @GetMapping("/plants")
    fun getPlants(
        @RequestParam(required = false) family: String?,
        @RequestParam(required = false) feederType: String?,
        @RequestParam(required = false) cycle: String?,
        @RequestParam(required = false) search: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int
    ): ResponseEntity<PlantListResponseDTO> {
        logger.info("Getting plants: family={}, page={}, size={}", family, page, size)
        val result = plantDataApiClient.getPlants(
            page = page,
            size = size,
            family = family,
            feederType = feederType,
            cycle = cycle,
            search = search
        )
        return ResponseEntity.ok(result)
    }
    
    /**
     * Get soil-borne diseases
     * GET /api/diseases/soil-borne
     */
    @GetMapping("/diseases/soil-borne")
    fun getSoilBorneDiseases(): ResponseEntity<SoilBorneDiseasesResponseDTO> {
        logger.info("Getting soil-borne diseases")
        val diseases = plantDataApiClient.getSoilBorneDiseases()
        return ResponseEntity.ok(diseases)
    }
    
    /**
     * Check plant compatibility
     * POST /api/companions/check
     */
    @PostMapping("/companions/check")
    fun checkCompatibility(@RequestBody request: CompatibilityCheckRequest): ResponseEntity<CompatibilityCheckResponse> {
        logger.info("Checking compatibility for: {}", request.plantNames)
        val result = plantDataApiClient.checkCompatibility(request.plantNames)
            ?: return ResponseEntity.badRequest().build()
        return ResponseEntity.ok(result)
    }
    
    /**
     * Get plant families
     * GET /api/families
     */
    @GetMapping("/families")
    fun getFamilies(): ResponseEntity<FamiliesResponseDTO> {
        logger.info("Getting plant families")
        val families = plantDataApiClient.getFamilies()
        return ResponseEntity.ok(families)
    }
    
    /**
     * Get plants by family
     * GET /api/families/{familyName}/plants
     */
    @GetMapping("/families/{familyName}/plants")
    fun getPlantsByFamily(@PathVariable familyName: String): ResponseEntity<FamilyWithPlantsDTO> {
        logger.info("Getting plants for family: {}", familyName)
        val result = plantDataApiClient.getPlantsByFamily(familyName)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(result)
    }
    
    /**
     * Get plant companions
     * GET /api/plants/{name}/companions
     */
    @GetMapping("/plants/{name}/companions")
    fun getCompanions(@PathVariable name: String): ResponseEntity<CompanionListDTO> {
        logger.info("Getting companions for: {}", name)
        val result = plantDataApiClient.getCompanions(name)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(result)
    }
    
    /**
     * Get plant pests
     * GET /api/plants/{name}/pests
     */
    @GetMapping("/plants/{name}/pests")
    fun getPlantPests(@PathVariable name: String): ResponseEntity<PlantPestsResponseDTO> {
        logger.info("Getting pests for: {}", name)
        val result = plantDataApiClient.getPlantPests(name)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(result)
    }
    
    /**
     * Get plant diseases
     * GET /api/plants/{name}/diseases
     */
    @GetMapping("/plants/{name}/diseases")
    fun getPlantDiseases(@PathVariable name: String): ResponseEntity<PlantDiseasesResponseDTO> {
        logger.info("Getting diseases for: {}", name)
        val result = plantDataApiClient.getPlantDiseases(name)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(result)
    }
}
