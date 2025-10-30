package no.sogn.gardentime.db

import no.sogn.gardentime.model.GrowAreaEntity
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface GrowAreaRepository: CrudRepository<GrowAreaEntity, Long> {
    fun findByNameContainingIgnoreCase(name: String): List<GrowAreaEntity>
    fun findByGardenIdIn(gardenIds: List<UUID>): List<GrowAreaEntity>
    fun findByGardenIdInAndNameContainingIgnoreCase(gardenIds: List<UUID>, name: String): List<GrowAreaEntity>
    fun findAllByGardenId(gardenId: UUID): List<GrowAreaEntity>
}