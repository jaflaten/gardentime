package no.sogn.gardentime.model
// kasse
data class GrowZone(
    val id: Int,
    val name: String,
    val zoneSize: ZoneSize,
    val cropRecord: List<CropRecord>,
    val nrOfRows: Int,
    val notes: String?,
    val zoneType: ZoneType,
    )

// number of plant x planted???
