package no.sogn.gardentime.db

import no.sogn.gardentime.model.GrowAreaEntity
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository

@Repository
interface GrowAreaRepository: CrudRepository<GrowAreaEntity, Long> {
}