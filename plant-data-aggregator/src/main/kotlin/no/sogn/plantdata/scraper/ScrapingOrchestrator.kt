package no.sogn.plantdata.scraper

import no.sogn.plantdata.scraper.model.ScrapedPlantData
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class ScrapingOrchestrator(
    private val almanacScraper: AlmanacScraper,
    private val fileOutputService: FileOutputService,
    private val plantSlugRegistry: PlantSlugRegistry
) {
    
    private val log = LoggerFactory.getLogger(javaClass)
    
    /**
     * Scrape a single plant and save results
     */
    fun scrapeSinglePlant(slug: String): ScrapedPlantData {
        log.info("Starting scrape for plant: $slug")
        
        val data = almanacScraper.scrapePlant(slug)
        
        // Save raw HTML
        fileOutputService.saveRawHtml(data.slug, data.rawHtml, data.scrapedAt)
        
        // Save scraped data JSON
        fileOutputService.saveScrapedData(data)
        
        // Log result
        val status = if (data.successful) "SUCCESS" else "FAILED"
        val message = buildString {
            appendLine("**Plant: ${data.slug}** - $status")
            if (data.successful) {
                appendLine("- Common name: ${data.commonName ?: "N/A"}")
                appendLine("- Has companion info: ${data.companionSection?.isNotBlank() ?: false}")
                appendLine("- Has planting guide: ${data.plantingGuide?.isNotBlank() ?: false}")
                appendLine("- URL: ${data.url}")
            } else {
                appendLine("- Error: ${data.errorMessage}")
            }
        }
        fileOutputService.appendToReport(message)
        
        log.info("Completed scrape for $slug: $status")
        return data
    }
    
    /**
     * Scrape top priority plants (15 plants)
     */
    fun scrapeTopPriority(): List<ScrapedPlantData> {
        val plants = plantSlugRegistry.getTopPriorityPlants()
        log.info("Starting scrape of ${plants.size} top priority plants")
        
        val results = plants.map { plant ->
            scrapeSinglePlant(plant.slug)
        }
        
        // Generate summary report
        fileOutputService.generateSummaryReport(results)
        
        val successCount = results.count { it.successful }
        log.info("Scraping complete: $successCount/${results.size} successful")
        
        return results
    }
    
    /**
     * Scrape specific plants by slugs
     */
    fun scrapePlants(slugs: List<String>): List<ScrapedPlantData> {
        log.info("Starting scrape of ${slugs.size} plants")
        
        val results = slugs.map { slug ->
            scrapeSinglePlant(slug)
        }
        
        // Generate summary report
        fileOutputService.generateSummaryReport(results)
        
        val successCount = results.count { it.successful }
        log.info("Scraping complete: $successCount/${results.size} successful")
        
        return results
    }
    
    /**
     * Scrape all target plants (30 plants - use cautiously!)
     */
    fun scrapeAllTargetPlants(): List<ScrapedPlantData> {
        val plants = plantSlugRegistry.getAllTargetPlants()
        log.warn("Starting scrape of ALL ${plants.size} target plants - this will take time!")
        
        val results = plants.map { plant ->
            scrapeSinglePlant(plant.slug)
        }
        
        // Generate summary report
        fileOutputService.generateSummaryReport(results)
        
        val successCount = results.count { it.successful }
        log.info("Scraping complete: $successCount/${results.size} successful")
        
        return results
    }
}
