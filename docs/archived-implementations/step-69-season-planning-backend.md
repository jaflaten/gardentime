# Step 69: Planting Calendar & Season Planning - Implementation Summary

## Date: 2025-10-30

## Backend Implementation - COMPLETE ✅

### 1. Database Migration V7 ✅
- **File**: `/src/main/resources/db/migration/V7__create_season_planning_tables.sql`
- **Tables Created**:
  - `garden_climate_info` - Store frost dates and hardiness zones
  - `season_plans` - Track planning seasons (Spring, Summer, Fall, Winter)
  - `planned_crops` - Individual crop plans with calculated dates
  - `plant_details` - Extended plant information for date calculations

### 2. Entities Created ✅
- `GardenClimateInfo.kt` - Climate and frost date information
- `SeasonPlan.kt` - Season planning container
- `PlannedCrop.kt` - Individual planned crop with status tracking
- `PlantDetails.kt` - Plant-specific growing information

### 3. Repositories Created ✅
- `GardenClimateInfoRepository.kt`
- `SeasonPlanRepository.kt`
- `PlannedCropRepository.kt`
- `PlantDetailsRepository.kt`

### 4. Services Created ✅
- `PlantingDateCalculatorService.kt` - Calculates planting dates based on frost dates and plant characteristics
  - Indoor start dates calculation
  - Transplant/direct sow dates based on frost tolerance
  - Expected harvest dates
  - Handles hardy, semi-hardy, and tender plants differently
  
- `SeasonPlanningService.kt` - Business logic for season planning
  - CRUD operations for season plans and planned crops
  - Calendar event aggregation
  - Integration with existing crop records

### 5. API Endpoints Created ✅
**Climate Info:**
- `GET /api/gardens/{gardenId}/climate` - Get frost dates and climate info
- `PUT /api/gardens/{gardenId}/climate` - Update frost dates manually

**Season Plans:**
- `GET /api/gardens/{gardenId}/season-plans` - List all season plans
- `GET /api/gardens/{gardenId}/season-plan` - Get current season plan
- `POST /api/gardens/{gardenId}/season-plan` - Create new season plan
- `DELETE /api/gardens/{gardenId}/season-plans/{seasonPlanId}` - Delete season plan

**Planned Crops:**
- `GET /api/gardens/{gardenId}/season-plans/{seasonPlanId}/planned-crops` - List planned crops
- `POST /api/gardens/{gardenId}/season-plans/{seasonPlanId}/planned-crops` - Add crop to plan
- `PATCH /api/gardens/{gardenId}/season-plans/{seasonPlanId}/planned-crops/{id}` - Update planned crop
- `DELETE /api/gardens/{gardenId}/season-plans/{seasonPlanId}/planned-crops/{id}` - Remove crop

**Calendar:**
- `GET /api/gardens/{gardenId}/calendar?startDate={date}&endDate={date}` - Get calendar events

### 6. DTOs Created ✅
- `GardenClimateInfoDTO`, `CreateGardenClimateInfoDTO`
- `SeasonPlanDTO`, `CreateSeasonPlanDTO`
- `PlannedCropDTO`, `CreatePlannedCropDTO`, `UpdatePlannedCropDTO`
- `CalendarEventDTO`, `CalendarResponseDTO`
- `PlantDetailsDTO`

### 7. Security ✅
- All endpoints require authentication
- Garden ownership verification on all operations
- Uses existing `SecurityUtils.getCurrentUserId()`

## Frontend Implementation - TODO

### Next Steps (In Priority Order):

1. **Basic Season Plan Page** (`/gardens/[id]/season-plan`)
   - Create/select season
   - Add planned crops
   - View planned crops list
   - Status tracking

2. **Frost Date Settings** (in Garden Settings or Season Plan Creation)
   - Form to set last/first frost dates
   - Hardiness zone input
   - Saves to garden_climate_info table

3. **Add Planned Crop Modal**
   - Plant selector
   - Quantity input
   - Grow area selector
   - Display calculated dates from API
   - Phase selector (Early, Mid, Late)

4. **Season Plan Dashboard Widget** (add to Garden Dashboard)
   - Upcoming tasks this week
   - Season progress
   - Quick access to full plan

5. **Full Calendar View** (`/gardens/[id]/calendar`)
   - Monthly grid display
   - Color-coded event types
   - Event details on click

## Database Schema

### garden_climate_info
```sql
garden_id UUID PRIMARY KEY
last_frost_date DATE
first_frost_date DATE
hardiness_zone VARCHAR(10)
latitude DECIMAL(9,6)
longitude DECIMAL(9,6)
updated_at TIMESTAMP
```

### season_plans
```sql
id UUID PRIMARY KEY
garden_id UUID NOT NULL
user_id UUID NOT NULL
season VARCHAR(50) NOT NULL  -- SPRING, SUMMER, FALL, WINTER
year INTEGER NOT NULL
created_at TIMESTAMP
updated_at TIMESTAMP
UNIQUE(garden_id, season, year)
```

