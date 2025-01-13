package no.sogn.gardentime.model

data class Outcome(
    val successRating: Int,
    val growthQuality: GrowthQuality,
    val yield: String,
    val pestResistance: String,
    val tags: List<String>,
    val keyObservations: String,
    val recommendedActions: List<String>
)


