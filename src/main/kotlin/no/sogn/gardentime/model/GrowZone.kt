package no.sogn.gardentime.model

import jakarta.persistence.CascadeType
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import java.util.*

data class GrowZone(
    val id: Int? = null,
    val name: String,
    val zoneSize: String?,
    val cropRecord: List<CropRecord>,
    val nrOfRows: Int?,
    val notes: String?,
    val zoneType: ZoneType?,
    )

@Entity
class GrowZoneEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int? = null,
    val name: String,
    val zoneSize: String?,
    @OneToMany(mappedBy = "growZone", cascade = [CascadeType.ALL], orphanRemoval = false)
    val cropRecord: List<CropRecordEntity>,
//    @ManyToOne
//    @JoinColumn(name = "garden_id", nullable = false)
//    val garden: GardenEntity,
    val nrOfRows: Int? = null,
    val notes: String?,
    val zoneType: ZoneType? = null,
    ) {
//    constructor() : this(null, "", null, mutableListOf(), GardenEntity(), null, null, null)
constructor() : this(null, "", null, mutableListOf(), null, null, null)
    }

fun mapToGrowZoneEntity(growZone: GrowZone): GrowZoneEntity {
    return GrowZoneEntity(
        growZone.id,
        growZone.name,
        growZone.zoneSize,
        growZone.cropRecord.map { mapCropRecordToEntity(it) },
        growZone.nrOfRows,
        growZone.notes,
        growZone.zoneType
    )
}

fun mapToGrowZone(growZoneEntity: GrowZoneEntity): GrowZone {
    return GrowZone(
        growZoneEntity.id,
        growZoneEntity.name,
        growZoneEntity.zoneSize,
        growZoneEntity.cropRecord.map { mapCropRecord(it) },
        growZoneEntity.nrOfRows,
        growZoneEntity.notes,
        growZoneEntity.zoneType
    )
}

