package no.sogn.plantdata.repository

import no.sogn.plantdata.model.PlantMergeConflict
import no.sogn.plantdata.model.Plant
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface PlantMergeConflictRepository : JpaRepository<PlantMergeConflict, UUID> {
    fun findByPlant(plant: Plant): List<PlantMergeConflict>
}

