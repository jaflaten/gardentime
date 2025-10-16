package no.sogn.plantdata.service

object PlantNameNormalizer {
    private val whitespaceRegex = "\\s+".toRegex()
    fun canonical(scientificName: String?): String? = scientificName
        ?.trim()
        ?.lowercase()
        ?.replace(whitespaceRegex, " ")
}
