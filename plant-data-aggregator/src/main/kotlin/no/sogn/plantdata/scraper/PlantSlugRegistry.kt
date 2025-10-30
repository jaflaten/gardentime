package no.sogn.plantdata.scraper

import no.sogn.plantdata.scraper.model.PlantCategory
import no.sogn.plantdata.scraper.model.PlantSlug
import org.springframework.stereotype.Component

@Component
class PlantSlugRegistry {
    
    /**
     * Top 15 priority plants for initial scraping
     * Based on curated-target-plants.md Tier 1 & 2
     */
    fun getTopPriorityPlants(): List<PlantSlug> = listOf(
        // Tier 1 - Core annual vegetables
        PlantSlug("tomatoes", "Tomato", PlantCategory.VEGETABLE, 1),
        PlantSlug("lettuce", "Lettuce", PlantCategory.VEGETABLE, 1),
        PlantSlug("cucumbers", "Cucumber", PlantCategory.VEGETABLE, 1),
        PlantSlug("peppers", "Pepper", PlantCategory.VEGETABLE, 1),
        PlantSlug("beans", "Bean", PlantCategory.VEGETABLE, 1),
        PlantSlug("peas", "Pea", PlantCategory.VEGETABLE, 1),
        PlantSlug("carrots", "Carrot", PlantCategory.VEGETABLE, 1),
        PlantSlug("onions", "Onion", PlantCategory.VEGETABLE, 1),
        
        // Tier 2 - Brassicas and roots
        PlantSlug("broccoli", "Broccoli", PlantCategory.VEGETABLE, 2),
        PlantSlug("cabbage", "Cabbage", PlantCategory.VEGETABLE, 2),
        PlantSlug("kale", "Kale", PlantCategory.VEGETABLE, 2),
        PlantSlug("radishes", "Radish", PlantCategory.VEGETABLE, 2),
        
        // Tier 3 - High companion value herbs
        PlantSlug("basil", "Basil", PlantCategory.HERB, 1),
        PlantSlug("dill", "Dill", PlantCategory.HERB, 1),
        PlantSlug("parsley", "Parsley", PlantCategory.HERB, 2)
    )
    
    /**
     * Extended list of 30 plants (for future use)
     */
    fun getAllTargetPlants(): List<PlantSlug> = getTopPriorityPlants() + listOf(
        // More vegetables
        PlantSlug("spinach", "Spinach", PlantCategory.VEGETABLE, 2),
        PlantSlug("garlic", "Garlic", PlantCategory.VEGETABLE, 2),
        PlantSlug("beets", "Beetroot", PlantCategory.VEGETABLE, 2),
        PlantSlug("squash", "Squash", PlantCategory.VEGETABLE, 3),
        PlantSlug("corn", "Sweet Corn", PlantCategory.VEGETABLE, 2),
        PlantSlug("potatoes", "Potato", PlantCategory.VEGETABLE, 2),
        PlantSlug("eggplant", "Eggplant", PlantCategory.VEGETABLE, 3),
        
        // More herbs
        PlantSlug("cilantro", "Cilantro", PlantCategory.HERB, 2),
        PlantSlug("oregano", "Oregano", PlantCategory.HERB, 2),
        PlantSlug("thyme", "Thyme", PlantCategory.HERB, 2),
        PlantSlug("sage", "Sage", PlantCategory.HERB, 3),
        PlantSlug("mint", "Mint", PlantCategory.HERB, 3),
        PlantSlug("rosemary", "Rosemary", PlantCategory.HERB, 3),
        PlantSlug("chives", "Chives", PlantCategory.HERB, 2),
        
        // Fruits
        PlantSlug("strawberries", "Strawberry", PlantCategory.FRUIT, 2),
        PlantSlug("raspberries", "Raspberry", PlantCategory.FRUIT, 3)
    )
    
    /**
     * Get plants by category
     */
    fun getPlantsByCategory(category: PlantCategory): List<PlantSlug> =
        getAllTargetPlants().filter { it.category == category }
    
    /**
     * Get plants by priority level
     */
    fun getPlantsByPriority(priority: Int): List<PlantSlug> =
        getAllTargetPlants().filter { it.priority == priority }
}
