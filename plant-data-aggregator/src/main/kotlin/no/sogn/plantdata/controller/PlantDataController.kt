package no.sogn.plantdata.controller

import no.sogn.plantdata.dto.*
import no.sogn.plantdata.service.CompanionPlantingService
import no.sogn.plantdata.service.PlantDataService
import no.sogn.plantdata.service.PestDiseaseService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/plant-data")
class PlantDataController(
    private val plantDataService: PlantDataService,
    private val companionPlantingService: CompanionPlantingService,
    private val pestDiseaseService: PestDiseaseService
) {
    
    /**
     * GET /api/v1/plant-data/plants
     * List all plants with optional filtering and pagination
     */
    @GetMapping("/plants")
    fun getPlants(
        @RequestParam(required = false) family: String?,
        @RequestParam(required = false) feederType: String?,
        @RequestParam(required = false) cycle: String?,
        @RequestParam(required = false) sunNeeds: String?,
        @RequestParam(required = false) search: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int
    ): ResponseEntity<PlantListResponseDTO> {
        val result = plantDataService.getPlants(
            family = family,
            feederType = feederType,
            cycle = cycle,
            sunNeeds = sunNeeds,
            search = search,
            page = page,
            size = size
        )
        return ResponseEntity.ok(result)
    }
    
    /**
     * GET /api/v1/plant-data/plants/{name}
     * Get detailed information for a specific plant by common name or scientific name
     */
    @GetMapping("/plants/{name}")
    fun getPlantByName(@PathVariable name: String): ResponseEntity<PlantDetailDTO> {
        val plant = plantDataService.getPlantByName(name)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(plant)
    }
    
    /**
     * GET /api/v1/plant-data/plants/search
     * Search plants by name
     */
    @GetMapping("/plants/search")
    fun searchPlants(@RequestParam q: String): ResponseEntity<List<PlantSummaryDTO>> {
        val results = plantDataService.searchPlants(q)
        return ResponseEntity.ok(results)
    }
    
    /**
     * POST /api/v1/plant-data/plants/bulk
     * Get multiple plants at once
     */
    @PostMapping("/plants/bulk")
    fun getBulkPlants(@RequestBody request: BulkPlantRequest): ResponseEntity<BulkPlantResponseDTO> {
        val result = plantDataService.getBulkPlants(request.plantNames)
        return ResponseEntity.ok(result)
    }
    
    /**
     * GET /api/v1/plant-data/families
     * List all plant families with counts
     */
    @GetMapping("/families")
    fun getFamilies(): ResponseEntity<FamiliesResponseDTO> {
        val result = plantDataService.getFamilies()
        return ResponseEntity.ok(result)
    }
    
    /**
     * GET /api/v1/plant-data/families/{familyName}/plants
     * Get all plants in a specific family
     */
    @GetMapping("/families/{familyName}/plants")
    fun getPlantsByFamily(@PathVariable familyName: String): ResponseEntity<FamilyWithPlantsDTO> {
        val result = plantDataService.getPlantsByFamily(familyName)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(result)
    }
    
    /**
     * GET /api/v1/plant-data/plants/{name}/companions
     * Get companion planting information for a plant
     */
    @GetMapping("/plants/{name}/companions")
    fun getCompanions(
        @PathVariable name: String,
        @RequestParam(required = false) relationship: String?
    ): ResponseEntity<CompanionListDTO> {
        val result = companionPlantingService.getCompanions(name, relationship)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(result)
    }
    
    /**
     * POST /api/v1/plant-data/companions/check
     * Check compatibility between multiple plants
     */
    @PostMapping("/companions/check")
    fun checkCompatibility(
        @RequestBody request: CompatibilityCheckRequest
    ): ResponseEntity<CompatibilityCheckResponse> {
        return try {
            val result = companionPlantingService.checkCompatibility(request.plantNames)
            ResponseEntity.ok(result)
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }
    
    /**
     * GET /api/v1/plant-data/plants/{name}/pests
     * Get pests that affect this plant
     */
    @GetMapping("/plants/{name}/pests")
    fun getPlantPests(@PathVariable name: String): ResponseEntity<PlantPestsResponseDTO> {
        val result = pestDiseaseService.getPlantPests(name)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(result)
    }
    
    /**
     * GET /api/v1/plant-data/plants/{name}/diseases
     * Get diseases that affect this plant
     */
    @GetMapping("/plants/{name}/diseases")
    fun getPlantDiseases(@PathVariable name: String): ResponseEntity<PlantDiseasesResponseDTO> {
        val result = pestDiseaseService.getPlantDiseases(name)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(result)
    }
    
    /**
     * GET /api/v1/plant-data/diseases/soil-borne
     * Get all soil-borne diseases (critical for rotation planning)
     */
    @GetMapping("/diseases/soil-borne")
    fun getSoilBorneDiseases(): ResponseEntity<SoilBorneDiseasesResponseDTO> {
        val result = pestDiseaseService.getSoilBorneDiseases()
        return ResponseEntity.ok(result)
    }
}
