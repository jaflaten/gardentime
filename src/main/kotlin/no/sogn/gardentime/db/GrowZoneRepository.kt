package no.sogn.gardentime.db

import no.sogn.gardentime.model.GrowZoneEntity
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository

@Repository
interface GrowZoneRepository: CrudRepository<GrowZoneEntity, Long> {
}