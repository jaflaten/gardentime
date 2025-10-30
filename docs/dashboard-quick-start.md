# Garden Management Dashboard - Quick Start Guide

## Overview
This guide will help you start implementing the Garden Management Dashboard feature, beginning with Step 64 (Core Dashboard) and Step 69 (Season Planning).

---

## Phase 1: Garden Overview Dashboard (Step 64) - Week 1

### Recommended Order

#### Day 1-2: Backend Foundation
1. **Create Dashboard API Endpoint**
   - File: `src/main/java/com/gardentime/controller/GardenDashboardController.java`
   - Endpoint: `GET /api/gardens/{gardenId}/dashboard`
   - Service: `GardenDashboardService.java`
   - DTO: `GardenDashboardDTO.java` (aggregates all widget data)

2. **Implement Business Logic**
   - Calculate active crops count (status = PLANTED or GROWING)
   - Fetch recent harvests (last 5, sorted by harvest date DESC)
   - Calculate upcoming tasks:
     - Crops ready to harvest (expected_harvest_date <= today)
     - Crops to harvest soon (within 7 days)
     - Diseased/failed crops
     - Empty grow areas
   - Calculate garden capacity utilization
   - Generate mini calendar events (current month)

3. **Add Caching**
   - Use Spring Cache with 5-minute TTL
   - Cache key: `garden:{gardenId}:dashboard`

#### Day 3-4: Frontend Dashboard Page
1. **Create Dashboard Route**
   - File: `client-next/app/gardens/[id]/dashboard/page.tsx`
   - Make this the default when opening a garden
   - Update `client-next/app/gardens/[id]/page.tsx` to redirect to dashboard

2. **Create Dashboard Layout Component**
   - File: `client-next/components/dashboard/DashboardLayout.tsx`
   - Responsive grid: 3 columns on desktop, stacked on mobile
   - Loading states for each widget
   - Error boundaries

3. **Build Core Widgets** (one at a time)
   - `GardenSummaryCard.tsx` - Total areas, active crops, last activity
   - `ActiveCropsWidget.tsx` - Status breakdown with donut chart
   - `RecentHarvestsWidget.tsx` - List of recent harvests
   - `UpcomingTasksWidget.tsx` - Prioritized task list ⭐ MOST IMPORTANT
   - `GardenCapacityWidget.tsx` - Utilization bar
   - `PlantingCalendarWidget.tsx` - Mini month view

#### Day 5: Polish & Testing
- Add click-through navigation from widgets
- Implement auto-refresh (optional)
- Test with real data
- Mobile responsiveness
- Error handling

---

## Phase 2: Planting Calendar & Season Planning (Step 69) - Week 2-3

### Recommended Order

#### Day 1-2: Database Setup
1. **Create Migrations** (in order)
   - V10: `season_plans` table
   - V11: `garden_climate_info` table
   - V12: `planned_crops` table (with all fields for seed starting)
   - V13: Extend `plant_details` table with planting info
   
2. **Load Placeholder Plant Data**
   - Run `/docs/placeholder-plant-data.sql` after V13 migration
   - Verify 20 common plants have planting information

3. **Create Entities**
   - `SeasonPlan.java`
   - `PlannedCrop.java`
   - `GardenClimateInfo.java`
   - Update `PlantDetail.java` with new fields

#### Day 3-4: Backend APIs
1. **PlantingDateCalculator Service**
   - File: `src/main/java/com/gardentime/service/PlantingDateCalculator.java`
   - Method: `calculatePlantingDates(Plant plant, LocalDate lastFrostDate)`
   - Returns: `PlannedCropDates` (indoor_start, transplant/direct_sow, expected_harvest)
   - Handle edge cases (no indoor start needed, direct sow only, etc.)

2. **Season Plan API**
   - Controller: `SeasonPlanController.java`
   - Service: `SeasonPlanService.java`
   - Endpoints:
     - GET `/api/gardens/{gardenId}/season-plan` (optionally filter by season/year)
     - POST `/api/gardens/{gardenId}/season-plan`
     - POST `/api/gardens/{gardenId}/season-plan/planned-crops`
     - PATCH `/api/gardens/{gardenId}/season-plan/planned-crops/{id}`
     - DELETE `/api/gardens/{gardenId}/season-plan/planned-crops/{id}`

