package no.sogn.plantdata.model

import jakarta.persistence.*
import java.time.Instant
import java.util.*

@Entity
@Table(name = "plants", indexes = [Index(name = "idx_plants_canonical", columnList = "canonical_scientific_name")])
data class Plant(
    @Id var id: UUID = UUID.randomUUID(),
    @Column(name = "canonical_scientific_name", nullable = false) var canonicalScientificName: String,
    @Column(name = "common_name") var commonName: String? = null,
    @Column(name = "family") var family: String? = null,
    @Column(name = "genus") var genus: String? = null,
    @Column(name = "source_trefle_id") var sourceTrefleId: Long? = null,
    @Column(name = "source_perenual_id") var sourcePerenualId: Long? = null,
    @Column(name = "created_at", nullable = false) var createdAt: Instant = Instant.now(),
    @Column(name = "updated_at", nullable = false) var updatedAt: Instant = Instant.now()
) {
    // JPA requires a no-arg constructor; values here are placeholders and will be overwritten.
    @Suppress("unused")
    @Deprecated("Hibernate only")
    constructor(): this(UUID.randomUUID(), "", null, null, null, null, null, Instant.now(), Instant.now())
}
