package no.sogn.plantdata.repository

import no.sogn.plantdata.model.PlantSynonym
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface PlantSynonymRepository : JpaRepository<PlantSynonym, UUID> {
    fun findBySynonymIgnoreCase(synonym: String): List<PlantSynonym>
}

