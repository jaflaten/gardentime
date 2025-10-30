package no.sogn.plantdata.model

import jakarta.persistence.*
import java.io.Serializable
import java.util.*

@Entity
@Table(name = "plant_attribute_edible_parts")
@IdClass(PlantAttributeEdiblePartId::class)
data class PlantAttributeEdiblePart(
    @Id
    @Column(name = "plant_id")
    val plantId: UUID,
    
    @Id
    @Column(name = "edible_part")
    val ediblePart: String
)

data class PlantAttributeEdiblePartId(
    val plantId: UUID = UUID.randomUUID(),
    val ediblePart: String = ""
) : Serializable
