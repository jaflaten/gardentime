package no.sogn.gardentime.db

import no.sogn.gardentime.model.PlantFamily
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

@Repository
@Transactional
interface PlantFamilyRepository : CrudRepository<PlantFamily, Long> {
    fun findByName(name: String): PlantFamily?
    fun findByNameContainingIgnoreCase(name: String): List<PlantFamily>
}
