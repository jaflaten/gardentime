# Plant Data API Security Configuration Fix

## Issue
The plant-data-aggregator API was returning 403 Forbidden errors when gardentime tried to fetch plant data, even though both services were configured with matching API keys.

## Root Cause
The `ApiKeyAuthenticationFilter` in plant-data-aggregator was validating the API key correctly, but was not setting the authentication in Spring Security's `SecurityContext`. This meant that even though the filter accepted the request, Spring Security's authorization layer rejected it because there was no authenticated principal.

## Changes Made

### 1. Fixed ApiKeyAuthenticationFilter

**File:** `plant-data-aggregator/src/main/kotlin/no/sogn/plantdata/security/ApiKeyAuthenticationFilter.kt`

**Changes:**
- Added `shouldNotFilter()` method to explicitly exclude health check endpoints (`/actuator/health`, `/actuator/info`)
- Updated `doFilterInternal()` to set authentication in `SecurityContext` when API key is valid
- Creates a `UsernamePasswordAuthenticationToken` with `ROLE_API_USER` authority
- Added more detailed logging including request path and IP address
- Added debug logging for successful authentication

### 2. Architecture Verification

Confirmed the architecture is correct:
- **plant-data-aggregator**: Provides REST API for plant reference data, secured with API key authentication
- **gardentime backend**: Consumes plant-data-aggregator API using `PlantDataApiClient` with API key
- **NextJS BFF**: Only talks to gardentime backend using JWT authentication
- **Frontend**: Only talks to NextJS BFF

## API Key Configuration

Both services use the same API key configured in `application.yml`:

```yaml
# gardentime
plantdata:
  api:
    key: ${PLANT_DATA_API_KEY:dev-key-change-in-production-make-it-very-secure-and-random}

# plant-data-aggregator  
api:
  key: ${PLANT_DATA_API_KEY:dev-key-change-in-production-make-it-very-secure-and-random}
```

The API key is automatically added to requests by `PlantDataApiConfig`:

```kotlin
@Bean
fun plantDataRestTemplate(builder: RestTemplateBuilder): RestTemplate {
    return builder
        .setConnectTimeout(Duration.ofSeconds(5))
        .setReadTimeout(Duration.ofSeconds(10))
        .additionalInterceptors(apiKeyInterceptor())
        .build()
}

private fun apiKeyInterceptor() = ClientHttpRequestInterceptor { request, body, execution ->
    request.headers.set("X-API-Key", apiKey)
    execution.execute(request, body)
}
```

## Testing

### Direct API Test (Successful)
```bash
curl -H "X-API-Key: dev-key-change-in-production-make-it-very-secure-and-random" \
  "http://localhost:8081/api/v1/plant-data/plants/search?q=tomato"
```

### Health Check (No Auth Required)
```bash
curl http://localhost:8081/actuator/health
# Returns: {"status":"UP"}
```

## User Authentication Issue

The frontend was also showing 401 errors, but this is a separate issue related to JWT token expiration. Backend logs showed:

```
JWT expired 376681363 milliseconds ago at 2025-11-02T09:58:18.000Z
```

**Solution**: User needs to log out and log back in to get a fresh JWT token. The JWT token lifetime is configured to 24 hours in gardentime's `application.yml`:

```yaml
jwt:
  expiration: 86400000  # 24 hours in milliseconds
```

## Security Best Practices

1. **API Key Storage**: In production, use environment variables or secrets management:
   ```bash
   export PLANT_DATA_API_KEY="<strong-random-key>"
   ```

2. **HTTPS Only**: Always use HTTPS in production to protect API keys in transit

3. **Key Rotation**: Implement regular API key rotation

4. **Rate Limiting**: Consider adding rate limiting to prevent abuse

5. **Monitoring**: Log all authentication failures for security monitoring

## Next Steps

1. User should log out and log back in to refresh JWT token
2. Test plant search functionality through the full stack
3. In production, generate and use a strong random API key
4. Consider implementing API key rotation mechanism
