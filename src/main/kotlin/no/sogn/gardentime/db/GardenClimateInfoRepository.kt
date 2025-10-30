package no.sogn.gardentime.db

import no.sogn.gardentime.model.GardenClimateInfo
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface GardenClimateInfoRepository : JpaRepository<GardenClimateInfo, UUID> {
    fun findByGardenId(gardenId: UUID): GardenClimateInfo?
}
