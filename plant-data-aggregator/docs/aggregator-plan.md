# Data Aggregator Plan

Trefle: https://docs.trefle.io
Perenual: https://perenual.com/api/

## 1. Overview
The data aggregator will:
- [x] Aggregate plant data from Trefle and Perenual APIs (Trefle ✅, Perenual 🔄)
- [ ] Store merged plant data in a database
- [ ] Scrape and/or manually collect companion planting data (starting with Almanac)
- [ ] Provide admin tooling for data curation and validation
- [ ] Expose API endpoints consumed by the main application

## 2. Data Structure Considerations (Companion Relationships)
For each companion relationship we should track:
- [ ] Plant A & Plant B (species/variety references)
- [ ] Relationship type (beneficial / neutral / antagonistic)
- [ ] Confidence level (scientific study / traditional knowledge / anecdotal)
- [ ] Evidence type (scientific / traditional / anecdotal) – separated from confidence
- [ ] Reason(s) (pest control, nutrient sharing, allelopathy, space optimization, etc.)
- [ ] Source / citation (URL or bibliographic reference)
- [ ] Geographic validity / climate notes
- [ ] Directionality (is bidirectional?)
- [ ] Additional notes / mechanism
- [ ] Verification status, timestamps, reviewer
- [ ] Quality score (optional aggregation of heuristics)

## 3. Implementation Phases

### Phase 1: Project Setup ✅ COMPLETE
- [x] Create new Kotlin/Spring Boot module in monorepo (`plant-data-aggregator`)
- [x] Set up Gradle build configuration
- [x] Configure database (PostgreSQL recommended for JSON support)
- [x] Set up database migrations (Flyway or Liquibase)
- [x] Create basic project structure (controllers, services, repositories)
- [x] Configure `application.properties` / `application.yml` with API keys (use environment variables)

### Phase 2: External API Integration 🔄 IN PROGRESS
**Trefle Client:** ✅ COMPLETE
- [x] Implement authentication
- [x] Create DTOs for Trefle responses (based on actual API examples)
- [x] Implement rate limiting handling
- [x] Add caching layer (Caffeine in-memory cache)
- [x] Create TrefleService with search, list, and detail endpoints
- [x] Add TrefleController with REST endpoints
- [x] API call tracking in database
- [x] Comprehensive error handling (401, 404, 429, etc.)
- [x] Documentation (see `docs/trefle-integration.md`)

Next steps: 
1. Implement PerenualService (following the same pattern as TrefleService)
2. Build the merge service to combine data from both Trefle and Perenual
3. Add data enrichment and conflict resolution logic

**Perenual Client:** 🔄 TODO
- [ ] Implement authentication
- [ ] Create DTOs for Perenual responses (DTOs already exist)
- [ ] Implement rate limiting handling
- [ ] Add caching layer
- [ ] Create PerenualService similar to TrefleService
- [ ] Add PerenualController with REST endpoints

**Unified Data:** 🔄 TODO
- [ ] Create unified plant data model combining both sources
- [ ] Implement data fetching service that merges Trefle + Perenual data
- [ ] Define canonical matching strategy (normalized scientific name)
- [ ] Implement synonym harvesting & persistence
- [x] Add conflict logging mechanism (table + service) - models exist
- [x] Add API quota tracking mechanism (persist counters) - implemented in TrefleService

### Phase 3: Database Schema Design ✅ COMPLETE
- [x] Design `plants` table (merged data from APIs)
- [x] Design `companion_relationships` table (directionality + evidence + uniqueness)
- [x] Design `plant_attributes` table (expanded agronomic + care attributes)
- [x] Design `plant_synonyms` table
- [x] Design `plant_merge_conflicts` table
- [x] Design `sources` table
- [x] Design `api_call_tracker` table
- [ ] (Optional) `plant_region_attributes` table for zone-specific overrides
- [ ] Create indexes for performance
- [ ] Add uniqueness & check constraints

