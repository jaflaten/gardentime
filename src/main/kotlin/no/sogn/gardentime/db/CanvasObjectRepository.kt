package no.sogn.gardentime.db

import no.sogn.gardentime.model.CanvasObjectEntity
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface CanvasObjectRepository: CrudRepository<CanvasObjectEntity, Long> {
    fun findByGardenId(gardenId: UUID): List<CanvasObjectEntity>
}

