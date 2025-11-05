package no.sogn.plantdata.service

import no.sogn.plantdata.dto.*
import no.sogn.plantdata.enums.RelationshipType
import no.sogn.plantdata.repository.CompanionRelationshipRepository
import no.sogn.plantdata.repository.PlantRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
@Transactional(readOnly = true)
class CompanionPlantingService(
    private val plantRepository: PlantRepository,
    private val companionRepository: CompanionRelationshipRepository
) {
    
    /**
     * Get all companions for a plant by name
     */
    fun getCompanions(plantName: String, relationship: String? = null): CompanionListDTO? {
        val plant = plantRepository.findByCommonNameIgnoreCase(plantName) 
            ?: plantRepository.findByCanonicalScientificNameIgnoreCase(plantName) 
            ?: return null
        
        val companions = if (relationship != null) {
            try {
                val relType = RelationshipType.valueOf(relationship.uppercase())
                companionRepository.findByPlantAAndRelationshipTypeAndVerifiedIsTrue(plant, relType)
            } catch (e: IllegalArgumentException) {
                emptyList()
            }
        } else {
            companionRepository.findAll()
                .filter { (it.plantA.id == plant.id || it.plantB.id == plant.id) && it.verified }
        }
        
        val beneficial = companions
            .filter { it.relationshipType == RelationshipType.BENEFICIAL }
            .map { toCompanionDTO(it, plant.id) }
        
        val antagonistic = companions
            .filter { it.relationshipType == RelationshipType.ANTAGONISTIC }
            .map { toCompanionDTO(it, plant.id) }
        
        val neutral = companions
            .filter { it.relationshipType == RelationshipType.NEUTRAL }
            .map { toCompanionDTO(it, plant.id) }
        
        return CompanionListDTO(
            plant = PlantBasicDTO(
                id = plant.id,
                name = plant.commonName ?: plant.canonicalScientificName,
                scientificName = plant.canonicalScientificName
            ),
            companions = CompanionsByRelationshipDTO(
                beneficial = beneficial,
                antagonistic = antagonistic,
                neutral = neutral
            ),
            summary = CompanionCountDTO(
                beneficial = beneficial.size,
                antagonistic = antagonistic.size,
                neutral = neutral.size
            )
        )
    }
    
    /**
     * Check compatibility between multiple plants
     */
    fun checkCompatibility(plantNames: List<String>): CompatibilityCheckResponse {
        // Get all plants
        val plants = plantNames.mapNotNull { name ->
            plantRepository.findByCommonNameIgnoreCase(name) 
                ?: plantRepository.findByCanonicalScientificNameIgnoreCase(name)
        }
        
        if (plants.size != plantNames.size) {
            val notFound = plantNames.filter { name ->
                plants.none { 
                    it.commonName?.equals(name, ignoreCase = true) == true || 
                    it.canonicalScientificName.equals(name, ignoreCase = true) 
                }
            }
            throw IllegalArgumentException("Plants not found: ${notFound.joinToString()}")
        }
        
        val relationships = mutableListOf<PlantRelationshipDTO>()
        val warnings = mutableListOf<CompatibilityWarningDTO>()
        var hasAntagonistic = false
        
        // Check all pairs
        for (i in plants.indices) {
            for (j in i + 1 until plants.size) {
                val plant1 = plants[i]
                val plant2 = plants[j]
                
                val relationship = companionRepository.findAll()
                    .firstOrNull { 
                        (it.plantA.id == plant1.id && it.plantB.id == plant2.id) ||
                        (it.plantA.id == plant2.id && it.plantB.id == plant1.id)
                    }
                
                if (relationship != null) {
                    val relationshipDTO = PlantRelationshipDTO(
                        plant1 = plant1.commonName ?: plant1.canonicalScientificName,
                        plant2 = plant2.commonName ?: plant2.canonicalScientificName,
                        relationship = relationship.relationshipType.name,
                        reason = relationship.reason,
                        mechanism = relationship.mechanism,
                        confidenceLevel = relationship.confidenceLevel.name,
                        severity = if (relationship.relationshipType == RelationshipType.ANTAGONISTIC) "HIGH" else null
                    )
                    relationships.add(relationshipDTO)
                    
                    if (relationship.relationshipType == RelationshipType.ANTAGONISTIC) {
                        hasAntagonistic = true
                        warnings.add(
                            CompatibilityWarningDTO(
                                severity = "HIGH",
                                message = "${plant1.commonName ?: plant1.canonicalScientificName} and ${plant2.commonName ?: plant2.canonicalScientificName} are incompatible" +
                                        (relationship.reason?.let { " - $it" } ?: "")
                            )
                        )
                    }
                }
            }
        }
        
        // Generate suggestions
        val suggestions = mutableListOf<String>()
        if (hasAntagonistic) {
            val antagonisticPlants = relationships
                .filter { it.relationship == "ANTAGONISTIC" }
                .flatMap { listOf(it.plant1, it.plant2) }
                .distinct()
            
            if (antagonisticPlants.isNotEmpty()) {
                suggestions.add("Consider removing ${antagonisticPlants.first()} to improve compatibility")
            }
        }
        
        // Add beneficial suggestions
        val beneficialCount = relationships.count { it.relationship == "BENEFICIAL" }
        if (beneficialCount > 0) {
            suggestions.add("Great! You have $beneficialCount beneficial companion relationships")
        }
        
        return CompatibilityCheckResponse(
            compatible = !hasAntagonistic,
            relationships = relationships,
            warnings = warnings,
            suggestions = suggestions
        )
    }
    
    // Private helper to convert relationship to DTO
    private fun toCompanionDTO(
        relationship: no.sogn.plantdata.model.CompanionRelationship,
        currentPlantId: UUID
    ): CompanionDTO {
        val companion = if (relationship.plantA.id == currentPlantId) 
            relationship.plantB 
        else 
            relationship.plantA
        
        return CompanionDTO(
            id = companion.id,
            name = companion.commonName ?: companion.canonicalScientificName,
            scientificName = companion.canonicalScientificName,
            relationship = relationship.relationshipType.name,
            reason = relationship.reason,
            mechanism = relationship.mechanism,
            confidenceLevel = relationship.confidenceLevel.name,
            evidenceType = relationship.evidenceType.name
        )
    }
}
