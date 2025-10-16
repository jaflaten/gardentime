package no.sogn.plantdata.repository

import no.sogn.plantdata.enums.RelationshipType
import no.sogn.plantdata.model.CompanionRelationship
import no.sogn.plantdata.model.Plant
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface CompanionRelationshipRepository : JpaRepository<CompanionRelationship, UUID> {
    fun findByPlantAAndRelationshipTypeAndVerifiedIsTrue(plantA: Plant, relationshipType: RelationshipType): List<CompanionRelationship>
}

