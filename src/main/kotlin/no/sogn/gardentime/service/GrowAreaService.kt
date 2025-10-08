package no.sogn.gardentime.service

import no.sogn.gardentime.db.CropRecordRepository
import no.sogn.gardentime.db.GardenRepository
import no.sogn.gardentime.db.GrowAreaRepository
import no.sogn.gardentime.exceptions.GardenIdNotFoundException
import no.sogn.gardentime.exceptions.GrowAreaIdNotFoundException
import no.sogn.gardentime.model.CropRecordEntity
import no.sogn.gardentime.model.GrowArea
import no.sogn.gardentime.model.GrowAreaEntity
import no.sogn.gardentime.model.ZoneType
import no.sogn.gardentime.model.mapGrowAreaEntityToDomain
import no.sogn.gardentime.model.mapGrowAreaToEntity
import no.sogn.gardentime.security.SecurityUtils
import org.springframework.stereotype.Service
import java.util.*

@Service
class GrowAreaService(
    private val growAreaRepository: GrowAreaRepository,
    private val gardenRepository: GardenRepository,
    private val cropRecordRepository: CropRecordRepository,
    private val securityUtils: SecurityUtils,
) {

    fun addGrowArea(
        name: String,
        gardenId: UUID,
        zoneSize: String? = null,
        zoneType: ZoneType? = null,
        nrOfRows: Int? = null,
        notes: String? = null
    ): GrowArea {
        val currentUserId = securityUtils.getCurrentUserId()
        val gardenEntity = gardenRepository.findGardenEntityById(gardenId)
            ?: throw IllegalArgumentException("Garden with id $gardenId not found")

        // Security check: ensure the garden belongs to the current user
        if (gardenEntity.userId != currentUserId) {
            throw IllegalAccessException("You don't have permission to add grow areas to this garden")
        }

        val growArea = GrowArea(
            name = name,
            gardenId = gardenId,
            zoneSize = zoneSize,
            zoneType = zoneType,
            nrOfRows = nrOfRows,
            notes = notes
        )
        val growAreaEntity = growAreaRepository.save(mapGrowAreaToEntity(growArea))

        return mapGrowAreaEntityToDomain(growAreaEntity, cropRecords = mutableListOf())
    }

    fun updateGrowArea(
        id: Long,
        name: String? = null,
        zoneSize: String? = null,
        zoneType: ZoneType? = null,
        nrOfRows: Int? = null,
        notes: String? = null
    ): GrowArea {
        val currentUserId = securityUtils.getCurrentUserId()
        val growAreaEntity = growAreaRepository.findById(id)
            .orElseThrow { GrowAreaIdNotFoundException("GrowArea with id $id not found") }

        val gardenEntity = gardenRepository.findGardenEntityById(growAreaEntity.gardenId)
            ?: throw GardenIdNotFoundException("Garden with id ${growAreaEntity.gardenId} not found")

        // Security check: ensure the garden belongs to the current user
        if (gardenEntity.userId != currentUserId) {
            throw IllegalAccessException("You don't have permission to update this grow area")
        }

        // Create updated entity with new values (only update if provided)
        val updatedEntity = GrowAreaEntity(
            id = growAreaEntity.id,
            name = name ?: growAreaEntity.name,
            zoneSize = zoneSize ?: growAreaEntity.zoneSize,
            gardenId = growAreaEntity.gardenId,
            zoneType = zoneType ?: growAreaEntity.zoneType,
            nrOfRows = nrOfRows ?: growAreaEntity.nrOfRows,
            notes = notes ?: growAreaEntity.notes
        )

        val savedEntity = growAreaRepository.save(updatedEntity)
        val cropRecords = cropRecordRepository.findAllByGrowZoneId(id)
        return mapGrowAreaEntityToDomain(savedEntity, cropRecords)
    }

    fun deleteGrowArea(id: Long) {
        val currentUserId = securityUtils.getCurrentUserId()
        val growAreaEntity = growAreaRepository.findById(id)
            .orElseThrow { GrowAreaIdNotFoundException("GrowArea with id $id not found") }

        val gardenEntity = gardenRepository.findGardenEntityById(growAreaEntity.gardenId)
            ?: throw GardenIdNotFoundException("Garden with id ${growAreaEntity.gardenId} not found")

        // Security check: ensure the garden belongs to the current user
        if (gardenEntity.userId != currentUserId) {
            throw IllegalAccessException("You don't have permission to delete this grow area")
        }

        // Simply delete the grow area - no need to manage the garden's collection
        growAreaRepository.deleteById(id)
    }

    fun getCropRecordsForGarden(id: UUID): MutableList<CropRecordEntity> {
        val garden = (gardenRepository.findGardenEntityById(id)
            ?: throw GardenIdNotFoundException("Garden with id $id not found"))

        var cropRecords = mutableListOf<CropRecordEntity>()
        garden.growAreas.map { it.id }.forEach { growAreaId ->
            requireNotNull(growAreaId)
            cropRecords = cropRecordRepository.findAllByGrowZoneId(growAreaId).toMutableList()
        }
        return cropRecords
    }

    fun getGrowAreaById(id: Long): GrowArea? {
        val currentUserId = securityUtils.getCurrentUserId()
        val growAreaEntity = growAreaRepository.findById(id).orElse(null) ?: return null

        val gardenEntity = gardenRepository.findGardenEntityById(growAreaEntity.gardenId)
            ?: throw GardenIdNotFoundException("Garden with id ${growAreaEntity.gardenId} not found")

        // Security check: ensure the garden belongs to the current user
        if (gardenEntity.userId != currentUserId) {
            throw IllegalAccessException("You don't have permission to access this grow area")
        }

        val cropRecordsForThisGrowArea = cropRecordRepository.findAllByGrowZoneId(id)
        return mapGrowAreaEntityToDomain(growAreaEntity, cropRecordsForThisGrowArea)
    }

    fun getGrowAreasByGardenId(gardenId: UUID): List<GrowArea> {
        val currentUserId = securityUtils.getCurrentUserId()
        val gardenEntity = gardenRepository.findGardenEntityById(gardenId)
            ?: throw GardenIdNotFoundException("Garden with id $gardenId not found")

        // Security check: ensure the garden belongs to the current user
        if (gardenEntity.userId != currentUserId) {
            throw IllegalAccessException("You don't have permission to access this garden's grow areas")
        }

        return gardenEntity.growAreas.map { growAreaEntity ->
            val cropRecords = cropRecordRepository.findAllByGrowZoneId(growAreaEntity.id!!)
            mapGrowAreaEntityToDomain(growAreaEntity, cropRecords)
        }
    }

}