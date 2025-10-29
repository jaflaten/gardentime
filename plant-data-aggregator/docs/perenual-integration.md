# Perenual API Integration

## Overview

The PerenualService provides integration with the [Perenual API](https://perenual.com/api/) for accessing plant data. It includes:

- ✅ Plant search by name
- ✅ Paginated plant listings with filters
- ✅ Detailed plant information retrieval
- ✅ Rate limiting and API call tracking
- ✅ Caching with Caffeine (in-memory)
- ✅ Error handling and logging

## Setup

### 1. Get a Perenual API Key

1. Sign up at [Perenual.com](https://perenual.com/docs/api)
2. Get your API key from the dashboard

### 2. Configure the API Key

Set the environment variable:

```bash
export PERENUAL_API_KEY=your_api_key_here
```

Or update `application.yml`:

```yaml
perenual:
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
GET http://localhost:8081/api/perenual/health
```

Response:
```json
{
  "service": "perenual",
  "configured": true,
  "status": "ready"
}
```

### Search Plants
```bash
GET http://localhost:8081/api/perenual/search?query=tomato&page=1
```

Response:
```json
{
  "data": [
    {
      "id": 1234,
      "common_name": "Tomato",
      "scientific_name": ["Solanum lycopersicum"],
      "other_name": ["Love Apple"],
      "family": "Solanaceae",
      "genus": "Solanum",
      "default_image": {
        "thumbnail": "https://..."
      }
    }
  ],
  "current_page": 1,
  "last_page": 10,
  "per_page": 30,
  "total": 287
}
```

### List All Plants with Filters
```bash
GET http://localhost:8081/api/perenual/plants?page=1&edible=true&indoor=false
```

Supported filters:
- `edible` (boolean) - Filter for edible plants
- `indoor` (boolean) - Filter for indoor plants
- `page` (integer) - Page number for pagination

### Get Plant Details
```bash
GET http://localhost:8081/api/perenual/plants/1234
```

Response:
```json
{
  "id": 1234,
  "common_name": "Tomato",
  "scientific_name": "Solanum lycopersicum",
  "scientificNames": ["Solanum lycopersicum"],
  "family": "Solanaceae",
  "genus": "Solanum",
  "type": "vegetable",
  "cycle": "Annual",
  "watering": "Frequent",
  "sunlight": ["full sun"],
  "edible_fruit": true,
  "edible_leaf": false,
  "edibleParts": ["fruit"],
  "growth_rate": "High",
  "maintenance": "Moderate",
  "drought_tolerant": false,
  "invasive": false,
  "poisonous_to_pets": false,
  "description": "...",
  "default_image": {...}
}
```

### Batch Fetch Plants
```bash
POST http://localhost:8081/api/perenual/plants/batch
Content-Type: application/json

{
  "ids": [1234, 5678, 9012]
}
```

Response:
```json
{
  "1234": { "id": 1234, "common_name": "Tomato", ... },
  "5678": { "id": 5678, "common_name": "Basil", ... },
  "9012": { "id": 9012, "common_name": "Carrot", ... }
}
```

### API Statistics
```bash
GET http://localhost:8081/api/perenual/stats
```

Response:
```json
{
  "apiName": "PERENUAL",
  "date": "2025-10-23",
  "callsMade": 15,
  "lastUpdated": "2025-10-23T22:45:00Z",
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
class MyPlantService(private val perenualService: PerenualService) {
    
    fun findPlantByName(name: String): PerenualSpeciesDetail? {
        val results = perenualService.searchPlants(name, page = 1)
        return results.data.firstOrNull()?.id?.let { id ->
            perenualService.getPlantDetail(id)
        }
    }
    
    fun findEdiblePlants(page: Int = 1): PerenualSpeciesListResponse {
        return perenualService.listPlants(page = page, edible = true)
    }
}
```

### Batch Fetching

```kotlin
// Efficient batch fetching with automatic caching
val plantIds = listOf(1234L, 5678L, 9012L)
val plants = perenualService.batchGetPlantDetails(plantIds)

plants.forEach { (id, detail) ->
    println("${detail.commonName}: ${detail.scientificName}")
}
```

## Rate Limiting

The Perenual API has rate limits. The service:
- ✅ Tracks all API calls in the database
- ✅ Logs warnings when rate limits are exceeded
- ⚠️ Consider implementing exponential backoff for production

### Check Rate Limit Usage

```kotlin
val stats = perenualService.getApiCallStats()
println("API calls today: ${stats?.callsMade}")
```

## Error Handling

The service handles various errors gracefully:

- **401 Unauthorized**: Invalid API key
- **404 Not Found**: Plant ID doesn't exist
- **429 Too Many Requests**: Rate limit exceeded
- **5xx Server Errors**: Perenual service issues

All errors are logged and return empty results or null instead of throwing exceptions.

## Data Model

### PerenualSpeciesDetail

The DTO for Perenual plant details includes:

```kotlin
data class PerenualSpeciesDetail(
    val id: Long,
    val commonName: String?,
    val scientificNames: List<String>?,      // Array from API
    val otherNames: List<String>?,
    val family: String?,
    val genus: String?,
    val type: String?,                       // "tree", "vegetable", etc.
    val cycle: String?,                      // "Annual", "Perennial", etc.
    val watering: String?,                   // "Frequent", "Average", etc.
    val sunlight: List<String>?,             // ["full sun", "part shade"]
    val growth_rate: String?,
    val maintenance: String?,
    val edible_fruit: Boolean?,
    val edible_leaf: Boolean?,
    val drought_tolerant: Boolean?,
    val invasive: Boolean?,
    val poisonous_to_humans: Boolean?,
    val poisonous_to_pets: Boolean?,
    val description: String?,
    val default_image: PerenualImage?,
    // ... and many more fields
) {
    // Computed property - extracts first scientific name
    val scientificName: String?
        get() = scientificNames?.firstOrNull()
    
    // Helper to get edible parts
    val edibleParts: List<String>
        get() = buildList {
            if (edibleFruit == true) add("fruit")
            if (edibleLeaf == true) add("leaf")
        }
}
```

## Key Differences from Trefle

1. **Scientific Names**: Perenual returns scientific names as an array, while Trefle returns a single string. The DTO provides a computed `scientificName` property for compatibility.

2. **Response Structure**: Perenual returns the plant detail directly, while Trefle wraps it in a `data` field.

3. **Boolean Fields**: Perenual uses explicit boolean fields for properties like `edible_fruit`, `edible_leaf`, while Trefle uses nested objects.

4. **Filtering**: Perenual supports filtering by edible/indoor in the list endpoint, which Trefle doesn't.

## Testing

### Manual Testing with cURL

```bash
# Health check
curl http://localhost:8081/api/perenual/health

# Search for tomatoes
curl "http://localhost:8081/api/perenual/search?query=tomato"

# List edible plants
curl "http://localhost:8081/api/perenual/plants?edible=true&page=1"

# Get specific plant
curl http://localhost:8081/api/perenual/plants/1234

# Batch fetch
curl -X POST http://localhost:8081/api/perenual/plants/batch \
  -H "Content-Type: application/json" \
  -d '{"ids": [1234, 5678]}'

# Check stats
curl http://localhost:8081/api/perenual/stats
```

## Next Steps

1. ✅ Perenual integration complete
2. 🔄 Enhance PlantMergeService to handle Perenual-specific fields
3. 🔄 Add data enrichment mapping (cycle, watering, sunlight)
4. 🔄 Implement conflict resolution for overlapping fields
5. 🔄 Build unified plant search across both APIs

## Troubleshooting

### "Service not configured" error

Make sure the PERENUAL_API_KEY environment variable is set:

```bash
export PERENUAL_API_KEY=your_key_here
./gradlew :plant-data-aggregator:bootRun
```

### Rate limit exceeded

The service logs warnings when rate limits are hit. Consider:
- Increasing cache duration
- Implementing exponential backoff
- Upgrading Perenual API plan

### Empty scientific name

If `scientificName` is null, check the `scientificNames` array - the API returns it as an array. The computed property automatically extracts the first element.

### Cache not working

Verify cache configuration in logs. If cache isn't working, check that `@EnableCaching` is present in CacheConfig and the cache names match in the service methods.
