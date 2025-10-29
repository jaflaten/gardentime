package no.sogn.gardentime.service

import no.sogn.gardentime.db.CanvasObjectRepository
import no.sogn.gardentime.db.GardenRepository
import no.sogn.gardentime.model.*
import no.sogn.gardentime.security.SecurityUtils
import org.springframework.stereotype.Service
import org.slf4j.LoggerFactory
import java.util.*

@Service
class CanvasObjectService(
    private val canvasObjectRepository: CanvasObjectRepository,
    private val gardenRepository: GardenRepository,
    private val securityUtils: SecurityUtils
) {
    private val log = LoggerFactory.getLogger(CanvasObjectService::class.java)

    fun createCanvasObject(
        gardenId: UUID,
        type: CanvasObjectType,
        x: Double,
        y: Double,
        width: Double? = null,
        height: Double? = null,
        points: String? = null,
        fillColor: String? = null,
        strokeColor: String? = null,
        strokeWidth: Double? = null,
        opacity: Double? = null,
        dash: String? = null,
        text: String? = null,
        fontSize: Int? = null,
        fontFamily: String? = null,
        rotation: Double? = null,
        zIndex: Int? = null,
        locked: Boolean = false,
        layerId: String? = null
    ): CanvasObject {
        val currentUserId = securityUtils.getCurrentUserId()
        val gardenEntity = gardenRepository.findGardenEntityById(gardenId)
            ?: throw IllegalArgumentException("Garden with id $gardenId not found")

        // Security check: ensure the garden belongs to the current user
        if (gardenEntity.userId != currentUserId) {
            throw IllegalAccessException("You don't have permission to add objects to this garden")
        }

        val canvasObject = CanvasObject(
            gardenId = gardenId,
            type = type,
            x = x,
            y = y,
            width = width,
            height = height,
            points = points,
            fillColor = fillColor,
            strokeColor = strokeColor,
            strokeWidth = strokeWidth,
            opacity = opacity,
            dash = dash,
            text = text,
            fontSize = fontSize,
            fontFamily = fontFamily,
            rotation = rotation,
            zIndex = zIndex,
            locked = locked,
            layerId = layerId
        )

        val savedEntity = canvasObjectRepository.save(mapCanvasObjectToEntity(canvasObject))
        return mapCanvasObjectEntityToDomain(savedEntity)
    }

    fun getCanvasObjectsByGarden(gardenId: UUID): List<CanvasObject> {
        val currentUserId = securityUtils.getCurrentUserId()
        val gardenEntity = gardenRepository.findGardenEntityById(gardenId)
            ?: throw IllegalArgumentException("Garden with id $gardenId not found")

        // Security check
        if (gardenEntity.userId != currentUserId) {
            throw IllegalAccessException("You don't have permission to view this garden's objects")
        }

        return canvasObjectRepository.findByGardenId(gardenId)
            .map { mapCanvasObjectEntityToDomain(it) }
    }

    fun updateCanvasObject(
        id: Long,
        x: Double? = null,
        y: Double? = null,
        width: Double? = null,
        height: Double? = null,
        points: String? = null,
        fillColor: String? = null,
        strokeColor: String? = null,
        strokeWidth: Double? = null,
        opacity: Double? = null,
        dash: String? = null,
        text: String? = null,
        fontSize: Int? = null,
        fontFamily: String? = null,
        rotation: Double? = null,
        zIndex: Int? = null,
        locked: Boolean? = null,
        layerId: String? = null
    ): CanvasObject {
        log.debug("Updating CanvasObject id={} x={} y={} width={} height={} locked={} layerId={}", id, x, y, width, height, locked, layerId)
        val currentUserId = securityUtils.getCurrentUserId()
        val existingEntity = canvasObjectRepository.findById(id).orElseThrow {
            IllegalArgumentException("Canvas object with id $id not found")
        }
        log.trace("Existing entity before update: {}", existingEntity)

        val gardenEntity = gardenRepository.findGardenEntityById(existingEntity.gardenId ?: throw IllegalStateException("Canvas object has no gardenId"))
            ?: throw IllegalArgumentException("Garden not found")

        if (gardenEntity.userId != currentUserId) {
            log.warn("User {} attempted to update canvas object {} not belonging to them (garden user {})", currentUserId, id, gardenEntity.userId)
            throw IllegalAccessException("You don't have permission to update this object")
        }

        // Update the entity properties
        existingEntity.x = x ?: existingEntity.x
        existingEntity.y = y ?: existingEntity.y
        existingEntity.width = if (width != null) width else existingEntity.width
        existingEntity.height = if (height != null) height else existingEntity.height
        existingEntity.points = points ?: existingEntity.points
        existingEntity.fillColor = fillColor ?: existingEntity.fillColor
        existingEntity.strokeColor = strokeColor ?: existingEntity.strokeColor
        existingEntity.strokeWidth = strokeWidth ?: existingEntity.strokeWidth
        existingEntity.opacity = opacity ?: existingEntity.opacity
        existingEntity.dash = dash ?: existingEntity.dash
        existingEntity.text = text ?: existingEntity.text
        existingEntity.fontSize = fontSize ?: existingEntity.fontSize
        existingEntity.fontFamily = fontFamily ?: existingEntity.fontFamily
        existingEntity.rotation = rotation ?: existingEntity.rotation
        existingEntity.zIndex = zIndex ?: existingEntity.zIndex
        existingEntity.locked = locked ?: existingEntity.locked
        existingEntity.layerId = layerId ?: existingEntity.layerId

        log.trace("Entity after merge: {}", existingEntity)

        val savedEntity = canvasObjectRepository.save(existingEntity)
        log.debug("Updated CanvasObject id={} persisted successfully", savedEntity.id)
        return mapCanvasObjectEntityToDomain(savedEntity)
    }

    fun deleteCanvasObject(id: Long) {
        val currentUserId = securityUtils.getCurrentUserId()
        val existingEntity = canvasObjectRepository.findById(id).orElseThrow {
            IllegalArgumentException("Canvas object with id $id not found")
        }

        // Security check via garden
        val gardenEntity = gardenRepository.findGardenEntityById(existingEntity.gardenId ?: throw IllegalStateException("Canvas object has no gardenId"))
            ?: throw IllegalArgumentException("Garden not found")

        if (gardenEntity.userId != currentUserId) {
            throw IllegalAccessException("You don't have permission to delete this object")
        }

        canvasObjectRepository.deleteById(id)
    }

    fun batchCreateCanvasObjects(objects: List<CanvasObject>): List<CanvasObject> {
        val currentUserId = securityUtils.getCurrentUserId()

        // Validate all gardens belong to user
        val gardenIds = objects.map { it.gardenId }.distinct()
        gardenIds.forEach { gardenId ->
            val gardenEntity = gardenRepository.findGardenEntityById(gardenId)
                ?: throw IllegalArgumentException("Garden with id $gardenId not found")

            if (gardenEntity.userId != currentUserId) {
                throw IllegalAccessException("You don't have permission to add objects to garden $gardenId")
            }
        }

        val entities = objects.map { mapCanvasObjectToEntity(it) }
        val savedEntities = canvasObjectRepository.saveAll(entities)
        return savedEntities.map { mapCanvasObjectEntityToDomain(it) }
    }
}
