# Feature Requests & TODOs

## User Feedback - Seasonal Planning & Companion Planting

### Priority Features

#### 1. Grow Area Sun Level Configuration
**User Story:** As a gardener, I want to set the sun level for each grow area so the system can suggest appropriate plants for that location.

**Requirements:**
- Each grow area should have a configurable sun level (FULL_SUN, PART_SHADE, SHADE)
- System should match plant sun needs with grow area sun level during planning
- This affects plant recommendations and placement suggestions

**Database Changes Needed:**
- [ ] Add `sun_level` enum column to `grow_areas` table
- [ ] Migrate existing grow areas with default value
- [ ] Update API to accept/return sun level

**Files to Update:**
- [ ] `src/main/resources/db/migration/` - New migration for sun_level column
- [ ] `client-next/src/types/garden.ts` - Add sunLevel to GrowArea type
- [ ] API endpoints for grow area CRUD
- [ ] UI for setting sun level per grow area

---

#### 2. Multiple Grow Areas Per Plant Type
**User Story:** During seasonal planning, I want to specify how many grow areas I want to plant with the same crop (e.g., "I want 3 boxes with carrots").

**Requirements:**
- User can specify quantity of grow areas for a plant during planning
- System tracks multiple instances of same plant in different locations
- Seasonal plan should show: "Carrots x3" or similar notation

