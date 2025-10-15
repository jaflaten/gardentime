package no.sogn.gardentime.db

import no.sogn.gardentime.model.PlantEntity
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

@Repository
@Transactional
interface PlantRepository : CrudRepository<PlantEntity, Long> {
    fun findPlantEntityByName(name: String): MutableList<PlantEntity>
    fun findPlantEntityById(id: Long): PlantEntity?
    fun findByNameContainingIgnoreCaseOrScientificNameContainingIgnoreCase(name: String, scientificName: String): List<PlantEntity>
}