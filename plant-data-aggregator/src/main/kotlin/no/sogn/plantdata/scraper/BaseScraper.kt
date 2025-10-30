package no.sogn.plantdata.scraper

import no.sogn.plantdata.scraper.model.ScrapedPlantData
import org.jsoup.Jsoup
import org.jsoup.nodes.Document
import org.slf4j.LoggerFactory
import java.time.Instant

abstract class BaseScraper(
    protected val config: ScraperConfig,
    protected val rateLimiter: RateLimiter
) {
    
    protected val log = LoggerFactory.getLogger(javaClass)
    
    abstract val domain: String
    abstract val sourceName: String
    
    /**
     * Fetch and parse a plant page
     */
    fun scrapePlant(slug: String): ScrapedPlantData {
        val url = buildUrl(slug)
        
        return try {
            log.info("Scraping $sourceName plant: $slug from $url")
            
            // Respect rate limiting
            rateLimiter.waitIfNeeded(domain)
            
            // Fetch with retry logic
            val html = fetchWithRetry(url)
            val doc = Jsoup.parse(html)
            
            // Record successful request
            rateLimiter.recordRequest(domain)
            
            // Extract data
            ScrapedPlantData(
                slug = slug,
                source = sourceName,
                url = url,
                commonName = extractCommonName(doc),
                description = extractDescription(doc),
                companionSection = extractCompanionSection(doc),
                plantingGuide = extractPlantingGuide(doc),
                careInstructions = extractCareInstructions(doc),
                harvestInfo = extractHarvestInfo(doc),
                pestsAndDiseases = extractPestsAndDiseases(doc),
                rawHtml = html,
                scrapedAt = Instant.now(),
                successful = true
            )
        } catch (e: Exception) {
            log.error("Failed to scrape $sourceName plant: $slug", e)
            ScrapedPlantData(
                slug = slug,
                source = sourceName,
                url = url,
                commonName = null,
                description = null,
                companionSection = null,
                plantingGuide = null,
                careInstructions = null,
                harvestInfo = null,
                pestsAndDiseases = null,
                rawHtml = "",
                scrapedAt = Instant.now(),
                successful = false,
                errorMessage = e.message
            )
        }
    }
    
    /**
     * Fetch URL with retry logic
     */
    private fun fetchWithRetry(url: String): String {
        var lastException: Exception? = null
        
        repeat(config.maxRetries) { attempt ->
            try {
                log.debug("Fetching $url (attempt ${attempt + 1}/${config.maxRetries})")
                
                val response = Jsoup.connect(url)
                    .userAgent(config.userAgent)
                    .timeout(config.connectionTimeoutMs)
                    .execute()
                
                if (response.statusCode() == 200) {
                    return response.body()
                } else {
                    throw Exception("HTTP ${response.statusCode()}: ${response.statusMessage()}")
                }
            } catch (e: Exception) {
                lastException = e
                log.warn("Attempt ${attempt + 1} failed for $url: ${e.message}")
                
                if (attempt < config.maxRetries - 1) {
                    Thread.sleep(config.retryDelayMs)
                }
            }
        }
        
        throw lastException ?: Exception("Failed to fetch $url after ${config.maxRetries} attempts")
    }
    
    // Abstract methods to be implemented by specific scrapers
    protected abstract fun buildUrl(slug: String): String
    protected abstract fun extractCommonName(doc: Document): String?
    protected abstract fun extractDescription(doc: Document): String?
    protected abstract fun extractCompanionSection(doc: Document): String?
    protected abstract fun extractPlantingGuide(doc: Document): String?
    protected abstract fun extractCareInstructions(doc: Document): String?
    protected abstract fun extractHarvestInfo(doc: Document): String?
    protected abstract fun extractPestsAndDiseases(doc: Document): String?
}
