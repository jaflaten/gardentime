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
    val growZones: MutableList<GrowZone> = mutableListOf()
) {


}

@Entity
class GardenEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,
    val name: String,
//    @OneToMany(mappedBy = "garden", cascade = [CascadeType.ALL], orphanRemoval = true)
//    val growZones: MutableList<GrowZoneEntity> = mutableListOf()
    @OneToMany(cascade = [CascadeType.ALL], orphanRemoval = true)
    @JoinColumn(name = "garden_id") // Define the foreign key column in GrowZoneEntity
    val growZones: MutableList<GrowZoneEntity> = mutableListOf()
) {
    constructor() : this(UUID.randomUUID(), "", mutableListOf()) {

    }

}

fun mapToGardenEntity(garden: Garden): GardenEntity {
    return GardenEntity(garden.id, garden.name, garden.growZones.map { mapToGrowZoneEntity(it) }.toMutableList())
}

fun mapToGarden(gardenEntity: GardenEntity): Garden {
    return Garden(gardenEntity.id, gardenEntity.name, gardenEntity.growZones.map { mapToGrowZone(it) }.toMutableList())
}