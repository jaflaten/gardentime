# Implementation Guide - Next Features

## Quick Start

Three major feature areas are fully specified and ready for development. This guide helps you get started quickly.

---

## Feature Overview

| Feature | Priority | Complexity | Time Estimate | User Impact |
|---------|----------|------------|---------------|-------------|
| **Garden Dashboard** (64-65) | HIGH | Medium | 4-6 days | High - Daily use |
| **Crop Management** (60,62-63) | HIGH | Low-Medium | 3-5 days | High - Efficiency |
| **Plant Info View** | MEDIUM | High | 11-14 days | Medium - Educational |
| **Templates** (67) | MEDIUM | Medium | 3-4 days | Medium - Onboarding |
| **Activity Feed** (68) | LOW | Low | 1-2 days | Low - Nice to have |

---

## Recommended Implementation Order

### Phase 1: Core Dashboard (Week 1)
**Goals:** Give users insights into their garden's current state

**Step 64: Garden Overview Dashboard**
1. Backend first:
   ```kotlin
   // Create DashboardController.kt
   @GetMapping("/api/gardens/{gardenId}/dashboard")
   fun getDashboardData(@PathVariable gardenId: UUID): DashboardDTO
   ```
   
2. Build dashboard DTO aggregating:
   - Garden summary (count grow areas, active/inactive)
   - Active crops (count by status)
   - Recent harvests (last 5)
   - Upcoming tasks (calculate from expected harvest dates)
   - Capacity metrics
   
3. Frontend: Create `/gardens/[id]/dashboard/page.tsx`
   - Layout: 3-column grid (desktop), stacked (mobile)
   - Start with 3 key widgets: Summary, Active Crops, Tasks
   - Add others incrementally
   
4. Testing: Verify calculations, test with empty garden, test with 100+ crops

**Files to Create:**
- Backend: `DashboardController.kt`, `DashboardService.kt`, `DashboardDTO.kt`
- Frontend: `app/gardens/[id]/dashboard/page.tsx`, `components/dashboard/` (widget components)

**Time: 2-3 days**

---

### Phase 2: Analytics Dashboard (Week 1-2)
**Goals:** Help users learn from their data

**Step 65: Garden Statistics**
1. Backend:
   ```kotlin
   @GetMapping("/api/gardens/{gardenId}/statistics")
   fun getStatistics(
       @PathVariable gardenId: UUID,
       @RequestParam(required = false) startDate: LocalDate?,
       @RequestParam(required = false) endDate: LocalDate?
   ): StatisticsDTO
   ```

