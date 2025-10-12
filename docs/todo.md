# GardenTime - TODO List

## Project Overview
GardenTime is a garden management application that helps users manage multiple gardens with grow zones (planting areas) and track crop rotation to follow regenerative farming principles.

### Core Concepts
- **Garden**: A container for multiple grow zones
- **Grow Zone**: A physical planting area (e.g., 80x120cm box) where crops are planted
- **Crop Record**: Historical record of what was planted in a grow zone (to support crop rotation)
- **Plant**: The type of crop/vegetable/flower that can be grown

---

## 🔴 High Priority - Core Features

### Authentication & User Management
- [x] **Step 1:** Implement user authentication system
  - [x] 1.1: Create User model/entity with necessary fields (id, email, name, etc.)
  - [x] 1.2: Add user_id foreign key to garden_entity table (migration needed)
  - [x] 1.3: Set up local authentication for development (username/password)
  - [ ] 1.4: Plan for OAuth integration (Google/Facebook) for production
  - [x] 1.5: Add Spring Security dependency and configuration
  - [x] 1.6: Create login/logout endpoints
  - [x] 1.7: Implement JWT or session-based auth
  - [x] 1.8: Add user registration endpoint
  - [x] 1.9: Protect all API endpoints to filter by authenticated user

### Frontend Authentication
- [x] **Step 2:** Create login page/component
- [x] **Step 3:** Create registration page/component
- [x] **Step 4:** Implement auth state management (Context/Redux)
- [x] **Step 5:** Add protected routes
- [x] **Step 6:** Store and manage auth tokens
- [x] **Step 7:** Add logout functionality
- [x] **Step 8:** Handle session expiration

### Data Access Control
- [x] **Step 9:** Ensure users only see their own gardens
- [x] **Step 10:** Filter grow zones by user's gardens
- [x] **Step 11:** Filter crop records by user's grow zones
- [x] **Step 12:** Add user context to all service layer methods

---

## 🟡 Medium Priority - Enhanced Features

### Visual Garden Layout (Miro-style Board)

**Technology Choice:** `react-konva` (Canvas-based rendering with zoom/pan capabilities)
**Key Requirements:** Mobile support, performance for many grow areas, auto-save like Miro

- [x] **Backend Requirements (Steps 13-16)** ✅ **COMPLETED** (October 11, 2025)
  - [x] **Step 13:** Add position fields to GrowArea model
    - [x] 13.1: Add `positionX: Double?` (nullable, for canvas X coordinate)
    - [x] 13.2: Add `positionY: Double?` (nullable, for canvas Y coordinate)
    - [x] Note: Positions are in pixels on the canvas; nullable to support areas not yet placed on board
  
  - [x] **Step 14:** Add dimension fields to GrowArea model for accurate visual scaling
    - [x] 14.1: Add `width: Double?` (in centimeters, for real-world width)
    - [x] 14.2: Add `length: Double?` (in centimeters, for real-world length)
    - [x] 14.3: Add `height: Double?` (in centimeters, optional - for vertical gardens)
    - [x] Note: These replace/augment the string-based `zoneSize` field with precise measurements
  
  - [x] **Step 15:** Create Flyway migration for new position and dimension fields
    - [x] 15.1: Add columns: position_x, position_y, width, length, height (all DOUBLE PRECISION, nullable)
    - [x] 15.2: Keep existing `zone_size` column for backward compatibility
    - [x] 15.3: Test migration on local database
  
  - [x] **Step 16:** Update GrowArea API endpoints to support position/dimension data
    - [x] 16.1: Update `CreateGrowAreaRequest` DTO with new fields
    - [x] 16.2: Update `UpdateGrowAreaRequest` DTO with new fields
    - [x] 16.3: Update `GrowAreaService` to handle position updates
    - [x] 16.4: Add validation (positions >= 0, dimensions > 0 if provided)
    - [x] 16.5: Update TypeScript types in frontend (`lib/api.ts`)

**Implementation Summary (Steps 13-16):**
- **Backend Model Changes:**
  - Added 5 new nullable fields to `GrowArea` domain model and `GrowAreaEntity`: `positionX`, `positionY`, `width`, `length`, `height`
  - Added `@Column` annotations to map camelCase Kotlin properties to snake_case database columns
  - Updated mapper functions to include new fields
  
- **Database Migration:**
  - Created `V4__add_position_and_dimensions_to_grow_area.sql` migration
  - Manually verified columns were created in PostgreSQL using podman-compose
  - All columns are nullable to support grow areas not yet placed on visual board
  
