# API Security Implementation Summary

## Problem
The plant-data-aggregator API was open to everyone without authentication, which is a security risk. We needed to secure it while still allowing the gardentime application to access the plant data.

## Solution
Implemented API key-based authentication for service-to-service communication between gardentime and plant-data-aggregator.

## Changes Made

### 1. Plant Data Aggregator (Backend)

#### New Security Components
- **`ApiKeyAuthenticationFilter`**: Spring Security filter that validates API keys in the `X-API-Key` header
- **`SecurityConfig`**: Spring Security configuration that:
  - Enables API key authentication on all endpoints except health checks
  - Configures CORS to allow requests from gardentime frontend and backend
  - Disables CSRF (stateless API)
  - Sets session management to STATELESS

#### Dependencies Added
- `spring-boot-starter-security` - Spring Security framework
- `spring-security-test` - For testing security configuration

#### Configuration
- Added `api.key` property in `application.yml`
- Default key for development: `dev-key-change-in-production-make-it-very-secure-and-random`
- Environment variable: `PLANT_DATA_API_KEY`

#### Controller Changes
- Removed `@CrossOrigin(origins = ["*"])` from `PlantDataController` (now handled centrally in SecurityConfig)

### 2. Gardentime Backend (Client)

#### Configuration Changes
- Added `plantdata.api.key` property in `application.yml`
- Updated `PlantDataApiConfig` to include API key interceptor
- Interceptor automatically adds `X-API-Key` header to all requests to plant-data-aggregator

#### Client Updates
- `PlantDataApiClient` now automatically includes API key in all requests via the RestTemplate interceptor
- No changes needed to individual API calls

### 3. Gardentime Frontend (Next.js)

#### Environment Configuration
- Created `.env.local` with API key configuration
- Created `.env.local.example` as template

#### API Route Updates
- Updated `/app/api/plants/search/route.ts` to:
  - Use correct API endpoint path (`/api/v1/plant-data/plants/search`)
  - Include `X-API-Key` header in requests
  - Read API key from environment variable

### 4. Documentation
- Created `plant-data-aggregator/SECURITY.md` with comprehensive security documentation including:
  - Overview of security implementation
  - Configuration instructions for all components
  - Production deployment best practices
  - API endpoint documentation
  - Testing instructions
  - Future enhancement suggestions

## Security Features

### Authentication
- **Method**: API Key via HTTP header (`X-API-Key`)
- **Scope**: All endpoints except health checks
- **Validation**: Per-request validation in filter
- **Logging**: Failed authentication attempts are logged with IP address

### CORS Configuration
- **Development**: Allows `localhost:3000` (Next.js) and `localhost:8080` (Spring Boot)
- **Production**: Should be updated to actual domain names

### Protected Endpoints
All endpoints under `/api/v1/plant-data/*`:
- Plant search and listing
- Plant details
- Companion planting information
- Pest and disease data
- Family information
- Compatibility checks

### Unprotected Endpoints
- `/actuator/health` - Health check
- `/actuator/info` - Application info

## Production Deployment Checklist

1. **Generate Strong API Key**
   ```bash
   openssl rand -base64 32
   ```

2. **Set Environment Variables** on all services:
   - Plant-data-aggregator: `PLANT_DATA_API_KEY`
   - Gardentime backend: `PLANT_DATA_API_KEY`
   - Gardentime frontend: `PLANT_DATA_API_KEY`

3. **Update CORS Configuration** in `plant-data-aggregator/src/main/kotlin/no/sogn/plantdata/config/SecurityConfig.kt`:
   - Replace `localhost` URLs with production domain names

4. **Network Security**:
   - Restrict plant-data-aggregator to only accept connections from gardentime servers
   - Use firewall rules or network policies
   - Consider running on private network

5. **Enable HTTPS** on all services to encrypt API keys in transit

6. **Set up Monitoring** for failed authentication attempts

## Testing

### Local Development
Both applications work with the default development API key.

### Testing API Key Authentication
```bash
# Without API key (should fail with 403)
curl http://localhost:8081/api/v1/plant-data/plants

# With API key (should succeed)
curl -H "X-API-Key: dev-key-change-in-production-make-it-very-secure-and-random" \
  http://localhost:8081/api/v1/plant-data/plants
```

### Testing Through Gardentime
The gardentime application automatically includes the API key when calling plant-data-aggregator, so users can search for plants through the frontend as normal.

## Benefits

1. **Security**: Plant data is no longer publicly accessible
2. **Service-to-Service Auth**: Proper authentication between internal services
3. **Simple Implementation**: API key authentication is lightweight and easy to manage
4. **Backward Compatible**: No changes to existing API endpoints
5. **Flexible**: Easy to add more clients by sharing the API key
6. **Production Ready**: Supports environment-based configuration

## Future Enhancements

Consider implementing:
1. **Multiple API Keys**: Different keys for different clients
2. **Rate Limiting**: Limit requests per API key
3. **Key Scopes**: Different permissions for different keys
4. **Key Expiration**: Automatic key rotation
5. **OAuth 2.0**: More sophisticated authentication for public API
6. **mTLS**: Additional security layer for production

## Architecture

```
┌─────────────────┐
│  Next.js Client │
│  (Frontend)     │
└────────┬────────┘
         │ HTTP + JWT
         ▼
┌─────────────────┐
│  Spring Boot    │
│  (Gardentime)   │
└────────┬────────┘
         │ HTTP + API Key
         ▼
┌─────────────────┐
│  Spring Boot    │
│  (Plant Data    │
│   Aggregator)   │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL     │
│  (Plant Data)   │
└─────────────────┘
```

The gardentime backend acts as a secure intermediary, authenticating users with JWT and then using the API key to fetch plant data on their behalf.

## Files Changed

### Plant Data Aggregator
- `plant-data-aggregator/build.gradle.kts` - Added Spring Security dependency
- `plant-data-aggregator/src/main/resources/application.yml` - Added API key configuration
- `plant-data-aggregator/src/main/kotlin/no/sogn/plantdata/security/ApiKeyAuthenticationFilter.kt` - New
- `plant-data-aggregator/src/main/kotlin/no/sogn/plantdata/config/SecurityConfig.kt` - New
- `plant-data-aggregator/src/main/kotlin/no/sogn/plantdata/controller/PlantDataController.kt` - Removed @CrossOrigin
- `plant-data-aggregator/SECURITY.md` - New documentation

### Gardentime Backend
- `src/main/resources/application.yml` - Added API key configuration
- `src/main/kotlin/no/sogn/gardentime/config/PlantDataApiConfig.kt` - Added API key interceptor

### Gardentime Frontend
- `client-next/.env.local` - Added API key configuration
- `client-next/.env.local.example` - Added API key configuration template
- `client-next/app/api/plants/search/route.ts` - Added API key header, fixed endpoint path

## Verification

Both applications build successfully:
```
BUILD SUCCESSFUL in 1s
```

The security implementation is complete and ready for testing with the running applications.
