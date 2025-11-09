package no.sogn.gardentime.service

import no.sogn.gardentime.db.GardenClimateInfoRepository
import no.sogn.gardentime.db.PlantDetailsRepository
import no.sogn.gardentime.db.PlantRepository
import no.sogn.gardentime.model.PlantDetails
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.util.*

@Service
class PlantingDateCalculatorService(
    private val gardenClimateInfoRepository: GardenClimateInfoRepository,
    private val plantDetailsRepository: PlantDetailsRepository,
    private val plantRepository: PlantRepository
) {

    data class CalculatedDates(
        val indoorStartDate: LocalDate?,
        val transplantDate: LocalDate?,
        val directSowDate: LocalDate?,
        val expectedHarvestDate: LocalDate?,
        val recommendedMethod: String  // "TRANSPLANT", "DIRECT_SOW", "EITHER"
    )

    /**
     * Calculate all relevant planting dates for a crop based on:
     * - Garden's frost dates
     * - Plant's characteristics (frost tolerance, indoor start requirements)
     * - Plant's maturity time
     */
    fun calculatePlantingDates(gardenId: UUID, plantId: String): CalculatedDates {
        // TODO: Integrate with plant-data-aggregator API to fetch plant details
        // For now, return empty dates - user will manually set them
        return CalculatedDates(
            indoorStartDate = null,
            transplantDate = null,
            directSowDate = null,
            expectedHarvestDate = null,
            recommendedMethod = "EITHER"
        )
    }

    private fun determineRecommendedMethod(plantDetails: PlantDetails?): String {
        if (plantDetails == null) return "DIRECT_SOW"
        
        return when {
            plantDetails.canTransplant && !plantDetails.canDirectSow -> "TRANSPLANT"
            !plantDetails.canTransplant && plantDetails.canDirectSow -> "DIRECT_SOW"
            plantDetails.canTransplant && plantDetails.canDirectSow -> "EITHER"
            else -> "DIRECT_SOW"
        }
    }

    /**
     * Check if we're currently in a planting window for this plant
     */
    fun isInPlantingWindow(gardenId: UUID, plantId: String, currentDate: LocalDate = LocalDate.now()): Boolean {
        val dates = calculatePlantingDates(gardenId, plantId)
        
        // Check if current date is within 2 weeks of indoor start date
        if (dates.indoorStartDate != null) {
            val windowStart = dates.indoorStartDate.minusWeeks(1)
            val windowEnd = dates.indoorStartDate.plusWeeks(2)
            if (currentDate.isAfter(windowStart) && currentDate.isBefore(windowEnd)) {
                return true
            }
        }

        // Check if current date is within planting window (transplant or direct sow)
        val plantingDate = dates.transplantDate ?: dates.directSowDate
        if (plantingDate != null) {
            val windowStart = plantingDate.minusWeeks(1)
            val windowEnd = plantingDate.plusWeeks(4)  // Extended window for succession planting
            if (currentDate.isAfter(windowStart) && currentDate.isBefore(windowEnd)) {
                return true
            }
        }

        return false
    }
}
