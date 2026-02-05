package no.sogn.gardentime.model

import jakarta.persistence.*
import java.util.*

data class GrowArea(
    val id: Long? = null,
    val name: String,
    val zoneSize: String? = null,
    val cropRecord: MutableList<CropRecord> = mutableListOf(),
    val gardenId: UUID,
    val nrOfRows: Int? = null,
    val notes: String? = null,
    val zoneType: ZoneType? = null,
    // Visual board position fields (in pixels on canvas)
    val positionX: Double? = null,
    val positionY: Double? = null,
    // Physical dimension fields (in centimeters)
    val width: Double? = null,
    val length: Double? = null,
    val height: Double? = null,
    // Rotation angle in degrees (0-360)
    val rotation: Double? = 0.0,
)

@Entity
@Table(name = "grow_area_entity")
data class GrowAreaEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    val name: String = "",
    val zoneSize: String? = null,
    val gardenId: UUID = UUID.randomUUID(),
    val nrOfRows: Int? = null,
    val notes: String? = null,
    @Convert(converter = ZoneTypeConverter::class)
    val zoneType: ZoneType? = null,
    // Visual board position fields (in pixels on canvas)
    @Column(name = "position_x")
    val positionX: Double? = null,
    @Column(name = "position_y")
    val positionY: Double? = null,
    // Physical dimension fields (in centimeters)
    @Column(name = "width")
    val width: Double? = null,
    @Column(name = "length")
    val length: Double? = null,
    @Column(name = "height")
    val height: Double? = null,
    // Rotation angle in degrees (0-360)
    @Column(name = "rotation")
    val rotation: Double? = 0.0,
)

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
        zoneType = growAreaEntity.zoneType,
        positionX = growAreaEntity.positionX,
        positionY = growAreaEntity.positionY,
        width = growAreaEntity.width,
        length = growAreaEntity.length,
        height = growAreaEntity.height,
        rotation = growAreaEntity.rotation
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
        zoneType = growArea.zoneType,
        positionX = growArea.positionX,
        positionY = growArea.positionY,
        width = growArea.width,
        length = growArea.length,
        height = growArea.height,
        rotation = growArea.rotation
    )
}
