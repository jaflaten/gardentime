# Trefle API Integration

## Overview

The TrefleService provides integration with the [Trefle API](https://docs.trefle.io) for accessing plant data. It includes:

- ✅ Plant search by name
- ✅ Paginated plant listings
- ✅ Detailed plant information retrieval
- ✅ Rate limiting and API call tracking
- ✅ Caching with Caffeine (in-memory)
- ✅ Error handling and logging

## Setup

### 1. Get a Trefle API Key

1. Sign up at [Trefle.io](https://trefle.io)
2. Get your API key from the dashboard

### 2. Configure the API Key

Set the environment variable:

```bash
export TREFLE_API_KEY=your_api_key_here
```

Or update `application.yml`:

```yaml
trefle:
  api:
    key: your_api_key_here
```

### 3. Start the Application

```bash
./gradlew :plant-data-aggregator:bootRun
```

## API Endpoints

### Health Check
```bash
GET http://localhost:8081/api/trefle/health
```

Response:
```json
{
  "service": "trefle",
  "configured": true,
  "status": "ready"
}
```

### Search Plants
```bash
GET http://localhost:8081/api/trefle/search?query=tomato&page=1
```

Response:
```json
{
  "data": [
    {
      "id": 123456,
      "common_name": "Tomato",
      "scientific_name": "Solanum lycopersicum",
      "family": "Solanaceae",
      "genus": "Solanum",
      ...
    }
  ],
  "meta": {...}
}
```

### List All Plants
```bash
GET http://localhost:8081/api/trefle/plants?page=1&filter=tomato
```

### Get Plant Details
```bash
GET http://localhost:8081/api/trefle/plants/123456
```

Response:
```json
{
  "id": 123456,
  "scientificName": "Solanum lycopersicum",
  "commonName": "Tomato",
  "family": "Solanaceae",
  "genus": "Solanum",
  "ediblePart": "fruit",
  "vegetable": true,
  "edible": true,
  "growthMonths": ["april", "may", "june"],
  "bloomMonths": ["june", "july"],
  "imageUrl": "https://...",
  "synonyms": ["Lycopersicon esculentum"],
  "sources": ["https://..."]
}
```

### API Statistics
```bash
GET http://localhost:8081/api/trefle/stats
```

Response:
```json
{
  "apiName": "TREFLE",
  "date": "2025-10-16",
  "callsMade": 42,
  "lastUpdated": "2025-10-16T10:30:00Z",
  "configured": true
}
```

## Caching

The service uses Caffeine for in-memory caching:

- **Cache Duration**: 1 hour
- **Max Size**: 1000 entries
- **Cached Endpoints**: search, list, and detail endpoints

### Why Caffeine vs Valkey/Redis?

**Caffeine (Current Choice)**:
- ⚡ Extremely fast (nanoseconds latency)
- 🔧 Simple setup, no external dependencies
- 💾 Perfect for read-heavy, rarely-changing data
- ✅ Good for single-instance services

**Valkey/Redis (Future Option)**:
- 🌐 Shared cache across multiple instances
- 💪 Persists across restarts
- 📈 Better for horizontally scaled deployments
- ⏱️ Slight network latency overhead

For this use case, Caffeine is optimal since:
1. Plant data rarely changes
2. This is a single-instance service
3. Cache can be rebuilt on restart
4. No need for cross-instance sharing

## Usage in Code

### Basic Usage

```kotlin
@Service
class MyPlantService(private val trefleService: TrefleService) {
    
    fun findPlantByName(name: String): TrefleSpeciesDetail? {
        val results = trefleService.searchPlants(name, page = 1)
        return results.data.firstOrNull()?.id?.let { id ->
            trefleService.getPlantDetail(id)
        }
    }
    
    fun batchFetch(ids: List<Long>): Map<Long, TrefleSpeciesDetail> {
        return trefleService.batchGetPlantDetails(ids)
    }
}
```

### Batch Fetching

```kotlin
// Efficient batch fetching with automatic caching
val plantIds = listOf(123456L, 234567L, 345678L)
val plants = trefleService.batchGetPlantDetails(plantIds)

plants.forEach { (id, detail) ->
    println("${detail.commonName}: ${detail.scientificName}")
}
```

## Rate Limiting

The Trefle API has rate limits. The service:
- ✅ Tracks all API calls in the database
- ✅ Logs warnings when rate limits are exceeded
- ⚠️ Consider implementing exponential backoff for production

### Check Rate Limit Usage

```kotlin
val stats = trefleService.getApiCallStats()
println("API calls today: ${stats?.callsMade}")
```

## Error Handling

The service handles various errors gracefully:

- **401 Unauthorized**: Invalid API key
- **404 Not Found**: Plant ID doesn't exist
- **429 Too Many Requests**: Rate limit exceeded
- **5xx Server Errors**: Trefle service issues

All errors are logged and return empty results or null instead of throwing exceptions.

## Data Model

### TrefleSpeciesDetail

The simplified DTO for merge service compatibility includes:

```kotlin
data class TrefleSpeciesDetail(
    val id: Long,
    val scientificName: String?,
    val commonName: String?,
    val family: String?,
    val genus: String?,
    val ediblePart: String?,
    val vegetable: Boolean?,
    val edible: Boolean?,
    val light: Int?,
    val soilTexture: Int?,
    val growthMonths: List<String>?,
    val bloomMonths: List<String>?,
    val imageUrl: String?,
    val sources: List<String>?,
    val synonyms: List<String>?
)
```

## Testing

### Manual Testing with cURL

```bash
# Health check
curl http://localhost:8081/api/trefle/health

# Search for tomatoes
curl "http://localhost:8081/api/trefle/search?query=tomato"

# Get specific plant
curl http://localhost:8081/api/trefle/plants/123456

# Check stats
curl http://localhost:8081/api/trefle/stats
```

## Next Steps

1. ✅ Trefle integration complete
2. 🔄 Implement PerenualService (similar pattern)
3. 🔄 Create PlantMergeService integration
4. 🔄 Add admin endpoints for data curation
5. 🔄 Implement companion planting data scraping

## Troubleshooting

### "Service not configured" error

Make sure the TREFLE_API_KEY environment variable is set:

```bash
export TREFLE_API_KEY=your_key_here
./gradlew :plant-data-aggregator:bootRun
```

### Rate limit exceeded

The service logs warnings when rate limits are hit. Consider:
- Increasing cache duration
- Implementing exponential backoff
- Upgrading Trefle API plan

### Cache not working

Verify cache configuration in logs:
```
DEBUG no.sogn.plantdata.service.TrefleService - Fetching from cache: ...
```

If cache isn't working, check that `@EnableCaching` is present in CacheConfig.

