package no.sogn.gardentime.model

import jakarta.persistence.*
import java.time.LocalDate
import java.util.*

// DTO for API responses - maps to frontend expectations
data class CropRecordDTO(
    val id: UUID?,
    val growAreaId: Long,
    val plantId: Long,
    val plantName: String,
    val datePlanted: String,  // ISO date string
    val dateHarvested: String? = null,  // ISO date string
    val notes: String? = null,
    val outcome: String? = null,
    val status: CropStatus? = null,
    val quantityHarvested: Double? = null,
    val unit: String? = null
)

data class CropRecord(
    val id: UUID ? = null,
    val name: String? = null,
    val description: String? = null,
    val plantingDate: LocalDate,
    val harvestDate: LocalDate? = null,
    val plant: Plant,
    val status: CropStatus? = null,
    val growZoneId: Long,
    val outcome: String? = null,
    val notes: String? = null,

    )

@Entity
class CropRecordEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,
    val name: String? = null,
    val description: String? = null,
    val plantingDate: LocalDate,
    val harvestDate: LocalDate? = null,
    @ManyToOne
    @JoinColumn(name = "plant_id", nullable = false)
    val plant: PlantEntity,
    @Convert(converter = CropStatusConverter::class)
    val status: CropStatus? = null,
    val growZoneId: Long,
    val outcome: String? = null,
    val notes: String? = null,
) {
    constructor() : this(null, "", "", LocalDate.now(), null, PlantEntity(), CropStatus.UNKNOWN, 0, "", "") {

    }
}

enum class CropStatus {
    PLANTED,
    GROWING,
    HARVESTED,
    DISEASED,
    FAILED,
    UNKNOWN
}

fun mapCropRecordEntityToDomain(cropRecordEntity: CropRecordEntity): CropRecord {
    return CropRecord(
        id = cropRecordEntity.id,
        name = cropRecordEntity.name,
        description = cropRecordEntity.description,
        plantingDate = cropRecordEntity.plantingDate,
        harvestDate = cropRecordEntity.harvestDate,
        plant = mapPlantToDomain(cropRecordEntity.plant),
        status = cropRecordEntity.status,
        growZoneId = cropRecordEntity.growZoneId,
        outcome = cropRecordEntity.outcome,
        notes = cropRecordEntity.notes
    )
}

fun mapCropRecordToDTO(cropRecord: CropRecord): CropRecordDTO {
    return CropRecordDTO(
        id = cropRecord.id,
        growAreaId = cropRecord.growZoneId,
        plantId = cropRecord.plant.id ?: 0L,
        plantName = cropRecord.plant.name,
        datePlanted = cropRecord.plantingDate.toString(),
        dateHarvested = cropRecord.harvestDate?.toString(),
        notes = cropRecord.notes,
        outcome = cropRecord.outcome,
        status = cropRecord.status
    )
}

fun mapCropRecordEntityToDTO(cropRecordEntity: CropRecordEntity): CropRecordDTO {
    return CropRecordDTO(
        id = cropRecordEntity.id,
        growAreaId = cropRecordEntity.growZoneId,
        plantId = cropRecordEntity.plant.id ?: 0L,
        plantName = cropRecordEntity.plant.name,
        datePlanted = cropRecordEntity.plantingDate.toString(),
        dateHarvested = cropRecordEntity.harvestDate?.toString(),
        notes = cropRecordEntity.notes,
        outcome = cropRecordEntity.outcome,
        status = cropRecordEntity.status
    )
}

@Converter(autoApply = true)
class CropStatusConverter : AttributeConverter<CropStatus, String> {

    override fun convertToDatabaseColumn(attribute: CropStatus?): String? {
        return attribute?.name
    }

    override fun convertToEntityAttribute(dbData: String?): CropStatus? {
        return dbData?.let { CropStatus.valueOf(it) }
    }
}