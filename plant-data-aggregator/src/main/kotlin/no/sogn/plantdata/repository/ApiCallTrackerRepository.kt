package no.sogn.plantdata.repository

import no.sogn.plantdata.model.ApiCallTracker
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate

interface ApiCallTrackerRepository : JpaRepository<ApiCallTracker, Long> {
    fun findByApiNameAndDate(apiName: String, date: LocalDate): ApiCallTracker?
}

