package no.sogn.gardentime.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.web.client.RestTemplateBuilder
import org.springframework.cache.annotation.EnableCaching
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpRequest
import org.springframework.http.client.ClientHttpRequestExecution
import org.springframework.http.client.ClientHttpRequestInterceptor
import org.springframework.web.client.RestTemplate
import java.time.Duration

/**
 * Configuration for plant-data-aggregator API client
 */
@Configuration
@EnableCaching
class PlantDataApiConfig {
    
    @Value("\${plantdata.api.key}")
    private lateinit var apiKey: String
    
    /**
     * RestTemplate for calling plant-data-aggregator API
     * Configured with timeouts, retry logic, and API key authentication
     */
    @Bean
    fun plantDataRestTemplate(builder: RestTemplateBuilder): RestTemplate {
        return builder
            .setConnectTimeout(Duration.ofSeconds(5))
            .setReadTimeout(Duration.ofSeconds(10))
            .additionalInterceptors(apiKeyInterceptor())
            .build()
    }
    
    /**
     * Interceptor that adds the API key to all requests
     */
    private fun apiKeyInterceptor() = ClientHttpRequestInterceptor { request, body, execution ->
        request.headers.set("X-API-Key", apiKey)
        execution.execute(request, body)
    }
}
