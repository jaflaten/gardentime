package no.sogn.gardentime.model

import java.util.*

data class Garden(
    val id: UUID,
    val name: String,
    val growZones: MutableList<GrowZone>
) {


}