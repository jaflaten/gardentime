package no.sogn.plantdata.service

import no.sogn.plantdata.dto.*
import no.sogn.plantdata.model.Plant
import no.sogn.plantdata.model.PlantAttributes
import no.sogn.plantdata.repository.CompanionRelationshipRepository
import no.sogn.plantdata.repository.PlantAttributeEdiblePartsRepository
import no.sogn.plantdata.repository.PlantAttributeRepository
import no.sogn.plantdata.repository.PlantRepository
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.util.*

@Service
@Transactional(readOnly = true)
class PlantDataService(
    private val plantRepository: PlantRepository,
    private val plantAttributeRepository: PlantAttributeRepository,
    private val ediblePartsRepository: PlantAttributeEdiblePartsRepository,
    private val companionRelationshipRepository: CompanionRelationshipRepository
) {
    
    /**
     * Get all plants with optional filtering and pagination
     */
    fun getPlants(
        family: String? = null,
        feederType: String? = null,
        cycle: String? = null,
        sunNeeds: String? = null,
        search: String? = null,
        page: Int = 0,
        size: Int = 50
    ): PlantListResponseDTO {
        // Get all plants and filter in-memory (can be optimized with Specifications later)
        var plants = plantRepository.findAll().toList()
        
        // Apply filters
        family?.let { f ->
            plants = plants.filter { it.family?.equals(f, ignoreCase = true) == true }
        }
        
        search?.let { query ->
            plants = plants.filter { 
                it.commonName?.contains(query, ignoreCase = true) == true || 
                it.canonicalScientificName.contains(query, ignoreCase = true) 
            }
        }
        
        // Pagination
        val totalElements = plants.size.toLong()
        val totalPages = ((totalElements + size - 1) / size).toInt()
        val start = page * size
        val end = minOf(start + size, plants.size)
        val paginatedPlants = if (start < plants.size) plants.subList(start, end) else emptyList()
        
        // Load attributes for paginated plants
        val plantsWithAttributes = paginatedPlants.mapNotNull { plant ->
            val attributes = plantAttributeRepository.findById(plant.id).orElse(null)
            if (attributes != null) {
                // Apply additional filters based on attributes
                if (feederType != null && attributes.feederType?.name != feederType) return@mapNotNull null
                if (cycle != null && attributes.cycle?.name != cycle) return@mapNotNull null
                if (sunNeeds != null && attributes.sunNeeds?.name != sunNeeds) return@mapNotNull null
                
                plant to attributes
            } else null
        }
        
        return PlantListResponseDTO(
            plants = plantsWithAttributes.map { (plant, attributes) -> 
                toPlantSummary(plant, attributes) 
            },
            pagination = PaginationDTO(
                page = page,
                size = size,
                totalElements = plantsWithAttributes.size.toLong(),
                totalPages = ((plantsWithAttributes.size + size - 1) / size).toInt()
            )
        )
    }
    
    /**
     * Get plant by common name or scientific name
     */
    fun getPlantByName(name: String): PlantDetailDTO? {
        val plant = plantRepository.findByCommonNameIgnoreCase(name) 
            ?: plantRepository.findByCanonicalScientificNameIgnoreCase(name) 
            ?: return null
        
        val attributes = plantAttributeRepository.findById(plant.id).orElse(null) ?: return null
        
        return toPlantDetail(plant, attributes)
    }
    
    /**
     * Search plants by name or scientific name
     */
    fun searchPlants(query: String): List<PlantSummaryDTO> {
        val plants = plantRepository.findAll().filter { 
            it.commonName?.contains(query, ignoreCase = true) == true || 
            it.canonicalScientificName.contains(query, ignoreCase = true) 
        }
        
        return plants.mapNotNull { plant ->
            plantAttributeRepository.findById(plant.id)
                .map { attributes -> toPlantSummary(plant, attributes) }
                .orElse(null)
        }
    }
    
    // ============ Private Mapping Functions ============
    
    private fun toPlantSummary(plant: Plant, attributes: PlantAttributes): PlantSummaryDTO {
        val edibleParts = ediblePartsRepository.findByPlantId(plant.id)
            .map { it.ediblePart }
        
        return PlantSummaryDTO(
            id = plant.id,
            name = plant.commonName ?: plant.canonicalScientificName,
            scientificName = plant.canonicalScientificName,
            family = plant.family,
            genus = plant.genus,
            cycle = attributes.cycle?.name,
            sunNeeds = attributes.sunNeeds?.name,
            waterNeeds = attributes.waterNeeds?.name,
            rootDepth = attributes.rootDepth.name,
            growthHabit = attributes.growthHabit?.name,
            feederType = attributes.feederType?.name,
            isNitrogenFixer = attributes.isNitrogenFixer,
            edibleParts = edibleParts,
            maturityDaysMin = attributes.daysToMaturityMin,
            maturityDaysMax = attributes.daysToMaturityMax
        )
    }
    
    private fun toPlantDetail(plant: Plant, attributes: PlantAttributes): PlantDetailDTO {
        val edibleParts = ediblePartsRepository.findByPlantId(plant.id)
            .map { it.ediblePart }
        
        // Get companion count
        val companionCount = getCompanionCount(plant)
        
        return PlantDetailDTO(
            id = plant.id,
            name = plant.commonName ?: plant.canonicalScientificName,
            scientificName = plant.canonicalScientificName,
            family = plant.family,
            genus = plant.genus,
            cycle = attributes.cycle?.name,
            growthRequirements = GrowthRequirementsDTO(
                sunNeeds = attributes.sunNeeds?.name,
                waterNeeds = attributes.waterNeeds?.name,
                phMin = attributes.phMin?.toBigDecimal(),
                phMax = attributes.phMax?.toBigDecimal(),
                droughtTolerant = attributes.droughtTolerant
            ),
            plantingDetails = PlantingDetailsDTO(
                rootDepth = attributes.rootDepth.name,
                growthHabit = attributes.growthHabit?.name,
                daysToMaturityMin = attributes.daysToMaturityMin,
                daysToMaturityMax = attributes.daysToMaturityMax,
                successionIntervalDays = attributes.successionIntervalDays,
                edibleParts = edibleParts
            ),
            rotationData = RotationDataDTO(
                feederType = attributes.feederType?.name,
                isNitrogenFixer = attributes.isNitrogenFixer,
                primaryNutrientContribution = attributes.primaryNutrientContribution?.name
            ),
            companionCount = companionCount,
            synonyms = emptyList() // TODO: load from plant_synonyms table
        )
    }
    
    private fun getCompanionCount(plant: Plant): CompanionCountDTO {
        val allRelationships = companionRelationshipRepository.findAll()
            .filter { it.plantA.id == plant.id || it.plantB.id == plant.id }
        
        return CompanionCountDTO(
            beneficial = allRelationships.count { it.relationshipType.name == "BENEFICIAL" },
            antagonistic = allRelationships.count { it.relationshipType.name == "ANTAGONISTIC" },
            neutral = allRelationships.count { it.relationshipType.name == "NEUTRAL" }
        )
    }
}
