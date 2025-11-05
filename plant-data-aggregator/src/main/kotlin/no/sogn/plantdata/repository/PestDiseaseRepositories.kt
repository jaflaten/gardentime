package no.sogn.plantdata.repository

import no.sogn.plantdata.model.Pest
import no.sogn.plantdata.model.Disease
import no.sogn.plantdata.model.PlantPest
import no.sogn.plantdata.model.PlantDisease
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface PestRepository : JpaRepository<Pest, UUID> {
    fun findByNameIgnoreCase(name: String): Pest?
}

@Repository
interface DiseaseRepository : JpaRepository<Disease, UUID> {
    fun findByNameIgnoreCase(name: String): Disease?
    fun findByIsSoilBorneTrue(): List<Disease>
}

@Repository
interface PlantPestRepository : JpaRepository<PlantPest, UUID> {
    fun findByPlantId(plantId: UUID): List<PlantPest>
    
    @Query("SELECT COUNT(pp) FROM PlantPest pp WHERE pp.plant.id = :plantId")
    fun countByPlantId(plantId: UUID): Long
}

@Repository
interface PlantDiseaseRepository : JpaRepository<PlantDisease, UUID> {
    fun findByPlantId(plantId: UUID): List<PlantDisease>
    
    @Query("SELECT COUNT(pd) FROM PlantDisease pd WHERE pd.plant.id = :plantId")
    fun countByPlantId(plantId: UUID): Long
}