- **API Updates:**
  - Updated `CreateGrowAreaRequest` and `UpdateGrowAreaRequest` DTOs with position/dimension fields
  - Updated `GrowAreaController` to pass new fields to service layer
  - Enhanced `GrowAreaService.addGrowArea()` and `updateGrowArea()` with validation logic:
    - Positions must be >= 0 if provided
    - Dimensions must be > 0 if provided
  
- **Frontend Types:**
  - Updated TypeScript interfaces in `client-next/lib/api.ts`:
    - `GrowArea`, `CreateGrowAreaRequest`, `UpdateGrowAreaRequest` now include optional position/dimension fields
  
- **Key Design Decision:**
  - All new fields are optional/nullable to support the UX flow where users can create grow areas in list view first, then later arrange them on the visual board
  - This allows grow areas to exist without positions until user places them on canvas

**Technical Challenge Solved:**
- Initial issue: Hibernate was looking for `positionx` but database had `position_x`
- Solution: Added `@Column(name = "position_x")` annotations to entity fields to map camelCase to snake_case naming
- Result: Application now starts successfully with all new fields properly mapped

- [ ] **Frontend Implementation (Steps 17-27)**
  - [x] **Step 17:** Choose canvas library: **react-konva** selected ✅
    - Reason: True canvas rendering, zoom/pan, precise scaling, Miro-like experience
    - Install: `npm install react-konva konva`
    - Also consider: `npm install use-image` for loading images if needed
  
  - [x] **Step 18:** Create GardenBoardView component (main canvas container) ✅ **COMPLETED** (October 11, 2025)
    - [x] 18.1: Set up Konva Stage and Layer components
    - [x] 18.2: Initialize with garden dimensions (or auto-size to viewport)
    - [x] 18.3: Implement zoom controls (buttons: 50%, 100%, 200%, Fit to View)
    - [x] 18.4: Implement pan/drag canvas functionality (click-drag empty space)
    - [x] 18.5: **Mobile:** Touch gesture support for pinch-to-zoom and pan (built into Konva)
    - [x] 18.6: Add toolbar with: zoom level display, grid toggle, view mode toggle
    - [x] **BONUS:** Added dual-view toggle system (List View | Board View) with localStorage persistence
    - [x] **BONUS:** Integrated canvas into existing garden detail page with seamless switching
  
  - [ ] **Step 19:** Create GrowAreaBox component (visual representation)
    - [ ] 19.1: Render each grow area as Konva Rect with label (Text)
    - [ ] 19.2: Apply color based on zone type (BOX=blue, FIELD=green, BED=brown, BUCKET=gray)
    - [ ] 19.3: Display grow area name inside or above the box
    - [ ] 19.4: Show dimensions text (e.g., "80 x 120 cm")
    - [ ] 19.5: Add hover effects (border highlight, cursor change)
    - [ ] 19.6: **Mobile:** Touch-friendly size (minimum touch target 44x44px)
  
  - [ ] **Step 20:** Implement drag-and-drop for grow areas
    - [ ] 20.1: Enable dragging on GrowAreaBox components
    - [ ] 20.2: Update position state in real-time during drag
    - [ ] 20.3: Debounce auto-save (e.g., 500ms after drag ends)
    - [ ] 20.4: Call API to save new position to backend
    - [ ] 20.5: Show loading indicator during save
    - [ ] 20.6: **Mobile:** Ensure drag works with touch events (not just mouse)
  
  - [ ] **Step 21:** Add resize functionality for grow areas
    - [ ] 21.1: Add resize handles (corner anchors) on selected grow area
    - [ ] 21.2: Update width/length during resize
    - [ ] 21.3: Maintain aspect ratio option (toggle or hold Shift key)
    - [ ] 21.4: Auto-save dimensions after resize (debounced)
    - [ ] 21.5: **Mobile:** Touch-friendly resize handles (larger touch targets)
  
  - [ ] **Step 22:** Implement visual scaling system
    - [ ] 22.1: Define scale factor (e.g., 1cm = 1px at 100% zoom)
    - [ ] 22.2: Convert grow area dimensions (cm) to canvas pixels
    - [ ] 22.3: Apply zoom multiplier to scale (50% = 0.5x, 200% = 2x)
    - [ ] 22.4: Add ruler/scale indicator (e.g., "10cm" visual guide)
    - [ ] 22.5: "Fit to View" auto-scales to show entire garden
  
  - [ ] **Step 23:** Add grid and snap-to-grid functionality
    - [ ] 23.1: Draw background grid lines (e.g., 10cm intervals)
    - [ ] 23.2: Toggle grid visibility (button in toolbar)
    - [ ] 23.3: Snap positions to grid when dragging (optional toggle)
    - [ ] 23.4: Configurable grid size (user preference)
  
  - [ ] **Step 24:** Click to view/edit grow area details
    - [ ] 24.1: Single click selects grow area (highlight border)
    - [ ] 24.2: Double click opens edit modal (reuse existing EditGrowAreaModal)
    - [ ] 24.3: Show quick info tooltip on hover (name, size, crop count)
    - [ ] 24.4: **Mobile:** Single tap selects, double tap or long-press opens edit
  
  - [ ] **Step 25:** Add new grow area from visual board
    - [ ] 25.1: "Draw Mode" button in toolbar
    - [ ] 25.2: Click-and-drag to draw new rectangle on canvas
    - [ ] 25.3: Show dimensions in real-time while drawing
    - [ ] 25.4: On release, open "Create Grow Area" modal with pre-filled dimensions
    - [ ] 25.5: Auto-calculate position and size from drawn rectangle
    - [ ] 25.6: Alternative: "Add Area" button opens modal, places at default position
  
  - [ ] **Step 26:** Delete grow area from visual board
    - [ ] 26.1: Delete button appears when grow area is selected
    - [ ] 26.2: Keyboard shortcut: Delete/Backspace key
    - [ ] 26.3: Show confirmation dialog (reuse existing delete confirmation)
    - [ ] 26.4: Remove from canvas and call API to delete
    - [ ] 26.5: **Mobile:** Delete icon/button in selection toolbar
  
  - [ ] **Step 27:** Auto-save layout positions (Miro-style)
    - [ ] 27.1: Debounced auto-save on drag end (500ms delay)
    - [ ] 27.2: Debounced auto-save on resize end (500ms delay)
    - [ ] 27.3: Visual indicator: "Saving..." → "Saved ✓" in toolbar
    - [ ] 27.4: Error handling: Show error toast if save fails, allow retry
    - [ ] 27.5: Optimistic updates: UI updates immediately, rollback on error
    - [ ] 27.6: Batch updates if multiple areas moved/resized quickly
  
  - [ ] **Step 27.1:** Toggle between list view and board view
    - [ ] Add view mode selector in garden detail page header
    - [ ] Tab/button toggle: "List View" | "Board View"
    - [ ] Persist view preference in localStorage
    - [ ] Ensure both views stay in sync (shared state/API)
    - [ ] **Mobile:** Default to list view on small screens, with option to switch

