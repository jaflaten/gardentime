# Season Planning Feature - Detailed Explanation

## The Problem We're Solving

Many gardeners struggle with knowing **when to start seeds indoors** before transplanting them outdoors. This is especially critical for crops like tomatoes, peppers, and eggplants that need a head start before the growing season.

### Real-World Example: Growing Tomatoes in Norway

**Scenario:**
- Location: Oslo, Norway
- Last frost date: May 15 (typical for Oslo area)
- Goal: Grow tomatoes from seed

**The Challenge:**
Tomatoes need 6-8 weeks of indoor growth before they can be transplanted outdoors. If you wait until May 15 to start seeds, your tomatoes won't produce fruit until very late in the short Norwegian summer.

**The Solution:**
1. Start tomato seeds **indoors** on March 27 (7 weeks before last frost)
2. Grow seedlings on windowsill or under grow lights
3. **Transplant outdoors** on May 22 (1 week after last frost for safety)
4. **Harvest** begins around August 5 (75 days after transplanting)

Our season planning feature **automatically calculates these dates** so users don't have to!

---

## How It Works

### Step 1: Set Frost Dates (One-Time Setup)

Users enter their garden's climate information:
- **Last Frost Date:** The average date of the last spring frost (e.g., May 15)
- **First Frost Date:** The average date of the first fall frost (e.g., October 1)
- **Hardiness Zone:** USDA zone (e.g., 7a) - optional initially

**Where to Find Frost Dates:**
- Local gardening clubs
- Agricultural extension offices
- Online frost date calculators (by ZIP code or city)
- Ask experienced local gardeners

**Note:** Users enter these manually for MVP. Phase 2 will auto-populate from hardiness zone database.

---

### Step 2: Create a Season Plan

Users create a plan for a specific growing season:
- **Season:** Spring, Summer, Fall, or Winter
- **Year:** 2025
- **Phase (Optional):** Early, Mid, or Late

**Why Phases?**
In countries like Norway with short growing seasons, gardeners use phases for succession planting:
- **Early:** First crops that can handle cool weather (peas, lettuce, kale)
- **Mid:** Main season crops (tomatoes, peppers, squash)
- **Late:** Fall crops and storage vegetables (carrots, cabbage)

**Multiple Seasons:**
Users can have multiple active season plans:
- Tropical regions: Multiple growing seasons per year
- Norway: Spring, Summer, Fall plans with different phases

---

### Step 3: Add Crops to the Plan

For each crop user wants to grow, they:
1. **Select Plant:** Choose from plant database (e.g., "Tomato")
2. **Enter Quantity:** How many plants (e.g., 6 tomato plants)
3. **Choose Grow Area:** Preferred location (e.g., "Greenhouse Box 1")
4. **Set Phase:** Early, Mid, or Late (optional)

**System Automatically Calculates:**
- 🔵 **Indoor Start Date:** When to plant seeds indoors (if needed)
- 🟢 **Transplant/Direct Sow Date:** When to move to garden
- 🟡 **Expected Harvest Date:** When crop should be ready

---

### Step 4: Date Calculation Logic

The system uses plant-specific data to calculate optimal planting dates.

#### Plant Data (from `plant_details` table)
Each plant has:
- `weeks_before_frost_indoor`: How many weeks before last frost to start indoors
- `can_direct_sow`: Whether can be planted directly in garden
- `can_transplant`: Whether can be started indoors and moved out
- `frost_tolerance`: HARDY, SEMI_HARDY, or TENDER
- `maturity_time`: Days from planting to harvest

#### Calculation Examples

**Example 1: Tomato (Transplant Only)**
```
Plant Data:
- weeks_before_frost_indoor: 7
- can_direct_sow: false
- can_transplant: true
- frost_tolerance: TENDER
- maturity_time: 75 days

Garden Data:
- last_frost_date: May 15, 2025

Calculated Dates:
- Indoor Start: May 15 - 7 weeks = March 27, 2025
- Transplant: May 15 + 1 week = May 22, 2025 (wait for safe temps)
- Expected Harvest: May 22 + 75 days = August 5, 2025
```

**Example 2: Lettuce (Both Methods)**
```
Plant Data:
- weeks_before_frost_indoor: 4
- can_direct_sow: true
- can_transplant: true
- frost_tolerance: HARDY
- maturity_time: 50 days

Garden Data:
- last_frost_date: May 15, 2025

Calculated Dates:
Option A - Indoor Start:
- Indoor Start: May 15 - 4 weeks = April 17, 2025
- Transplant: May 1, 2025 (can go earlier, it's hardy)
- Expected Harvest: May 1 + 50 days = June 20, 2025

Option B - Direct Sow:
- Direct Sow: April 17, 2025 (4 weeks before frost)
- Expected Harvest: April 17 + 50 days = June 6, 2025
```

