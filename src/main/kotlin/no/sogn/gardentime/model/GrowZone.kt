package no.sogn.gardentime.model

import jakarta.persistence.*
import java.util.*

data class GrowZone(
    val id: Long? = null,
    val name: String,
    val zoneSize: String? = null,
    val cropRecord: MutableList<CropRecord> = mutableListOf(),
    val gardenId: UUID,
    val nrOfRows: Int? = null,
    val notes: String? = null,
    val zoneType: ZoneType? = null,
    )

@Entity
class GrowZoneEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    val name: String,
    val zoneSize: String? = null,
    val gardenId: UUID,
    val nrOfRows: Int? = null,
    val notes: String? = null,
    @Convert(converter = ZoneTypeConverter::class)
    val zoneType: ZoneType? = null,
    ) {
    constructor() : this(null, "", "", UUID.randomUUID(), 0, "", null) {
    }

}

fun mapGrowZoneEntityToDomain(
    growZoneEntity: GrowZoneEntity,
    cropRecords: MutableList<CropRecordEntity>
): GrowZone {
    return GrowZone(
        id = growZoneEntity.id,
        name = growZoneEntity.name,
        zoneSize = growZoneEntity.zoneSize,
        cropRecord = cropRecords.map { cropRecord ->
            mapCropRecordEntityToDomain(cropRecord)
        }.toMutableList(),
        gardenId = growZoneEntity.gardenId,
        nrOfRows = growZoneEntity.nrOfRows,
        notes = growZoneEntity.notes,
        zoneType = growZoneEntity.zoneType
    )
}


fun mapGrowZoneToEntity(growZone: GrowZone): GrowZoneEntity {
    return GrowZoneEntity(
        id = growZone.id,
        name = growZone.name,
        zoneSize = growZone.zoneSize,
        nrOfRows = growZone.nrOfRows,
        gardenId = growZone.gardenId,
        notes = growZone.notes,
        zoneType = growZone.zoneType
    )
}
