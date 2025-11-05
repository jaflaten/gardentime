package no.sogn.plantdata.service

import no.sogn.plantdata.dto.*
import no.sogn.plantdata.model.*
import no.sogn.plantdata.repository.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class PestDiseaseService(
    private val plantRepository: PlantRepository,
    private val pestRepository: PestRepository,
    private val diseaseRepository: DiseaseRepository,
    private val plantPestRepository: PlantPestRepository,
    private val plantDiseaseRepository: PlantDiseaseRepository
) {
    
    /**
     * Get all pests affecting a plant
     */
    fun getPlantPests(plantName: String): PlantPestsResponseDTO? {
        val plant = plantRepository.findByCommonNameIgnoreCase(plantName)
            ?: plantRepository.findByCanonicalScientificNameIgnoreCase(plantName)
            ?: return null
        
        val plantPests = plantPestRepository.findByPlantId(plant.id)
        
        return PlantPestsResponseDTO(
            plantName = plant.commonName ?: plant.canonicalScientificName,
            totalPests = plantPests.size,
            pests = plantPests.map { toPlantPestDTO(it) }
        )
    }
    
    /**
     * Get all diseases affecting a plant
     */
    fun getPlantDiseases(plantName: String): PlantDiseasesResponseDTO? {
        val plant = plantRepository.findByCommonNameIgnoreCase(plantName)
            ?: plantRepository.findByCanonicalScientificNameIgnoreCase(plantName)
            ?: return null
        
        val plantDiseases = plantDiseaseRepository.findByPlantId(plant.id)
        
        return PlantDiseasesResponseDTO(
            plantName = plant.commonName ?: plant.canonicalScientificName,
            totalDiseases = plantDiseases.size,
            diseases = plantDiseases.map { toPlantDiseaseDTO(it) }
        )
    }
    
    /**
     * Get all soil-borne diseases (critical for rotation planning)
     */
    fun getSoilBorneDiseases(): SoilBorneDiseasesResponseDTO {
        val soilBorneDiseases = diseaseRepository.findByIsSoilBorneTrue()
        
        val diseasesWithFamilies = soilBorneDiseases.map { disease ->
            // Get all plants affected by this disease
            val affectedPlants = plantDiseaseRepository.findAll()
                .filter { it.disease.id == disease.id }
                .map { it.plant }
            
            // Get unique families
            val affectedFamilies = affectedPlants
                .mapNotNull { it.family }
                .distinct()
                .sorted()
            
            SoilBorneDiseaseDTO(
                disease = toDiseaseDTO(disease),
                affectedFamilies = affectedFamilies,
                affectedPlantCount = affectedPlants.size
            )
        }.sortedByDescending { it.disease.severity }
        
        return SoilBorneDiseasesResponseDTO(diseases = diseasesWithFamilies)
    }
    
    /**
     * Get pest and disease counts for a plant (used in PlantDetailDTO)
     */
    fun getPestDiseaseCount(plantId: java.util.UUID): PestDiseaseCountDTO {
        return PestDiseaseCountDTO(
            pests = plantPestRepository.countByPlantId(plantId).toInt(),
            diseases = plantDiseaseRepository.countByPlantId(plantId).toInt()
        )
    }
    
    // ============ Private Mapping Functions ============
    
    private fun toPestDTO(pest: Pest): PestDTO {
        return PestDTO(
            id = pest.id,
            name = pest.name,
            scientificName = pest.scientificName,
            description = pest.description,
            treatmentOptions = pest.treatmentOptions,
            severity = pest.severity.name
        )
    }
    
    private fun toDiseaseDTO(disease: Disease): DiseaseDTO {
        return DiseaseDTO(
            id = disease.id,
            name = disease.name,
            scientificName = disease.scientificName,
            description = disease.description,
            treatmentOptions = disease.treatmentOptions,
            severity = disease.severity.name,
            isSoilBorne = disease.isSoilBorne,
            persistenceYears = disease.persistenceYears
        )
    }
    
    private fun toPlantPestDTO(plantPest: PlantPest): PlantPestDTO {
        return PlantPestDTO(
            pest = toPestDTO(plantPest.pest),
            susceptibility = plantPest.susceptibility.name,
            notes = plantPest.notes,
            preventionTips = plantPest.preventionTips
        )
    }
    
    private fun toPlantDiseaseDTO(plantDisease: PlantDisease): PlantDiseaseDTO {
        return PlantDiseaseDTO(
            disease = toDiseaseDTO(plantDisease.disease),
            susceptibility = plantDisease.susceptibility.name,
            notes = plantDisease.notes,
            preventionTips = plantDisease.preventionTips
        )
    }
}

/**
 * Pest and Disease count for plant details
 */
data class PestDiseaseCountDTO(
    val pests: Int,
    val diseases: Int
)
