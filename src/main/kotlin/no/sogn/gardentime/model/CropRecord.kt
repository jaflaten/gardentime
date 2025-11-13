package no.sogn.gardentime.model

import jakarta.persistence.*
import java.time.LocalDate
import java.util.*

// DTO for API responses - maps to frontend expectations
data class CropRecordDTO(
    val id: UUID?,
    val growAreaId: Long,
    val plantId: String,  // UUID string from plant-data-aggregator
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
    val plantId: String,  // UUID string from plant-data-aggregator
    val plantName: String,
    val status: CropStatus? = null,
    val growZoneId: Long,
    val outcome: String? = null,
    val notes: String? = null,
    
    // Rotation planning fields (cached from plant-data-aggregator)
    val plantFamily: String? = null,
    val plantGenus: String? = null,
    val feederType: String? = null,
    val isNitrogenFixer: Boolean = false,
    val rootDepth: String? = null,
    
    // Disease tracking
    val hadDiseases: Boolean = false,
    val diseaseNames: String? = null,
    val diseaseNotes: String? = null,
    
    // Yield tracking
    val yieldRating: Int? = null,
    val soilQualityAfter: Int? = null
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
    @Column(name = "plant_id", nullable = false)
    val plantId: String,  // UUID string from plant-data-aggregator
    @Column(name = "plant_name", nullable = false)
    val plantName: String,
    @Convert(converter = CropStatusConverter::class)
    val status: CropStatus? = null,
    val growZoneId: Long,
    val outcome: String? = null,
    val notes: String? = null,
    
    // Rotation planning fields (cached from plant-data-aggregator)
    @Column(name = "plant_family")
    val plantFamily: String? = null,
    @Column(name = "plant_genus")
    val plantGenus: String? = null,
    @Column(name = "feeder_type")
    val feederType: String? = null,
    @Column(name = "is_nitrogen_fixer")
    val isNitrogenFixer: Boolean = false,
    @Column(name = "root_depth")
    val rootDepth: String? = null,
    
    // Disease tracking
    @Column(name = "had_diseases")
    val hadDiseases: Boolean = false,
    @Column(name = "disease_names")
    val diseaseNames: String? = null,
    @Column(name = "disease_notes")
    val diseaseNotes: String? = null,
    
    // Yield tracking
    @Column(name = "yield_rating")
    val yieldRating: Int? = null,
    @Column(name = "soil_quality_after")
    val soilQualityAfter: Int? = null
) {
    constructor() : this(
        null, "", "", LocalDate.now(), null, "", "", CropStatus.UNKNOWN, 0, "", "",
        null, null, null, false, null, false, null, null, null, null
    )
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
        plantId = cropRecordEntity.plantId,
        plantName = cropRecordEntity.plantName,
        status = cropRecordEntity.status,
        growZoneId = cropRecordEntity.growZoneId,
        outcome = cropRecordEntity.outcome,
        notes = cropRecordEntity.notes,
        plantFamily = cropRecordEntity.plantFamily,
        plantGenus = cropRecordEntity.plantGenus,
        feederType = cropRecordEntity.feederType,
        isNitrogenFixer = cropRecordEntity.isNitrogenFixer,
        rootDepth = cropRecordEntity.rootDepth,
        hadDiseases = cropRecordEntity.hadDiseases,
        diseaseNames = cropRecordEntity.diseaseNames,
        diseaseNotes = cropRecordEntity.diseaseNotes,
        yieldRating = cropRecordEntity.yieldRating,
        soilQualityAfter = cropRecordEntity.soilQualityAfter
    )
}

fun mapCropRecordToDTO(cropRecord: CropRecord): CropRecordDTO {
    return CropRecordDTO(
        id = cropRecord.id,
        growAreaId = cropRecord.growZoneId,
        plantId = cropRecord.plantId,
        plantName = cropRecord.plantName,
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
        plantId = cropRecordEntity.plantId,
        plantName = cropRecordEntity.plantName,
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