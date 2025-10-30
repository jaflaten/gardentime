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
    fun calculatePlantingDates(gardenId: UUID, plantId: Long): CalculatedDates {
        val climateInfo = gardenClimateInfoRepository.findByGardenId(gardenId)
        val plantDetails = plantDetailsRepository.findByPlantId(plantId)
        val plant = plantRepository.findById(plantId).orElse(null)

        // If no frost date info, return null dates with recommendation
        if (climateInfo?.lastFrostDate == null) {
            return CalculatedDates(
                indoorStartDate = null,
                transplantDate = null,
                directSowDate = null,
                expectedHarvestDate = null,
                recommendedMethod = determineRecommendedMethod(plantDetails)
            )
        }

        val lastFrostDate = climateInfo.lastFrostDate!!
        var indoorStartDate: LocalDate? = null
        var transplantDate: LocalDate? = null
        var directSowDate: LocalDate? = null
        var expectedHarvestDate: LocalDate? = null

        // Calculate indoor start date if applicable
        if (plantDetails?.weeksBeforeFrostIndoor != null && plantDetails.weeksBeforeFrostIndoor!! > 0) {
            indoorStartDate = lastFrostDate.minusWeeks(plantDetails.weeksBeforeFrostIndoor!!.toLong())
        }

        // Calculate transplant or direct sow dates based on frost tolerance
        when (plantDetails?.frostTolerance) {
            "HARDY" -> {
                // Hardy plants can go out 4-6 weeks before last frost
                transplantDate = lastFrostDate.minusWeeks(4)
                directSowDate = lastFrostDate.minusWeeks(4)
            }
            "SEMI_HARDY" -> {
                // Semi-hardy can go out 2-4 weeks before last frost
                transplantDate = lastFrostDate.minusWeeks(2)
                directSowDate = lastFrostDate.minusWeeks(2)
            }
            "TENDER" -> {
                // Tender plants need to wait until after frost danger
                transplantDate = lastFrostDate.plusWeeks(1)
                directSowDate = lastFrostDate.plusWeeks(1)
            }
            else -> {
                // Default: conservative approach, after last frost
                transplantDate = lastFrostDate
                directSowDate = lastFrostDate
            }
        }

        // Calculate expected harvest date
        val plantingDate = when {
            plantDetails?.canTransplant == true && transplantDate != null -> transplantDate
            directSowDate != null -> directSowDate
            else -> lastFrostDate
        }

        if (plant?.maturityTime != null && plant.maturityTime > 0) {
            expectedHarvestDate = plantingDate.plusDays(plant.maturityTime.toLong())
        }

        return CalculatedDates(
            indoorStartDate = indoorStartDate,
            transplantDate = if (plantDetails?.canTransplant == true) transplantDate else null,
            directSowDate = if (plantDetails?.canDirectSow == true) directSowDate else null,
            expectedHarvestDate = expectedHarvestDate,
            recommendedMethod = determineRecommendedMethod(plantDetails)
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
    fun isInPlantingWindow(gardenId: UUID, plantId: Long, currentDate: LocalDate = LocalDate.now()): Boolean {
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
