package no.sogn.gardentime.model

import jakarta.persistence.*
import java.time.LocalDate
import java.util.*

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

fun mapCropRecordToEntity(cropRecord: CropRecord): CropRecordEntity {
    return CropRecordEntity(
        id = cropRecord.id,
        name = cropRecord.name,
        description = cropRecord.description,
        plantingDate = cropRecord.plantingDate,
        harvestDate = cropRecord.harvestDate,
        plant = mapPlantToEntity(cropRecord.plant),
        status = cropRecord.status,
        growZoneId = cropRecord.growZoneId,
        outcome = cropRecord.outcome,
        notes = cropRecord.notes
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