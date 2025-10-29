package no.sogn.plantdata.dto

import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper

// ----------------------------- TREFLE DTOs -----------------------------
// Based on actual API responses from Trefle documentation

// Nested objects for detailed species data
data class TrefleImages(
    val flower: List<String>? = null,
    val leaf: List<String>? = null,
    val habit: List<String>? = null,
    val fruit: List<String>? = null,
    val bark: List<String>? = null,
    val other: List<String>? = null
)

data class TrefleDistribution(
    val native: List<String>? = null,
    val introduced: List<String>? = null
)

data class TrefleFlower(
    val color: String? = null,
    val conspicuous: Boolean? = null
)

data class TrefleFoliage(
    val texture: String? = null,
    val color: String? = null,
    @JsonProperty("leaf_retention") val leafRetention: Boolean? = null
)

data class TrefleFruitOrSeed(
    val conspicuous: Boolean? = null,
    val color: String? = null,
    val shape: String? = null,
    @JsonProperty("seed_persistence") val seedPersistence: Boolean? = null
)

data class TrefleHeight(
    val cm: Int? = null
)

data class TrefleSpecifications(
    @JsonProperty("ligneous_type") val ligneousType: String? = null,
    @JsonProperty("growth_form") val growthForm: String? = null,
    @JsonProperty("growth_habit") val growthHabit: String? = null,
    @JsonProperty("growth_rate") val growthRate: String? = null,
    @JsonProperty("average_height") val averageHeight: TrefleHeight? = null,
    @JsonProperty("maximum_height") val maximumHeight: TrefleHeight? = null,
    @JsonProperty("nitrogen_fixation") val nitrogenFixation: String? = null,
    @JsonProperty("shape_and_orientation") val shapeAndOrientation: String? = null,
    val toxicity: String? = null
)

data class TrefleTemperature(
    @JsonProperty("deg_f") val degF: Int? = null,
    @JsonProperty("deg_c") val degC: Int? = null
)

data class TrefleMeasurement(
    val cm: Int? = null
)

data class TreflePrecipitation(
    val mm: Int? = null
)

data class TrefleGrowth(
    val description: String? = null,
    val sowing: String? = null,
    @JsonProperty("days_to_harvest") val daysToHarvest: Int? = null,
    @JsonProperty("row_spacing") val rowSpacing: TrefleMeasurement? = null,
    val spread: TrefleMeasurement? = null,
    @JsonProperty("ph_maximum") val phMaximum: Double? = null,
    @JsonProperty("ph_minimum") val phMinimum: Double? = null,
    val light: Int? = null,
    @JsonProperty("atmospheric_humidity") val atmosphericHumidity: Int? = null,
    @JsonProperty("growth_months") val growthMonths: List<String>? = null,
    @JsonProperty("bloom_months") val bloomMonths: List<String>? = null,
    @JsonProperty("fruit_months") val fruitMonths: List<String>? = null,
    @JsonProperty("minimum_precipitation") val minimumPrecipitation: TreflePrecipitation? = null,
    @JsonProperty("maximum_precipitation") val maximumPrecipitation: TreflePrecipitation? = null,
    @JsonProperty("minimum_root_depth") val minimumRootDepth: TrefleMeasurement? = null,
    @JsonProperty("minimum_temperature") val minimumTemperature: TrefleTemperature? = null,
    @JsonProperty("maximum_temperature") val maximumTemperature: TrefleTemperature? = null,
    @JsonProperty("soil_nutriments") val soilNutriments: Int? = null,
    @JsonProperty("soil_salinity") val soilSalinity: Int? = null,
    @JsonProperty("soil_texture") val soilTexture: Int? = null,
    @JsonProperty("soil_humidity") val soilHumidity: Int? = null
)

data class TrefleSource(
    @JsonProperty("last_update") val lastUpdate: String? = null,
    val id: String? = null,
    val name: String? = null,
    val url: String? = null,
    val citation: String? = null
)