3. **Calendar Events API**
   - Endpoint: GET `/api/gardens/{gardenId}/calendar?startDate=X&endDate=Y`
   - Aggregates events from planned_crops AND crop_records
   - Returns event list with type, date, plant, grow area

4. **Climate Info API**
   - Endpoints:
     - GET `/api/gardens/{gardenId}/climate`
     - PUT `/api/gardens/{gardenId}/climate`

#### Day 5-6: Frost Dates & Season Creation UI
1. **Frost Dates Setup Modal**
   - File: `client-next/components/season-plan/FrostDatesSetupModal.tsx`
   - Form with last frost date and first frost date pickers
   - Optional hardiness zone input
   - Helpful tooltips explaining frost dates
   - Save to garden_climate_info

2. **Season Plan Creation Page**
   - File: `client-next/app/gardens/[id]/season-plan/new/page.tsx`
   - Season selector (Spring, Summer, Fall, Winter)
   - Phase selector (Early, Mid, Late) - optional
   - Year input
   - Check if frost dates are set, show setup modal if not
   - Create season plan on submit

#### Day 7-9: Planned Crops UI
1. **Add Planned Crop Modal**
   - File: `client-next/components/season-plan/AddPlannedCropModal.tsx`
   - Plant search/autocomplete
   - Quantity input
   - Preferred grow area selector
   - Display calculated dates (call PlantingDateCalculator via API)
   - Phase selector
   - Notes field
   - Allow manual date overrides

2. **Season Plan Management Page**
   - File: `client-next/app/gardens/[id]/season-plan/page.tsx`
   - List all planned crops
   - Status badges (PLANNED, SEEDS_STARTED, TRANSPLANTED, etc.)
   - Progress bar showing season completion
   - Quick actions:
     - Mark as "Seeds Started"
     - Mark as "Transplanted" (triggers crop record creation)
     - Edit
     - Delete
   - Filter by status, phase, grow area
   - Add new crop button

3. **Planned Crop Status Update Logic**
   - When marking as "Transplanted" or "Direct Sown":
     - Show modal to create crop_record
     - Pre-fill with planned crop data
     - Link crop_record.id to planned_crop
     - Update planned_crop status
     - Refresh board to show new crop

#### Day 10-12: Calendar View
1. **Full Calendar Component**
   - File: `client-next/components/calendar/CalendarView.tsx`
   - Monthly grid view
   - Year/month navigation
   - Event dots on dates (color-coded by type)
   - Click date → Show events modal
   - Consider using library: `react-big-calendar` or build custom

2. **Calendar Events Display**
   - Event types with color coding:
     - 🔵 Blue = Indoor seed starting
     - 🟢 Green = Outdoor planting/transplanting
     - 🟡 Yellow = Expected harvest
     - 🔴 Red = Actual harvest
   - Hover tooltip showing event details
   - Click event → Details modal with quick actions

3. **Event Details Modal**
   - Shows plant name, grow area, date, type
   - Quick actions:
     - Mark as done (update status)
     - Snooze (change date)
     - View crop details
     - Create crop record (for planned crops)

#### Day 13-14: Dashboard Integration
1. **Season Plan Widget for Dashboard**
   - File: `client-next/components/dashboard/SeasonPlanWidget.tsx`
   - Display current season name
   - Progress bar (X/Y crops planted)
   - Upcoming tasks this week (list)
   - Quick stats
   - Link to full season plan page

2. **Indoor Seed Starting Alerts Widget**
   - File: `client-next/components/dashboard/SeedStartingAlerts.tsx`
   - List of upcoming seed starting dates
   - Alert badges (this week, today, overdue)
   - Link to calendar or planned crop

3. **Update Dashboard Layout**
   - Add season plan widget to dashboard
   - Position prominently (top or side)

