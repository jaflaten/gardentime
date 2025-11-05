package no.sogn.plantdata.dto

import java.util.UUID

/**
 * Pest DTO
 */
data class PestDTO(
    val id: UUID,
    val name: String,
    val scientificName: String?,
    val description: String?,
    val treatmentOptions: String?,
    val severity: String
)

/**
 * Disease DTO
 */
data class DiseaseDTO(
    val id: UUID,
    val name: String,
    val scientificName: String?,
    val description: String?,
    val treatmentOptions: String?,
    val severity: String,
    val isSoilBorne: Boolean,
    val persistenceYears: Int?
)

/**
 * Plant Pest with relationship info
 */
data class PlantPestDTO(
    val pest: PestDTO,
    val susceptibility: String,
    val notes: String?,
    val preventionTips: String?
)

/**
 * Plant Disease with relationship info
 */
data class PlantDiseaseDTO(
    val disease: DiseaseDTO,
    val susceptibility: String,
    val notes: String?,
    val preventionTips: String?
)

/**
 * Plant Pests Response
 */
data class PlantPestsResponseDTO(
    val plantName: String,
    val totalPests: Int,
    val pests: List<PlantPestDTO>
)

/**
 * Plant Diseases Response
 */
data class PlantDiseasesResponseDTO(
    val plantName: String,
    val totalDiseases: Int,
    val diseases: List<PlantDiseaseDTO>
)

/**
 * Soil-borne Diseases Response
 */
data class SoilBorneDiseasesResponseDTO(
    val diseases: List<SoilBorneDiseaseDTO>
)

/**
 * Soil-borne Disease with affected families
 */
data class SoilBorneDiseaseDTO(
    val disease: DiseaseDTO,
    val affectedFamilies: List<String>,
    val affectedPlantCount: Int
)
