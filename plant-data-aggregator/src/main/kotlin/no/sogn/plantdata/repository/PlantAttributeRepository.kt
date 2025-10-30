package no.sogn.plantdata.repository

import no.sogn.plantdata.model.PlantAttributes
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface PlantAttributeRepository : JpaRepository<PlantAttributes, UUID>
