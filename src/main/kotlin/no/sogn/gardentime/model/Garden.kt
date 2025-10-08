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
    val growAreas: MutableList<GrowArea> = mutableListOf(),
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
    @JoinColumn(name = "gardenId") // Define the foreign key column in GrowAreaEntity
    val growAreas: MutableList<GrowAreaEntity> = mutableListOf(),
    val userId: UUID? = null,
) {
    constructor() : this(null, "", mutableListOf(), null) {

    }

}

fun mapToGardenEntity(garden: Garden): GardenEntity {
    return GardenEntity(garden.id, garden.name, garden.growAreas.map { mapGrowAreaToEntity(it) }.toMutableList(), garden.userId)
}

fun mapToGarden(gardenEntity: GardenEntity, cropRecords: MutableList<CropRecordEntity>): Garden {
    return Garden(gardenEntity.id, gardenEntity.name, gardenEntity.growAreas.map {
        mapGrowAreaEntityToDomain(it, cropRecords) }.toMutableList(), gardenEntity.userId)
}