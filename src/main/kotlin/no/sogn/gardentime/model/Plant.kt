package no.sogn.gardentime.model

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import java.util.*


data class Plant(
    val id: Int,
    val name: String,
    val scientificName: String,
    val plantType: PlantType,
    val plantFamily: String,
    val maturityTime: Int,
    val growingSeason: GrowingSeason?,
    val sunReq: String?,
    val waterReq: String?,
    val soilType: String?,
    val spaceReq: String?,
    ) {
}

@Entity
class PlantEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    val name: String = "",
    val scientificName: String = "",
    val plantType: PlantType? = null,
    val plantFamily: String,
    val maturityTime: Int,
    val growingSeason: GrowingSeason?,
    val sunReq: String?,
    val waterReq: String?,
    val soilType: String?,
    val spaceReq: String?,
) {
    constructor() : this(null, "", "", null, "", 0, null, null, null, null, null) {}
}

enum class GrowingSeason {
    WINTER,
    SPRING,
    SUMMER,
    AUTUMN,
}

enum class PlantType(val description: String, val examples: List<String>) {
    ROOT_VEGETABLE("Edible roots grown underground", listOf("Carrot", "Beetroot", "Radish")),
    LEAFY_GREEN("Edible leafy plants", listOf("Kale", "Spinach", "Lettuce")),
    TUBER("Underground storage organs", listOf("Potato", "Sweet Potato", "Yam")),
    FRUIT_VEGETABLE("Fruits commonly used as vegetables", listOf("Tomato", "Cucumber", "Zucchini")),
    HERB("Aromatic plants used in cooking", listOf("Basil", "Parsley", "Mint")),
    LEGUME("Seed-producing pod plants", listOf("Bean", "Pea", "Lentil")),
    GRAIN("Seed-bearing plants used for food", listOf("Corn", "Wheat", "Barley")),
    FLOWERING_PLANT("Plants grown for edible flowers", listOf("Broccoli", "Cauliflower", "Artichoke")),
    ALLIUM("Plants in the onion family", listOf("Onion", "Garlic", "Leek"));
}
