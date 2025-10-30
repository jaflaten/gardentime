# Crop Record Management - Feature Specification (Steps 60-63)

## Overview
Enhance the crop record management system to provide users with comprehensive views and tools for managing their planting history, tracking crop performance, and making data-driven decisions.

---

## Step 60: Crop Records List View (All User Crops)

### Purpose
Provide a centralized view where users can see ALL their crop records across ALL gardens and grow areas in one place. This complements the existing grow-area-specific views.

### User Stories
- As a user, I want to see all my crops in one place so I can track what I'm growing across all my gardens. Also i want to see how many of each type of crop i have(i.e 2 grow areas of tomatoes would be 2 of the crop tomato). 
- As a user, I want to filter and search my crops so I can quickly find specific plantings
- As a user, I want to see crop status at a glance so I know what needs attention

### Backend Requirements (Step 60.1)

#### API Endpoint: GET /api/crop-records
**Purpose:** Fetch all crop records for the authenticated user across all their gardens

**Query Parameters:**
- `status` (optional): Filter by CropStatus (PLANTED, GROWING, HARVESTED, DISEASED, FAILED)
- `plantId` (optional): Filter by specific plant type
- `gardenId` (optional): Filter by specific garden
- `dateFrom` (optional): Filter crops planted after this date (ISO date string)
- `dateTo` (optional): Filter crops planted before this date (ISO date string)
- `sort` (optional): Sort field (plantingDate, harvestDate, plantName, status)
- `order` (optional): Sort order (asc, desc)
- `page` (optional): Page number for pagination (default: 0)
- `size` (optional): Page size (default: 20, max: 100)

**Response:**
```json
{
  "content": [
    {
      "id": "uuid",
      "growAreaId": "uuid",
      "growAreaName": "Box 1",
      "gardenId": "uuid",
      "gardenName": "Main Garden",
      "plantId": 123,
      "plantName": "Tomato",
      "plantType": "FRUIT_VEGETABLE",
      "datePlanted": "2025-05-15",
      "dateHarvested": null,
      "status": "GROWING",
      "notes": "Looking healthy",
      "outcome": null,
      "quantityHarvested": null,
      "unit": null,
      "daysGrowing": 168,
      "expectedHarvestDate": "2025-09-01"
    }
  ],
  "totalElements": 45,
  "totalPages": 3,
  "currentPage": 0,
  "pageSize": 20
}
```

**Business Logic:**
- Only return crop records for grow areas in gardens owned by the authenticated user
- Calculate `daysGrowing` = days between plantingDate and (harvestDate or today)
- Calculate `expectedHarvestDate` = plantingDate + plant.maturityTime (if available)
- Include garden name and grow area name for context

**Security:**
- User can only access their own crop records
- Implement proper user-scoped query filters

#### Implementation Notes
- Create new `CropRecordController.getAllUserCropRecords()` method
- Extend `CropRecordRepository` with filtering and pagination support
- Use Spring Data JPA Specifications for dynamic filtering
- Join with Garden and GrowArea entities to fetch names
- Cache plant data to avoid N+1 queries

---

### Frontend Requirements

#### Route: `/crops`
New page to display all user crops

#### Components

**CropRecordsList Component**
- Display crop records in a table or card grid view
- Columns:
  - Plant name (with icon/image if available)
  - Garden name → Grow Area name
  - Date Planted
  - Status (color-coded badge)
  - Days Growing
  - Expected Harvest / Harvest Date
  - Quick actions (view details, edit, mark as harvested)
  
**Filters Panel**
- Status filter (all, active only, harvested only)
- Garden selector (multi-select dropdown)
- Plant type filter
- Date range picker (planted between X and Y)
- Search by plant name
- Clear all filters button

**View Toggles**
- Table view (default)
- Card grid view (more visual)
- Timeline view (optional, see Step 61)

**Pagination Controls**
- Show X-Y of Z crops
- Page size selector (20, 50, 100)
- Previous/Next buttons

**Statistics Summary Panel**
- Total crops
- Active crops (PLANTED + GROWING)
- Harvested this season
- Success rate (non-FAILED crops / total)

**Empty States**
- No crops yet: "Start tracking your crops!"
- No results from filters: "No crops match your filters"

