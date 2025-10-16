package no.sogn.plantdata.model

import jakarta.persistence.*
import no.sogn.plantdata.enums.ConflictResolutionStrategy
import java.time.Instant
import java.util.*

@Entity
@Table(name = "plant_merge_conflicts")
data class PlantMergeConflict(
    @Id var id: UUID = UUID.randomUUID(),
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "plant_id", nullable = false) var plant: Plant,
    @Column(name = "field_name", nullable = false) var fieldName: String,
    @Column(name = "trefle_value") var trefleValue: String? = null,
    @Column(name = "perenual_value") var perenualValue: String? = null,
    @Column(name = "resolved_value") var resolvedValue: String? = null,
    @Enumerated(EnumType.STRING) @Column(name = "resolution_strategy") var resolutionStrategy: ConflictResolutionStrategy? = null,
    @Column(name = "created_at", nullable = false) var createdAt: Instant = Instant.now(),
    @Column(name = "updated_at", nullable = false) var updatedAt: Instant = Instant.now()
) {
    @Suppress("unused")
    @Deprecated("Hibernate only")
    constructor(): this(UUID.randomUUID(), Plant(UUID.randomUUID(), ""), "", null, null, null, null, Instant.now(), Instant.now())
}
