package no.sogn.plantdata.model

import jakarta.persistence.*
import java.time.Instant
import java.util.*

@Entity
@Table(name = "plant_synonyms", uniqueConstraints = [UniqueConstraint(columnNames = ["plant_id", "synonym"])])
data class PlantSynonym(
    @Id val id: UUID = UUID.randomUUID(),
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "plant_id", nullable = false) val plant: Plant,
    @Column(name = "synonym", nullable = false) val synonym: String,
    @Column(name = "source", nullable = true) val source: String? = null,
    @Column(name = "created_at", nullable = false) val createdAt: Instant = Instant.now()
)