2. Complex queries:
   - Productivity over time (group crops by month, sum yields)
   - Plant performance (group by plant, calculate success rates)
   - Success rate by plant type (join with plants table)
   - Seasonal performance (group by planting month's season)
   - Grow area efficiency (group by grow area)
   
3. Frontend: Add `/statistics` tab or separate page
   - Use Chart.js or Recharts for visualizations
   - Create chart components: LineChart, BarChart, PieChart, Table
   
4. Performance:
   - Add database indexes on `plantingDate`, `harvestDate`, `status`
   - Consider caching (Redis or in-memory for 15 min)
   - For large datasets, use database views

**Files to Create:**
- Backend: `StatisticsController.kt`, `StatisticsService.kt`, `StatisticsDTO.kt`
- Frontend: `app/gardens/[id]/statistics/page.tsx`, `components/charts/`
- Database: Migration for indexes

**Time: 2-3 days**

---

### Phase 3: Crop Management List (Week 2)
**Goals:** Central view of all crops, better organization

**Step 60: Crop Records List View**
1. Backend:
   ```kotlin
   @GetMapping("/api/crop-records")
   fun getAllUserCropRecords(
       @RequestParam(required = false) status: CropStatus?,
       @RequestParam(required = false) plantId: Long?,
       @RequestParam(required = false) gardenId: UUID?,
       @RequestParam(required = false) dateFrom: LocalDate?,
       @RequestParam(required = false) dateTo: LocalDate?,
       @RequestParam(required = false) sort: String = "plantingDate",
       @RequestParam(required = false) order: String = "desc",
       @PageableDefault(size = 20) pageable: Pageable
   ): Page<CropRecordDTO>
   ```
   
2. Use Spring Data JPA Specifications for dynamic filtering
   
3. Frontend: Create `/crops/page.tsx`
   - Table view with sortable columns
   - Filters sidebar (status, plant, garden, date range)
   - Pagination controls
   - Statistics summary at top
   
4. Security: Ensure query only returns crops for gardens user owns

**Files to Create:**
- Backend: Extend `CropRecordController.kt`, create `CropRecordSpecifications.kt`
- Frontend: `app/crops/page.tsx`, `components/crops/CropsList.tsx`, `components/crops/CropFilters.tsx`

**Time: 2-3 days**

---

### Phase 4: Batch Operations & Export (Week 2-3)
**Goals:** Efficiency for managing many crops

**Step 62: Batch Operations**
1. Backend:
   ```kotlin
   @PatchMapping("/api/crop-records/batch")
   fun batchUpdate(@RequestBody request: BatchUpdateRequest): BatchUpdateResponse
   
   @DeleteMapping("/api/crop-records/batch")
   fun batchDelete(@RequestBody request: BatchDeleteRequest): BatchDeleteResponse
   ```

2. Frontend:
   - Add checkboxes to crop list
   - Bulk actions panel (appears when 1+ selected)
   - Bulk harvest modal
   
**Step 63: Export**
1. Backend:
   ```kotlin
   @GetMapping("/api/crop-records/export")
   fun export(
       @RequestParam format: String = "csv",
       // ... same filters as list endpoint
   ): ResponseEntity<ByteArray>
   ```
   
2. Use OpenCSV for CSV generation, Apache POI for Excel
   
3. Frontend:
   - Export button in toolbar
   - Export modal (format selection, fields selection)

**Files to Create:**
- Backend: Extend `CropRecordController.kt`, create `ExportService.kt`
- Frontend: `components/crops/BulkActionsPanel.tsx`, `components/crops/ExportModal.tsx`

**Time: 2 days**

---

### Phase 5: Plant Information View (Week 3-5)
**Goals:** Educational platform, better plant data

**This is a larger feature, break it down:**

**Week 3: Database & Basic View**
1. Database migrations for new tables:
   - `plant_details`
   - `plant_care_guides`
   - `plant_varieties`
   - `plant_companions`
   - `plant_images`
   - `plant_resources`
   
2. Create entities and repositories
   
3. Basic plant detail page:
   - Header
   - Quick facts card
   - Placeholder for guides

**Week 4: Growing Guides & Frontend**
1. Populate care guides for 20 common plants (manual entry or seed data)
   
2. Build tabbed interface:
   - Overview, Planting, Care, Harvesting tabs
   
3. Create browse page with grid view

**Week 5: Personal History & Recommendations**
1. Personal history section (calculate from user's crop records)
   
2. Recommendation algorithm:
   - Based on user's location (hardiness zone)
   - Based on current season
   - Based on past success
   
3. Community stats (if enough users)

**Files to Create:**
- Backend: Multiple entities, controllers, services, DTOs, migrations
- Frontend: `app/plants/page.tsx`, `app/plants/[id]/page.tsx`, many components
- Data: Seed data scripts for initial 20-30 plants

**Time: 11-14 days** (can be done in parallel with other work)

---

## Database Migrations

### For Dashboard & Analytics (Phase 1-2)
No schema changes needed! Uses existing tables.

### For Crop Management (Phase 3-4)
Add indexes for performance:
```sql
CREATE INDEX idx_crop_records_planting_date ON crop_records(planting_date DESC);
CREATE INDEX idx_crop_records_harvest_date ON crop_records(harvest_date DESC);
CREATE INDEX idx_crop_records_status ON crop_records(status);
CREATE INDEX idx_crop_records_grow_zone_id ON crop_records(grow_zone_id);
```

### For Plant Info View (Phase 5)
See detailed schema in `/docs/plant-information-view-spec.md`
- 6 new tables
- Multiple foreign keys
- Indexes for performance

---

## Testing Strategy

### Backend Tests
For each new endpoint:
1. Unit tests for service layer logic
2. Integration tests for controller endpoints
3. Security tests (verify user can only access own data)
4. Performance tests (test with 1000+ records)

**Example:**
```kotlin
@Test
fun `should return only user's crop records`() {
    // Given: Two users with crops
    val user1Crops = createCropsForUser(user1, count = 10)
    val user2Crops = createCropsForUser(user2, count = 10)
    
    // When: User 1 requests crops
    val response = getCropRecords(user1Token)
    
    // Then: Only user 1's crops returned
    assertEquals(10, response.totalElements)
    assertTrue(response.content.all { it.userId == user1.id })
}
```

### Frontend Tests
1. E2E tests with Playwright for critical flows:
   - View dashboard
   - Filter crop list
   - Batch update crops
   - Export crops
   - View plant details
   
2. Component tests for complex widgets (charts, filters)

**Example E2E:**
```typescript
test('dashboard shows correct crop counts', async ({ page }) => {
  // Setup: Create garden with known crops
  const garden = await createGarden({ userId: testUser.id });
  await createCrop({ gardenId: garden.id, status: 'PLANTED' });
  await createCrop({ gardenId: garden.id, status: 'GROWING' });
  await createCrop({ gardenId: garden.id, status: 'HARVESTED' });
  
  // Navigate to dashboard
  await page.goto(`/gardens/${garden.id}/dashboard`);
  
  // Verify counts
  await expect(page.locator('[data-testid="active-crops-count"]')).toHaveText('2');
  await expect(page.locator('[data-testid="harvested-crops-count"]')).toHaveText('1');
});
```

---

## Performance Considerations

### Dashboard Queries
**Problem:** Dashboard aggregates data from multiple tables, can be slow

**Solutions:**
1. **Database Views:** Create materialized view for dashboard data
   ```sql
   CREATE MATERIALIZED VIEW garden_dashboard_data AS
   SELECT 
     g.id as garden_id,
     COUNT(ga.id) as total_grow_areas,
     COUNT(CASE WHEN cr.status IN ('PLANTED','GROWING') THEN 1 END) as active_crops,
     -- ... more aggregations
   FROM gardens g
   LEFT JOIN grow_areas ga ON ga.garden_id = g.id
   LEFT JOIN crop_records cr ON cr.grow_zone_id = ga.id
   GROUP BY g.id;
   
   REFRESH MATERIALIZED VIEW garden_dashboard_data;
   ```
   
2. **Caching:** Cache dashboard data for 5-15 minutes
   ```kotlin
   @Cacheable("dashboard", key = "#gardenId")
   fun getDashboardData(gardenId: UUID): DashboardDTO {
       // expensive queries
   }
   ```
   
3. **Background Jobs:** Pre-calculate statistics nightly
   ```kotlin
   @Scheduled(cron = "0 0 2 * * *")  // 2 AM daily
   fun calculateStatistics() {
       gardens.forEach { garden ->
           val stats = calculateGardenStatistics(garden)
           cacheService.put("stats-${garden.id}", stats)
       }
   }
   ```

### Large Datasets
**Problem:** Users with 100+ crops, queries slow down

**Solutions:**
1. **Pagination:** Always use pagination (default 20 items per page)
2. **Lazy Loading:** Load data as user scrolls
3. **Indexes:** Add indexes on commonly queried fields
4. **Query Optimization:** Use `JOIN FETCH` to avoid N+1 queries
   ```kotlin
   @Query("SELECT c FROM CropRecordEntity c JOIN FETCH c.plant WHERE c.growZoneId IN :growZoneIds")
   fun findByGrowZoneIdsWithPlant(growZoneIds: List<Long>): List<CropRecordEntity>
   ```

---

## API Design Patterns

### Consistent Response Format
```json
{
  "content": [...],
  "totalElements": 100,
  "totalPages": 5,
  "currentPage": 0,
  "pageSize": 20
}
```

### Error Handling
```json
{
  "error": "CROP_NOT_FOUND",
  "message": "Crop record with id abc-123 not found",
  "timestamp": "2025-10-30T12:00:00Z",
  "path": "/api/crop-records/abc-123"
}
```

### Filtering Pattern
Use query parameters for filtering:
- `GET /api/crop-records?status=HARVESTED&plantId=123&dateFrom=2025-01-01`

### Batch Operations Pattern
Use request body with array of IDs:
```json
{
  "cropRecordIds": ["uuid1", "uuid2"],
  "updates": { "status": "HARVESTED" }
}
```

---

## Common Gotchas & Tips

### 1. User Scoping
**Always** filter by user ownership. Example:
```kotlin
// BAD - Exposes all users' data
fun getAllCrops(): List<CropRecord> {
    return cropRecordRepository.findAll()
}

// GOOD - Only user's data
fun getAllUserCrops(userId: UUID): List<CropRecord> {
    val userGardens = gardenRepository.findByUserId(userId)
    val growAreaIds = userGardens.flatMap { it.growAreas }.map { it.id }
    return cropRecordRepository.findByGrowZoneIdIn(growAreaIds)
}
```

### 2. Date Handling
Use `LocalDate` for planting/harvest dates (no time component needed):
```kotlin
val plantingDate: LocalDate = LocalDate.now()
val daysGrowing = ChronoUnit.DAYS.between(plantingDate, LocalDate.now())
```

### 3. Null Safety
Kotlin's null safety prevents many bugs, but DTOs from Java/JPA can be tricky:
```kotlin
// Use safe calls and Elvis operator
val harvestDate = cropRecord.harvestDate?.toString() ?: "Not harvested"
val outcome = cropRecord.outcome ?: "Unknown"
```

### 4. Frontend State Management
For complex forms (filters, multi-select), use URL query params:
```typescript
const [searchParams, setSearchParams] = useSearchParams();

// Update URL when filter changes
const handleStatusFilter = (status: string) => {
  searchParams.set('status', status);
  setSearchParams(searchParams);
};

// Read from URL on mount
useEffect(() => {
  const status = searchParams.get('status');
  if (status) {
    setFilterStatus(status);
    fetchCrops({ status });
  }
}, [searchParams]);
```

### 5. Optimistic Updates
For better UX, update UI immediately, then sync with server:
```typescript
const handleMarkHarvested = async (cropId: string) => {
  // Update UI immediately
  setCrops(crops.map(c => 
    c.id === cropId 
      ? { ...c, status: 'HARVESTED', dateHarvested: today }
      : c
  ));
  
  // Then sync with server
  try {
    await api.patch(`/crop-records/${cropId}`, { 
      status: 'HARVESTED',
      dateHarvested: today 
    });
  } catch (error) {
    // Revert on error
    fetchCrops();
    toast.error('Failed to update crop');
  }
};
```

---

## Resources

### Specifications
- `/docs/crop-record-management-spec.md` - Steps 60-63 detailed
- `/docs/garden-management-dashboard-spec.md` - Steps 64-68 detailed
- `/docs/plant-information-view-spec.md` - Plant info system detailed
- `/docs/feature-specs-summary.md` - High-level overview

### Existing Code to Reference
- Dashboard patterns: `/client-next/app/gardens/[id]/page.tsx` (existing garden page)
- Filtering: `/client-next/app/search/page.tsx` (search implementation)
- Batch operations: Look at grow area CRUD for patterns
- Charts: Install Chart.js or Recharts (new dependency)

### Libraries to Install

**Backend (build.gradle.kts):**
```kotlin
dependencies {
    // For CSV export
    implementation("com.opencsv:opencsv:5.7.1")
    
    // For Excel export
    implementation("org.apache.poi:poi-ooxml:5.2.3")
    
    // For caching (optional)
    implementation("org.springframework.boot:spring-boot-starter-cache")
    implementation("com.github.ben-manes.caffeine:caffeine:3.1.8")
}
```

**Frontend (package.json):**
```json
{
  "dependencies": {
    "recharts": "^2.10.0",  // For charts
    "date-fns": "^2.30.0",   // For date handling (if not already installed)
    "react-day-picker": "^8.9.0"  // For date range picker
  }
}
```

---

## Getting Help

1. **Specifications unclear?** See detailed spec documents in `/docs/`
2. **API design questions?** Check existing controllers for patterns
3. **Frontend patterns?** Look at existing pages like search, garden view
4. **Database questions?** Check existing migrations in `/src/main/resources/db/migration/`
5. **Testing questions?** See `/client-next/e2e/` for E2E test examples

---

## Success Criteria

### Dashboard (Steps 64-65)
✅ User can view garden overview with key metrics  
✅ Dashboard loads in <2 seconds with 100 crops  
✅ All widgets display correct data  
✅ Mobile responsive layout works  
✅ Charts are interactive and clear  

### Crop Management (Steps 60, 62-63)
✅ User can see all crops across all gardens  
✅ Filters work correctly (status, plant, date)  
✅ Pagination handles 500+ crops smoothly  
✅ Batch operations update multiple crops  
✅ Export generates valid CSV/Excel files  

### Plant Info (New Feature)
✅ User can browse and search plants  
✅ Plant detail page shows comprehensive info  
✅ Growing guides are clear and helpful  
✅ Personal history calculates correctly  
✅ Recommendations are relevant  

---

## Questions Before Starting?

- Which feature to start with?
- Any concerns about the proposed designs?
- Need clarification on any specifications?
- Should we adjust scope for first version?

**Recommendation:** Start with Dashboard (Steps 64-65) as it has highest user impact and moderate complexity. It will immediately improve the user experience and provide motivation to keep using the app.
