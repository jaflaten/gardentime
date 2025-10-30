# Garden Management Dashboard - Implementation Plan

## Overview
We're implementing the Garden Management Dashboard feature set (Steps 64-69), with **Step 64 (Core Dashboard)** and **Step 69 (Planting Calendar with Season Planning)** as the highest priorities.

---

## Phase 1: Garden Overview Dashboard (Step 64)
**Estimated Time:** 2-3 days

### Backend Tasks
1. **Create Dashboard API Endpoint**
   - `GET /api/gardens/{gardenId}/dashboard`
   - Returns aggregated data for all dashboard widgets in single request
   - Implements caching (5-minute TTL) for performance

2. **Business Logic**
   - Calculate active crops count (PLANTED + GROWING)
   - Get recent harvests (last 5)
   - Calculate upcoming tasks (ready to harvest, diseased crops, empty areas)
   - Calculate garden capacity utilization
   - Generate mini calendar events

### Frontend Tasks
1. **Create Dashboard Route**
   - `/gardens/[id]/dashboard` or `/dashboard`
   - Responsive layout (3-column desktop, stacked mobile)

2. **Build Dashboard Widgets**
   - Garden Summary Card (total areas, active crops, last activity)
   - Active Crops Widget (donut chart with status breakdown)
   - Recent Harvests Widget (list with outcome badges)
   - Upcoming Tasks Widget (prioritized task list with actions)
   - Garden Capacity Widget (utilization bar)
   - Planting Calendar Widget (mini month view with event dots)

3. **Features**
   - Loading states for all widgets
   - Error handling with retry
   - Click-through navigation (widget → detail page)
   - Auto-refresh every 5 minutes (optional)

---

## Phase 2: Planting Calendar & Season Planning (Step 69)
**Estimated Time:** 3-4 days

### The Problem We're Solving
Many crops (tomatoes, peppers, etc.) need to be started from seed indoors 6-8 weeks before the last frost date, then transplanted outdoors when weather is warm enough. Users need help planning this timeline and remembering when to start seeds.

### Backend Tasks

