# Garden Management Dashboard - Feature Specification (Steps 64-68)

## Overview
Create comprehensive dashboards that give users insights into their garden's health, productivity, and planning needs. Transform raw data into actionable intelligence.

---

## Step 64: Garden Overview Dashboard

### Purpose
Provide users with a high-level view of their garden's current state and key metrics at a glance.

### User Stories
- As a user, I want to see my garden's health at a glance when I log in
- As a user, I want to quickly understand what needs attention in my garden
- As a user, I want to track my gardening progress over time

### Frontend Requirements

#### Route: `/gardens/[id]/dashboard` or `/dashboard`
Main dashboard page for garden overview

---

### Dashboard Widgets

#### 1. Garden Summary Card
**Displays:**
- Garden name
- Total grow areas
- Active grow areas (with current crops)
- Inactive/empty grow areas
- Total area under cultivation (sum of grow area sizes)
- Last activity date

**Visual:**
- Large card at top of dashboard
- Icon indicators for each metric
- Quick link to garden settings

---

#### 2. Active Crops Widget
**Displays:**
- Total active crops (PLANTED + GROWING status)
- Breakdown by status:
  - 🌱 Planted: X crops
  - 🌿 Growing: X crops
  - 📅 Ready to harvest soon: X crops (within 7 days of expected harvest)
- Visual: Donut chart or progress bars

**Interactions:**
- Click segment → Filter crops by that status
- "View All" link → Navigate to `/crops` with filter

---

#### 3. Recent Harvests Widget
**Displays:**
- Last 5 harvested crops
- Harvest date
- Quantity harvested
- Outcome rating
- Total harvested this month/season

**Visual:**
- List with plant icons
- Color-coded outcome badges (green=excellent, yellow=good, etc.)

**Interactions:**
- Click crop → View crop detail
- "View All Harvests" → Navigate to `/crops?status=HARVESTED`

---

#### 4. Upcoming Tasks Widget
**Displays:**
- Crops ready to harvest (expected harvest date ≤ today)
- Crops to harvest soon (within 7 days)
- Areas needing attention (failed/diseased crops)
- Empty grow areas ready for planting

**Visual:**
- Task list with priority indicators
- Due date badges (overdue, today, this week)
- Action buttons (Mark Harvested, View, Dismiss)

**Interactions:**
- Click task → Quick action or navigate to relevant page
- "Dismiss" → Hide task from list
- "Mark Harvested" → Quick harvest modal

---

#### 5. Garden Capacity Widget
**Displays:**
- Space utilization: X% of grow areas in use
- Visual capacity bar
- Recommendations:
  - "You have 3 empty boxes ready for planting"
  - "Box 2 is crowded with 5 crops"

**Visual:**
- Horizontal bar showing used/available space
- Color gradient (green=good, yellow=near capacity, red=overcrowded)

**Interactions:**
- Click empty areas → Navigate to grow area for planting
- Click crowded areas → Show warning about overcrowding

---

#### 6. Planting Calendar Widget (Mini)
**Displays:**
- Current month calendar
- Dots/indicators on dates with plantings or harvests
- Color coding:
  - Blue dot = seed pre-planting day (indoors)
  - Green dot = planting/transplanting day (outdoors)
  - Yellow dot = expected harvest day
  - Red dot = actual harvest day

**Visual:**
- Small calendar grid
- Tooltip on hover showing events for that day

**Interactions:**
- Click date → Show details in modal or navigate to timeline
- "View Full Calendar" → Navigate to full planting calendar view

---

#### 7. Weather Widget (Future Integration)
**Displays:**
- Current temperature
- 7-day forecast
- Alerts (frost warning, heat wave, etc.)
- Watering recommendations based on weather

**Data Source:**
- Weather API (OpenWeatherMap, Weather.gov)
- User's location (from garden settings)

**Note:** This is a future enhancement requiring weather API integration

---

### Dashboard Layout

**Desktop Layout (3-column grid):**
```
┌────────────────────────────────────────────────┐
│          Garden Summary Card (full width)       │
├─────────────────┬─────────────────┬────────────┤
│  Active Crops   │ Recent Harvests │  Capacity  │
├─────────────────┼─────────────────┼────────────┤
│ Upcoming Tasks  │ Planting Cal    │  Weather   │
└─────────────────┴─────────────────┴────────────┘
```

**Mobile Layout (single column, stacked):**
- Garden Summary
- Upcoming Tasks (most important)
- Active Crops
- Recent Harvests
- Capacity
- Planting Calendar
- Weather

---

### Backend Requirements

#### API Endpoint: GET /api/gardens/{gardenId}/dashboard
**Purpose:** Fetch all dashboard data in a single request to minimize API calls

