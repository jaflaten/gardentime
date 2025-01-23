package no.sogn.gardentime.service

import no.sogn.gardentime.db.CropRecordRepository
import no.sogn.gardentime.db.GardenRepository
import no.sogn.gardentime.db.GrowZoneRepository
import no.sogn.gardentime.exceptions.GardenIdNotFoundException
import no.sogn.gardentime.exceptions.GrowZoneIdNotFoundException
import no.sogn.gardentime.model.CropRecordEntity
import no.sogn.gardentime.model.GrowZone
import no.sogn.gardentime.model.mapGrowZoneEntityToDomain
import no.sogn.gardentime.model.mapGrowZoneToEntity
import org.springframework.stereotype.Service
import java.util.*

@Service
class GrowZoneService(
    private val growZoneRepository: GrowZoneRepository,
    private val gardenRepository: GardenRepository,
    private val cropRecordRepository: CropRecordRepository,
) {

    fun addGrowZone(name: String, gardenId: UUID): GrowZone {
        val gardenEntity = gardenRepository.findGardenEntityById(gardenId)
            ?: throw IllegalArgumentException("Garden with id $gardenId not found")

        val growZoneEntity = growZoneRepository.save(mapGrowZoneToEntity(GrowZone(name = name, gardenId = gardenId)))
        gardenEntity.growZones.add(growZoneEntity)
        gardenRepository.save(gardenEntity)

        return mapGrowZoneEntityToDomain(growZoneEntity, cropRecords = mutableListOf())
    }

    fun deleteGrowZone(id: Long) {

        val growZoneEntity = growZoneRepository.findById(id)
            .orElseThrow { GrowZoneIdNotFoundException("GrowZone with id $id not found") }

        val gardenEntity = gardenRepository.findGardenEntityById(growZoneEntity.gardenId)
            ?: throw GardenIdNotFoundException("Garden with id ${growZoneEntity.gardenId} not found")
        gardenEntity.growZones.remove(growZoneEntity)
        gardenRepository.save(gardenEntity)
        growZoneRepository.deleteById(id)
    }

    fun getCropRecordsForGarden(id: UUID): MutableList<CropRecordEntity> {
        val garden = (gardenRepository.findGardenEntityById(id)
            ?: throw GardenIdNotFoundException("Garden with id $id not found"))

        var cropRecords = mutableListOf<CropRecordEntity>()
        garden.growZones.map { it.id }.forEach { growZoneId ->
            requireNotNull(growZoneId)
            cropRecords = cropRecordRepository.findAllByGrowZoneId(growZoneId).toMutableList()
        }
        return cropRecords
    }

    fun getGrowZoneById(id: Long): GrowZone? {
        val cropRecordsForThisGrowZone = cropRecordRepository.findAllByGrowZoneId(id)
        return growZoneRepository.findById(id).map { mapGrowZoneEntityToDomain(it, cropRecordsForThisGrowZone) }.orElse(null)
    }

}