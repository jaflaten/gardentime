package no.sogn.plantdata.service

import no.sogn.plantdata.dto.PlantSummaryDTO
import no.sogn.plantdata.repository.PlantAttributeRepository
import no.sogn.plantdata.repository.PlantRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class SeasonalPlanningService(
    private val plantRepository: PlantRepository,
    private val plantAttributeRepository: PlantAttributeRepository
) {
    
    /**
     * Get plants suitable for a given season, zone, and planting method
     * 
     * Note: Season-specific planting data is not yet available in the database.
     * This returns all plants with their basic attributes.
     */
    fun getSeasonalPlants(
        season: String?,
        zone: String?,
        month: Int?,
        directSow: Boolean?,
        indoorStart: Boolean?
    ): List<PlantSummaryDTO> {
        // Get all plants
        val allPlants = plantRepository.findAll()
        
        // Get attributes for filtering
        val plantIds = allPlants.map { it.id }
        val attributesMap = plantAttributeRepository.findAllById(plantIds)
            .associateBy { it.plantId }
        
        // Convert to DTOs
        return allPlants.mapNotNull { plant ->
            val attributes = attributesMap[plant.id]
            
            // Basic filtering could be added here if needed
            // For now, return all plants with their attributes
            
            PlantSummaryDTO(
                id = plant.id,
                name = plant.commonName ?: plant.canonicalScientificName,
                scientificName = plant.canonicalScientificName,
                family = plant.family,
                genus = plant.genus,
                cycle = attributes?.cycle?.name,
                sunNeeds = attributes?.sunNeeds?.name,
                waterNeeds = attributes?.waterNeeds?.name,
                rootDepth = attributes?.rootDepth?.name,
                growthHabit = attributes?.growthHabit?.name,
                feederType = attributes?.feederType?.name,
                isNitrogenFixer = attributes?.isNitrogenFixer ?: false,
                edibleParts = emptyList(), // Would need to join with plant_attribute_edible_parts table
                maturityDaysMin = attributes?.daysToMaturityMin,
                maturityDaysMax = attributes?.daysToMaturityMax
            )
        }
    }
}
