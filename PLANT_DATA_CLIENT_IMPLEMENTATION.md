# Plant Data API Client Implementation

## Overview

Implementation of HTTP client in **gardentime** to fetch plant data from **plant-data-aggregator** API with caching support.

## Architecture

### Separation of Concerns

**plant-data-aggregator** (Port 8081):
- Provides REST API for plant reference data
- Aggregates data from multiple sources
- Serves plant characteristics, families, companions, pests, diseases
- No rotation planning logic (stateless data service)

**gardentime** (Port 8080):
- Consumes plant-data-aggregator API
- Implements rotation planning logic
- Manages user gardens and season plans
- Uses plant data to make intelligent rotation recommendations

## Implementation Details

### Client: PlantDataApiClient

Located: `src/main/kotlin/no/sogn/gardentime/client/PlantDataApiClient.kt`

#### Endpoints Implemented

1. **Plant Information**
   - `getPlantDetails(plantName)` - Get detailed plant info
   - `getPlants(page, size, filters)` - List/filter plants
   - `searchPlants(query)` - Search by name
   - `getBulkPlants(plantNames)` - Get multiple plants

2. **Plant Families**
   - `getFamilies()` - List all families
   - `getPlantsByFamily(familyName)` - Plants in family

3. **Companion Planting**
   - `getCompanions(plantName)` - Get companion info
   - `checkCompatibility(plantNames)` - Multi-plant compatibility

4. **Pest & Disease**
   - `getPlantPests(plantName)` - Pests for plant
   - `getPlantDiseases(plantName)` - Diseases for plant
   - `getSoilBorneDiseases()` - Critical rotation diseases

### Caching Strategy

All API calls are cached using Spring Cache with Caffeine:

**Cache Configuration** (`application.yml`):
```yaml
spring.cache:
  cache-names: plantDetails,plantList,plantSearch,families,familyPlants,
               soilBorneDiseases,companions,plantPests,plantDiseases,compatibility
  caffeine:
    spec: maximumSize=500,expireAfterWrite=3600s
```

**Cache TTLs**:
- Plant details: 1 hour
- Plant lists: 1 hour
- Families: 24 hours (rarely change)
- Companions: 1 hour
- Pests/Diseases: 1 hour
- Soil-borne diseases: 24 hours
- Compatibility checks: 1 hour

### DTOs

Located: `src/main/kotlin/no/sogn/gardentime/client/dto/PlantDataApiDTOs.kt`

All DTOs mirror the plant-data-aggregator API response structures:
- `PlantSummaryDTO` - Brief plant info
- `PlantDetailDTO` - Full plant details
- `FamilySummaryDTO` - Family info
- `CompanionDTO` - Companion relationships
- `PestDTO` / `DiseaseDTO` - Pest/disease info
- `CompatibilityCheckResponse` - Compatibility results
- `BulkPlantResponseDTO` - Bulk fetch results

### Error Handling

- 404 errors return `null` (plant not found)
- Other HTTP errors throw `PlantDataApiException`
- Logs all errors for debugging
- Graceful degradation (returns empty lists on failure where appropriate)

### Configuration

**application.yml**:
```yaml
plantdata:
  api:
    url: ${PLANT_DATA_API_URL:http://localhost:8081}
```

**RestTemplate Configuration** (`PlantDataApiConfig.kt`):
- Connect timeout: 5 seconds
- Read timeout: 10 seconds
- Caching enabled

## Usage Example

```kotlin
@Service
class RotationPlanningService(
    private val plantDataClient: PlantDataApiClient
) {
    
    fun validateRotation(currentPlant: String, history: List<String>): RotationValidation {
        // Get plant details from API
        val plant = plantDataClient.getPlantDetails(currentPlant)
            ?: return RotationValidation.plantNotFound()
        
        // Get soil-borne diseases
        val diseases = plantDataClient.getSoilBorneDiseases()
        
        // Get companion compatibility
        val compatibility = plantDataClient.checkCompatibility(
            listOf(currentPlant) + history
        )
        
        // Implement rotation logic based on data
        return scoreRotation(plant, diseases, compatibility, history)
    }
}
```

## Testing

Test files created:
- `PlantDataApiClientTest.kt` - Unit tests with mocked API
- `PlantDataApiClientIntegrationTest.kt` - Integration tests against real API

## Documentation Updates

Updated `docs/API_IMPLEMENTATION_PLAN.md` to clarify:
- Rotation planning logic is in gardentime
- plant-data-aggregator only provides plant data
- Clear architectural separation

## Benefits

1. **Performance**: Caching reduces API calls and improves response times
2. **Reliability**: Error handling prevents cascading failures
3. **Maintainability**: Clean separation between data service and business logic
4. **Scalability**: Can easily switch to different plant data sources
5. **Testing**: Easy to mock plant data for rotation logic tests

## Next Steps

The rotation planning logic in gardentime can now use this client to:
1. Fetch plant family information for rotation rules
2. Check companion compatibility
3. Analyze pest/disease risks
4. Score rotation plans based on real plant data

All plant data is now available through a clean, cached API client interface.
