package no.sogn.gardentime.model

import java.time.LocalDate

data class CropRecord(
    val id: Int,
    val name: String,
    val description: String,
    val plantingDate: LocalDate,
    val harvestDate: LocalDate?,
    val plants: List<Plant>,
    val growZoneId: Int, //UUID?
    val growZoneName: String? = null,
    val outcome: Outcome?,
    val notes: String? = null,

)