#### Day 15: Testing & Polish
- End-to-end testing:
  - Create season plan
  - Add planned crops
  - Verify date calculations
  - Mark crops as seeds started, transplanted
  - Create crop records from planned crops
  - View on calendar
  - Check dashboard widgets
- Edge case testing:
  - No frost zone (tropical)
  - Direct sow only plants
  - Transplant only plants
  - Multiple seasons
  - Phases (early, mid, late)
- Mobile responsiveness
- Error handling

---

## Data Flow Summary

### Creating a Season Plan
```
1. User creates season → season_plan record created
2. User sets frost dates (if not set) → garden_climate_info record
3. User adds crop to plan:
   a. Select plant
   b. Backend calculates dates using PlantingDateCalculator
   c. planned_crop record created with calculated dates
4. Display on calendar and season plan page
```

### Following the Plan
```
1. Dashboard shows "Start tomato seeds indoors (in 3 days)"
2. User marks as "Seeds Started" → planned_crop.status = SEEDS_STARTED
3. Later, mark as "Transplanted":
   a. Show "Create Crop Record" modal
   b. Pre-fill with planned crop data
   c. Create crop_record
   d. Link crop_record.id to planned_crop
   e. Update planned_crop.status = TRANSPLANTED
   f. Crop appears on board immediately
```

### Date Calculation Example
```
User's garden:
- Last frost date: May 15, 2025

Tomato plant (from plant_details):
- weeks_before_frost_indoor: 7
- can_transplant: true
- frost_tolerance: TENDER
- maturity_time: 75 days

Calculated dates:
- Indoor start: May 15 - 7 weeks = March 27, 2025
- Transplant: May 15 + 1 week = May 22, 2025 (after frost danger)
- Expected harvest: May 22 + 75 days = August 5, 2025
```

---

## Quick Wins to Start With

If you want to see results quickly, implement in this order:

### Minimal Viable Dashboard (2-3 days)
1. Backend: Dashboard API endpoint with basic calculations
2. Frontend: Dashboard route with simple layout
3. Widget 1: Garden Summary Card (easiest)
4. Widget 2: Active Crops Widget (visual, impressive)
5. Widget 3: Upcoming Tasks (most useful)

### Minimal Viable Season Planning (3-4 days)
1. Database: Migrations V10-V13
2. Load placeholder plant data
3. Backend: Season plan API + PlantingDateCalculator
4. Frontend: Simple season plan creation form
5. Frontend: Add planned crop modal with date display
6. Frontend: Basic list view of planned crops

---

## Files to Create/Modify

### Backend (Spring Boot)
**New Files:**
- `controller/GardenDashboardController.java`
- `controller/SeasonPlanController.java`
- `service/GardenDashboardService.java`
- `service/SeasonPlanService.java`
- `service/PlantingDateCalculator.java`
- `model/SeasonPlan.java`
- `model/PlannedCrop.java`
- `model/GardenClimateInfo.java`
- `repository/SeasonPlanRepository.java`
- `repository/PlannedCropRepository.java`
- `repository/GardenClimateInfoRepository.java`
- `dto/GardenDashboardDTO.java`
- `dto/SeasonPlanDTO.java`
- `dto/PlannedCropDTO.java`
- `dto/CalendarEventDTO.java`

**Migrations:**
- `resources/db/migration/V10__create_season_plans.sql`
- `resources/db/migration/V11__create_garden_climate_info.sql`
- `resources/db/migration/V12__create_planned_crops.sql`
- `resources/db/migration/V13__extend_plant_details.sql`
- `resources/db/migration/V14__load_placeholder_plant_data.sql` (copy from docs)

**Modified Files:**
- `model/PlantDetail.java` (add new fields)