// Main species object (inside the plant detail response)
data class TrefleMainSpecies(
    val id: Long,
    @JsonProperty("common_name") val commonName: String? = null,
    val slug: String? = null,
    @JsonProperty("scientific_name") val scientificName: String? = null,
    val year: Int? = null,
    val bibliography: String? = null,
    val author: String? = null,
    val status: String? = null,
    val rank: String? = null,
    @JsonProperty("family_common_name") val familyCommonName: String? = null,
    @JsonProperty("genus_id") val genusId: Long? = null,
    val observations: String? = null,
    val vegetable: Boolean? = null,
    @JsonProperty("image_url") val imageUrl: String? = null,
    val genus: String? = null,
    val family: String? = null,
    val duration: String? = null,
    @JsonProperty("edible_part") val ediblePart: String? = null,
    val edible: Boolean? = null,
    val images: TrefleImages? = null,
    @JsonProperty("common_names") val commonNames: Map<String, List<String>>? = null,
    val distribution: TrefleDistribution? = null,
    val flower: TrefleFlower? = null,
    val foliage: TrefleFoliage? = null,
    @JsonProperty("fruit_or_seed") val fruitOrSeed: TrefleFruitOrSeed? = null,
    val specifications: TrefleSpecifications? = null,
    val growth: TrefleGrowth? = null,
    val synonyms: List<String>? = null,
    val sources: List<TrefleSource>? = null
)

// Plant detail response from GET /api/v1/plants/{id}
data class TreflePlantDetail(
    val id: Long,
    @JsonProperty("common_name") val commonName: String? = null,
    val slug: String? = null,
    @JsonProperty("scientific_name") val scientificName: String? = null,
    @JsonProperty("main_species_id") val mainSpeciesId: Long? = null,
    @JsonProperty("image_url") val imageUrl: String? = null,
    val year: Int? = null,
    val bibliography: String? = null,
    val author: String? = null,
    @JsonProperty("family_common_name") val familyCommonName: String? = null,
    @JsonProperty("genus_id") val genusId: Long? = null,
    val observations: String? = null,
    val vegetable: Boolean? = null,
    @JsonProperty("main_species") val mainSpecies: TrefleMainSpecies? = null,
    val sources: List<TrefleSource>? = null
)

data class TreflePlantDetailResponse(
    val data: TreflePlantDetail,
    val meta: Map<String, Any>? = null
)

// Species list item from /api/v1/plants (paginated list)
data class TrefleSpeciesListItem(
    val id: Long,
    @JsonProperty("common_name") val commonName: String?,
    val slug: String? = null,
    @JsonProperty("scientific_name") val scientificName: String?,
    val year: Int? = null,
    val bibliography: String? = null,
    val author: String? = null,
    val status: String? = null,
    val rank: String? = null,
    @JsonProperty("family_common_name") val familyCommonName: String? = null,
    @JsonProperty("genus_id") val genusId: Long? = null,
    @JsonProperty("image_url") val imageUrl: String? = null,
    val synonyms: List<String>? = null,
    val genus: String?,
    val family: String?
)

data class TrefleSpeciesListResponse(
    val data: List<TrefleSpeciesListItem> = emptyList(),
    val links: Map<String, String>? = null,
    val meta: Map<String, Any>? = null
)