#### 1. Database Migrations
**Migration V10: Season Planning Tables**
```sql
-- Season plans (Spring 2025, Fall 2025, etc.)
CREATE TABLE season_plans (
  id UUID PRIMARY KEY,
  garden_id UUID NOT NULL REFERENCES gardens(id),
  user_id UUID NOT NULL,
  season VARCHAR(50),
  year INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Planned crops for season
CREATE TABLE planned_crops (
  id UUID PRIMARY KEY,
  season_plan_id UUID NOT NULL REFERENCES season_plans(id),
  plant_id BIGINT NOT NULL REFERENCES plants(id),
  quantity INTEGER DEFAULT 1,
  preferred_grow_area_id UUID REFERENCES grow_areas(id),
  status VARCHAR(50),  -- PLANNED, SEEDS_STARTED, TRANSPLANTED, COMPLETED
  indoor_start_date DATE,
  transplant_date DATE,
  expected_harvest_date DATE,
  notes TEXT,
  crop_record_id UUID REFERENCES crop_records(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Migration V11: Garden Climate Info**
```sql
-- Store frost dates for each garden
CREATE TABLE garden_climate_info (
  garden_id UUID PRIMARY KEY REFERENCES gardens(id),
  last_frost_date DATE,      -- e.g., May 15
  first_frost_date DATE,     -- e.g., October 1
  hardiness_zone VARCHAR(10), -- e.g., "7a"
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Migration V12: Plant Pre-Planting Data**
```sql
-- Extend plant_details with indoor starting info
ALTER TABLE plant_details
ADD COLUMN weeks_before_frost_indoor INTEGER,  -- 6-8 weeks for tomatoes
ADD COLUMN can_direct_sow BOOLEAN DEFAULT true,
ADD COLUMN can_transplant BOOLEAN DEFAULT false,
ADD COLUMN frost_tolerance VARCHAR(50);  -- HARDY, SEMI_HARDY, TENDER
```

#### 2. API Endpoints

**Season Plan Management:**
- `GET /api/gardens/{gardenId}/season-plan` - Get current season plan
- `POST /api/gardens/{gardenId}/season-plan` - Create season plan
- `POST /api/gardens/{gardenId}/season-plan/planned-crops` - Add crop to plan
- `PATCH /api/gardens/{gardenId}/season-plan/planned-crops/{id}` - Update crop status
- `DELETE /api/gardens/{gardenId}/season-plan/planned-crops/{id}` - Remove from plan

**Calendar Events:**
- `GET /api/gardens/{gardenId}/calendar?startDate=X&endDate=Y` - Get all calendar events

**Climate Info:**
- `GET /api/gardens/{gardenId}/climate` - Get frost dates
- `PUT /api/gardens/{gardenId}/climate` - Update frost dates

#### 3. Date Calculation Logic

**Example for Tomatoes:**
```
User's last frost date: May 15, 2025
Tomato requirements: 6-8 weeks before frost indoors
                     70-80 days to maturity

Calculated dates:
- Indoor start: March 20 - April 1
- Transplant outdoors: May 22 (1 week after last frost)
- Expected harvest: August 5 (75 days after transplant)
```

**Implementation:**
```java
public class PlantingDateCalculator {
    public PlannedCropDates calculate(Plant plant, LocalDate lastFrostDate) {
        // Indoor start (if needed)
        LocalDate indoorStart = null;
        if (plant.getWeeksBeforeFrostIndoor() != null) {
            indoorStart = lastFrostDate.minusWeeks(plant.getWeeksBeforeFrostIndoor());
        }
        
        // Transplant date (after frost)
        LocalDate transplantDate = lastFrostDate.plusWeeks(1);
        
        // Expected harvest
        LocalDate harvestDate = transplantDate.plusDays(plant.getMaturityTime());
        
        return new PlannedCropDates(indoorStart, transplantDate, harvestDate);
    }
}
```

### Frontend Tasks

#### 1. Season Plan Creation
**Route:** `/gardens/[id]/season-plan/new`

**Form:**
- Season selector (Spring, Summer, Fall, Winter)
- Year input
- Frost dates (if not already set)
  - Last frost date picker
  - First frost date picker
  - Or ZIP code lookup (future)

#### 2. Add Crops to Plan
**Component:** Add Planned Crop Modal

**Flow:**
1. User clicks "Add Crop to Season"
2. Search/select plant
3. Enter quantity
4. Select preferred grow area (optional)
5. System shows calculated dates:
   - 🔵 Start seeds indoors: March 20
   - 🟢 Transplant outdoors: May 22
   - 🟡 Expected harvest: August 5
6. User can override dates if needed
7. Save to plan

#### 3. Season Plan Dashboard
**Component:** Season Plan Widget (on main dashboard)

**Displays:**
- Current season progress
- Upcoming tasks this week:
  - "Start basil seeds indoors (in 3 days)"
  - "Transplant tomatoes to Box 1 (in 5 days)"
- Quick stats: X planned, Y started, Z planted

#### 4. Full Calendar View
**Route:** `/gardens/[id]/calendar`

**Features:**
- Monthly calendar grid
- Color-coded events:
  - 🔵 Blue = Start seeds indoors
  - 🟢 Green = Transplant/direct sow outdoors
  - 🟡 Yellow = Expected harvest
  - 🔴 Red = Actual harvest (from crop records)
- Click event → Show details modal
- Mark as done → Update status
- Create crop record from planned crop

#### 5. Integration with Crop Records
When user marks planned crop as "Transplanted":
1. Show "Create Crop Record" modal
2. Pre-fill with data from planned crop:
   - Plant
   - Grow area
   - Date planted (transplant date)
   - Status: PLANTED
3. User confirms
4. Create crop_record
5. Link crop_record.id to planned_crop
6. Crop appears on board view

---

## Technical Considerations

### Performance
- Cache dashboard data (5-15 min TTL)
- Single API call for dashboard (avoid N+1 queries)
- Use database indexes on date fields
- Paginate long lists

### Data Integrity
- Validate frost dates (last frost < first frost)
- Validate planned crop dates are logical
- Handle edge cases (no frost zones, tropical climates)

### User Experience
- Autosave draft season plans
- Show helpful tooltips for frost dates
- Provide default frost dates by ZIP code (future)
- Allow manual override of calculated dates
- Confirmation before deleting planned crops

---

## MVP Scope (What to Build First)

### Phase 1.1: Core Dashboard (Week 1)
✅ Must Have:
- Dashboard route and layout
- Garden summary card
- Active crops widget
- Upcoming tasks widget
- Basic styling and responsiveness

⏳ Can Wait:
- Advanced charts
- Export features
- Customizable widgets

### Phase 1.2: Basic Season Planning (Week 2)
✅ Must Have:
- Season plan creation
- Add/remove planned crops
- Manual frost date entry
- Basic date calculations
- Season plan widget on dashboard

⏳ Can Wait:
- Auto-create crop records
- Calendar view
- Notifications/reminders
- ZIP code lookup for frost dates

### Phase 2: Enhanced Features (Week 3+)
- Full calendar view
- Advanced date calculations
- Integration with weather API
- Push notifications
- Succession planting suggestions

---

## Dependencies & Blockers

### Required Before Starting
- ✅ User authentication (completed)
- ✅ Gardens and grow areas (completed)
- ✅ Crop records system (completed)
- ✅ Plant database (exists, needs enhancement)

### Data Dependencies
- Need to populate plant_details with pre-planting info
  - At minimum: 10-20 common plants (tomato, pepper, lettuce, etc.)
  - Can use placeholder values initially
  
### External Dependencies
- Weather API for frost dates (future enhancement)
- Notification service (future enhancement)

---

## Success Metrics

### User Engagement
- % of users who create a season plan
- % of users who mark tasks as complete
- Average crops per season plan
- Time spent on dashboard vs board view

### Feature Adoption
- Season plans created per active user
- Planned crops that become crop records
- Calendar view visits

### User Satisfaction
- Survey: "Did season planning help you?"
- User feedback on date calculations
- Support tickets about feature

---

## Next Steps

1. **Review this plan** - Do you approve the scope and approach?
2. **Start with Dashboard Backend** - Create API endpoint
3. **Build Dashboard Frontend** - Widgets and layout
4. **Test Dashboard** - Verify all data displays correctly
5. **Move to Season Planning** - Database migrations
6. **Implement Calendar** - Date calculations and UI
7. **Integration Testing** - End-to-end flows
8. **User Testing** - Get feedback and iterate

---

## Questions - ANSWERED

1. **Frost Dates:** Should we auto-populate based on hardiness zone or let users enter manually?
   - Answer: Start with manual entry. Add note in TODO for hardiness zone auto-lookup later.

2. **Notifications:** Do you want email/push notifications when it's time to start seeds?
   - Answer: Phase 2 feature. Add note in TODO for notification reminders.

3. **Plant Data:** Should I create placeholder data for 10-20 plants with indoor starting times?
   - Answer: Yes, create placeholder data for 20 common plants with typical values.

4. **Dashboard Location:** Should dashboard be the default view when opening a garden?
   - Answer: Yes, dashboard should be default view when opening a garden.

5. **Multiple Seasons:** Can users have multiple active season plans (Spring + Fall)?
   - Answer: Yes, users should be able to have multiple seasons. Some regions have multiple growing seasons per year, and Norway can use distinct phases (early, mid, late blooming) for planning.

---

Ready to start implementation? I recommend:
1. **Step 64.1-64.3** (Dashboard backend + first 2 widgets) - Quick wins
2. **Step 69.1-69.4** (Season planning backend) - Foundation
3. **Step 69.6-69.7** (Season planning UI) - User-facing feature
4. Continue with remaining widgets and calendar view
