package no.sogn.plantdata.repository

import no.sogn.plantdata.model.PlantAttributeEdiblePart
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface PlantAttributeEdiblePartsRepository : JpaRepository<PlantAttributeEdiblePart, UUID> {
    
    @Modifying
    @Query("DELETE FROM PlantAttributeEdiblePart p WHERE p.plantId = :plantId")
    fun deleteByPlantId(plantId: UUID)
    
    fun findByPlantId(plantId: UUID): List<PlantAttributeEdiblePart>
}