// Simplified DTO for merge service compatibility
data class TrefleSpeciesDetail(
    val id: Long,
    val scientificName: String?,
    val commonName: String?,
    val family: String?,
    val genus: String?,
    // Extended attributes
    val ediblePart: String? = null,
    val vegetable: Boolean? = null,
    val edible: Boolean? = null,
    val light: Int? = null,
    val soilTexture: Int? = null,
    val growthMonths: List<String>? = null,
    val bloomMonths: List<String>? = null,
    val imageUrl: String? = null,
    val sources: List<String>? = null,
    val synonyms: List<String>? = null
) {
    companion object {
        fun fromPlantDetail(detail: TreflePlantDetail): TrefleSpeciesDetail {
            val mainSpecies = detail.mainSpecies
            return TrefleSpeciesDetail(
                id = detail.id,
                scientificName = detail.scientificName,
                commonName = detail.commonName,
                family = mainSpecies?.family,
                genus = mainSpecies?.genus,
                ediblePart = mainSpecies?.ediblePart,
                vegetable = mainSpecies?.vegetable,
                edible = mainSpecies?.edible,
                light = mainSpecies?.growth?.light,
                soilTexture = mainSpecies?.growth?.soilTexture,
                growthMonths = mainSpecies?.growth?.growthMonths,
                bloomMonths = mainSpecies?.growth?.bloomMonths,
                imageUrl = detail.imageUrl,
                sources = mainSpecies?.sources?.mapNotNull { it.url },
                synonyms = mainSpecies?.synonyms
            )
        }
    }
}

// ----------------------------- PERENUAL DTOs -----------------------------

/**
 * Custom deserializer for other_images field that can handle both:
 * - Array of PerenualImage objects (when data is available)
 * - String message (when data requires plan upgrade)
 */
class FlexibleImageListDeserializer : JsonDeserializer<List<PerenualImage>?>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): List<PerenualImage>? {
        return try {
            when {
                p.currentToken.isStructStart -> {
                    // It's an array - parse normally
                    val mapper = jacksonObjectMapper()
                    mapper.readValue(p, mapper.typeFactory.constructCollectionType(List::class.java, PerenualImage::class.java))
                }
                else -> {
                    // It's a string or something else - just skip it and return empty list
                    p.text // consume the value
                    null
                }
            }
        } catch (e: Exception) {
            // If anything goes wrong, return null
            null
        }
    }
}

// Image representation reused across endpoints
// Matches keys in responses (license, license_name, license_url, original_url, regular_url, medium_url, small_url, thumbnail)
data class PerenualImage(
    @JsonProperty("image_id") val imageId: Long? = null,
    val license: Int? = null,
    @JsonProperty("license_name") val licenseName: String? = null,
    @JsonProperty("license_url") val licenseUrl: String? = null,
    @JsonProperty("original_url") val originalUrl: String? = null,
    @JsonProperty("regular_url") val regularUrl: String? = null,
    @JsonProperty("medium_url") val mediumUrl: String? = null,
    @JsonProperty("small_url") val smallUrl: String? = null,
    val thumbnail: String? = null
)

// Species list item from /species-list
// Example fields taken from plant-list.md
// scientific_name & other_name are arrays; family may be null

data class PerenualSpeciesListItem(
    val id: Long,
    @JsonProperty("common_name") val commonName: String?,
    @JsonProperty("scientific_name") val scientificName: List<String>? = null,
    @JsonProperty("other_name") val otherNames: List<String>? = null,
    val family: String? = null,
    val hybrid: String? = null,
    val authority: String? = null,
    val subspecies: String? = null,
    val cultivar: String? = null,
    val variety: String? = null,
    @JsonProperty("species_epithet") val speciesEpithet: String? = null,
    val genus: String? = null,
    @JsonProperty("default_image") val defaultImage: PerenualImage? = null
)

data class PerenualSpeciesListResponse(
    val data: List<PerenualSpeciesListItem> = emptyList(),
    @JsonProperty("to") val to: Int? = null,
    @JsonProperty("per_page") val perPage: Int? = null,
    @JsonProperty("current_page") val currentPage: Int? = null,
    @JsonProperty("from") val from: Int? = null,
    @JsonProperty("last_page") val lastPage: Int? = null,
    val total: Int? = null
)

// Nested detail objects -------------------------------------------------

data class PerenualDimensions(
    val type: String? = null,
    @JsonProperty("min_value") val minValue: Double? = null,
    @JsonProperty("max_value") val maxValue: Double? = null,
    val unit: String? = null
)

data class PerenualWateringGeneralBenchmark(
    val value: String? = null, // value like "5-7" cannot be parsed as number reliably
    val unit: String? = null
)