- [ ] **Performance Optimization (for many grow areas)**
  - [ ] **Step 27.2:** Virtualization and optimization
    - [ ] Use Konva's built-in performance optimizations
    - [ ] Only render grow areas in viewport (virtualization)
    - [ ] Limit number of simultaneously selected items
    - [ ] Throttle zoom/pan events
    - [ ] Use Konva's caching for static elements
    - [ ] Test with 50+ grow areas to ensure smooth performance

- [ ] **Mobile-Specific Features**
  - [ ] **Step 27.3:** Mobile UX enhancements
    - [ ] Touch gesture library integration (pinch-zoom, two-finger pan)
    - [ ] Larger touch targets for buttons and handles (minimum 44x44px)
    - [ ] Simplified toolbar for small screens
    - [ ] Bottom sheet or drawer for grow area details (instead of modal)
    - [ ] Orientation support (landscape for better canvas view)
    - [ ] Prevent accidental zooms (disable page zoom, only canvas zoom)

- [ ] **Additional Features**
  - [ ] **Step 27.4:** Advanced board features
    - [ ] Collision detection (warn if grow areas overlap)
    - [ ] Multi-select (Shift+click or drag-select box)
    - [ ] Bulk move/delete selected areas
    - [ ] Undo/Redo functionality
    - [ ] Copy/paste grow areas
    - [ ] Garden layout templates (preset arrangements)
    - [ ] Export layout as image (PNG/PDF)
    - [ ] Measurement tool (distance between areas)
    - [ ] Notes/annotations on canvas (text boxes, arrows)
    - [ ] Background image upload (aerial view of actual garden)

