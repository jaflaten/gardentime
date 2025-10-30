package no.sogn.plantdata.repository

import no.sogn.plantdata.model.PlantAttributes
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.sql.Timestamp
import java.util.*

@Repository
class PlantAttributeJdbcRepository(
    private val jdbcTemplate: JdbcTemplate
) {
    
    @Transactional
    fun saveWithEnumCast(attributes: PlantAttributes) {
        val sql = """
            INSERT INTO plant_attributes (
                plant_id, is_nitrogen_fixer, root_depth, feeder_type, cycle,
                growth_habit, sun_needs, water_needs, ph_min, ph_max,
                toxicity_level, invasive, drought_tolerant, poisonous_to_pets,
                days_to_maturity_min, days_to_maturity_max, succession_interval_days,
                primary_nutrient_contribution, created_at, updated_at
            ) VALUES (
                ?, ?, ?::root_depth, ?::feeder_type, ?::plant_cycle,
                ?::growth_habit, ?::sun_needs, ?::water_needs, ?, ?,
                ?::toxicity_level, ?, ?, ?,
                ?, ?, ?,
                ?::primary_nutrient_contribution, ?, ?
            )
            ON CONFLICT (plant_id) DO UPDATE SET
                is_nitrogen_fixer = EXCLUDED.is_nitrogen_fixer,
                root_depth = EXCLUDED.root_depth,
                feeder_type = EXCLUDED.feeder_type,
                cycle = EXCLUDED.cycle,
                growth_habit = EXCLUDED.growth_habit,
                sun_needs = EXCLUDED.sun_needs,
                water_needs = EXCLUDED.water_needs,
                ph_min = EXCLUDED.ph_min,
                ph_max = EXCLUDED.ph_max,
                toxicity_level = EXCLUDED.toxicity_level,
                invasive = EXCLUDED.invasive,
                drought_tolerant = EXCLUDED.drought_tolerant,
                poisonous_to_pets = EXCLUDED.poisonous_to_pets,
                days_to_maturity_min = EXCLUDED.days_to_maturity_min,
                days_to_maturity_max = EXCLUDED.days_to_maturity_max,
                succession_interval_days = EXCLUDED.succession_interval_days,
                primary_nutrient_contribution = EXCLUDED.primary_nutrient_contribution,
                updated_at = EXCLUDED.updated_at
        """.trimIndent()
        
        jdbcTemplate.update(
            sql,
            attributes.plantId,
            attributes.isNitrogenFixer,
            attributes.rootDepth.name,
            attributes.feederType?.name,
            attributes.cycle?.name,
            attributes.growthHabit?.name,
            attributes.sunNeeds?.name,
            attributes.waterNeeds?.name,
            attributes.phMin,
            attributes.phMax,
            attributes.toxicityLevel?.name,
            attributes.invasive,
            attributes.droughtTolerant,
            attributes.poisonousToPets,
            attributes.daysToMaturityMin,
            attributes.daysToMaturityMax,
            attributes.successionIntervalDays,
            attributes.primaryNutrientContribution?.name,
            Timestamp.from(attributes.createdAt),
            Timestamp.from(attributes.updatedAt)
        )
    }
}
