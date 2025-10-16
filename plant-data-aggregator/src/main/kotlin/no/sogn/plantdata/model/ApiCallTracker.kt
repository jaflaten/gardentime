package no.sogn.plantdata.model

import jakarta.persistence.*
import java.time.Instant
import java.time.LocalDate

@Entity
@Table(name = "api_call_tracker", uniqueConstraints = [UniqueConstraint(columnNames = ["api_name","date"])])
data class ApiCallTracker(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Long? = null,
    @Column(name = "api_name", nullable = false) val apiName: String,
    @Column(name = "date", nullable = false) val date: LocalDate,
    @Column(name = "calls_made", nullable = false) var callsMade: Int = 0,
    @Column(name = "last_updated", nullable = false) var lastUpdated: Instant = Instant.now()
)
