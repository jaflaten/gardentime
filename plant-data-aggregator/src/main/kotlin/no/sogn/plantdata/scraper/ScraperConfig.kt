package no.sogn.plantdata.scraper

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration

@Configuration
@ConfigurationProperties(prefix = "scraper")
data class ScraperConfig(
    var userAgent: String = "Mozilla/5.0 (compatible; GardenTime-PlantDataAggregator/1.0; +https://gardentime.app)",
    var requestDelayMs: Long = 3000, // 3 seconds between requests (polite)
    var connectionTimeoutMs: Int = 30000, // 30 seconds
    var maxRetries: Int = 3,
    var retryDelayMs: Long = 5000,
    var outputBaseDir: String = "docs/scrapers"
)
