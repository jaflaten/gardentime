package no.sogn.plantdata.service

import no.sogn.plantdata.dto.*
import no.sogn.plantdata.enums.*
import no.sogn.plantdata.model.*
import no.sogn.plantdata.repository.*
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.*

@Service
class PlantAttributeImportService(
    private val plantRepository: PlantRepository,
    private val plantAttributeRepository: PlantAttributeRepository,
    private val plantAttributeJdbcRepository: PlantAttributeJdbcRepository,
    private val plantAttributeEdiblePartsRepository: PlantAttributeEdiblePartsRepository,
    private val sourceRepository: SourceRepository,
    private val trefleService: TrefleService?
) {
    
    private val log = LoggerFactory.getLogger(javaClass)
    
    /**
     * Import plant attributes from LLM-parsed JSON
     */
    fun importPlantAttributes(request: ImportPlantAttributesRequest): ImportResponse {
        val attrs = request.attributes
        val warnings = mutableListOf<String>()
        
        try {
            log.info("Importing plant attributes for: ${attrs.commonName}")
            
            // Step 1: Find or create the plant entry (in its own transaction)
            val plant = findOrCreatePlantInNewTransaction(attrs.commonName, request.scientificName, warnings)
            
            // Step 2: Create or update plant attributes (in its own transaction via JDBC)
            val plantAttributes = createOrUpdateAttributes(plant, attrs, warnings)
            plantAttributeJdbcRepository.saveWithEnumCast(plantAttributes)
            
            // Step 3: Update edible parts (in its own transaction)
            updateEdiblePartsInTransaction(plant.id, attrs.edibleParts)
            
            // Step 4: Create source entry if needed (in its own transaction)
            createSourceIfNeededInTransaction(request.source)
            
            log.info("Successfully imported attributes for ${attrs.commonName} (plant_id: ${plant.id})")
            
            return ImportResponse(
                success = true,
                plantId = plant.id.toString(),
                commonName = attrs.commonName,
                message = "Successfully imported plant attributes",
                warnings = warnings
            )
            
        } catch (e: Exception) {
            log.error("Failed to import plant attributes for ${attrs.commonName}", e)
            return ImportResponse(
                success = false,
                plantId = null,
                commonName = attrs.commonName,
                message = "Failed to import: ${e.message}",
                warnings = warnings
            )
        }
    }
    
    /**
     * Find or create plant in a new transaction to ensure it's committed before attributes
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    fun findOrCreatePlantInNewTransaction(
        commonName: String,
        scientificName: String?,
        warnings: MutableList<String>
    ): Plant {
        return findOrCreatePlant(commonName, scientificName, warnings)
    }
    
    /**
     * Update edible parts in a transaction
     */
    @Transactional
    fun updateEdiblePartsInTransaction(plantId: UUID, edibleParts: List<String>) {
        updateEdibleParts(plantId, edibleParts)
    }
    
    /**
     * Create source in a transaction
     */
    @Transactional
    fun createSourceIfNeededInTransaction(sourceName: String) {
        createSourceIfNeeded(sourceName)
    }
    
    /**
     * Find existing plant or create new one
     */
    private fun findOrCreatePlant(
        commonName: String,
        scientificName: String?,
        warnings: MutableList<String>
    ): Plant {
        // Try to find by common name first
        val existing = plantRepository.findByCommonNameIgnoreCase(commonName)
        if (existing != null) {
            log.debug("Found existing plant: ${existing.commonName} (${existing.canonicalScientificName})")
            return existing
        }
        
        // Try to get scientific name from Trefle if not provided
        val resolvedScientificName = scientificName ?: tryFetchScientificName(commonName, warnings)
        
        if (resolvedScientificName == null) {
            warnings.add("Could not resolve scientific name - using common name as placeholder")
        }
        
        // Create new plant
        val plant = Plant(
            id = UUID.randomUUID(),
            canonicalScientificName = resolvedScientificName ?: commonName,
            commonName = commonName,
            family = null,  // Will be updated if we fetch from Trefle
            genus = null
        )
        
        log.info("Creating new plant: $commonName")
        return plantRepository.save(plant)
    }
    
    /**
     * Try to fetch scientific name from Trefle API
     */
    private fun tryFetchScientificName(commonName: String, warnings: MutableList<String>): String? {
        if (trefleService == null || !trefleService.isConfigured()) {
            warnings.add("Trefle API not configured - cannot fetch scientific name")
            return null
        }
        
        return try {
            val searchResults = trefleService.searchPlants(commonName, page = 1)
            val firstResult = searchResults.data.firstOrNull()
            
            if (firstResult != null) {
                log.info("Found scientific name from Trefle: ${firstResult.scientificName}")
                firstResult.scientificName
            } else {
                warnings.add("No results found in Trefle for: $commonName")
                null
            }
        } catch (e: Exception) {
            log.warn("Failed to fetch from Trefle: ${e.message}")
            warnings.add("Failed to fetch scientific name from Trefle: ${e.message}")
            null
        }
    }
    
    /**
     * Create or update plant attributes
     */
    private fun createOrUpdateAttributes(
        plant: Plant,
        attrs: ParsedPlantAttributesDto,
        warnings: MutableList<String>
    ): PlantAttributes {
        val existing = plantAttributeRepository.findById(plant.id).orElse(null)
        
        // Parse root depth with a default value
        val rootDepth = parseRootDepth(attrs.rootDepth, warnings)
        
        return (existing ?: PlantAttributes(
            plantId = plant.id,
            rootDepth = rootDepth
        )).apply {
            // Map enum values with validation
            this.cycle = parsePlantCycle(attrs.cycle, warnings)
            this.sunNeeds = parseSunNeeds(attrs.sunNeeds, warnings)
            this.waterNeeds = parseWaterNeeds(attrs.waterNeeds, warnings)
            this.rootDepth = rootDepth
            this.growthHabit = parseGrowthHabit(attrs.growthHabit, warnings)
            
            // Boolean values
            this.droughtTolerant = !attrs.frostTolerant && attrs.waterNeeds == "LOW"
            this.invasive = false  // Not extracted from current data
            this.poisonousToPets = false  // Not extracted from current data
            this.isNitrogenFixer = false  // Not extracted from current data
            
            // Numeric values
            this.daysToMaturityMin = attrs.daysToMaturityMin
            this.daysToMaturityMax = attrs.daysToMaturityMax
            
            // Update timestamp
            this.updatedAt = Instant.now()
            
            // Additional data stored in separate tables or future schema extensions
            // For now, we'll note in logs what data we're not storing
            if (attrs.soilTempMinF != null || attrs.soilTempOptimalF != null) {
                warnings.add("Soil temperature data captured but not stored in current schema (min: ${attrs.soilTempMinF}°F, optimal: ${attrs.soilTempOptimalF}°F)")
            }
            if (attrs.spacingMin != null || attrs.spacingMax != null) {
                warnings.add("Spacing data captured but not stored in current schema (${attrs.spacingMin}-${attrs.spacingMax} inches)")
            }
        }
    }
    
    /**
     * Update edible parts (separate table)
     */
    private fun updateEdibleParts(plantId: UUID, edibleParts: List<String>) {
        // Delete existing edible parts
        plantAttributeEdiblePartsRepository.deleteByPlantId(plantId)
        
        // Insert new edible parts
        edibleParts.forEach { part ->
            val ediblePart = PlantAttributeEdiblePart(
                plantId = plantId,
                ediblePart = part.lowercase()
            )
            plantAttributeEdiblePartsRepository.save(ediblePart)
        }
    }
    
    /**
     * Create source entry if it doesn't exist
     */
    private fun createSourceIfNeeded(sourceName: String) {
        val existing = sourceRepository.findByTitle(sourceName)
        if (existing == null) {
            val source = Source(
                id = UUID.randomUUID(),
                type = SourceType.WEBSITE,
                title = sourceName,
                url = when (sourceName) {
                    "Almanac.com" -> "https://www.almanac.com"
                    else -> null
                },
                copyrightOk = true
            )
            sourceRepository.save(source)
            log.info("Created source entry: $sourceName")
        }
    }
    
    // Enum parsing helpers with validation
    
    private fun parsePlantCycle(value: String, warnings: MutableList<String>): PlantCycle? {
        return try {
            PlantCycle.valueOf(value.uppercase())
        } catch (e: IllegalArgumentException) {
            warnings.add("Invalid plant cycle: $value, using null")
            null
        }
    }
    
    private fun parseSunNeeds(value: String, warnings: MutableList<String>): SunNeeds? {
        return try {
            SunNeeds.valueOf(value.uppercase())
        } catch (e: IllegalArgumentException) {
            warnings.add("Invalid sun needs: $value, using null")
            null
        }
    }
    
    private fun parseWaterNeeds(value: String, warnings: MutableList<String>): WaterNeeds? {
        return try {
            WaterNeeds.valueOf(value.uppercase())
        } catch (e: IllegalArgumentException) {
            warnings.add("Invalid water needs: $value, using null")
            null
        }
    }
    
    private fun parseRootDepth(value: String, warnings: MutableList<String>): RootDepth {
        return try {
            RootDepth.valueOf(value.uppercase())
        } catch (e: IllegalArgumentException) {
            warnings.add("Invalid root depth: $value, defaulting to MEDIUM")
            RootDepth.MEDIUM
        }
    }
    
    private fun parseGrowthHabit(value: String, warnings: MutableList<String>): GrowthHabit? {
        return try {
            GrowthHabit.valueOf(value.uppercase())
        } catch (e: IllegalArgumentException) {
            warnings.add("Invalid growth habit: $value, using null")
            null
        }
    }
}