#### User Interactions
- Click row → Navigate to grow area detail page
- Click "Mark as Harvested" → Quick modal to update status, harvest date, quantity
- Click "Edit" → Navigate to crop record edit page
- Filter updates → Auto-refresh data
- Sort columns → Update sort parameter

---

## Step 61: Crop Timeline View

### Purpose
Visual timeline showing crop lifecycles across the year, helping users plan succession planting and understand crop rotation patterns.

### User Stories
- As a user, I want to see when crops are planted and harvested on a timeline so I can plan succession planting
- As a user, I want to see overlapping crops so I can avoid overcrowding my garden
- As a user, I want to identify gaps in my planting schedule

### Frontend Requirements

#### Timeline Component
**Display Type:** Gantt-chart-style horizontal timeline

**X-Axis:** Months of the year (Jan-Dec)
**Y-Axis:** Grow areas or plant types (user-selectable)

**Crop Bars:**
- Start: datePlanted
- End: dateHarvested or expectedHarvestDate
- Color: Status-based (green=active, yellow=harvested, red=failed)
- Hover: Show crop details tooltip
- Click: Navigate to crop detail

**Features:**
- Group by garden/grow area or by plant type
- Filter by year (current year, past years)
- Zoom in/out (month view, quarter view, year view)
- Highlight current date with vertical line
- Show gaps (periods with no crops in a grow area)

**Libraries to Consider:**
- react-gantt-chart
- vis-timeline
- Custom implementation with D3.js or canvas

#### Navigation
- Add "Timeline" tab to `/crops` page
- Or create separate route `/crops/timeline`

---

## Step 62: Batch Operations on Crop Records

### Purpose
Allow users to perform actions on multiple crop records at once for efficiency.

### User Stories
- As a user, I want to mark multiple crops as harvested at once when I harvest multiple beds
- As a user, I want to delete old crop records in bulk to clean up my history (this has to be an active choice as the record is important to understand what to grow next. Especially important in regenrative farming where you want to keep the history of your crops. So maybe we soft delete them?)
- As a user, I want to export selected crops for record-keeping

### Backend Requirements

#### API Endpoint: PATCH /api/crop-records/batch
**Purpose:** Update multiple crop records at once

**Request Body:**
```json
{
  "cropRecordIds": ["uuid1", "uuid2", "uuid3"],
  "updates": {
    "status": "HARVESTED",
    "dateHarvested": "2025-10-30",
    "outcome": "GOOD"
  }
}
```

**Response:**
```json
{
  "updated": 3,
  "failed": 0,
  "errors": []
}
```

**Business Logic:**
- Validate all cropRecordIds belong to user
- Apply updates only to fields provided
- Return count of successful/failed updates
- Log any errors

#### API Endpoint: DELETE /api/crop-records/batch
**Purpose:** Delete multiple crop records at once

