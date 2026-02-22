package no.sogn.gardentime.dto

import java.time.Instant

// Export response structure
data class GardenExportDto(
    val exportVersion: String = "1.1",
    val exportedAt: Instant,
    val garden: GardenDataDto,
    val growAreas: List<GrowAreaExportDto>
)

data class GardenDataDto(
    val name: String,
    val description: String? = null,
    val location: String? = null
)

data class GrowAreaExportDto(
    val name: String,
    val zoneSize: String? = null,
    val zoneType: String? = null,
    val nrOfRows: Int? = null,
    val notes: String? = null,
    val positionX: Double? = null,
    val positionY: Double? = null,
    val width: Double? = null,
    val length: Double? = null,
    val height: Double? = null,
    val rotation: Double? = null,
    val cropRecords: List<CropRecordExportDto> = emptyList()
)

// Crop record export - includes all fields for complete backup/restore
data class CropRecordExportDto(
    // Core fields
    val plantId: String,
    val plantName: String,
    val datePlanted: String,  // ISO date string (LocalDate.toString())
    val dateHarvested: String? = null,
    val status: String? = null,  // PLANTED, GROWING, HARVESTED, DISEASED, FAILED
    val notes: String? = null,
    val outcome: String? = null,
    val name: String? = null,
    val description: String? = null,
    
    // Rotation planning fields (cached from plant-data-aggregator)
    val plantFamily: String? = null,
    val plantGenus: String? = null,
    val feederType: String? = null,
    val isNitrogenFixer: Boolean = false,
    val rootDepth: String? = null,
    
    // Disease tracking
    val hadDiseases: Boolean = false,
    val diseaseNames: String? = null,
    val diseaseNotes: String? = null,
    
    // Yield tracking
    val yieldRating: Int? = null,
    val soilQualityAfter: Int? = null
)

// Import request structure
data class GardenImportRequest(
    val exportVersion: String? = null,
    val gardenName: String,
    val garden: GardenDataDto,
    val growAreas: List<GrowAreaExportDto> = emptyList()
)
