package no.sogn.plantdata.model

import jakarta.persistence.*
import no.sogn.plantdata.enums.SeverityLevel
import java.time.Instant
import java.util.*

@Entity
@Table(name = "pests")
data class Pest(
    @Id val id: UUID = UUID.randomUUID(),
    @Column(name = "name", nullable = false, unique = true) val name: String,
    @Column(name = "scientific_name") val scientificName: String? = null,
    @Column(name = "description", columnDefinition = "TEXT") val description: String? = null,
    @Column(name = "treatment_options", columnDefinition = "TEXT") val treatmentOptions: String? = null,
    @Enumerated(EnumType.STRING) @Column(name = "severity") val severity: SeverityLevel = SeverityLevel.MEDIUM,
    @Column(name = "created_at", nullable = false) val createdAt: Instant = Instant.now(),
    @Column(name = "updated_at", nullable = false) var updatedAt: Instant = Instant.now()
)

@Entity
@Table(name = "diseases")
data class Disease(
    @Id val id: UUID = UUID.randomUUID(),
    @Column(name = "name", nullable = false, unique = true) val name: String,
    @Column(name = "scientific_name") val scientificName: String? = null,
    @Column(name = "description", columnDefinition = "TEXT") val description: String? = null,
    @Column(name = "treatment_options", columnDefinition = "TEXT") val treatmentOptions: String? = null,
    @Enumerated(EnumType.STRING) @Column(name = "severity") val severity: SeverityLevel = SeverityLevel.MEDIUM,
    @Column(name = "is_soil_borne") val isSoilBorne: Boolean = false,
    @Column(name = "persistence_years") val persistenceYears: Int? = null,
    @Column(name = "created_at", nullable = false) val createdAt: Instant = Instant.now(),
    @Column(name = "updated_at", nullable = false) var updatedAt: Instant = Instant.now()
)

@Entity
@Table(name = "plant_pests")
data class PlantPest(
    @Id val id: UUID = UUID.randomUUID(),
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "plant_id", nullable = false) val plant: Plant,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "pest_id", nullable = false) val pest: Pest,
    @Enumerated(EnumType.STRING) @Column(name = "susceptibility") val susceptibility: SeverityLevel = SeverityLevel.MEDIUM,
    @Column(name = "notes", columnDefinition = "TEXT") val notes: String? = null,
    @Column(name = "prevention_tips", columnDefinition = "TEXT") val preventionTips: String? = null,
    @Column(name = "created_at", nullable = false) val createdAt: Instant = Instant.now()
)

@Entity
@Table(name = "plant_diseases")
data class PlantDisease(
    @Id val id: UUID = UUID.randomUUID(),
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "plant_id", nullable = false) val plant: Plant,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "disease_id", nullable = false) val disease: Disease,
    @Enumerated(EnumType.STRING) @Column(name = "susceptibility") val susceptibility: SeverityLevel = SeverityLevel.MEDIUM,
    @Column(name = "notes", columnDefinition = "TEXT") val notes: String? = null,
    @Column(name = "prevention_tips", columnDefinition = "TEXT") val preventionTips: String? = null,
    @Column(name = "created_at", nullable = false) val createdAt: Instant = Instant.now()
)
