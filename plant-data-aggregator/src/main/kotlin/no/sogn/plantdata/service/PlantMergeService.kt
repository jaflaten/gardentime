package no.sogn.plantdata.service

import no.sogn.plantdata.dto.PerenualSpeciesDetail
import no.sogn.plantdata.dto.TrefleSpeciesDetail
import no.sogn.plantdata.enums.ConflictResolutionStrategy
import no.sogn.plantdata.model.Plant
import no.sogn.plantdata.model.PlantMergeConflict
import no.sogn.plantdata.repository.PlantMergeConflictRepository
import no.sogn.plantdata.repository.PlantRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
class PlantMergeService(
    private val plantRepository: PlantRepository,
    private val conflictRepository: PlantMergeConflictRepository
) {

    data class MergeResult(val plant: Plant, val conflicts: List<PlantMergeConflict>)

    @Transactional
    fun merge(trefle: TrefleSpeciesDetail?, perenual: PerenualSpeciesDetail?): MergeResult {
        val canonicalName = PlantNameNormalizer.canonical(
            trefle?.scientificName ?: perenual?.scientificName
        ) ?: throw IllegalArgumentException("No scientific name available to merge")

        val existing = plantRepository.findByCanonicalScientificNameIgnoreCase(canonicalName)
        val plant = existing ?: plantRepository.save(
            Plant(
                canonicalScientificName = canonicalName,
                commonName = trefle?.commonName ?: perenual?.commonName,
                family = trefle?.family ?: perenual?.family,
                genus = trefle?.genus ?: perenual?.genus,
                sourceTrefleId = trefle?.id,
                sourcePerenualId = perenual?.id
            )
        )

        val conflicts = mutableListOf<PlantMergeConflict>()
        // Example conflict detection: family/genus mismatch
        if (trefle != null && perenual != null) {
            if (!valuesEqual(trefle.family, perenual.family)) {
                conflicts += conflictRepository.save(
                    PlantMergeConflict(
                        plant = plant,
                        fieldName = "family",
                        trefleValue = trefle.family,
                        perenualValue = perenual.family,
                        resolutionStrategy = ConflictResolutionStrategy.PREFER_TREFLE
                    )
                )
            }
            if (!valuesEqual(trefle.genus, perenual.genus)) {
                conflicts += conflictRepository.save(
                    PlantMergeConflict(
                        plant = plant,
                        fieldName = "genus",
                        trefleValue = trefle.genus,
                        perenualValue = perenual.genus,
                        resolutionStrategy = ConflictResolutionStrategy.PREFER_TREFLE
                    )
                )
            }
        }
        return MergeResult(plant, conflicts)
    }

    private fun valuesEqual(a: String?, b: String?): Boolean = (a == null && b == null) || (a != null && b != null && a.equals(b, ignoreCase = true))
}

