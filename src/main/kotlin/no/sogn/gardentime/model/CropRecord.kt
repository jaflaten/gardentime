package no.sogn.gardentime.model

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import java.time.LocalDate
import java.util.UUID

data class CropRecord(
    val id: UUID,
    val name: String,
    val description: String,
    val plantingDate: LocalDate,
    val harvestDate: LocalDate?,
    val plant: Plant,
    val status: String,
    val growZone: GrowZone,
    val outcome: String?,
    val notes: String? = null,

    )

@Entity
class CropRecordEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,
    val name: String,
    val description: String,
    val plantingDate: LocalDate,
    val harvestDate: LocalDate?,
    @ManyToOne
    @JoinColumn(name = "plant_id", nullable = false)
    val plant: PlantEntity,
    val status: String?,
    @ManyToOne
    @JoinColumn(name = "grow_zone_id", nullable = false)
    val growZone: GrowZoneEntity,
    val outcome: String? = null,
    val notes: String? = null,
) {
    constructor() : this(null, "", "", LocalDate.now(), null, PlantEntity(), "", GrowZoneEntity(), "", "") {

    }
}

fun mapCropRecordToEntity(cropRecord: CropRecord): CropRecordEntity {
    return CropRecordEntity(
        cropRecord.id,
        cropRecord.name,
        cropRecord.description,
        cropRecord.plantingDate,
        cropRecord.harvestDate,
        mapPlantToEntity(cropRecord.plant),
        cropRecord.status,
        mapToGrowZoneEntity(cropRecord.growZone),
        cropRecord.outcome,
        cropRecord.notes
    )
}

fun mapCropRecord(cropRecordEntity: CropRecordEntity): CropRecord {
    return CropRecord(
        cropRecordEntity.id!!,
        cropRecordEntity.name,
        cropRecordEntity.description,
        cropRecordEntity.plantingDate,
        cropRecordEntity.harvestDate,
        mapPlantToDomain(cropRecordEntity.plant),
        cropRecordEntity.status!!,
        mapToGrowZone(cropRecordEntity.growZone),
        cropRecordEntity.outcome,
        cropRecordEntity.notes
    )
}
