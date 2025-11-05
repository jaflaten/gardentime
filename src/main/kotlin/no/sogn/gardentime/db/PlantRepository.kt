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
    
    // New methods for plant data API
    fun findBySlug(slug: String): PlantEntity?
    fun findByFamilyId(familyId: Long): List<PlantEntity>
    fun findByFeederType(feederType: String): List<PlantEntity>
    fun findByCycle(cycle: String): List<PlantEntity>
    fun findBySunNeeds(sunNeeds: String): List<PlantEntity>
    fun findByFrostTolerant(frostTolerant: Boolean): List<PlantEntity>
    fun findByContainerSuitable(containerSuitable: Boolean): List<PlantEntity>
    fun findByIsNitrogenFixer(isNitrogenFixer: Boolean): List<PlantEntity>
}