data class PerenualPlantAnatomy(
    val part: String? = null,
    val color: List<String>? = null
)

data class PerenualPruningCount(
    val amount: Int? = null,
    val interval: String? = null
)

data class PerenualHardiness(
    val min: String? = null,
    val max: String? = null
)

data class PerenualHardinessLocation(
    @JsonProperty("full_url") val fullUrl: String? = null,
    @JsonProperty("full_iframe") val fullIframe: String? = null
)

data class PerenualWateringTemperature(
    val unit: String? = null,
    val min: Double? = null,
    val max: Double? = null
)

data class PerenualPhLevel(
    val min: Double? = null,
    val max: Double? = null
)

data class PerenualSunlightDuration(
    val min: String? = null,
    val max: String? = null,
    val unit: String? = null
)

// Species details DTO combining required merge fields + extended attributes
// Keep simple fields for merge service compatibility (id, scientificName (first variant), commonName, otherNames, family, genus)
// We expose a canonical single scientificName (first array element) while retaining full list in scientificNames

data class PerenualSpeciesDetail(
    val id: Long,
    @JsonProperty("common_name") val commonName: String? = null,
    @JsonProperty("scientific_name") val scientificNames: List<String>? = null,
    @JsonProperty("other_name") val otherNames: List<String>? = null,
    val family: String? = null,
    val genus: String? = null,
    val origin: String? = null,
    val type: String? = null,
    val dimensions: PerenualDimensions? = null,
    val cycle: String? = null,
    val watering: String? = null,
    @JsonProperty("watering_general_benchmark") val wateringGeneralBenchmark: PerenualWateringGeneralBenchmark? = null,
    @JsonProperty("plant_anatomy") val plantAnatomy: List<PerenualPlantAnatomy>? = null,
    val sunlight: List<String>? = null,
    @JsonProperty("pruning_month") val pruningMonth: List<String>? = null,
    @JsonProperty("pruning_count") val pruningCount: PerenualPruningCount? = null,
    val seeds: Int? = null,
    val attracts: List<String>? = null,
    val propagation: List<String>? = null,
    val hardiness: PerenualHardiness? = null,
    @JsonProperty("hardiness_location") val hardinessLocation: PerenualHardinessLocation? = null,
    val flowers: Boolean? = null,
    @JsonProperty("flowering_season") val floweringSeason: String? = null,
    val soil: List<String>? = null,
    @JsonProperty("pest_susceptibility") val pestSusceptibility: String? = null,
    val cones: Boolean? = null,
    val fruits: Boolean? = null,
    @JsonProperty("edible_fruit") val edibleFruit: Boolean? = null,
    @JsonProperty("fruiting_season") val fruitingSeason: String? = null,
    @JsonProperty("harvest_season") val harvestSeason: String? = null,
    @JsonProperty("harvest_method") val harvestMethod: String? = null,
    val leaf: Boolean? = null,
    @JsonProperty("edible_leaf") val edibleLeaf: Boolean? = null,
    @JsonProperty("growth_rate") val growthRate: String? = null,
    val maintenance: String? = null,
    val medicinal: Boolean? = null,
    @JsonProperty("poisonous_to_humans") val poisonousToHumans: Boolean? = null,
    @JsonProperty("poisonous_to_pets") val poisonousToPets: Boolean? = null,
    @JsonProperty("drought_tolerant") val droughtTolerant: Boolean? = null,
    @JsonProperty("salt_tolerant") val saltTolerant: Boolean? = null,
    val thorny: Boolean? = null,
    val invasive: Boolean? = null,
    val rare: Boolean? = null,
    val tropical: Boolean? = null,
    val cuisine: Boolean? = null,
    val indoor: Boolean? = null,
    @JsonProperty("care_level") val careLevel: String? = null,
    val description: String? = null,
    @JsonProperty("default_image") val defaultImage: PerenualImage? = null,
    @JsonProperty("other_images") 
    @JsonDeserialize(using = FlexibleImageListDeserializer::class)
    val otherImages: List<PerenualImage>? = null,
    @JsonProperty("xWateringQuality") val xWateringQuality: List<String>? = null,
    @JsonProperty("xWateringPeriod") val xWateringPeriod: List<String>? = null,
    @JsonProperty("xWateringAvgVolumeRequirement") val xWateringAvgVolumeRequirement: List<String>? = null,
    @JsonProperty("xWateringDepthRequirement") val xWateringDepthRequirement: List<String>? = null,
    @JsonProperty("xWateringBasedTemperature") val xWateringBasedTemperature: PerenualWateringTemperature? = null,
    @JsonProperty("xWateringPhLevel") val xWateringPhLevel: PerenualPhLevel? = null,
    @JsonProperty("xSunlightDuration") val xSunlightDuration: PerenualSunlightDuration? = null
) {
    // Derived property for merge service compatibility - extracts first scientific name
    val scientificName: String?
        get() = scientificNames?.firstOrNull()
    
    // Helper to get edible parts based on boolean flags
    val edibleParts: List<String>
        get() = buildList {
            if (edibleFruit == true) add("fruit")
            if (edibleLeaf == true) add("leaf")
        }
    
    // Helper to derive pH range from xWateringPhLevel
    val phMin: Double?
        get() = xWateringPhLevel?.min
    
    val phMax: Double?
        get() = xWateringPhLevel?.max
}

