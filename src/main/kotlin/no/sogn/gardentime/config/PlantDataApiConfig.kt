package no.sogn.gardentime.config

import org.springframework.boot.web.client.RestTemplateBuilder
import org.springframework.cache.annotation.EnableCaching
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.client.RestTemplate
import java.time.Duration

/**
 * Configuration for plant-data-aggregator API client
 */
@Configuration
@EnableCaching
class PlantDataApiConfig {
    
    /**
     * RestTemplate for calling plant-data-aggregator API
     * Configured with timeouts and retry logic
     */
    @Bean
    fun plantDataRestTemplate(builder: RestTemplateBuilder): RestTemplate {
        return builder
            .setConnectTimeout(Duration.ofSeconds(5))
            .setReadTimeout(Duration.ofSeconds(10))
            .build()
    }
}
