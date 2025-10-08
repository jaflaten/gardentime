package no.sogn.gardentime.model

import jakarta.persistence.*
import java.util.*
//TODO we should probably rename GrowZone to GrowArea or something similar
data class GrowArea(
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
class GrowAreaEntity(
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

fun mapGrowAreaEntityToDomain(
    growAreaEntity: GrowAreaEntity,
    cropRecords: MutableList<CropRecordEntity>
): GrowArea {
    return GrowArea(
        id = growAreaEntity.id,
        name = growAreaEntity.name,
        zoneSize = growAreaEntity.zoneSize,
        cropRecord = cropRecords.map { cropRecord ->
            mapCropRecordEntityToDomain(cropRecord)
        }.toMutableList(),
        gardenId = growAreaEntity.gardenId,
        nrOfRows = growAreaEntity.nrOfRows,
        notes = growAreaEntity.notes,
        zoneType = growAreaEntity.zoneType
    )
}


fun mapGrowAreaToEntity(growArea: GrowArea): GrowAreaEntity {
    return GrowAreaEntity(
        id = growArea.id,
        name = growArea.name,
        zoneSize = growArea.zoneSize,
        nrOfRows = growArea.nrOfRows,
        gardenId = growArea.gardenId,
        notes = growArea.notes,
        zoneType = growArea.zoneType
    )
}
