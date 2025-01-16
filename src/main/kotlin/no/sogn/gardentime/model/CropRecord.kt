package no.sogn.gardentime.model

import java.time.LocalDate
import java.util.UUID

data class CropRecord(
    val id: UUID,
    val name: String,
    val description: String,
    val plantingDate: LocalDate,
    val harvestDate: LocalDate?,
    val plant: Plant,
    val status: String,
    val growZoneId: Int,
    val growZoneName: String? = null,
    val outcome: Outcome?,
    val notes: String? = null,

)