**Request Body:**
```json
{
  "cropRecordIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Security:**
- Verify user owns all crop records before deletion
- Soft delete (add deletedAt field) vs hard delete?

---

### Frontend Requirements

**Multi-Select Functionality**
- Checkboxes on each row in CropRecordsList
- "Select All" checkbox in table header
- Selected count badge (e.g., "3 selected")

**Batch Actions Panel**
- Appears when 1+ crops selected
- Actions:
  - Mark as Harvested (opens bulk harvest modal)
  - Mark as Failed/Diseased
  - Delete
  - Export to CSV
  - Cancel (clear selection)

**Bulk Harvest Modal**
- Set harvest date (default: today)
- Set outcome (EXCELLENT, GOOD, FAIR, POOR)
- Set quantity and unit (optional)
- Apply notes (optional, same notes for all)
- Confirm button

**Confirmation Dialogs**
- Delete confirmation: "Delete X crop records? This cannot be undone."
- Bulk update confirmation: "Update X crop records?"

---

## Step 63: Export Crop Records

### Purpose
Allow users to export their crop data for external analysis, record-keeping, or sharing.

### User Stories
- As a user, I want to export my crop history to Excel so I can analyze it offline
- As a user, I want to export my harvest data for tax or insurance purposes
- As a user, I want to share my crop rotation plan with others

### Backend Requirements

#### API Endpoint: GET /api/crop-records/export
**Purpose:** Export crop records to CSV/Excel

**Query Parameters:**
- Same filters as GET /api/crop-records (status, plantId, gardenId, dates)
- `format`: csv or excel (default: csv)
- `fields`: Comma-separated list of fields to include (default: all)

**Response:**
- Content-Type: text/csv or application/vnd.ms-excel
- Content-Disposition: attachment; filename="crop-records-{date}.csv"

**CSV Format:**
```csv
Garden,Grow Area,Plant Name,Plant Type,Date Planted,Date Harvested,Days Growing,Status,Quantity Harvested,Unit,Outcome,Notes
Main Garden,Box 1,Tomato,FRUIT_VEGETABLE,2025-05-15,2025-09-01,109,HARVESTED,5.2,kg,EXCELLENT,"Great yield"
```

**Excel Format:**
- Use Apache POI or similar
- Include formatted headers
- Color-code status column
- Add auto-filter to headers
- Include summary statistics sheet

#### Implementation Notes
- Use OpenCSV or Apache Commons CSV for CSV generation
- Use Apache POI for Excel generation
- Stream large exports to avoid memory issues
- Add rate limiting to prevent abuse

---

### Frontend Requirements

**Export Button**
- Location: Top of CropRecordsList page
- Icon: Download icon
- Click → Open export modal

**Export Modal**
- Format selector (CSV or Excel)
- Fields selector (checkboxes for each field)
  - Include all fields by default
  - Common presets: "Basic", "Detailed", "For Analysis"
- Apply current filters checkbox (checked by default)
- Date range override (optional)
- File name preview
- Export button

**Export Feedback**
- Loading spinner during export
- Success message: "Exported X crop records"
- Download file automatically
- Error handling for large exports

---

## Testing Checklist

### Step 60 - List View
- [ ] Fetch all user crops successfully
- [ ] Pagination works correctly
- [ ] Filters apply properly (status, plant, garden, dates)
- [ ] Sorting works on all columns
- [ ] Statistics summary shows correct counts
- [ ] Empty states display correctly
- [ ] Security: Cannot access other users' crops
- [ ] Performance: Loads quickly with 100+ crops

### Step 61 - Timeline View
- [ ] Timeline renders correctly
- [ ] Crop bars show correct date ranges
- [ ] Hover tooltips display crop details
- [ ] Click navigates to correct page
- [ ] Group by options work
- [ ] Year filter works
- [ ] Zoom controls work
- [ ] Current date highlighted
- [ ] Gaps are visible

### Step 62 - Batch Operations
- [ ] Multi-select works correctly
- [ ] Batch panel appears/hides properly
- [ ] Bulk harvest updates multiple crops
- [ ] Bulk delete removes selected crops
- [ ] Confirmation dialogs appear
- [ ] Selection persists across pages
- [ ] Security: Can only batch update own crops
- [ ] Error handling for partial failures

### Step 63 - Export
- [ ] CSV export downloads correctly
- [ ] Excel export downloads correctly
- [ ] Exported data matches filters
- [ ] All selected fields included
- [ ] File naming convention correct
- [ ] Large exports don't timeout
- [ ] Excel formatting applied
- [ ] Special characters handled correctly

---

## Implementation Priority

**Phase 1 (High Priority):**
- Step 60.1: Backend API for fetching all user crops
- Step 60: Frontend list view with filters

**Phase 2 (Medium Priority):**
- Step 62: Batch operations (harvest, delete)
- Step 63: CSV export

**Phase 3 (Lower Priority):**
- Step 61: Timeline view
- Step 63: Excel export with formatting
- Advanced filtering and saved filter presets

---

## Open Questions

1. **Data Retention:** Should we implement soft delete for crop records, or hard delete?
   - Recommendation: Soft delete to preserve historical data
   - Answer: soft delete

2. **Performance:** How to handle users with 1000+ crop records?
   - Recommendation: Implement virtual scrolling or pagination with reasonable page sizes
   - Answer: pagination with reasonable page sizes

3. **Timeline Complexity:** Should timeline be read-only or allow drag-to-reschedule?
   - Recommendation: Start with read-only, add editing in future iteration
   - Answer: read-only to start with, lets see how it feels when implemented

4. **Export Limits:** Should we limit export size to prevent server overload?
   - Recommendation: Yes, max 1000 records per export, suggest filtering for larger datasets
   - Answer: yes, max 1000 records per export

5. **Batch Operations Scope:** Should batch operations support moving crops between grow areas?
   - Recommendation: No, too complex. Keep batch ops simple (status, delete, export)
   - Answer. no, too complex.