**Response:**
```json
{
  "summary": {
    "gardenName": "Main Garden",
    "totalGrowAreas": 12,
    "activeGrowAreas": 8,
    "inactiveGrowAreas": 4,
    "totalAreaCm2": 96000,
    "lastActivityDate": "2025-10-29"
  },
  "activeCrops": {
    "total": 23,
    "planted": 5,
    "growing": 15,
    "readyToHarvest": 3
  },
  "recentHarvests": [
    {
      "id": "uuid",
      "plantName": "Tomato",
      "harvestDate": "2025-10-25",
      "quantity": 2.5,
      "unit": "kg",
      "outcome": "EXCELLENT"
    }
  ],
  "upcomingTasks": [
    {
      "type": "HARVEST_READY",
      "cropId": "uuid",
      "plantName": "Lettuce",
      "growAreaName": "Box 1",
      "expectedDate": "2025-10-30",
      "daysOverdue": 0
    },
    {
      "type": "ATTENTION_NEEDED",
      "cropId": "uuid",
      "plantName": "Cucumber",
      "growAreaName": "Box 3",
      "reason": "DISEASED"
    }
  ],
  "capacity": {
    "totalGrowAreas": 12,
    "inUseGrowAreas": 8,
    "utilizationPercent": 66.7,
    "emptyGrowAreas": ["Box 5", "Box 7", "Bed 1", "Bucket 2"],
    "crowdedGrowAreas": []
  },
  "plantingCalendar": {
    "month": "2025-10",
    "events": [
      {
        "date": "2025-10-15",
        "type": "PLANTED",
        "plantName": "Carrot",
        "count": 2
      },
      {
        "date": "2025-10-30",
        "type": "EXPECTED_HARVEST",
        "plantName": "Lettuce",
        "count": 1
      }
    ]
  }
}
```

**Business Logic:**
- Calculate all metrics from crop records and grow areas
- Sort recent harvests by date (newest first)
- Prioritize tasks: overdue harvests > diseased crops > ready to harvest > empty areas
- Calculate expected harvest dates using plant maturity times
- Cache results for 5 minutes to reduce database load

**Performance:**
- Use single query with JOINs to fetch all needed data
- Denormalize some calculations for speed
- Consider materialized views for complex statistics

---

## Step 65: Garden Statistics & Analytics

### Purpose
Provide detailed analytics about garden productivity, success rates, and trends over time.

### User Stories
- As a user, I want to see which plants perform best in my garden
- As a user, I want to track my harvest yields over time
- As a user, I want to identify patterns in crop failures

### Dashboard Widgets

#### 1. Productivity Over Time Chart
**Displays:**
- Monthly harvest quantities over the past year
- Line or bar chart
- Optional: Compare multiple years

**Metrics:**
- Total harvests per month
- Total quantity harvested (kg, items, etc.)
- Number of crops planted vs harvested

**Filters:**
- Time range (last month, 3 months, year, all time)
- Plant type filter
- Grow area filter

**Chart Library:** Chart.js, Recharts, or Apache ECharts

---

#### 2. Plant Performance Leaderboard
**Displays:**
- Top 10 performing plants by:
  - Harvest yield (total quantity)
  - Success rate (harvested / planted)
  - Average outcome rating
- Visual: Table with sortable columns

**Columns:**
- Plant name
- Times planted
- Times harvested
- Success rate %
- Average yield
- Average outcome

**Interactions:**
- Click plant → View all crop records for that plant
- Sort by any column

---

#### 3. Success Rate by Plant Type
**Displays:**
- Pie or donut chart showing success rates
- Breakdown by plant type (ROOT_VEGETABLE, LEAFY_GREEN, etc.)
- Percentage of crops that reached HARVESTED status

**Insights:**
- "Your tomatoes have a 95% success rate!"
- "Leafy greens perform best in your garden"
- "Root vegetables struggle (60% success rate) - consider soil amendments"

---

#### 4. Seasonal Performance
**Displays:**
- Which seasons produce the most harvests
- Bar chart comparing Spring, Summer, Autumn, Winter
- Metrics:
  - Number of crops harvested
  - Total yield
  - Average outcome rating

**Insights:**
- "Summer is your most productive season"
- "Winter harvests are 40% lower - consider cold-hardy crops"

---

#### 5. Grow Area Efficiency
**Displays:**
- Which grow areas produce the most
- Table or bar chart comparing all grow areas
- Metrics per grow area:
  - Total crops grown
  - Total yield
  - Success rate
  - Average days to harvest

**Insights:**
- "Box 1 is your most productive area (15 crops/year)"
- "Field 2 has low success rate (45%) - check soil conditions"

---

#### 6. Crop Rotation Compliance
**Displays:**
- How well user follows crop rotation principles
- Visual indicator (score out of 100)
- Breakdown:
  - Areas with good rotation (different plant families each season)
  - Areas with poor rotation (same family planted repeatedly)
  - Recommendations for next plantings

