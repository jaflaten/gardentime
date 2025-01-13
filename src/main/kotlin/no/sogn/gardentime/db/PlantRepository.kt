package no.sogn.gardentime.db

import no.sogn.gardentime.model.Plant
import no.sogn.gardentime.model.PlantEntity
import no.sogn.gardentime.model.PlantType
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Repository
@Transactional
interface PlantRepository : CrudRepository<PlantEntity, Long> {
    fun findPlantsByPlantType(plantType: PlantType): MutableList<PlantEntity>


}