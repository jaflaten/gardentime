package no.sogn.gardentime.model

import jakarta.persistence.*
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.*

@Entity
@Table(name = "garden_climate_info")
class GardenClimateInfo(
    @Id
    @Column(name = "garden_id")
    val gardenId: UUID = UUID.randomUUID(),

    @Column(name = "last_frost_date")
    var lastFrostDate: LocalDate? = null,

    @Column(name = "first_frost_date")
    var firstFrostDate: LocalDate? = null,

    @Column(name = "hardiness_zone", length = 10)
    var hardinessZone: String? = null,

    @Column(name = "latitude")
    var latitude: Double? = null,

    @Column(name = "longitude")
    var longitude: Double? = null,

    @Column(name = "updated_at")
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