// Care guide sections ----------------------------------------------------
data class PerenualCareGuideSection(
    val id: Long?,
    val type: String?,
    val description: String?
)

data class PerenualCareGuideItem(
    val id: Long?,
    @JsonProperty("species_id") val speciesId: Long?,
    @JsonProperty("common_name") val commonName: String?,
    @JsonProperty("scientific_name") val scientificName: List<String>? = null,
    val section: List<PerenualCareGuideSection>? = null
)

data class PerenualCareGuideListResponse(
    val data: List<PerenualCareGuideItem> = emptyList(),
    @JsonProperty("to") val to: Int? = null,
    @JsonProperty("per_page") val perPage: Int? = null,
    @JsonProperty("current_page") val currentPage: Int? = null,
    @JsonProperty("from") val from: Int? = null,
    @JsonProperty("last_page") val lastPage: Int? = null,
    val total: Int? = null
)

// Disease / pest list ----------------------------------------------------
data class PerenualDiseaseImage(
    val license: Int? = null,
    @JsonProperty("license_name") val licenseName: String? = null,
    @JsonProperty("license_url") val licenseUrl: String? = null,
    @JsonProperty("original_url") val originalUrl: String? = null,
    @JsonProperty("regular_url") val regularUrl: String? = null,
    @JsonProperty("medium_url") val mediumUrl: String? = null,
    @JsonProperty("small_url") val smallUrl: String? = null,
    val thumbnail: String? = null
)

data class PerenualDiseaseItem(
    val id: Long,
    @JsonProperty("common_name") val commonName: String?,
    @JsonProperty("scientific_name") val scientificName: String?,
    @JsonProperty("other_name") val otherName: List<String>? = null,
    val family: String? = null,
    val description: String? = null,
    val solution: String? = null,
    val host: List<String>? = null,
    val images: List<PerenualDiseaseImage>? = null
)

data class PerenualDiseaseListResponse(
    val data: List<PerenualDiseaseItem> = emptyList(),
    @JsonProperty("to") val to: Int? = null,
    @JsonProperty("per_page") val perPage: Int? = null,
    @JsonProperty("current_page") val currentPage: Int? = null,
    @JsonProperty("from") val from: Int? = null,
    @JsonProperty("last_page") val lastPage: Int? = null,
    val total: Int? = null
)

// Hardiness map retrieval (image response). The API returns image bytes; we wrap them for downstream processing.
// If instead only a URL is used, this can be simplified.
data class PerenualHardinessMap(
    val speciesId: Long,
    val imageBytes: ByteArray? = null,
    val contentType: String? = null
)
