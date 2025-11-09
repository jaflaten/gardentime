package no.sogn.plantdata.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class ApiKeyAuthenticationFilter(
    @Value("\${api.key:}") private val validApiKey: String
) : OncePerRequestFilter() {
    
    private val logger = LoggerFactory.getLogger(javaClass)
    
    companion object {
        private const val API_KEY_HEADER = "X-API-Key"
    }
    
    override fun shouldNotFilter(request: HttpServletRequest): Boolean {
        val path = request.requestURI
        // Don't filter health check endpoints
        return path.startsWith("/actuator/health") || path.startsWith("/actuator/info")
    }
    
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val requestApiKey = request.getHeader(API_KEY_HEADER)
        
        if (validApiKey.isEmpty()) {
            logger.warn("API key not configured - allowing all requests. This is insecure!")
            // Set authentication even without API key for development
            val authentication = UsernamePasswordAuthenticationToken(
                "anonymous",
                null,
                listOf(SimpleGrantedAuthority("ROLE_API_USER"))
            )
            SecurityContextHolder.getContext().authentication = authentication
            filterChain.doFilter(request, response)
            return
        }
        
        if (requestApiKey == null || requestApiKey != validApiKey) {
            logger.warn("Invalid or missing API key from IP: ${request.remoteAddr}, path: ${request.requestURI}")
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Invalid or missing API key")
            return
        }
        
        logger.debug("Valid API key from IP: ${request.remoteAddr}, path: ${request.requestURI}")
        
        // Set authentication in SecurityContext
        val authentication = UsernamePasswordAuthenticationToken(
            "api-client",
            null,
            listOf(SimpleGrantedAuthority("ROLE_API_USER"))
        )
        SecurityContextHolder.getContext().authentication = authentication
        
        filterChain.doFilter(request, response)
    }
}
