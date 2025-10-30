package no.sogn.gardentime.model

import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.*

@Entity
@Table(
    name = "season_plans",
    uniqueConstraints = [UniqueConstraint(columnNames = ["garden_id", "season", "year"])]
)
data class SeasonPlan(
    @Id
    @Column(name = "id")
    val id: UUID = UUID.randomUUID(),

    @Column(name = "garden_id", nullable = false)
    val gardenId: UUID,

    @Column(name = "user_id", nullable = false)
    val userId: UUID,

    @Column(name = "season", nullable = false, length = 50)
    var season: String,  // SPRING, SUMMER, FALL, WINTER

    @Column(name = "year", nullable = false)
    var year: Int,

    @Column(name = "created_at")
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at")
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
