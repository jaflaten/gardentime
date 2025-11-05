-- Database Index Optimization Recommendations for GardenTime
-- Generated: 2025-11-05

-- ============================================================================
-- ANALYSIS OF CURRENT INDEXES
-- ============================================================================

-- Current coverage is good with 57 indexes already created:
-- ✓ Primary keys on all tables
-- ✓ Foreign key indexes on plant_id, companion_id
-- ✓ Unique constraints on slug, name fields
-- ✓ Garden/user relationship indexes
-- ✓ Date-based indexes for seasonal planning
-- ✓ Rotation cache indexes

-- ============================================================================
-- RECOMMENDED NEW INDEXES FOR PERFORMANCE
-- ============================================================================

-- 1. CROP RECORD QUERIES (historical data for rotation planning)
-- Most common: "What was planted in this grow area in previous years?"
CREATE INDEX IF NOT EXISTS idx_crop_record_grow_zone_date 
ON crop_record_entity (grow_zone_id, planting_date DESC);

CREATE INDEX IF NOT EXISTS idx_crop_record_plant_date 
ON crop_record_entity (plant_id, planting_date DESC);

-- For rotation history view optimization
CREATE INDEX IF NOT EXISTS idx_crop_record_family_lookup
ON crop_record_entity (family_id, grow_zone_id, planting_date DESC)
WHERE family_id IS NOT NULL;

-- 2. PLANT SEARCH & FILTERING
-- Common: Search plants by family, feeder type, sun needs (for rotation recommendations)
CREATE INDEX IF NOT EXISTS idx_plant_entity_family_feeder 
ON plant_entity (family_id, feeder_type)
WHERE family_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_plant_entity_sun_water 
ON plant_entity (sun_needs, water_needs);

CREATE INDEX IF NOT EXISTS idx_plant_entity_cycle_family
ON plant_entity (cycle, family_id)
WHERE family_id IS NOT NULL;