#### companion_relationships (updated proposal)
| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID (PK) | Generated |
| plant_a_id | UUID (FK plants.id) | Base / subject plant |
| plant_b_id | UUID (FK plants.id) | Companion / related plant |
| relationship_type | ENUM (BENEFICIAL, NEUTRAL, ANTAGONISTIC) | Required |
| relationship_subtype | ENUM (PEST_DETERRENT, NUTRIENT_SUPPORT, SHADE, STRUCTURAL, OTHER) | Future-ready (nullable) |
| confidence_level | ENUM (HIGH, MEDIUM, LOW) | Required |
| evidence_type | ENUM (SCIENTIFIC, TRADITIONAL, ANECDOTAL) | Required |
| reason | TEXT | Primary reason (short) |
| mechanism | TEXT | Detailed explanation (nullable) |
| source_id | UUID (FK sources.id) | Normalized source reference |
| source_url | TEXT | Raw URL if no source record (nullable) |
| geographic_scope | TEXT | Region/climate applicability |
| is_bidirectional | BOOLEAN | True if symmetric relationship |
| verified | BOOLEAN | Manual review flag |
| verified_at | TIMESTAMP | When verified |
| verified_by | UUID (FK users.id) | Reviewer (nullable) |
| quality_score | INT | 0–100 heuristic score (nullable) |
| notes | TEXT | Free-form notes |
| deprecated | BOOLEAN | Soft delete / superseded |
| created_at | TIMESTAMP | Default now() |
| updated_at | TIMESTAMP | On change |

Constraints:
- CHECK `plant_a_id <> plant_b_id`
- UNIQUE (`plant_a_id`,`plant_b_id`,`relationship_type`) with canonical ordering rule if treating as undirected when `is_bidirectional = true`

#### plant_attributes (updated proposal)
| Column | Type | Notes |
| ------ | ---- | ----- |
| plant_id | UUID (PK, FK plants.id) | 1:1 |
| is_nitrogen_fixer | BOOLEAN | Default false |
| root_depth | ENUM (SHALLOW, MEDIUM, DEEP) | Required |
| feeder_type | ENUM (HEAVY, MODERATE, LIGHT) | Nutrient demand |
| cycle | ENUM (ANNUAL, PERENNIAL, BIENNIAL) | From sources |
| growth_habit | ENUM (BUSH, VINE, CLIMBER, ROOT, LEAF, FRUITING, OTHER) | Nullable |
| sun_needs | ENUM (FULL_SUN, PART_SHADE, SHADE) | Core planning |
| water_needs | ENUM (LOW, MODERATE, HIGH, FREQUENT) | Normalized mapping |
| ph_min | NUMERIC(3,1) | Nullable |
| ph_max | NUMERIC(3,1) | Nullable |
| soil_types | TEXT[] | Array of codes |
| toxicity_level | ENUM (NONE, LOW, MODERATE, HIGH) | Nullable |
| invasive | BOOLEAN | Nullable |
| drought_tolerant | BOOLEAN | Nullable |
| edible_parts | TEXT[] | From APIs |
| poisonous_to_pets | BOOLEAN | Nullable |
| days_to_maturity_min | INT | Nullable |
| days_to_maturity_max | INT | Nullable |
| succession_interval_days | INT | Nullable |
| primary_nutrient_contribution | ENUM (NITROGEN, POTASSIUM, PHOSPHORUS, NONE) | Nullable |
| created_at | TIMESTAMP | Default now() |
| updated_at | TIMESTAMP | On change |

Constraints:
- CHECK `days_to_maturity_min IS NULL OR days_to_maturity_max IS NULL OR days_to_maturity_min <= days_to_maturity_max`
- CHECK `ph_min IS NULL OR ph_max IS NULL OR ph_min <= ph_max`

#### plant_synonyms
| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID (PK) | Generated |
| plant_id | UUID (FK plants.id) | Parent plant |
| synonym | TEXT | Normalized (lowercased) |
| source | ENUM (TREFLE, PERENUAL, MANUAL) | Origin |
| created_at | TIMESTAMP | Default now() |
| UNIQUE (plant_id, synonym) | Prevent duplicates |

#### plant_merge_conflicts
| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID (PK) | Generated |
| plant_id | UUID (FK plants.id) | Affected plant |
| field_name | TEXT | Field with conflict |
| trefle_value | TEXT | Raw value |
| perenual_value | TEXT | Raw value |
| resolved_value | TEXT | Chosen/merged value (nullable) |
| resolution_strategy | ENUM (PREFER_TREFLE, PREFER_PERENUAL, MANUAL) | Applied rule |
| created_at | TIMESTAMP | Default now() |
| updated_at | TIMESTAMP | On change |

