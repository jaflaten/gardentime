package no.sogn.gardentime.model

import jakarta.persistence.*
import java.util.*

/**
 * Canvas objects are decorative/annotation elements on the garden board.
 * Unlike GrowAreas which are functional objects with crop tracking,
 * these are for visual planning, annotations, and design.
 */
data class CanvasObject(
    val id: Long? = null,
    val gardenId: UUID,
    val type: CanvasObjectType,
    // Position and dimensions
    val x: Double,
    val y: Double,
    val width: Double? = null,  // For rectangles, ellipses
    val height: Double? = null, // For rectangles, ellipses
    // For lines, arrows, freehand paths (array of points: [x1,y1,x2,y2,...])
    val points: String? = null,
    // Styling
    val fillColor: String? = null,
    val strokeColor: String? = null,
    val strokeWidth: Double? = null,
    val opacity: Double? = null,
    val dash: String? = null,  // Line dash pattern as JSON, e.g. "[5, 5]" for dashed
    // Text content (for text objects)
    val text: String? = null,
    val fontSize: Int? = null,
    val fontFamily: String? = null,
    // Metadata
    val rotation: Double? = null,
    val zIndex: Int? = null,
    val locked: Boolean = false,
    val layerId: String? = null
)

@Entity
@Table(name = "canvas_object")
class CanvasObjectEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(name = "garden_id", nullable = false)
    var gardenId: UUID? = null,

    @Column(name = "type", nullable = false)
    @Convert(converter = CanvasObjectTypeConverter::class)
    var type: CanvasObjectType? = null,

    // Position and dimensions
    @Column(name = "x", nullable = false)
    var x: Double = 0.0,

    @Column(name = "y", nullable = false)
    var y: Double = 0.0,

    @Column(name = "width")
    var width: Double? = null,

    @Column(name = "height")
    var height: Double? = null,

    @Column(name = "points", columnDefinition = "TEXT")
    var points: String? = null,

    // Styling
    @Column(name = "fill_color", length = 20)
    var fillColor: String? = null,

    @Column(name = "stroke_color", length = 20)
    var strokeColor: String? = null,

    @Column(name = "stroke_width")
    var strokeWidth: Double? = null,

    @Column(name = "opacity")
    var opacity: Double? = null,

    @Column(name = "dash", length = 50)
    var dash: String? = null,

    // Text content
    @Column(name = "text", columnDefinition = "TEXT")
    var text: String? = null,

    @Column(name = "font_size")
    var fontSize: Int? = null,

    @Column(name = "font_family", length = 50)
    var fontFamily: String? = null,

    // Metadata
    @Column(name = "rotation")
    var rotation: Double? = null,

    @Column(name = "z_index")
    var zIndex: Int? = null,

    @Column(name = "locked")
    var locked: Boolean = false,

    @Column(name = "layer_id", length = 50)
    var layerId: String? = null
)

enum class CanvasObjectType {
    RECTANGLE,
    CIRCLE,
    LINE,
    ARROW,
    TEXT,
    FREEHAND
}

@Converter
class CanvasObjectTypeConverter : AttributeConverter<CanvasObjectType, String> {
    override fun convertToDatabaseColumn(attribute: CanvasObjectType?): String? {
        return attribute?.name
    }

    override fun convertToEntityAttribute(dbData: String?): CanvasObjectType? {
        return dbData?.let { CanvasObjectType.valueOf(it) }
    }
}

fun mapCanvasObjectEntityToDomain(entity: CanvasObjectEntity): CanvasObject {
    return CanvasObject(
        id = entity.id,
        gardenId = entity.gardenId ?: throw IllegalStateException("CanvasObject gardenId cannot be null"),
        type = entity.type ?: throw IllegalStateException("CanvasObject type cannot be null"),
        x = entity.x,
        y = entity.y,
        width = entity.width,
        height = entity.height,
        points = entity.points,
        fillColor = entity.fillColor,
        strokeColor = entity.strokeColor,
        strokeWidth = entity.strokeWidth,
        opacity = entity.opacity,
        dash = entity.dash,
        text = entity.text,
        fontSize = entity.fontSize,
        fontFamily = entity.fontFamily,
        rotation = entity.rotation,
        zIndex = entity.zIndex,
        locked = entity.locked,
        layerId = entity.layerId
    )
}

fun mapCanvasObjectToEntity(canvasObject: CanvasObject): CanvasObjectEntity {
    return CanvasObjectEntity(
        id = canvasObject.id,
        gardenId = canvasObject.gardenId,
        type = canvasObject.type,
        x = canvasObject.x,
        y = canvasObject.y,
        width = canvasObject.width,
        height = canvasObject.height,
        points = canvasObject.points,
        fillColor = canvasObject.fillColor,
        strokeColor = canvasObject.strokeColor,
        strokeWidth = canvasObject.strokeWidth,
        opacity = canvasObject.opacity,
        dash = canvasObject.dash,
        text = canvasObject.text,
        fontSize = canvasObject.fontSize,
        fontFamily = canvasObject.fontFamily,
        rotation = canvasObject.rotation,
        zIndex = canvasObject.zIndex,
        locked = canvasObject.locked,
        layerId = canvasObject.layerId
    )
}
