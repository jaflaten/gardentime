package no.sogn.plantdata.scraper

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap

@Component
class RateLimiter(private val config: ScraperConfig) {
    
    private val log = LoggerFactory.getLogger(javaClass)
    private val lastRequestTime = ConcurrentHashMap<String, Instant>()
    
    /**
     * Wait if necessary to respect rate limits for a given domain
     */
    fun waitIfNeeded(domain: String) {
        val last = lastRequestTime[domain]
        if (last != null) {
            val elapsed = Instant.now().toEpochMilli() - last.toEpochMilli()
            val remaining = config.requestDelayMs - elapsed
            
            if (remaining > 0) {
                log.debug("Rate limiting: waiting ${remaining}ms before next request to $domain")
                Thread.sleep(remaining)
            }
        }
        
        lastRequestTime[domain] = Instant.now()
    }
    
    /**
     * Mark that a request was made to a domain (used after successful request)
     */
    fun recordRequest(domain: String) {
        lastRequestTime[domain] = Instant.now()
    }
}
