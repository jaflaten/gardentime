package no.sogn.plantdata.scraper.model

import java.time.Instant

data class ScrapedPlantData(
    val slug: String,
    val source: String, // "almanac.com", etc.
    val url: String,
    val commonName: String?,
    val description: String?,
    val companionSection: String?,
    val plantingGuide: String?,
    val careInstructions: String?,
    val harvestInfo: String?,
    val pestsAndDiseases: String?,
    val rawHtml: String,
    val scrapedAt: Instant = Instant.now(),
    val successful: Boolean = true,
    val errorMessage: String? = null
)

data class ExtractedSection(
    val slug: String,
    val sectionType: SectionType,
    val text: String,
    val html: String? = null
)

enum class SectionType {
    COMMON_NAME,
    DESCRIPTION,
    COMPANIONS,
    PLANTING_GUIDE,
    CARE_INSTRUCTIONS,
    HARVEST_INFO,
    PESTS_AND_DISEASES
}

data class PlantSlug(
    val slug: String,
    val commonName: String,
    val category: PlantCategory,
    val priority: Int = 3 // 1=highest, 5=lowest
)

enum class PlantCategory {
    VEGETABLE,
    FRUIT,
    HERB
}
