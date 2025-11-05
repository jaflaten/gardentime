package no.sogn.gardentime.db

import no.sogn.gardentime.model.CompanionRelationship
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

@Repository
@Transactional
interface PlantCompanionRepository : CrudRepository<no.sogn.gardentime.model.PlantCompanion, Long> {
    
    /**
     * Find all companions for a specific plant with custom projection
     */
    @Query("""
        SELECT pc.id as id, 
               c.id as companionId, 
               c.name as companionName, 
               c.slug as companionSlug,
               pc.relationship as relationship, 
               pc.reason as reason
        FROM PlantCompanion pc
        JOIN pc.companion c
        WHERE pc.plant.id = :plantId
    """)
    fun findCompanionsByPlantId(@Param("plantId") plantId: Long): List<CompanionProjection>
    
    /**
     * Find companions by relationship type
     */
    @Query("""
        SELECT pc.id as id, 
               c.id as companionId, 
               c.name as companionName, 
               c.slug as companionSlug,
               pc.relationship as relationship, 
               pc.reason as reason
        FROM PlantCompanion pc
        JOIN pc.companion c
        WHERE pc.plant.id = :plantId 
          AND pc.relationship = :relationship
    """)
    fun findCompanionsByPlantIdAndRelationship(
        @Param("plantId") plantId: Long, 
        @Param("relationship") relationship: CompanionRelationship
    ): List<CompanionProjection>
    
    /**
     * Count companions by relationship for a plant
     */
    @Query("SELECT COUNT(pc) FROM PlantCompanion pc WHERE pc.plant.id = :plantId AND pc.relationship = :relationship")
    fun countByPlantIdAndRelationship(
        @Param("plantId") plantId: Long, 
        @Param("relationship") relationship: CompanionRelationship
    ): Int
    
    /**
     * Find relationship between two plants (bidirectional)
     */
    @Query("""
        SELECT pc FROM PlantCompanion pc 
        WHERE (pc.plant.id = :plant1Id AND pc.companion.id = :plant2Id)
           OR (pc.plant.id = :plant2Id AND pc.companion.id = :plant1Id)
    """)
    fun findRelationshipBetween(
        @Param("plant1Id") plant1Id: Long, 
        @Param("plant2Id") plant2Id: Long
    ): List<no.sogn.gardentime.model.PlantCompanion>
}

/**
 * Projection for companion data to avoid lazy loading issues
 */
interface CompanionProjection {
    fun getId(): Long
    fun getCompanionId(): Long
    fun getCompanionName(): String
    fun getCompanionSlug(): String?
    fun getRelationship(): CompanionRelationship
    fun getReason(): String?
}