#### sources
| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID (PK) | Generated |
| type | ENUM (WEBSITE, BOOK, JOURNAL, INTERNAL) | Source classification |
| title | TEXT | Human-readable title |
| authors | TEXT | Optional |
| url | TEXT | Nullable for non-web |
| accessed_at | TIMESTAMP | When last retrieved |
| copyright_ok | BOOLEAN | Legal status flag |
| created_at | TIMESTAMP | Default now() |

#### api_call_tracker
| Column | Type | Notes |
| ------ | ---- | ----- |
| id | SERIAL (PK) | Sequence |
| api_name | TEXT | 'TREFLE' / 'PERENUAL' |
| date | DATE | Quota day |
| calls_made | INT | Incremental count |
| last_updated | TIMESTAMP | Timestamp of update |
| UNIQUE (api_name, date) | One row per API per day |

#### (Optional) plant_region_attributes
| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID (PK) | Generated |
| plant_id | UUID (FK plants.id) | Plant |
| region_code | TEXT | e.g. USDA zone or Köppen |
| days_to_maturity_min | INT | Override |
| days_to_maturity_max | INT | Override |
| notes | TEXT | Region-specific notes |
| created_at | TIMESTAMP | Default now() |
| updated_at | TIMESTAMP | On change |
| UNIQUE (plant_id, region_code) | Prevent duplicates |

#### Index & Performance Ideas (updated)
- [ ] `CREATE INDEX idx_companion_a_type_verified ON companion_relationships(plant_a_id, relationship_type, verified);`
- [ ] `CREATE INDEX idx_companion_b_type ON companion_relationships(plant_b_id, relationship_type);`
- [ ] Partial index for verified beneficial: `CREATE INDEX idx_verified_beneficial ON companion_relationships(plant_a_id) WHERE verified = true AND relationship_type = 'BENEFICIAL';`
- [ ] GIN index on `plant_attributes(soil_types)` for soil filtering: `CREATE INDEX idx_soil_types ON plant_attributes USING GIN(soil_types);`
- [ ] GIN/trigram index on synonyms: `CREATE INDEX idx_synonym_trgm ON plant_synonyms USING GIN (synonym gin_trgm_ops);`
- [ ] Consider materialized view for frequently accessed beneficial companions.

### Phase 4: Data Import Pipeline
- [ ] Batch job: fetch plants from Trefle
  - [ ] Pagination handling
  - [ ] Error recovery / retry strategy
  - [ ] Progress tracking / metrics
- [ ] Batch job: enrich with Perenual data
- [ ] Data merge service
  - [ ] Conflict resolution logic (precedence rules)
  - [ ] Data validation
  - [ ] Deduplication logic
- [ ] Scheduled job for periodic updates

### Phase 5: Companion Data Collection Tools
- [ ] Admin REST API for manual data entry
  - [ ] `POST /api/admin/companion-relationships`
  - [ ] `PUT /api/admin/companion-relationships/{id}`
  - [ ] `DELETE /api/admin/companion-relationships/{id}`
- [ ] Web scraper service (base abstraction)
- [ ] Implement Almanac.com scraper
- [ ] Implement additional site scrapers (if legally permissible)
- [ ] CSV import tool for book / static data
- [ ] Validation service for companion data

### Phase 6: Web Interface for Data Entry
- [ ] Simple admin UI (React / Vue)
  - [ ] Plant search / autocomplete
  - [ ] Companion relationship form
  - [ ] Bulk import interface
  - [ ] Data review / approval queue
- [ ] (Alternative) Spreadsheet import tool

### Phase 7: Data Quality & Validation
- [ ] Implement validation rules
- [ ] Duplicate detection service
- [ ] Data quality scoring (populate quality_score)
- [ ] Review / approval workflow (verified, verified_at, verified_by)
- [ ] Conflict detection (contradictory relationships) + resolution UI
- [ ] Source reliability auditing (copyright_ok)

### Phase 8: API Endpoints for Main App
- [ ] `GET /api/plants` (search, filter)
- [ ] `GET /api/plants/{id}`
- [ ] `GET /api/plants/{id}/companions` (beneficial plants)
- [ ] `GET /api/plants/{id}/antagonists` (avoid list)
- [ ] `GET /api/companion-suggestions` (given planted crops set)
- [ ] `GET /api/plants/search` (autocomplete)

