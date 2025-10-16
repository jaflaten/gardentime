package no.sogn.plantdata.model

import jakarta.persistence.*
import no.sogn.plantdata.enums.*
import java.time.Instant
import java.util.*

@Entity
@Table(name = "companion_relationships", uniqueConstraints = [UniqueConstraint(columnNames = ["plant_a_id","plant_b_id","relationship_type"])])
data class CompanionRelationship(
    @Id val id: UUID = UUID.randomUUID(),
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "plant_a_id", nullable = false) val plantA: Plant,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "plant_b_id", nullable = false) val plantB: Plant,
    @Enumerated(EnumType.STRING) @Column(name = "relationship_type", nullable = false) val relationshipType: RelationshipType,
    @Enumerated(EnumType.STRING) @Column(name = "relationship_subtype") val relationshipSubtype: RelationshipSubtype? = null,
    @Enumerated(EnumType.STRING) @Column(name = "confidence_level", nullable = false) val confidenceLevel: ConfidenceLevel,
    @Enumerated(EnumType.STRING) @Column(name = "evidence_type", nullable = false) val evidenceType: EvidenceType,
    @Column(name = "reason", length = 400) val reason: String? = null,
    @Column(name = "mechanism", columnDefinition = "TEXT") val mechanism: String? = null,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "source_id") val source: Source? = null,
    @Column(name = "source_url") val sourceUrl: String? = null,
    @Column(name = "geographic_scope") val geographicScope: String? = null,
    @Column(name = "is_bidirectional") val isBidirectional: Boolean = false,
    @Column(name = "verified") val verified: Boolean = false,
    @Column(name = "verified_at") val verifiedAt: Instant? = null,
    @Column(name = "verified_by") val verifiedBy: UUID? = null,
    @Column(name = "quality_score") val qualityScore: Int? = null,
    @Column(name = "notes", columnDefinition = "TEXT") val notes: String? = null,
    @Column(name = "deprecated") val deprecated: Boolean = false,
    @Column(name = "created_at", nullable = false) val createdAt: Instant = Instant.now(),
    @Column(name = "updated_at", nullable = false) var updatedAt: Instant = Instant.now()
)
