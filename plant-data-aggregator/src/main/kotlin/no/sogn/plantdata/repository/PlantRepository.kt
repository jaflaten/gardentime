package no.sogn.plantdata.repository

import no.sogn.plantdata.model.Plant
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface PlantRepository : JpaRepository<Plant, UUID> {
    fun findByCanonicalScientificNameIgnoreCase(name: String): Plant?
    fun findByCommonNameIgnoreCase(name: String): Plant?
}