### Search Functionality
- [ ] **Grow Zone Search**
  - [ ] **Step 28:** Backend: Add search endpoint for grow zones (by name, type, size)
  - [ ] **Step 29:** Frontend: Search bar component for grow zones
  - [ ] **Step 30:** Filter grow zones in real-time
  
- [ ] **Plant/Crop Search**
  - [ ] **Step 31:** Backend: Add search endpoint for plants (by name, type, season)
  - [ ] **Step 32:** Frontend: Search bar for available crops
  - [ ] **Step 33:** Autocomplete suggestions
  - [ ] **Step 34:** Filter by plant type, growing season, etc.

### Crop/Plant Database Enhancement
- [ ] **Step 35:** Expand plant database with more varieties
- [ ] **Step 36:** Add companion planting information
- [ ] **Step 37:** Add crop family information (for rotation planning)
- [ ] **Step 38:** Import from external plant database/API (if available)
- [ ] **Step 39:** Required fields validation when adding new plant:
  - [ ] 39.1: Name (required)
  - [ ] 39.2: Plant type (required)
  - [ ] 39.3: Growing season (required)
  - [ ] 39.4: Maturity time (optional but recommended)
- [ ] **Step 40:** Create admin/seed data script for common vegetables
- [ ] **Step 97:** **NEW: Plant Management UI**
  - [ ] 97.1: Create plant management page/section
  - [ ] 97.2: List all plants with search/filter
  - [ ] 97.3: Add new plant form (with all fields: name, type, season, maturity time, etc.)
  - [ ] 97.4: Edit existing plants
  - [ ] 97.5: Delete plants (with safety check if used in crop records)
  - [ ] 97.6: Import/export plant data

### Crop Rotation Intelligence
- [ ] **Step 41:** Add crop family tracking (Brassicas, Legumes, Nightshades, etc.)
- [ ] **Step 42:** Warning system when planting same family in consecutive seasons
- [ ] **Step 43:** Suggest alternative crops based on rotation best practices
- [ ] **Step 44:** Display crop history timeline for each grow zone

---

## 🟢 Low Priority - UX & Polish

### Frontend Modernization
- [ ] **Step 45:** Improve overall UI/UX design
- [ ] **Step 46:** Make responsive for mobile devices
- [ ] **Step 47:** Add loading states and skeletons
- [ ] **Step 48:** Add error handling and user feedback (toasts/notifications)
- [ ] **Step 49:** Improve form validation and error messages
- [x] **Step 50:** Add confirmation dialogs for delete actions
- [ ] **Step 51:** Implement dark mode support
- [ ] **Step 52:** Add animations and transitions

### Grow Zone Management
- [x] **Step 53:** Implement "Add Grow Area" button functionality
- [x] **Step 54:** Create modal/form for adding new grow zone
  - [x] 54.1: Form with name field (required)
  - [x] 54.2: Advanced fields: zone type, size, number of rows, notes (all optional)
  - [x] 54.3: Collapsible "Show/Hide advanced options" section
  - [x] 54.4: Clear indication of required vs optional fields
  - [x] 54.5: Improved text visibility (text-gray-900 for inputs)
- [x] **Step 55:** Implement edit functionality (currently shows "edit" but not functional)
  - [x] 55.1: Edit modal with pre-populated values
  - [x] 55.2: Support for updating all grow area fields
  - [x] 55.3: Proper API integration with PUT endpoint
  - [x] 55.4: **NEW:** Edit button works in grow area detail page (fixed missing API endpoints)
- [x] **Step 56:** Implement delete functionality with confirmation
  - [x] 56.1: Delete confirmation modal
  - [x] 56.2: Proper API integration with DELETE endpoint
  - [x] 56.3: Refresh list after deletion
- [x] **Step 57:** Show more grow zone information in list view (size, type, current crops)
  - [x] 57.1: Display zone type with emoji icons (📦 Box, 🌾 Field, 🛏️ Bed, 🪣 Bucket)
  - [x] 57.2: Display zone size if provided
  - [x] 57.3: Display number of rows if provided
  - [x] 57.4: Display notes (truncated) if provided
  - [x] 57.5: Edit and delete buttons on each card
- [x] **Step 58:** Add filtering and sorting options
  - Note: Basic display completed, advanced filtering/sorting can be added later if needed

