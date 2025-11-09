# Plant Data Aggregator API Security

## Overview

The plant-data-aggregator API is secured using API key authentication. This ensures that only authorized clients (specifically the gardentime application) can access the plant data.

## Security Implementation

### API Key Authentication

- **Authentication Method**: HTTP Header-based API Key
- **Header Name**: `X-API-Key`
- **Filter**: `ApiKeyAuthenticationFilter` validates the API key on every request
- **Protected Endpoints**: All endpoints except health checks (`/actuator/health`, `/actuator/info`)

### Configuration

#### Plant Data Aggregator (Server)

The API key is configured in `application.yml`:

```yaml
api:
  key: ${PLANT_DATA_API_KEY:dev-key-change-in-production-make-it-very-secure-and-random}
```

**Environment Variable**: `PLANT_DATA_API_KEY`

#### Gardentime Backend (Client)

The API key is configured in `application.yml`:

```yaml
plantdata:
  api:
    url: ${PLANT_DATA_API_URL:http://localhost:8081}
    key: ${PLANT_DATA_API_KEY:dev-key-change-in-production-make-it-very-secure-and-random}
```

The `PlantDataApiConfig` automatically adds the API key to all outgoing requests via a `ClientHttpRequestInterceptor`.

#### Gardentime Frontend (Next.js)

The API key is configured in `.env.local`:

```env
PLANT_DATA_API_URL=http://localhost:8081
PLANT_DATA_API_KEY=dev-key-change-in-production-make-it-very-secure-and-random
```

The Next.js API routes (`/app/api/plants/*`) add the API key when proxying requests to the plant-data-aggregator.

## Production Deployment

### Security Best Practices

1. **Generate a Strong API Key**
   ```bash
   # Generate a secure random key (32 bytes, base64 encoded)
   openssl rand -base64 32
   ```

2. **Set Environment Variables**
   
   For plant-data-aggregator:
   ```bash
   export PLANT_DATA_API_KEY="your-generated-secure-key-here"
   ```
   
   For gardentime backend:
   ```bash
   export PLANT_DATA_API_KEY="your-generated-secure-key-here"
   ```
   
   For gardentime frontend:
   ```bash
   export PLANT_DATA_API_KEY="your-generated-secure-key-here"
   ```

3. **Never Commit API Keys**
   - API keys should never be committed to version control
   - Use environment variables or secure secret management systems
   - The default key in application.yml is only for local development

4. **Rotate Keys Regularly**
   - Change API keys periodically (e.g., every 90 days)
   - Update keys on all clients when rotating

5. **Network Security**
   - In production, plant-data-aggregator should only be accessible from:
     - The gardentime backend server
     - The gardentime frontend server (for SSR)
   - Use firewall rules or network policies to restrict access
   - Consider running on a private network

6. **HTTPS Only**
   - Always use HTTPS in production to encrypt API keys in transit
   - Configure SSL/TLS certificates properly

7. **Monitoring**
   - Monitor for failed authentication attempts
   - Log all API key validation failures
   - Set up alerts for suspicious activity

## CORS Configuration

CORS is configured in `SecurityConfig` to allow:
- `http://localhost:3000` (Next.js dev server)
- `http://localhost:8080` (Spring Boot backend)

In production, update these to your actual domain names.

## Development vs Production

### Development (Default)
- Uses default API key (insecure, logged as warning)
- CORS allows localhost origins
- Suitable for local development only

### Production
- Requires strong, randomly generated API key
- CORS restricted to production domains
- All traffic over HTTPS
- API key passed via secure environment variables

## API Endpoints

All endpoints under `/api/v1/plant-data/*` require API key authentication:

- `GET /api/v1/plant-data/plants` - List plants
- `GET /api/v1/plant-data/plants/{name}` - Get plant details
- `GET /api/v1/plant-data/plants/search` - Search plants
- `POST /api/v1/plant-data/plants/bulk` - Bulk plant fetch
- `GET /api/v1/plant-data/families` - List families
- `GET /api/v1/plant-data/families/{familyName}/plants` - Plants by family
- `GET /api/v1/plant-data/plants/{name}/companions` - Companion plants
- `POST /api/v1/plant-data/companions/check` - Check compatibility
- `GET /api/v1/plant-data/plants/{name}/pests` - Plant pests
- `GET /api/v1/plant-data/plants/{name}/diseases` - Plant diseases
- `GET /api/v1/plant-data/diseases/soil-borne` - Soil-borne diseases

## Testing

To test API key authentication:

```bash
# Without API key (should fail with 403)
curl http://localhost:8081/api/v1/plant-data/plants

# With API key (should succeed)
curl -H "X-API-Key: dev-key-change-in-production-make-it-very-secure-and-random" \
  http://localhost:8081/api/v1/plant-data/plants
```

## Future Enhancements

Consider implementing:
1. Multiple API keys for different clients
2. Rate limiting per API key
3. API key scopes/permissions
4. API key expiration
5. OAuth 2.0 for more sophisticated authentication
6. mTLS for additional security layer