**Example 3: Carrot (Direct Sow Only)**
```
Plant Data:
- weeks_before_frost_indoor: NULL (can't transplant)
- can_direct_sow: true
- can_transplant: false
- frost_tolerance: HARDY
- maturity_time: 70 days

Garden Data:
- last_frost_date: May 15, 2025

Calculated Dates:
- Direct Sow: April 24, 2025 (3 weeks before frost)
- Expected Harvest: April 24 + 70 days = July 3, 2025
```

---

### Step 5: Following the Plan

#### Dashboard Shows Upcoming Tasks
```
📅 This Week:
- 🔵 Start basil seeds indoors (in 3 days)
- 🟢 Transplant lettuce to Box 2 (in 5 days)

📅 Next Week:
- 🔵 Start pepper seeds indoors (in 9 days)
- 🟢 Direct sow carrots in Bed 1 (in 12 days)
```

#### User Actions & Status Updates

**Statuses:**
1. **PLANNED** - Crop is in the plan, no action taken yet
2. **SEEDS_STARTED** - Seeds planted indoors
3. **TRANSPLANTED** - Moved to garden (creates crop record)
4. **DIRECT_SOWN** - Planted directly in garden (creates crop record)
5. **GROWING** - Actively growing in garden
6. **COMPLETED** - Harvested

**Workflow A: Indoor Start → Transplant**
```
1. User sees: "Start tomato seeds indoors (today)"
2. User marks as "Seeds Started"
   - Status changes to SEEDS_STARTED
   - Calendar shows completed (checkmark)
   
3. Later, user sees: "Transplant tomatoes to Box 1 (today)"
4. User clicks "Transplant"
   - Modal appears: "Create Crop Record"
   - Pre-filled: Plant=Tomato, GrowArea=Box 1, Date=today, Status=PLANTED
   - User confirms
   - crop_record created in database
   - planned_crop.status = TRANSPLANTED
   - planned_crop.crop_record_id = new crop record ID
   - Tomato appears on garden board immediately!
```

**Workflow B: Direct Sow**
```
1. User sees: "Direct sow carrots in Bed 1 (today)"
2. User clicks "Plant Now"
   - Modal appears: "Create Crop Record"
   - Pre-filled: Plant=Carrot, GrowArea=Bed 1, Date=today, Status=PLANTED
   - User confirms
   - crop_record created
   - planned_crop.status = DIRECT_SOWN
   - Carrots appear on garden board!
```

---

### Step 6: Calendar View

Full calendar displays all events in visual timeline:

**Color Coding:**
- 🔵 **Blue Dots:** Indoor seed starting dates
- 🟢 **Green Dots:** Outdoor planting/transplanting dates
- 🟡 **Yellow Dots:** Expected harvest dates (from planned crops)
- 🔴 **Red Dots:** Actual harvest dates (from completed crop records)

**Example Calendar - April 2025**
```
Mon  Tue  Wed  Thu  Fri  Sat  Sun
     1    2    3    4    5    6
     🔵   
     Basil
     
7    8    9    10   11   12   13
          🟢
          Lettuce
          
14   15   16   17   18   19   20
     🔵        🟢
     Pepper    Carrot
     
21   22   23   24   25   26   27
🔵   
Tomato

28   29   30
```

**Interactions:**
- Click date → See all events for that day
- Click event → Details modal with quick actions
- Mark as done → Update status
- Create crop record → Opens pre-filled form

---

## Benefits for Users

### 1. **Never Miss Planting Windows**
- Automated reminders for seed starting
- Calculated dates based on local climate
- No more guesswork or missed deadlines

### 2. **Optimize Harvest Timing**
- Plan succession plantings for continuous harvest
- Stagger crops using early/mid/late phases
- Maximize growing season productivity

### 3. **Learn Growing Requirements**
- See which crops need indoor start vs. direct sow
- Understand frost tolerance differences
- Build gardening knowledge over time

### 4. **Seamless Workflow**
- From plan → seed starting → transplanting → crop record
- All steps connected and tracked
- Garden board auto-updates

### 5. **Multi-Season Planning**
- Plan entire year ahead
- Support for multiple growing seasons
- Spring/summer/fall planning for year-round gardens

---

## Technical Architecture

### Database Tables

**season_plans**
- Represents a growing season (e.g., "Spring 2025")
- Links to garden
- Can have multiple per garden

