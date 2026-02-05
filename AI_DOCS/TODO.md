# GardenTime - TODO List

## Recently Completed ✅

### 2026-02-05 - Grow Area Rotation
- [x] **Rotate grow areas on canvas** - See `GROW_AREA_ROTATION_FEATURE.md`
  - Rotation handle on selected grow areas
  - 22.5° snap increments
  - Persists to database
  - Migrations V14 + V15

### 2026-02-05 - User Management (Previously completed)
- [x] **User profile page** - View/edit profile, change password
- [x] **Password reset flow** - Forgot password with console-logged tokens
- [x] **Delete account** - With password confirmation
- [x] **Welcome message** - Navbar shows "Welcome, {firstName}"
- See `USER_MANAGEMENT_PLAN.md`

---

## High Priority - User Feedback

### Database Schema Updates

- [ ] **Add Plant Family Column**
  - Migration: Add `family VARCHAR(100)` to `plants` table
  - Populate with data for existing 15 plants
  - Update import service to include family
  - See: `plant-data-aggregator/docs/plant-families.md`

- [ ] **Add Sun Level to Grow Areas**
  - Migration: Add `sun_level sun_needs` to `grow_areas` table (enum: FULL_SUN, PART_SHADE, SHADE)
  - Default existing areas to FULL_SUN
  - Update API to accept/return sun level
  - Update UI for setting sun level per area

- [ ] **Track Plant Family in Historical Data**
  - Ensure `garden_plantings` can query plant family through join
  - Add index on plants.family for performance
  - Create view or helper function for "what family was here last year"

### Seasonal Planning Features

- [ ] **Grow Area Quantity Selection**
  - UI: Allow specifying "I want 3 boxes of carrots"
  - Backend: Support multiple grow areas per plant in plan
  - Display: Show "Carrots x3" in plan visualization

- [ ] **Sun Level Matching**
  - Algorithm: Filter grow areas by sun compatibility
  - Warnings: Alert if plant's sun needs don't match area
  - Suggestions: Only show suitable areas for plant

- [ ] **Crop Rotation Validator**
  - Service: Check plant family against previous years
  - Rules: Warn if same family planted <2 years ago
  - Suggestions: Recommend families that haven't been grown recently

- [ ] **Companion Planting Integration**
  - Wait for user's compiled companion data
  - Import script for companion relationships
  - Query API for compatible/incompatible plants
  - UI warnings for bad pairings
  - UI suggestions for beneficial neighbors

### Services to Create

```
src/main/kotlin/no/sogn/plantdata/service/
├── CropRotationService.kt          (validate family rotation rules)
├── CompanionPlantingService.kt     (query relationships)
├── SeasonalPlanningService.kt      (main orchestrator)
└── PlacementScoringService.kt      (score grow area options)
```

### UI Components to Create

```
client-next/src/components/
├── GrowArea/
│   └── SunLevelSelector.tsx        (set sun level for area)
├── SeasonalPlanner/
│   ├── PlantQuantitySelector.tsx   (select number of areas)
│   ├── PlacementSuggestions.tsx    (show scored options)
│   ├── CompatibilityWarnings.tsx   (show conflicts)
│   └── RotationValidator.tsx       (check family history)
```

## Medium Priority - Data & Documentation

- [ ] **Companion Planting Data**
  - User is compiling from Almanac.com
  - Create import process once data ready
  - Format: TBD (CSV or JSON)
  - See: `plant-data-aggregator/docs/companion-planting-import.md`

- [ ] **Plant Family Data for Current Plants**
  ```sql
  -- Update our 15 plants with family data
  UPDATE plants SET family = 'Solanaceae' WHERE common_name = 'Tomato';
  UPDATE plants SET family = 'Solanaceae' WHERE common_name = 'Pepper';
  UPDATE plants SET family = 'Brassicaceae' WHERE common_name IN ('Broccoli', 'Cabbage', 'Kale', 'Radish');
  UPDATE plants SET family = 'Fabaceae' WHERE common_name IN ('Bean', 'Pea');
  UPDATE plants SET family = 'Cucurbitaceae' WHERE common_name = 'Cucumber';
  UPDATE plants SET family = 'Apiaceae' WHERE common_name IN ('Carrot', 'Dill', 'Parsley');
  UPDATE plants SET family = 'Allium' WHERE common_name = 'Onion';
  UPDATE plants SET family = 'Asteraceae' WHERE common_name = 'Lettuce';
  UPDATE plants SET family = 'Lamiaceae' WHERE common_name = 'Basil';
  ```

- [ ] **Documentation**
  - [x] Create FEATURE-REQUESTS.md (comprehensive requirements)
  - [x] Create plant-families.md (reference guide)
  - [x] Create companion-planting-import.md (data format & import)
  - [ ] Create crop-rotation-guide.md (user-facing help)
  - [ ] Create seasonal-planning-workflow.md (user guide)

## Low Priority - Technical Debt

- [ ] **Fix Plant Import Service**
  - Issue: PostgreSQL enum casting in JPA/Hibernate
  - Current workaround: JDBC template with explicit casts
  - Problem: Transaction rollback in nested @Transactional
  - Options:
    1. Debug transaction propagation
    2. Generate SQL script for manual import
    3. Refactor to use JDBC for all operations

- [ ] **Complete Plant Data Import**
  - 15 plants extracted and validated
  - JSON files ready in `docs/scrapers/extracted-text/`
  - Need to load into database

- [ ] **Scraping Pipeline**
  - Scraper works for Almanac.com
  - LLM parsing works
  - Consider scraping more plants beyond initial 15

## Future Features - Backlog

- [ ] **Mobile Responsiveness**
  - Optimize UI for field use on phone/tablet
  - Quick access to care instructions
  - Photo upload for plant tracking

- [ ] **Reporting & Analytics**
  - Harvest yields over time
  - Success rates per plant/area
  - Soil health trends

- [ ] **Community Features**
  - Share garden plans
  - Local companion planting data
  - Regional growing calendars

- [ ] **Advanced Planning**
  - Succession planting recommendations
  - Cover crop suggestions
  - Poly culture combinations

## Notes

- Regenerative farming principles guide all features
- Educational component important (explain WHY, not just WHAT)
- User should maintain control (suggestions, not restrictions)
- Start simple, iterate based on feedback

## Reference Documents

- `/FEATURE-REQUESTS.md` - Detailed requirements from user feedback
- `/plant-data-aggregator/docs/plant-families.md` - Family reference
- `/plant-data-aggregator/docs/companion-planting-import.md` - Import guide
- `/plant-data-aggregator/IMPORT-GUIDE.md` - How to import plant data
- `/plant-data-aggregator/SCRAPING-GUIDE.md` - How to scrape plants

## Next Steps

1. Add plant family column + data
2. Add sun level to grow areas
3. Create crop rotation validator service
4. Build seasonal planner with suggestions
5. Wait for companion data, then import
6. Iterate based on user testing