**Implementation Notes (Steps 53-58):**
- Backend: Added new endpoint `GET /api/growarea/garden/{gardenId}` to retrieve grow areas by garden
- Backend: Updated GrowAreaController to accept full request bodies with all fields
- Backend: Added CreateGrowAreaRequest and UpdateGrowAreaRequest DTOs
- Backend: Implemented updateGrowArea() method in GrowAreaService with security checks
- Frontend: Fixed API endpoint routing (BFF now correctly calls /api/growarea endpoints)
- Frontend: Enhanced text visibility throughout (text-gray-900 for all input fields)
- Frontend: All CRUD operations working with proper error handling
- All fields properly supported: name (required), zoneSize, zoneType, nrOfRows, notes (all optional)

### Crop Record Management
a crop record is kind of the history of a grow area, so a grow area can have several crop records, also several can be planted and have CropStatus PLANTED at the same time for instance. But if a crop record is harvested, it is in the past. We would still want to be able to see the history, but it should not be one of the main ones to be displayed.  This is required as we later want to avoid planting the same type of plant in the same grow area two seasons in a row.
- [x] **Step 59:** Improve crop record card display ✅ **COMPLETED**
  - [x] 59.1: Added CropStatus type support to frontend
  - [x] 59.2: Separated active crops (PLANTED, GROWING) from historical crops (HARVESTED, DISEASED, FAILED)
  - [x] 59.3: Active crops displayed prominently at the top
  - [x] 59.4: Historical crops in collapsible "Show/Hide" section
  - [x] 59.5: Enhanced visual display with status badges and icons
  - [x] 59.6: Status-based color coding (green for active, gray for historical, red for diseased)
- [ ] **Step 60:** Add quick view of current vs historical crops in that grow area 
- [ ] **Step 60.1:** Add a new page to show current and historical crops for all the users grow areas. This can be accessed either from the garden page "my new garden" or from a menu
- [ ] **Step 61:** Visual timeline of crop history
- [ ] **Step 62:** Batch operations (harvest multiple crops at once)
- [ ] **Step 63:** Export crop history to CSV/PDF

### Garden Management
- [ ] **Step 64:** Create garden overview dashboard
- [ ] **Step 65:** Add garden-level statistics (total zones, active crops, etc.)
- [ ] **Step 66:** Multiple garden support in UI
- [ ] **Step 67:** Switch between gardens easily
- [ ] **Step 68:** Garden templates/presets

---

## 🔧 Technical Debt & Refactoring

### Code Quality
- [x] **Step 69:** Rename GrowZone to GrowArea (as noted in TODO comment)
  - [x] 69.1: Update all model files
  - [x] 69.2: Update database tables/migrations
  - [x] 69.3: Update API endpoints
  - [x] 69.4: Update frontend components
- [ ] **Step 70:** Add comprehensive error handling
- [ ] **Step 71:** Add input validation on backend
- [ ] **Step 72:** Add API documentation (Swagger/OpenAPI)
- [ ] **Step 73:** Add integration tests
- [ ] **Step 74:** Add E2E tests for critical flows

### Database
- [ ] **Step 75:** Review and optimize database indexes
- [ ] **Step 76:** Add database constraints where needed
- [ ] **Step 77:** Consider adding soft delete functionality
- [ ] **Step 78:** Add created_at and updated_at timestamps to all tables

### Frontend
- [ ] **Step 79:** Set up proper state management (if needed beyond local state)
- [ ] **Step 80:** Organize component structure better
- [ ] **Step 81:** Add PropTypes or improve TypeScript types
- [ ] **Step 82:** Code splitting and lazy loading
- [ ] **Step 83:** Performance optimization

---

## 📋 Future Enhancements (Backlog)

- [ ] **Step 84:** Weather integration (to suggest planting times)
- [ ] **Step 85:** Calendar view for planting/harvest schedule
- [ ] **Step 86:** Reminders/notifications (watering, harvesting)
- [ ] **Step 87:** Photo upload for grow zones and crops
- [ ] **Step 88:** Notes and journal entries per grow zone
- [ ] **Step 89:** Pest and disease tracking
- [ ] **Step 90:** Yield tracking and analytics
- [ ] **Step 91:** Sharing gardens with other users (collaborative gardens)
- [ ] **Step 92:** Mobile app (React Native)
- [ ] **Step 93:** Offline support (PWA)
- [ ] **Step 94:** Import/export garden layouts
- [ ] **Step 95:** Community features (share layouts, tips)
- [ ] **Step 96:** Refactor backend layout so that we have module specific folders, such as a package for Crops, one for GrowArea etc...

---
