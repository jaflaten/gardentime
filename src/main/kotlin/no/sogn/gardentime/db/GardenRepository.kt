package no.sogn.gardentime.db

import no.sogn.gardentime.model.GardenEntity
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface GardenRepository: CrudRepository<GardenEntity, UUID> {

    fun findGardenEntityById(id: UUID): GardenEntity?
    fun findAllByUserId(userId: UUID): List<GardenEntity>
}