-- Text search on plant names (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_plant_entity_name_lower
ON plant_entity (LOWER(name));

CREATE INDEX IF NOT EXISTS idx_plant_entity_scientific_name_lower
ON plant_entity (LOWER(scientific_name))
WHERE scientific_name IS NOT NULL;

-- 3. COMPANION PLANTING LOOKUPS
-- Common: "Find all companions for a plant" (already has plant_id index)
-- Common: "Check relationship between two plants"
CREATE INDEX IF NOT EXISTS idx_plant_companions_both_plants
ON plant_companions (plant_id, companion_id, relationship);

-- Reverse lookup optimization
CREATE INDEX IF NOT EXISTS idx_plant_companions_companion_plant
ON plant_companions (companion_id, plant_id, relationship);

-- Find beneficial companions quickly
CREATE INDEX IF NOT EXISTS idx_plant_companions_beneficial
ON plant_companions (plant_id, relationship)
WHERE relationship = 'BENEFICIAL';

CREATE INDEX IF NOT EXISTS idx_plant_companions_unfavorable
ON plant_companions (plant_id, relationship)
WHERE relationship = 'UNFAVORABLE';

-- 4. PEST & DISEASE LOOKUPS
-- Already has plant_id indexes, but add composite for severity filtering
CREATE INDEX IF NOT EXISTS idx_plant_pests_severity
ON plant_pests (plant_id, pest_id)
WHERE severity IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_plant_diseases_severity
ON plant_diseases (plant_id, disease_id)
WHERE severity IS NOT NULL;

-- Reverse lookup: "Which plants are affected by this pest/disease?"
CREATE INDEX IF NOT EXISTS idx_plant_pests_reverse
ON plant_pests (pest_id, plant_id);

CREATE INDEX IF NOT EXISTS idx_plant_diseases_reverse
ON plant_diseases (disease_id, plant_id);

-- 5. SEASONAL PLANNING QUERIES
-- Already has good indexes, add grow_area_id for zone-specific queries
CREATE INDEX IF NOT EXISTS idx_planned_crops_grow_area
ON planned_crops (grow_area_id, season_plan_id)
WHERE grow_area_id IS NOT NULL;

-- Composite for filtering by plant and status
CREATE INDEX IF NOT EXISTS idx_planned_crops_plant_status
ON planned_crops (plant_id, status, season_plan_id);

-- 6. GROW AREA QUERIES
-- For finding areas by garden
CREATE INDEX IF NOT EXISTS idx_grow_area_garden
ON grow_area_entity (garden_id);

-- 7. ROTATION HISTORY ANALYSIS
-- For queries like "What families were planted in this area?"
-- Note: This is for the rotation_history VIEW queries
CREATE INDEX IF NOT EXISTS idx_crop_record_zone_year
ON crop_record_entity (grow_zone_id, EXTRACT(YEAR FROM planting_date))
WHERE planting_date IS NOT NULL;

-- ============================================================================
-- PARTIAL INDEXES FOR COMMON FILTERS
-- ============================================================================

-- Plants that are container-suitable
CREATE INDEX IF NOT EXISTS idx_plant_entity_container
ON plant_entity (id)
WHERE container_suitable = true;

-- Frost-tolerant plants (for early/late season planning)
CREATE INDEX IF NOT EXISTS idx_plant_entity_frost_tolerant
ON plant_entity (id, family_id)
WHERE frost_tolerant = true;

-- Nitrogen fixers (for rotation benefits)
-- Already exists: idx_plant_entity_nitrogen_fixer

-- Heavy feeders (need good rotation)
CREATE INDEX IF NOT EXISTS idx_plant_entity_heavy_feeders
ON plant_entity (id, family_id)
WHERE feeder_type = 'HEAVY';

-- ============================================================================
-- COMPOSITE INDEXES FOR ROTATION RECOMMENDATIONS
-- ============================================================================

-- For scoring rotation compatibility
CREATE INDEX IF NOT EXISTS idx_plant_entity_rotation_factors
ON plant_entity (family_id, feeder_type, is_nitrogen_fixer, root_depth)
WHERE family_id IS NOT NULL;

-- ============================================================================
-- INDEXES FOR API PERFORMANCE
-- ============================================================================

-- Plant details with family (common join)
-- Note: PostgreSQL will use covering index if we include commonly selected columns
CREATE INDEX IF NOT EXISTS idx_plant_entity_api_lookup
ON plant_entity (slug, id, name, family_id, cycle, sun_needs, water_needs);

-- ============================================================================
-- ANALYZE AFTER INDEX CREATION
-- ============================================================================

-- After creating indexes, update table statistics
-- Run: ANALYZE plant_entity;
-- Run: ANALYZE crop_record_entity;
-- Run: ANALYZE plant_companions;
-- Run: ANALYZE plant_pests;
-- Run: ANALYZE plant_diseases;

-- ============================================================================
-- MONITORING QUERY PERFORMANCE
-- ============================================================================

-- Enable query logging to identify slow queries:
-- ALTER DATABASE gardentime SET log_min_duration_statement = 100; -- log queries > 100ms

-- Check index usage statistics:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- Find unused indexes:
-- SELECT schemaname, tablename, indexname, idx_scan
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public' AND idx_scan = 0
-- ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- EXECUTION PLAN
-- ============================================================================

/*
Priority 1 (High Impact - Core Features):
1. idx_crop_record_grow_zone_date - Rotation history queries
2. idx_plant_companions_both_plants - Companion lookups
3. idx_plant_entity_family_feeder - Rotation recommendations
4. idx_plant_entity_name_lower - Plant search

Priority 2 (Medium Impact - Enhanced Features):
5. idx_plant_pests_reverse - Pest management
6. idx_plant_diseases_reverse - Disease tracking
7. idx_plant_entity_rotation_factors - Rotation scoring
8. idx_planned_crops_grow_area - Seasonal planning

Priority 3 (Low Impact - Optimization):
9. Partial indexes for filters
10. Additional composite indexes
*/

-- ============================================================================
-- NOTES
-- ============================================================================

/*
- Current database is small (76 plants, ~1500 relationships)
- Indexes have overhead on INSERT/UPDATE but improve SELECT
- With current size, many indexes may not show benefit yet
- Monitor query performance and add indexes as needed
- Consider EXPLAIN ANALYZE on slow queries before adding indexes

Current table sizes:
- plant_companions: 881 rows (400 KB)
- plant_pests: 437 rows (96 KB)
- plant_diseases: 406 rows (96 KB)
- plant_entity: 76 rows (160 KB)

Recommendation: Create Priority 1 indexes now, monitor performance, 
add Priority 2-3 as database grows and specific slow queries are identified.
*/
