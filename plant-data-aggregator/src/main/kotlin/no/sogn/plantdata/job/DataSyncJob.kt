package no.sogn.plantdata.job

import no.sogn.plantdata.dto.PerenualSpeciesDetail
import no.sogn.plantdata.dto.TrefleSpeciesDetail
import no.sogn.plantdata.service.PlantMergeService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class DataSyncJob(private val mergeService: PlantMergeService) {
    private val log = LoggerFactory.getLogger(DataSyncJob::class.java)

    // Placeholder scheduled job to demonstrate merge
    @Scheduled(fixedDelay = 3600000)
    fun syncSample() {
        log.info("Starting sample sync job")
        // In reality fetch from APIs; here we simulate a single merge
        val trefle = TrefleSpeciesDetail(1L, "Solanum lycopersicum", "Tomato", "Solanaceae", "Solanum")
        val perenual = PerenualSpeciesDetail(10L, "Solanum lycopersicum", "Tomato", listOf("Tomate"), "Solanaceae", "Solanum")
        val result = mergeService.merge(trefle, perenual)
        log.info("Merged plant ${result.plant.canonicalScientificName} conflicts=${result.conflicts.size}")
    }
}
