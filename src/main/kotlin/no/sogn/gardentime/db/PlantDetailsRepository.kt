package no.sogn.gardentime.db

import no.sogn.gardentime.model.PlantDetails
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface PlantDetailsRepository : JpaRepository<PlantDetails, Long> {
    fun findByPlantId(plantId: Long): PlantDetails?
}
