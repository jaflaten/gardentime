package no.sogn.gardentime.dto

import java.time.Instant

// Export response structure
data class GardenExportDto(
    val exportVersion: String = "1.0",
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
    val height: Double? = null
)

// Import request structure
data class GardenImportRequest(
    val exportVersion: String? = null,
    val gardenName: String,
    val garden: GardenDataDto,
    val growAreas: List<GrowAreaExportDto> = emptyList()
)
