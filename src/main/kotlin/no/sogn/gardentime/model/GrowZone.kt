package no.sogn.gardentime.model

data class GrowZone(
    val id: Int,
    val name: String,
    val plants: List<Plant>,
    val zoneSize: ZoneSize,
    val cropRecord: CropRecord,
    val nrOfRows: Int,
    val status: String,
    val notes: String?,
    val zoneType: ZoneType,
    )

// number of plant x planted???