### Frontend (Next.js)
**New Files:**
- `app/gardens/[id]/dashboard/page.tsx`
- `app/gardens/[id]/season-plan/page.tsx`
- `app/gardens/[id]/season-plan/new/page.tsx`
- `app/gardens/[id]/calendar/page.tsx`
- `components/dashboard/DashboardLayout.tsx`
- `components/dashboard/GardenSummaryCard.tsx`
- `components/dashboard/ActiveCropsWidget.tsx`
- `components/dashboard/RecentHarvestsWidget.tsx`
- `components/dashboard/UpcomingTasksWidget.tsx`
- `components/dashboard/GardenCapacityWidget.tsx`
- `components/dashboard/PlantingCalendarWidget.tsx`
- `components/dashboard/SeasonPlanWidget.tsx`
- `components/dashboard/SeedStartingAlerts.tsx`
- `components/season-plan/AddPlannedCropModal.tsx`
- `components/season-plan/FrostDatesSetupModal.tsx`
- `components/season-plan/PlannedCropsList.tsx`
- `components/season-plan/SeasonPlanProgress.tsx`
- `components/calendar/CalendarView.tsx`
- `components/calendar/CalendarEventModal.tsx`
- `app/api/dashboard/route.ts` (BFF layer)
- `app/api/season-plan/route.ts` (BFF layer)
- `app/api/calendar/route.ts` (BFF layer)

**Modified Files:**
- `app/gardens/[id]/page.tsx` (redirect to dashboard)
- Navigation component (add dashboard link)

---

## Testing Checklist

### Dashboard Testing
- [ ] Dashboard loads with correct data
- [ ] All widgets display properly
- [ ] Active crops count is accurate
- [ ] Recent harvests show last 5 items
- [ ] Upcoming tasks are prioritized correctly
- [ ] Garden capacity calculation is correct
- [ ] Click-through navigation works
- [ ] Mobile layout is responsive
- [ ] Loading states display
- [ ] Error handling works

### Season Planning Testing
- [ ] Can create season plan
- [ ] Frost dates can be set/updated
- [ ] Can add planned crop with plant selection
- [ ] Date calculations are correct for:
  - [ ] Indoor start date
  - [ ] Transplant date
  - [ ] Direct sow date (if applicable)
  - [ ] Expected harvest date
- [ ] Can mark crop as seeds started
- [ ] Can mark crop as transplanted → creates crop record
- [ ] Crop appears on board after transplanting
- [ ] Calendar shows all event types
- [ ] Calendar events are color-coded correctly
- [ ] Can filter planned crops by status
- [ ] Phase selector works (early, mid, late)
- [ ] Multiple seasons can exist simultaneously
- [ ] Edge cases handled:
  - [ ] Direct sow only plants (no indoor start date)
  - [ ] Transplant only plants
  - [ ] No frost zones (tropical)
  - [ ] Frost-hardy plants (can plant early)

---

## Next Steps After MVP

### Phase 2 Enhancements
- Weather API integration for auto-frost dates
- Email/push notifications for seed starting reminders
- Succession planting suggestions
- Export season plan to PDF
- Share season plan with others
- Season plan templates

### Phase 3 Features
- Statistics & analytics dashboard (Step 65)
- Multi-garden management (Step 66)
- Garden templates (Step 67)
- Activity feed (Step 68)

---

## Questions to Resolve During Implementation

1. **Date Overrides:** Should users be able to override calculated dates?
   - Recommendation: Yes, show calculated dates but allow manual edit

2. **Status Transitions:** Should status changes be linear (PLANNED → SEEDS_STARTED → TRANSPLANTED)?
   - Recommendation: No, allow jumping (e.g., PLANNED → TRANSPLANTED for direct sow)

3. **Crop Record Creation:** Auto-create or require user confirmation?
   - Recommendation: Show modal for user to review/confirm before creating

4. **Multiple Crops Same Plant:** Can user add tomatoes to plan multiple times?
   - Recommendation: Yes, for succession planting

5. **Dashboard Default:** Always show dashboard or remember user preference?
   - Recommendation: Always dashboard (can add preference later)

---

Ready to start? Begin with:
1. Create V10-V14 database migrations
2. Load placeholder plant data
3. Implement GardenDashboardController with basic calculations
4. Build dashboard page with GardenSummaryCard widget

Good luck! 🌱