**Calculation:**
- Check if successive crops in same grow area are from different plant families
- Higher score = better rotation practices

**Note:** This requires tracking plant families and analyzing planting sequences

---

### Backend Requirements

#### API Endpoint: GET /api/gardens/{gardenId}/statistics
**Purpose:** Fetch comprehensive statistics for analytics dashboard

**Query Parameters:**
- `startDate` (optional): Start of date range
- `endDate` (optional): End of date range
- `groupBy` (optional): month, quarter, year
- `metrics` (optional): Comma-separated list of metrics to include

**Response:**
```json
{
  "productivityOverTime": [
    {
      "period": "2025-10",
      "cropsPlanted": 12,
      "cropsHarvested": 8,
      "totalYieldKg": 15.5,
      "averageOutcome": 4.2
    }
  ],
  "plantPerformance": [
    {
      "plantId": 123,
      "plantName": "Tomato",
      "timesPlanted": 25,
      "timesHarvested": 24,
      "successRate": 96.0,
      "averageYieldKg": 2.5,
      "averageOutcome": 4.5
    }
  ],
  "successRateByType": {
    "FRUIT_VEGETABLE": 92.5,
    "LEAFY_GREEN": 87.0,
    "ROOT_VEGETABLE": 78.5,
    "HERB": 95.0,
    "LEGUME": 82.0
  },
  "seasonalPerformance": {
    "SPRING": {"harvests": 45, "yieldKg": 67.5, "avgOutcome": 4.2},
    "SUMMER": {"harvests": 78, "yieldKg": 125.3, "avgOutcome": 4.5},
    "AUTUMN": {"harvests": 52, "yieldKg": 88.2, "avgOutcome": 4.1},
    "WINTER": {"harvests": 15, "yieldKg": 22.0, "avgOutcome": 3.8}
  },
  "growAreaEfficiency": [
    {
      "growAreaId": "uuid",
      "growAreaName": "Box 1",
      "cropsGrown": 35,
      "successRate": 94.3,
      "totalYieldKg": 45.2,
      "avgDaysToHarvest": 72
    }
  ],
  "cropRotationScore": 78,
  "cropRotationDetails": {
    "goodRotation": 8,
    "poorRotation": 2,
    "recommendations": [
      "Plant legumes in Box 3 to follow the heavy feeder tomatoes",
      "Rotate Box 5 to root vegetables after leafy greens"
    ]
  }
}
```

**Complex Queries:**
- Aggregate crop records by time periods
- Calculate success rates (HARVESTED / total)
- Join with plants table to get plant types
- Group by plant families for rotation analysis
- Calculate weighted averages for outcome scores

**Performance Considerations:**
- These queries can be expensive - implement caching
- Consider pre-calculating daily/weekly statistics in background jobs
- Use database views or materialized views for complex aggregations
- Paginate large result sets

---

## Step 66: Garden Switching & Multi-Garden Management

### Purpose
Allow users to manage multiple gardens and easily switch between them.

### User Stories
- As a user, I want to manage multiple gardens (home, community plot, greenhouse)
- As a user, I want to quickly switch between my gardens
- As a user, I want to compare performance across gardens

### Frontend Requirements

#### Garden Switcher Component
**Location:** Top navigation bar or sidebar

**Displays:**
- Current garden name
- Dropdown arrow

**Click → Dropdown Menu:**
- List of all user's gardens
- Current garden indicated (checkmark or bold)
- Quick stats per garden (X crops, Y areas)
- "Create New Garden" option
- "Manage Gardens" option

**Interactions:**
- Click garden → Switch active garden, reload page with new gardenId
- Click "Create New Garden" → Open create garden modal
- Click "Manage Gardens" → Navigate to `/gardens` (garden management page)

---

#### Gardens Management Page (`/gardens`)
**Displays:**
- Grid or list of all user's gardens
- Each garden card shows:
  - Garden name
  - Location (if set)
  - Number of grow areas
  - Number of active crops
  - Last activity date
  - Preview image or icon
  - Actions: View, Edit, Delete

**Features:**
- Create new garden button
- Search gardens by name
- Sort by name, last activity, size
- Archive inactive gardens

---

#### Multi-Garden Dashboard (`/dashboard/all`)
**Purpose:** View statistics across ALL user's gardens

**Displays:**
- Total crops across all gardens
- Total harvests across all gardens
- Comparison charts:
  - Production by garden (bar chart)
  - Success rate by garden
  - Most productive garden
- Recent activity across all gardens

**Use Case:**
- User manages home garden + community plot + greenhouse
- Wants to see overall performance and identify which garden is most successful

---

### Backend Requirements

#### Existing Endpoints to Verify:
- GET /api/gardens - List all user's gardens ✓ (probably already exists)
- POST /api/gardens - Create new garden ✓
- PUT /api/gardens/{id} - Update garden ✓
- DELETE /api/gardens/{id} - Delete garden ✓