**planned_crops**
- Individual crop in a season plan
- Stores calculated dates
- Links to plant, grow area, and eventually crop_record
- Tracks status through workflow

**garden_climate_info**
- Stores frost dates for each garden
- One-time setup, reused across seasons
- Will be auto-populated in Phase 2

**plant_details (extended)**
- Added fields for indoor starting requirements
- Populated with 20 common plants initially
- Will sync with plant-data-aggregator API later

### API Flow

**Creating Planned Crop:**
```
Frontend (Add Crop Modal)
  ↓
  POST /api/gardens/{id}/season-plan/planned-crops
  {
    plantId: 123,
    quantity: 6,
    preferredGrowAreaId: "uuid",
    phase: "MID"
  }
  ↓
Backend (SeasonPlanService)
  ↓
  PlantingDateCalculator.calculate(plant, lastFrostDate)
  ↓
  Save planned_crop with calculated dates
  ↓
  Return PlannedCropDTO with all dates
```

**Transplanting Planned Crop:**
```
Frontend (Season Plan Page)
  ↓
  User clicks "Transplant" button
  ↓
  Frontend shows CreateCropRecordModal
  (pre-filled from planned_crop)
  ↓
  User confirms
  ↓
  POST /api/crop-records
  {
    growAreaId: "uuid",
    plantId: 123,
    datePlanted: "2025-05-22",
    status: "PLANTED"
  }
  ↓
  Backend creates crop_record
  ↓
  PATCH /api/season-plan/planned-crops/{id}
  {
    status: "TRANSPLANTED",
    cropRecordId: "new-uuid"
  }
  ↓
  Frontend refreshes garden board
  ↓
  Crop appears on board!
```

---

## Data Sources

### Current (MVP)
- **Frost Dates:** User manual entry
- **Plant Data:** Placeholder data for 20 common plants (see `/docs/placeholder-plant-data.sql`)
- **Calculations:** Simple algorithm based on weeks before frost

### Future (Phase 2+)
- **Frost Dates:** Auto-populate from hardiness zone database
- **Plant Data:** Sync with plant-data-aggregator API
- **Weather:** Real-time weather data to adjust recommendations
- **Community:** Learn from other users' success/failure data

---

## User Experience Highlights

### First-Time User Flow
1. Create garden → Set location
2. Prompted to enter frost dates (helpful tooltips provided)
3. Create season plan (Spring 2025)
4. Add first crops (tomatoes, lettuce, basil)
5. See calculated dates immediately
6. Dashboard shows "Start tomato seeds in 2 weeks"
7. User knows exactly what to do and when!

### Experienced User Flow
1. Open garden → Dashboard shows upcoming tasks
2. "Start basil seeds today" → Mark as done
3. Check calendar → See all planned events
4. Transplant tomatoes → Creates crop record automatically
5. Garden board updates → See tomatoes on visual board
6. Plan next succession planting

### Mobile Experience
- Dashboard optimized for mobile (stacked widgets)
- Quick actions (mark as done) easy to tap
- Calendar swipeable by month
- Notifications (Phase 2) on phone

---

## Success Metrics

### User Engagement
- % of users who create season plans
- % of planned crops that become crop records
- Average time from sign-up to first season plan
- Calendar view usage

### Feature Effectiveness
- Accuracy of date calculations (user feedback)
- % of crops marked "on time" vs. late
- Season plan completion rate

### User Satisfaction
- Survey: "Did season planning help you grow better crops?"
- NPS score for feature
- Support tickets related to feature

---

## Future Enhancements

### Phase 2
- Email/push notifications for seed starting reminders
- Auto-populate frost dates from ZIP code
- Weather integration (adjust dates based on actual weather)
- Succession planting suggestions

### Phase 3
- Crop rotation integration (suggest where to plant based on rotation)
- Companion planting recommendations
- Soil preparation reminders
- Seed inventory tracking

### Phase 4
- Share season plans with friends
- Season plan templates (beginner's salad garden, etc.)
- Import/export season plans
- Community season plans library

---

## Why This Matters

This feature transforms GardenTime from a simple tracking tool into a **proactive gardening assistant**. Instead of just recording what happened, we help users **plan ahead and succeed**.

For users in challenging climates (like Norway with short growing seasons), this is **essential** for maximizing harvests. For beginners, it removes the mystery and builds confidence.

By connecting season planning → seed starting → transplanting → crop records → garden board, we create a seamless workflow that guides users through the entire growing cycle.

🌱 **This is the feature that makes GardenTime indispensable for serious gardeners.**
