package no.sogn.gardentime.model

import jakarta.persistence.CascadeType
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.OneToMany
import java.util.*

data class Garden(
    val id: UUID? = null,
    val name: String,
    val growZones: MutableList<GrowZone> = mutableListOf(),
    val userId: UUID? = null,
) {


}

data class GardenInfo (
    val id: UUID,
    val name: String
)

@Entity
class GardenEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,
    val name: String,
    @OneToMany(cascade = [CascadeType.ALL], orphanRemoval = true)
    @JoinColumn(name = "gardenId") // Define the foreign key column in GrowZoneEntity
    val growZones: MutableList<GrowZoneEntity> = mutableListOf(),
    val userId: UUID? = null,
) {
    constructor() : this(null, "", mutableListOf(), null) {

    }

}

fun mapToGardenEntity(garden: Garden): GardenEntity {
    return GardenEntity(garden.id, garden.name, garden.growZones.map { mapGrowZoneToEntity(it) }.toMutableList(), garden.userId)
}

fun mapToGarden(gardenEntity: GardenEntity, cropRecords: MutableList<CropRecordEntity>): Garden {
    return Garden(gardenEntity.id, gardenEntity.name, gardenEntity.growZones.map {
        mapGrowZoneEntityToDomain(it, cropRecords) }.toMutableList(), gardenEntity.userId)
}