#### New Endpoint: GET /api/gardens/summary
**Purpose:** Get summary statistics for all user's gardens

**Response:**
```json
{
  "totalGardens": 3,
  "gardens": [
    {
      "id": "uuid",
      "name": "Main Garden",
      "location": "Home",
      "growAreasCount": 12,
      "activeCropsCount": 23,
      "lastActivityDate": "2025-10-29",
      "totalHarvestsThisYear": 145
    }
  ]
}
```

---

## Step 67: Garden Templates

### Purpose
Provide pre-configured garden layouts and planting plans to help beginners get started quickly.

### User Stories
- As a new user, I want to start with a pre-designed garden layout
- As a user, I want to save my garden as a template for future use
- As a user, I want to share my successful garden layout with others

### Template Categories

#### 1. By Garden Size
- Small Space (balcony, patio) - 4 containers
- Medium (backyard) - 6-8 raised beds
- Large (homestead) - 12+ beds and fields

#### 2. By Climate Zone
- Tropical
- Subtropical
- Temperate
- Cold Climate
- Arid/Desert

#### 3. By Garden Type
- Vegetable Garden
- Herb Garden
- Pollinator Garden
- Cut Flower Garden
- Permaculture Food Forest
- Square Foot Garden

#### 4. By Goal
- Beginner's First Garden
- Salad Garden (year-round greens)
- Canning & Preservation Garden
- Low-Maintenance Garden
- Maximum Yield Garden

---

### Template Structure

**Garden Template:**
```json
{
  "id": "template-001",
  "name": "Beginner Vegetable Garden",
  "description": "Perfect starter garden with easy-to-grow vegetables",
  "category": "Vegetable Garden",
  "difficulty": "Beginner",
  "size": "Medium",
  "climateZones": ["Temperate", "Subtropical"],
  "gardenLayout": {
    "name": "My First Vegetable Garden",
    "growAreas": [
      {
        "name": "Tomato Bed",
        "zoneType": "BOX",
        "width": 120,
        "length": 80,
        "positionX": 100,
        "positionY": 100,
        "suggestedCrops": [
          {
            "plantId": 123,
            "plantName": "Cherry Tomato",
            "quantity": 3,
            "notes": "Space 60cm apart"
          }
        ]
      },
      {
        "name": "Lettuce Bed",
        "zoneType": "BOX",
        "width": 120,
        "length": 80,
        "positionX": 250,
        "positionY": 100,
        "suggestedCrops": [
          {
            "plantId": 456,
            "plantName": "Butterhead Lettuce",
            "quantity": 6,
            "notes": "Succession plant every 2 weeks"
          }
        ]
      }
    ]
  },
  "tags": ["vegetables", "beginner", "summer"],
  "authorId": "system",
  "rating": 4.5,
  "usageCount": 1250,
  "createdAt": "2025-01-01"
}
```

---

### Frontend Requirements

#### Template Gallery Page (`/templates`)
**Displays:**
- Browse garden templates
- Filter by category, difficulty, size, climate
- Search by name or tags
- Preview template layout
- Template cards showing:
  - Name
  - Preview image or layout diagram
  - Difficulty badge
  - Size badge
  - Rating stars
  - "Use This Template" button

**Template Detail Modal:**
- Full description
- List of grow areas
- Suggested crops for each area
- Estimated setup time
- Estimated cost
- User reviews/ratings
- "Apply Template" button

**Apply Template Flow:**
1. Click "Use This Template"
2. Modal: "Create new garden from template?"
   - Garden name (pre-filled, editable)
   - Confirm button
3. System creates:
   - New garden
   - All grow areas from template
   - Optionally: Create crop records with suggested plants (in PLANNED status)
4. Redirect to new garden board view

---

#### Create Custom Template
**Route:** `/gardens/[id]/save-as-template`

**Form:**
- Template name
- Description
- Category selection
- Difficulty level
- Climate zones (multi-select)
- Tags
- Make public checkbox (share with community)

**Result:**
- Saves current garden layout as template
- Optionally shares to public template gallery

---

### Backend Requirements

#### API Endpoints:

**GET /api/templates**
- List all available templates (system + user's own)
- Filter by category, difficulty, climateZone
- Paginate results

**GET /api/templates/{templateId}**
- Get full template details

**POST /api/templates/apply**
- Request body: `{ "templateId": "string", "gardenName": "string" }`
- Creates new garden from template
- Returns new gardenId

**POST /api/templates**
- Create custom template from user's garden
- Request body: Template structure (see above)

**DELETE /api/templates/{templateId}**
- Delete user's custom template (only if user is author)

---

#### Database Schema Addition:

**garden_templates table:**
```sql
CREATE TABLE garden_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  difficulty VARCHAR(50),
  size VARCHAR(50),
  climate_zones VARCHAR(255),  -- JSON array
  layout_data JSONB NOT NULL,  -- Full garden layout
  tags VARCHAR(255),  -- Comma-separated
  author_id UUID,  -- NULL for system templates
  is_public BOOLEAN DEFAULT false,
  rating DECIMAL(3,2),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Step 68: Garden Activity Feed

### Purpose
Show a chronological feed of all activities in the garden to help users track what they've done and when.

### User Stories
- As a user, I want to see a history of all actions in my garden
- As a user, I want to remember when I last watered or fertilized
- As a user, I want to see patterns in my gardening activities

### Activity Types

1. **Crop Activities:**
   - Crop planted
   - Crop harvested
   - Crop status changed (DISEASED, FAILED)
   - Crop deleted

2. **Garden Structure:**
   - Grow area created
   - Grow area modified (name, size, position)
   - Grow area deleted
   - Garden settings changed

3. **Maintenance Activities (Future):**
   - Watered
   - Fertilized
   - Pruned
   - Pest control applied
   - Soil amended

4. **Notes & Observations:**
   - User added note to crop
   - User updated crop notes

---

### Frontend Requirements

#### Activity Feed Widget
**Location:** 
- Garden dashboard (right sidebar)
- Dedicated page `/gardens/[id]/activity`

**Display:**
- Reverse chronological list
- Group by date (Today, Yesterday, This Week, etc.)
- Each activity shows:
  - Icon (plant for crop, wrench for structure, etc.)
  - Activity description
  - Timestamp (relative: "2 hours ago" or absolute: "Oct 29, 2:30 PM")
  - Actor (user name/avatar)
  - Link to related object (crop, grow area)

**Example Activities:**
```
Today
🌱 Planted 3 Tomato plants in Box 1 — 2 hours ago
✏️  Updated notes for Lettuce in Box 2 — 4 hours ago

Yesterday
🥬 Harvested 2.5 kg of Kale from Box 3 — Yesterday at 3:45 PM
🔧 Created new grow area "Herb Box" — Yesterday at 10:20 AM

This Week
🌿 Marked Cucumber as DISEASED in Box 5 — Oct 28, 2:15 PM
❌ Deleted Radish crop from Box 1 — Oct 27, 4:30 PM
```

**Features:**
- Infinite scroll or pagination
- Filter by activity type
- Search by plant name or grow area
- Export activity log to CSV

---

### Backend Requirements

#### Database Schema:

**garden_activities table:**
```sql
CREATE TABLE garden_activities (
  id UUID PRIMARY KEY,
  garden_id UUID NOT NULL REFERENCES gardens(id),
  activity_type VARCHAR(100) NOT NULL,  -- CROP_PLANTED, CROP_HARVESTED, etc.
  entity_type VARCHAR(50),  -- CROP, GROW_AREA, GARDEN
  entity_id VARCHAR(255),  -- UUID of related entity
  description TEXT NOT NULL,
  metadata JSONB,  -- Additional data (plant name, quantity, etc.)
  user_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_garden_activities_garden_id ON garden_activities(garden_id);
CREATE INDEX idx_garden_activities_created_at ON garden_activities(created_at DESC);
```

---

#### API Endpoints:

**GET /api/gardens/{gardenId}/activities**
- Fetch activity feed for garden
- Query params:
  - `page`, `size` (pagination)
  - `activityType` (filter)
  - `since` (date filter)
  - `entityType` (filter)

**Response:**
```json
{
  "content": [
    {
      "id": "uuid",
      "activityType": "CROP_PLANTED",
      "entityType": "CROP",
      "entityId": "uuid",
      "description": "Planted 3 Tomato plants in Box 1",
      "metadata": {
        "plantName": "Tomato",
        "quantity": 3,
        "growAreaName": "Box 1"
      },
      "userId": "uuid",
      "userName": "John Doe",
      "createdAt": "2025-10-30T14:30:00Z"
    }
  ],
  "totalElements": 245,
  "currentPage": 0
}
```

---

#### Activity Tracking Implementation

**Option 1: Event Listeners**
- Use Spring ApplicationEventPublisher
- Emit events when entities change
- Event listeners save to activities table

**Option 2: Service Layer**
- Modify service methods to log activities
- Call `activityService.log()` after each action

**Option 3: Database Triggers**
- PostgreSQL triggers on crop_records, grow_areas tables
- Automatically insert into activities table

**Recommendation:** Option 1 (Event Listeners) for maintainability and flexibility

---

## Step 69: Planting Calendar & Season Planning

### Purpose
Provide users with a comprehensive planting calendar that helps them plan their growing season, including when to start seeds indoors before transplanting outdoors.

### User Stories
- As a user, I want to plan what crops to grow this season so I can prepare and purchase seeds
- As a user, I want to know when to start seeds indoors so I don't miss the planting window
- As a user, I want to be notified when it's time to pre-plant seeds based on my location and frost dates
- As a user, I want to see a full calendar view of all my planting and harvesting activities

### Frontend Requirements

#### Route: `/gardens/[id]/calendar` or `/calendar`
Full planting calendar page with season planning

---

### Season Planning Feature

#### 1. Crop Planning List
**Purpose:** Let users select which crops they want to grow in the upcoming season

**Displays:**
- List of plants user wants to grow this season
- Each entry shows:
  - Plant name
  - Quantity planned
  - Preferred grow areas
  - Start seeds indoors date (calculated from frost dates)
  - Transplant/direct sow date
  - Expected harvest date
  - Status badge (Not Started, Seeds Started, Planted, Growing, Harvested)

**Interactions:**
- Add crop to season plan
- Remove crop from plan
- Mark as "Seeds Started" when user plants indoors
- Mark as "Transplanted" when moved to garden
- Auto-create crop records when transplanted

---

#### 2. Indoor Seed Starting Alerts
**Purpose:** Notify users when to start seeds indoors based on their last frost date

**Calculation:**
- Last Frost Date (user's location) - Plant's "weeks before frost" = Indoor start date
- Example: Tomatoes need 6-8 weeks before frost
  - Last frost: May 15
  - Start seeds indoors: March 20 - April 1

**Alert Types:**
- "Start seeds this week" (7 days before indoor start date)
- "Last chance to start seeds" (on indoor start date)
- "Transplant window opening soon" (2 weeks before transplant date)
- "Frost danger passed - transplant now" (after last frost date)

**Visual:**
- Calendar events for each seed starting date
- Push notifications (future feature)
- Email reminders (future feature)

---

#### 3. Full Planting Calendar View

**Layout:**
- Monthly calendar grid (like Google Calendar)
- Year selector at top
- Month navigation (< October 2025 >)
- Week view / Month view toggle

**Events on Calendar:**
- 🔵 Blue: Indoor seed starting
- 🟢 Green: Outdoor planting/transplanting
- 🟡 Yellow: Expected harvest
- 🔴 Red: Actual harvest (completed)
- 🟠 Orange: Maintenance reminders (future: watering, fertilizing)

**Event Details (hover/click):**
- Plant name
- Action required (e.g., "Start tomato seeds indoors")
- Grow area (if assigned)
- Days until action
- Quick action button ("Mark as Done", "Snooze")

---

#### 4. Season Plan Dashboard Widget

**Displays in main dashboard:**
- Upcoming tasks this week
  - "Start basil seeds indoors (3 days)"
  - "Transplant tomatoes to Box 1 (5 days)"
  - "Direct sow carrots in Bed 2 (1 day)"
- Season progress bar
  - "Spring 2025: 12/20 crops planted (60%)"
- Quick stats
  - Planned: 20 crops
  - Seeds started: 8
  - Transplanted: 4
  - Harvested: 0

---

### Backend Requirements

#### New Data Model: Season Plan

**season_plans table:**
```sql
CREATE TABLE season_plans (
  id UUID PRIMARY KEY,
  garden_id UUID NOT NULL REFERENCES gardens(id),
  user_id UUID NOT NULL,
  season VARCHAR(50),  -- e.g., "Spring 2025"
  year INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_season_plans_garden_id ON season_plans(garden_id);
CREATE INDEX idx_season_plans_user_id ON season_plans(user_id);
```

**planned_crops table:**
```sql
-- Planned crops for season
-- Supports both direct sow and indoor seed starting workflows
CREATE TABLE planned_crops (
  id UUID PRIMARY KEY,
  season_plan_id UUID NOT NULL REFERENCES season_plans(id),
  plant_id BIGINT NOT NULL REFERENCES plants(id),
  quantity INTEGER DEFAULT 1,
  preferred_grow_area_id UUID REFERENCES grow_areas(id),
  status VARCHAR(50),  -- PLANNED, SEEDS_STARTED, TRANSPLANTED, DIRECT_SOWN, GROWING, COMPLETED
  
  -- Seed starting dates (for crops that need indoor pre-planting)
  indoor_start_date DATE,          -- Calculated: When to start seeds indoors
  indoor_start_method VARCHAR(50),  -- e.g., "seed_tray", "pots", "pellets"
  
  -- Outdoor planting dates
  transplant_date DATE,            -- Calculated: When to move to garden (for transplants)
  direct_sow_date DATE,            -- Calculated: When to plant directly (for direct sow)
  
  expected_harvest_date DATE,
  phase VARCHAR(50),               -- For countries like Norway: EARLY, MID, LATE
  notes TEXT,
  crop_record_id UUID REFERENCES crop_records(id),  -- Link when actually planted
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_planned_crops_season_plan ON planned_crops(season_plan_id);
CREATE INDEX idx_planned_crops_status ON planned_crops(status);
CREATE INDEX idx_planned_crops_dates ON planned_crops(indoor_start_date, transplant_date, direct_sow_date);

-- TODO: Phase 2 - Add notification/reminder system for seed starting dates
```

---

#### New Field: Garden Frost Dates

**Add to gardens table:**
```sql
ALTER TABLE gardens
ADD COLUMN last_frost_date DATE,
ADD COLUMN first_frost_date DATE,
ADD COLUMN hardiness_zone VARCHAR(10);
```

**Or create separate table (RECOMMENDED):**
```sql
-- Store frost dates and climate info for each garden
-- Note: Manual entry initially, will enhance with hardiness zone auto-detection later
CREATE TABLE garden_climate_info (
  garden_id UUID PRIMARY KEY REFERENCES gardens(id),
  last_frost_date DATE,      -- e.g., May 15 (manual entry)
  first_frost_date DATE,     -- e.g., October 1 (manual entry)
  hardiness_zone VARCHAR(10), -- e.g., "7a" (manual entry, future: auto-detect)
  latitude DECIMAL(9,6),      -- Optional: for future weather integration
  longitude DECIMAL(9,6),     -- Optional: for future weather integration
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TODO: Phase 2 - Auto-populate frost dates from hardiness zone database
-- TODO: Phase 2 - Integrate with weather API for location-based data
```

---

#### New Field: Plant Pre-Planting Requirements

**Add to plant_details table (or existing plants table):**
```sql
-- Extend plant_details with indoor starting and planting method info
-- Data source: Will come from plant-data-aggregator API later
-- For now: Using placeholder data for 20 common plants
ALTER TABLE plant_details
ADD COLUMN weeks_before_frost_indoor INTEGER,  -- e.g., 6-8 weeks for tomatoes
ADD COLUMN can_direct_sow BOOLEAN DEFAULT true,
ADD COLUMN can_transplant BOOLEAN DEFAULT false,
ADD COLUMN frost_tolerance VARCHAR(50),  -- HARDY, SEMI_HARDY, TENDER
ADD COLUMN indoor_start_method TEXT,     -- Guidance: seed tray, pots, pellets, etc.
ADD COLUMN transplant_guidance TEXT;     -- Instructions for moving outdoors

-- TODO: Future - populate from plant-data-aggregator API
-- TODO: Future - add companion planting data
-- TODO: Future - add seed depth, spacing, soil requirements
```

---

#### API Endpoints

**GET /api/gardens/{gardenId}/season-plan**
- Get current season plan for garden
- Returns: season plan with all planned crops
- Calculates indoor start dates based on frost dates and plant requirements

**POST /api/gardens/{gardenId}/season-plan**
- Create new season plan
- Request body: `{ "season": "Spring 2025", "year": 2025 }`

**POST /api/gardens/{gardenId}/season-plan/planned-crops**
- Add crop to season plan
- Request body:
```json
{
  "plantId": 123,
  "quantity": 3,
  "preferredGrowAreaId": "uuid",
  "notes": "Early variety for succession planting"
}
```
- Backend calculates `indoorStartDate`, `transplantDate`, `expectedHarvestDate`

**PATCH /api/gardens/{gardenId}/season-plan/planned-crops/{plannedCropId}**
- Update status of planned crop
- Request body: `{ "status": "SEEDS_STARTED" }`
- When status = TRANSPLANTED, optionally create crop_record

**DELETE /api/gardens/{gardenId}/season-plan/planned-crops/{plannedCropId}**
- Remove crop from season plan

**GET /api/gardens/{gardenId}/calendar**
- Get all calendar events for a date range
- Query params: `startDate`, `endDate`
- Returns aggregated events:
  - Indoor seed starting dates
  - Transplant dates
  - Expected harvest dates
  - Actual planting/harvest from crop records

---

#### Date Calculation Logic

**Example Calculation:**
```javascript
// Garden info
lastFrostDate = May 15, 2025

// Tomato plant info
weeksBeforeFrost = 6-8 weeks
daysToMaturity = 70-80 days

// Calculations
indoorStartDate = lastFrostDate - 8 weeks = March 20, 2025
transplantDate = lastFrostDate + 1 week = May 22, 2025  // After frost danger
expectedHarvestDate = transplantDate + 75 days = August 5, 2025
```

**Smart Recommendations:**
- If current date is past indoor start date, show "Direct sow outdoors" option
- If frost-hardy crop (kale, peas), allow earlier planting
- If user in warm climate (no frost), skip indoor starting

---

### Integration with Existing Features

**Crop Records:**
- When user marks planned crop as "Transplanted", create crop_record automatically
- Link crop_record.id back to planned_crop
- Status syncs bidirectionally

**Planting Calendar Widget (Dashboard):**
- Pulls data from season_plans and crop_records
- Shows combined view of planned and actual events

**Activity Feed:**
- Log activity when user adds/removes planned crops
- Log when seeds started or transplanted
- "Added 5 tomato plants to Spring 2025 plan"

---

### User Experience Flow

**1. First-Time Setup:**
- User creates garden
- Prompted to set location or enter frost dates manually
- Option to auto-detect from ZIP code (future: weather API)

**2. Planning Season:**
- User navigates to "Plan Season" or "Calendar"
- Clicks "Create Season Plan"
- Selects season and year
- Adds crops from plant library
- System calculates all important dates

**3. Following the Plan:**
- Dashboard shows "This Week" tasks
- Notifications remind user to start seeds
- User marks tasks as done
- Calendar updates to show progress

**4. Planting from Plan:**
- When transplant date arrives, user gets reminder
- Clicks "Plant Now" → Quick modal to create crop record
- System auto-fills data from plan
- User confirms and crop appears on board

---

### Future Enhancements

**Succession Planting:**
- Auto-suggest planting same crop every 2-3 weeks
- "Add succession planting" button

**Crop Rotation Integration:**
- Warn if planned crop conflicts with rotation rules
- Suggest alternative grow areas

**Weather Integration:**
- Adjust dates based on actual weather
- "Frost forecast - delay transplanting!"

**Sharing Plans:**
- Export season plan to PDF
- Share with gardening friends
- Template library (like garden templates)

---

## Implementation Roadmap

### Phase 1: Core Dashboard (2-3 days) ⭐ **HIGH PRIORITY**
- Step 64: Garden Overview Dashboard
  - Backend: Dashboard API endpoint
  - Frontend: Dashboard page with 6 core widgets
  - Testing: Verify metrics calculations

### Phase 2: Planting Calendar & Season Planning (3-4 days) ⭐ **HIGH PRIORITY**
- Step 69: Enhanced Planting Calendar
  - Backend: Season plans and planned crops tables
  - Backend: Frost date storage and calculation logic
  - Backend: Calendar events API
  - Frontend: Season plan creation and management
  - Frontend: Full calendar view with events
  - Frontend: Dashboard widget showing upcoming tasks
  - Testing: Date calculations, event creation, status updates

### Phase 3: Analytics (2-3 days)
- Step 65: Garden Statistics
  - Backend: Statistics API endpoint
  - Frontend: Charts and analytics widgets
  - Testing: Verify aggregations and performance

### Phase 4: Multi-Garden Support (1-2 days)
- Step 66: Garden Switching
  - Frontend: Garden switcher component
  - Frontend: Gardens management page
  - Testing: Garden switching, multi-garden dashboard

### Phase 5: Templates (3-4 days)
- Step 67: Garden Templates
  - Backend: Templates API and database
  - Frontend: Template gallery and apply flow
  - Content: Create 5-10 seed templates
  - Testing: Template application

### Phase 6: Activity Feed (1-2 days)
- Step 68: Activity Feed
  - Backend: Activities table and API
  - Backend: Event listeners for activity tracking
  - Frontend: Activity feed widget
  - Testing: Activity logging and display

---

## Design Considerations

### Performance
- Cache dashboard data (5-15 minute TTL)
- Use materialized views for complex statistics
- Implement pagination everywhere
- Consider background jobs for expensive calculations

### Scalability
- Design for users with 100+ crops and 50+ grow areas
- Implement data retention policies (archive old activities after 1 year)
- Use database indexes strategically

### User Experience
- Keep dashboards simple and scannable
- Use color coding consistently (green=good, yellow=warning, red=problem)
- Provide drill-down capabilities (click to explore details)
- Mobile-responsive layouts
- Loading states for all widgets

### Accessibility
- Use semantic HTML
- ARIA labels for charts and widgets
- Keyboard navigation support
- Screen reader friendly descriptions

---

## Open Questions - ANSWERED

1. **Dashboard Customization:** Should users be able to customize which widgets appear on their dashboard?
   - Answer: Future iteration. Start with fixed layout, add customization later.

2. **Real-time Updates:** Should dashboard update in real-time when crops are added/harvested?
   - Answer: No, polling every 5 minutes is sufficient. Use optimistic updates on user actions.

3. **Multi-User Gardens:** Should we support shared gardens with multiple users?
   - Answer: Not in this phase. Add to future backlog.

4. **Data Export:** Should all dashboard charts be exportable?
   - Answer: Yes, add export button to each chart (PNG image + CSV data) - Phase 2.

5. **Mobile App:** Should there be a mobile-specific dashboard layout?
   - Answer: Yes, responsive design with different widget order/sizing for mobile.

6. **Notifications:** Should dashboard include notification center for important events?
   - Answer: Phase 2 feature. Note added in TODO for reminders.
