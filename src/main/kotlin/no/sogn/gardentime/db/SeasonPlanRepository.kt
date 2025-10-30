package no.sogn.gardentime.db

import no.sogn.gardentime.model.SeasonPlan
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface SeasonPlanRepository : JpaRepository<SeasonPlan, UUID> {
    fun findByGardenId(gardenId: UUID): List<SeasonPlan>
    fun findByGardenIdAndSeasonAndYear(gardenId: UUID, season: String, year: Int): SeasonPlan?
    fun findByUserId(userId: UUID): List<SeasonPlan>
}
