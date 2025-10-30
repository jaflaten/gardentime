package no.sogn.plantdata.controller

import no.sogn.plantdata.scraper.PlantSlugRegistry
import no.sogn.plantdata.scraper.ScrapingOrchestrator
import no.sogn.plantdata.scraper.model.ScrapedPlantData
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/admin/scraping")
class ScrapingController(
    private val orchestrator: ScrapingOrchestrator,
    private val plantSlugRegistry: PlantSlugRegistry
) {
    
    /**
     * Scrape a single plant by slug
     */
    @PostMapping("/plant/{slug}")
    fun scrapePlant(@PathVariable slug: String): ResponseEntity<ScrapedPlantData> {
        val result = orchestrator.scrapeSinglePlant(slug)
        return ResponseEntity.ok(result)
    }
    
    /**
     * Scrape top priority plants (15 plants)
     */
    @PostMapping("/top-priority")
    fun scrapeTopPriority(): ResponseEntity<ScrapeResponse> {
        val results = orchestrator.scrapeTopPriority()
        return ResponseEntity.ok(ScrapeResponse(
            totalPlants = results.size,
            successful = results.count { it.successful },
            failed = results.count { !it.successful },
            results = results
        ))
    }
    
    /**
     * Scrape specific plants by slugs
     */
    @PostMapping("/plants")
    fun scrapePlants(@RequestBody request: ScrapeRequest): ResponseEntity<ScrapeResponse> {
        val results = orchestrator.scrapePlants(request.slugs)
        return ResponseEntity.ok(ScrapeResponse(
            totalPlants = results.size,
            successful = results.count { it.successful },
            failed = results.count { !it.successful },
            results = results
        ))
    }
    
    /**
     * Get available plant slugs
     */
    @GetMapping("/available-plants")
    fun getAvailablePlants(@RequestParam(required = false) priority: Int?): ResponseEntity<Map<String, Any>> {
        val plants = if (priority != null) {
            plantSlugRegistry.getPlantsByPriority(priority)
        } else {
            plantSlugRegistry.getAllTargetPlants()
        }
        
        return ResponseEntity.ok(mapOf(
            "total" to plants.size,
            "plants" to plants
        ))
    }
    
    /**
     * Get scraping status/health
     */
    @GetMapping("/status")
    fun getStatus(): ResponseEntity<Map<String, Any>> {
        val topPriority = plantSlugRegistry.getTopPriorityPlants()
        val allPlants = plantSlugRegistry.getAllTargetPlants()
        
        return ResponseEntity.ok(mapOf(
            "service" to "scraping",
            "status" to "ready",
            "topPriorityCount" to topPriority.size,
            "totalTargetPlantsCount" to allPlants.size,
            "message" to "Scraping service ready. Use POST /api/admin/scraping/top-priority to start."
        ))
    }
}

data class ScrapeRequest(
    val slugs: List<String>
)

data class ScrapeResponse(
    val totalPlants: Int,
    val successful: Int,
    val failed: Int,
    val results: List<ScrapedPlantData>
)