### Phase 9: Testing & Documentation
- [ ] Unit tests for services
- [ ] Integration tests for API clients
- [ ] API documentation (OpenAPI / Swagger)
- [ ] Data sourcing documentation
- [ ] Performance testing with large datasets

### Phase 10: Deployment & Monitoring
- [ ] CI/CD pipeline
- [ ] Production database configuration
- [ ] Monitoring & logging (metrics + alerts)
- [ ] Backup strategy
- [ ] Scheduled data sync jobs

## 4. Enumerations (Draft)
```kotlin
enum class RelationshipType { BENEFICIAL, NEUTRAL, ANTAGONISTIC }
enum class RelationshipSubtype { PEST_DETERRENT, NUTRIENT_SUPPORT, SHADE, STRUCTURAL, OTHER }
enum class ConfidenceLevel { HIGH, MEDIUM, LOW }
enum class EvidenceType { SCIENTIFIC, TRADITIONAL, ANECDOTAL }
enum class RootDepth { SHALLOW, MEDIUM, DEEP }
enum class FeederType { HEAVY, MODERATE, LIGHT }
enum class PlantCycle { ANNUAL, PERENNIAL, BIENNIAL }
enum class GrowthHabit { BUSH, VINE, CLIMBER, ROOT, LEAF, FRUITING, OTHER }
enum class SunNeeds { FULL_SUN, PART_SHADE, SHADE }
enum class WaterNeeds { LOW, MODERATE, HIGH, FREQUENT }
enum class ToxicityLevel { NONE, LOW, MODERATE, HIGH }
enum class PrimaryNutrientContribution { NITROGEN, POTASSIUM, PHOSPHORUS, NONE }
enum class SourceType { WEBSITE, BOOK, JOURNAL, INTERNAL }
enum class ConflictResolutionStrategy { PREFER_TREFLE, PREFER_PERENUAL, MANUAL }
```

## 5. Starting Point Code Structure (Target)
```
plant-data-aggregator/
├── src/main/kotlin/
│   ├── config/
│   │   ├── DatabaseConfig.kt
│   │   ├── ApiClientConfig.kt
│   ├── client/
│   │   ├── TrefleClient.kt
│   │   ├── PerenualClient.kt
│   ├── model/
│   │   ├── Plant.kt
│   │   ├── CompanionRelationship.kt
│   │   ├── PlantAttributes.kt
│   ├── repository/
│   │   ├── PlantRepository.kt
│   │   ├── CompanionRepository.kt
│   ├── service/
│   │   ├── PlantDataService.kt
│   │   ├── CompanionDataService.kt
│   │   ├── DataMergeService.kt
│   │   ├── ScraperService.kt
│   ├── controller/
│   │   ├── PlantController.kt
│   │   ├── AdminController.kt
│   └── job/
│       ├── DataSyncJob.kt
```

## 6. Scraping Strategy (Almanac.com)
Observations:
- Individual plant guides (e.g., `/plant/tomatoes`)
- Companion planting info embedded in guides
- Growing tips, pest info, harvest timing, care instructions

Extractable Data:
- Companion plants (beneficial list)
- Incompatible plants (avoid list)
- Planting guides (timing, spacing, depth)
- Care instructions (watering, fertilizing)
- Harvest information (timing & method)
- Common problems (pests, diseases)
- Recommended varieties

## 7. Extended Data Structure Ideas (Future)
Potential future tables/entities:
- `plant_care_guides`
- `plant_pests`
- `plant_varieties`
- `plant_harvest_info`

## 8. Next Immediate Actions (Suggested Order)
1. Finalize schema & enums (Phase 3 subset) – updated list above
2. Initialize module & Gradle config (Phase 1)
3. Add Flyway baseline migration (create core tables + enums)
4. Stub API clients with interfaces & DTO placeholders (Phase 2 start)
5. Implement canonical name normalization utility
6. Create initial entities & repositories
7. Implement conflict logging entity + repository
8. Implement basic `/api/plants` read endpoint returning mock/seed data
9. Start Trefle client integration & initial import job skeleton (single page)
10. Add rate limit & quota tracking (api_call_tracker)
11. Implement synonym ingestion & indexing
12. Add first merge pass + conflict detection

---
This document is the authoritative task checklist. Keep checkboxes updated as work progresses.