**Implementation Notes:**
- This might be a planning-time feature (doesn't need database schema change)
- Could be part of the seasonal plan UI workflow
- Needs to consider companion planting rules across all instances

**Files to Update:**
- [ ] `client-next/src/components/SeasonalPlanner/` - UI for quantity selection
- [ ] Planning algorithm to allocate multiple grow areas
- [ ] Visualization to show multiple instances clearly

---

#### 3. Plant Family Taxonomy
**User Story:** As a gardener practicing crop rotation, I need to know plant families so I can avoid planting related crops in the same location year after year.

**Why Important:**
- Critical for regenerative farming practices
- Prevents soil depletion and disease buildup
- Enables proper crop rotation planning
- Different families have different nutrient needs/contributions

**Database Changes Needed:**
- [ ] Add `family` column to `plants` table (VARCHAR or new enum)
- [ ] Research and document common plant families:
  - Solanaceae (tomatoes, peppers, potatoes, eggplant)
  - Brassicaceae (broccoli, cabbage, kale, radishes)
  - Fabaceae (beans, peas - nitrogen fixers)
  - Apiaceae (carrots, parsley, dill)
  - Cucurbitaceae (cucumbers, squash, melons)
  - Allium (onions, garlic, leeks)
  - Asteraceae (lettuce, sunflowers)
  - Lamiaceae (basil, mint, oregano)

**Rules to Implement:**
- [ ] Don't plant same family in same grow area consecutive years
- [ ] Track family history per grow area (last 2-3 years)
- [ ] Warning system when user tries to violate rotation rules
- [ ] Suggestions for what family to plant next based on rotation

**Files to Update:**
- [ ] `src/main/resources/db/migration/` - Add family column
- [ ] `plant-data-aggregator/docs/plant-families.md` - Reference document
- [ ] Seasonal planner algorithm - incorporate family rotation logic
- [ ] UI warnings/suggestions for crop rotation

---

#### 4. Companion Planting Integration
**User Story:** The system should help me place plants that benefit each other nearby, and keep incompatible plants apart.

**Data Source:**
- User is manually compiling companion planting data
- Once complete, will be imported to database
- Reference: https://www.almanac.com/companion-planting-guide-vegetables

**Database Schema:**
Already exists! See `companion_relationships` table:
```sql
CREATE TABLE companion_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plant_a_id UUID NOT NULL REFERENCES plants(id),
    plant_b_id UUID NOT NULL REFERENCES plants(id),
    relationship_type companion_relationship_type NOT NULL,
    reason TEXT,
    strength companion_strength,
    scientific_basis TEXT,
    ...
)
```

**Relationship Types:**
- ATTRACTS_BENEFICIAL_INSECTS
- REPELS_PESTS
- IMPROVES_FLAVOR
- PROVIDES_SHADE
- PROVIDES_SUPPORT
- IMPROVES_SOIL
- INCOMPATIBLE
- COMPETES_FOR_RESOURCES
- ALLELOPATHIC

**TODO:**
- [ ] Wait for user's companion planting data compilation
- [ ] Create import script for companion relationships
- [ ] Integrate into seasonal planner algorithm:
  - Suggest beneficial neighbors
  - Warn about incompatible pairings
  - Consider physical proximity in grow areas
- [ ] UI to show companion benefits/warnings
- [ ] Filter suggestions by compatibility

---

#### 5. Intelligent Seasonal Planner
**User Story:** The planner should consider multiple factors to suggest optimal plant placement:

**Factors to Consider:**
1. **Previous Years' Crops**
   - What was planted in each grow area last year?
   - What family was it from?
   - Did it deplete or enrich soil?

2. **Companion Relationships**
   - Which plants benefit from being neighbors?
   - Which combinations to avoid?
   - Spatial proximity matters

3. **Sun Requirements**
   - Match plant sun needs to grow area sun level
   - Don't suggest shade plants for full-sun areas

4. **Crop Rotation**
   - Avoid same plant family in same location
   - Follow nitrogen-fixing legumes with heavy feeders
   - Space out nutrient-demanding crops

5. **User Preferences**
   - Desired quantity of each crop
   - Multiple grow areas for same plant
   - Personal preferences/priorities

**Implementation Approach:**
```
Algorithm:
1. Load grow areas with sun levels
2. Load historical plantings (last 2-3 years)
3. For each plant user wants to grow:
   a. Filter compatible grow areas (sun level match)
   b. Check crop rotation rules (family history)
   c. Score locations by:
      - Companion benefits (neighbors)
      - Rotation benefit (soil health)
      - Spatial efficiency
   d. Suggest top N locations
4. Allow user to override/adjust
5. Save as seasonal plan
```

**Files to Create/Update:**
- [ ] `src/main/kotlin/no/sogn/plantdata/service/SeasonalPlanningService.kt`
- [ ] `src/main/kotlin/no/sogn/plantdata/algorithm/PlacementScorer.kt`
- [ ] `src/main/kotlin/no/sogn/plantdata/algorithm/CropRotationValidator.kt`
- [ ] `client-next/src/components/SeasonalPlanner/PlacementSuggestions.tsx`
- [ ] `client-next/src/components/SeasonalPlanner/CompatibilityWarnings.tsx`

---

## Additional Data Needs

### Plant Family Research
- [ ] Compile comprehensive list of plant families
- [ ] Add family data for our current 15 plants
- [ ] Document family characteristics (heavy feeders, nitrogen fixers, etc.)

### Companion Planting Data
- [ ] User is compiling from Almanac.com
- [ ] Format: TBD (CSV, JSON, or direct SQL?)
- [ ] Need import process once ready

### Historical Planting Data
- [ ] Ensure we're tracking plant family in `garden_plantings`
- [ ] Add migration if needed
- [ ] Query patterns for "what was here last year?"

---

## Technical Debt
- [ ] Fix plant import service transaction issues (PostgreSQL enum casting)
- [ ] Complete scraping pipeline for remaining plants
- [ ] Add API keys for Trefle/Perenual if using them

---

## Documentation Updates Needed
- [ ] Add crop rotation guide to docs
- [ ] Document plant family categories
- [ ] Create companion planting reference
- [ ] Add seasonal planning workflow diagrams

---

## Priority Order (Suggested)

1. **Phase 1: Data Foundation**
   - Add family column to plants table
   - Import family data for existing plants
   - Add sun_level to grow_areas table
   - Update APIs

2. **Phase 2: Companion Planting**
   - Import companion relationship data when ready
   - Create API to query relationships
   - Build UI to display compatibility

3. **Phase 3: Intelligent Planning**
   - Build crop rotation validator
   - Implement placement scoring algorithm
   - Create seasonal planner UI with suggestions
   - Add multiple-area quantity selection

4. **Phase 4: Polish**
   - Warnings and validation
   - Historical trend analysis
   - Reporting and insights

---

## Notes
- Keep regenerative farming principles in mind throughout
- Focus on helping users make informed decisions, not restricting them
- Provide explanations for suggestions (educational component)
- Consider mobile-first design for field use