### planned_crops
```sql
id UUID PRIMARY KEY
season_plan_id UUID NOT NULL
plant_id BIGINT NOT NULL
quantity INTEGER DEFAULT 1
preferred_grow_area_id BIGINT
status VARCHAR(50) NOT NULL DEFAULT 'PLANNED'
  -- PLANNED, SEEDS_STARTED, TRANSPLANTED, DIRECT_SOWN, GROWING, COMPLETED, CANCELLED
indoor_start_date DATE
indoor_start_method VARCHAR(100)
transplant_date DATE
direct_sow_date DATE
expected_harvest_date DATE
phase VARCHAR(50)  -- EARLY, MID, LATE
notes TEXT
crop_record_id UUID  -- Links to actual crop when planted
created_at TIMESTAMP
updated_at TIMESTAMP
```

### plant_details
```sql
plant_id BIGINT PRIMARY KEY
weeks_before_frost_indoor INTEGER
can_direct_sow BOOLEAN DEFAULT true
can_transplant BOOLEAN DEFAULT false
frost_tolerance VARCHAR(50)  -- HARDY, SEMI_HARDY, TENDER
indoor_start_method TEXT
transplant_guidance TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

## Date Calculation Logic

### Example: Tomato Plant
Given:
- Last frost date: May 15, 2025
- Tomato weeks_before_frost_indoor: 7
- Tomato frost_tolerance: TENDER
- Tomato maturity_time: 75 days

Calculated:
- Indoor start date: May 15 - 7 weeks = March 27, 2025
- Transplant date: May 15 + 1 week = May 22, 2025 (after frost danger)
- Expected harvest: May 22 + 75 days = August 5, 2025

### Frost Tolerance Rules
- **HARDY**: Can go out 4-6 weeks before last frost (e.g., kale, peas)
- **SEMI_HARDY**: Can go out 2-4 weeks before last frost (e.g., cauliflower)
- **TENDER**: Must wait until after last frost (e.g., tomatoes, peppers, basil)

## Placeholder Plant Data

The file `/docs/placeholder-plant-data.sql` contains INSERT statements for 20 common vegetables and herbs with their:
- Weeks before frost to start indoors
- Whether they can be direct sown or transplanted
- Frost tolerance
- Indoor starting methods
- Transplanting guidance

This data should be loaded after running migration V7.

**Plants included:**
Tomato, Pepper, Lettuce, Carrot, Cucumber, Basil, Kale, Spinach, Radish, Broccoli, Zucchini, Pea, Bean, Onion, Parsley, Cilantro, Eggplant, Squash, Cauliflower, Cabbage

## Future Enhancements (Phase 2+)

1. **Notifications & Reminders**
   - Email/SMS when it's time to start seeds
   - Push notifications for planting windows
   - Weekly task summaries

2. **Hardiness Zone Auto-Detection**
   - Integrate with USDA Plant Hardiness Zone API
   - Auto-populate frost dates based on ZIP code or coordinates
   - Weather API integration for real-time updates

3. **Succession Planting**
   - Auto-suggest planting same crop every 2-3 weeks
   - Templates for continuous harvest

4. **Crop Rotation Integration**
   - Check planned crops against rotation rules
   - Suggest alternative grow areas
   - Track soil nutrients by area

5. **Data from plant-data-aggregator**
   - Replace placeholder data with comprehensive database
   - Regular updates to planting information
   - Community-contributed varieties and methods

## Testing Checklist

### Backend Testing
- [ ] Create season plan via API
- [ ] Add planned crops with date calculations
- [ ] Update planned crop status
- [ ] Set garden climate info (frost dates)
- [ ] Fetch calendar events for date range
- [ ] Verify security checks (garden ownership)
- [ ] Test with no frost dates set
- [ ] Test with tropical climate (no frost)
- [ ] Test date calculations for hardy, semi-hardy, and tender plants

### Frontend Testing (When Built)
- [ ] Create new season plan
- [ ] Set frost dates for garden
- [ ] Add planned crops and see calculated dates
- [ ] Update crop status through the workflow
- [ ] View calendar with events
- [ ] Filter planned crops by status/phase
- [ ] Test responsive layout on mobile
- [ ] Test with multiple seasons
- [ ] Test phase selection (Early, Mid, Late)

## Build Status
✅ Backend compiles successfully
✅ All migrations ready
✅ All API endpoints implemented
⏳ Frontend implementation pending

## Next Immediate Steps

1. Create BFF routes in `client-next/app/api/` for the new endpoints
2. Build basic Season Plan page in Next.js
3. Create Frost Date settings component
4. Implement Add Planned Crop modal
5. Add Season Plan widget to Garden Dashboard

---

**Note**: This is a substantial feature that provides the foundation for advanced garden planning. The backend is complete and ready to use. Frontend development can now proceed using the documented API endpoints.
