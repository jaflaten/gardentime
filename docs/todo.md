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
  
  - [x] **Step 19:** Create GrowAreaBox component (visual representation) ✅ **COMPLETED** (October 12, 2025)
    - [x] 19.1: Render each grow area as Konva Rect with label (Text)
    - [x] 19.2: Apply color based on zone type (BOX=blue, FIELD=green, BED=brown, BUCKET=gray)
    - [x] 19.3: Display grow area name inside or above the box
    - [x] 19.4: Show dimensions text (e.g., "80 x 120 cm")
    - [x] 19.5: Add hover effects (border highlight, cursor change)
    - [x] 19.6: **Mobile:** Touch-friendly size (minimum touch target 44x44px)
    - [x] **BONUS:** Added zone type badge in top-left corner
    - [x] **BONUS:** Added number of rows indicator in bottom-right corner
    - [x] **BONUS:** Added selection corner markers for better visual feedback
    - [x] **BONUS:** Enhanced hover effects with opacity changes and dynamic shadows
    - [x] **BONUS:** Circular rendering for BUCKET type areas
    - [x] 19.7: **Accessibility:** Ensure text is readable on all backgrounds
    - [x] 19.8: **Performance:** Optimize rendering for large number of grow areas
    - [x] 19.9: **Testing:** Verify touch and drag interactions on mobile devices
    - [x] 19.10: **Documentation:** Update component documentation with usage examples

  - [x] **Step 20:** Implement drag-and-drop for grow areas ✅ **COMPLETED** (October 12, 2025)
    - [x] 20.1: Enable dragging on GrowAreaBox components
    - [x] 20.2: Update position state in real-time during drag
    - [x] 20.3: Auto-save immediately on drag end (no debounce needed for now)
    - [x] 20.4: Call API to save new position to backend
    - [x] 20.5: Optimistic updates with error handling
    - [x] 20.6: **Mobile:** Touch events work (onTap, onDblTap)
  
  - [x] **Step 21:** Add resize functionality for grow areas ✅ **COMPLETED** (October 12, 2025)
    - [x] 21.1: Add resize handles (corner anchors) on selected grow area using Konva Transformer
    - [x] 21.2: Update width/length during resize with real-time visual feedback
    - [x] 21.3: Proportional resize for circular buckets
    - [x] 21.4: Auto-save dimensions after resize (immediate save on transform end)
    - [x] 21.5: **Mobile:** Touch-friendly resize handles (12px anchors)
    - [x] **BONUS:** Different anchor configurations for circles vs rectangles
    - [x] **BONUS:** Minimum size enforcement (44x44px for touch targets)
    - [x] **BONUS:** Clean UI during resize (hide labels/badges)
  
  - [x] **Step 22:** Implement visual scaling system ✅ **COMPLETED** (October 15, 2025)
    - [x] 22.1: Define scale factor (e.g., 1cm = 1px at 100% zoom)
    - [x] 22.2: Convert grow area dimensions (cm) to canvas pixels
    - [x] 22.3: Apply zoom multiplier to scale (50% = 0.5x, 200% = 2x)
    - [x] 22.4: ~~Add ruler/scale indicator (e.g., "10cm" visual guide)~~ **REMOVED** (cleaner UI)
    - [x] 22.5: "Fit to View" auto-scales to show entire garden
    - [x] **BONUS:** Mouse wheel zoom functionality with smooth continuous zoom-to-pointer behavior
    - [x] **BONUS:** Live zoom percentage display (50%-200%)
  
  - [x] **Step 23:** Add grid and snap-to-grid functionality ✅ **PARTIALLY COMPLETED** (October 15, 2025)
    - [x] 23.1: Draw background grid lines (50cm intervals)
    - [x] 23.2: Toggle grid visibility (button in toolbar)
    - [ ] 23.3: Snap positions to grid when dragging (optional toggle)
    - [ ] 23.4: Configurable grid size (user preference)
  
  - [x] **Step 24:** Click to view/edit grow area details ✅ **COMPLETED** (October 12, 2025)
    - [x] 24.1: Single click selects grow area (highlight border with corner markers)
    - [x] 24.2: Double click opens edit modal (reuse existing EditGrowAreaModal)
    - [x] 24.3: ~~Show quick info tooltip on hover~~ (already showing name, size, crop count on cards)
    - [x] 24.4: **Mobile:** Single tap selects, double tap opens edit
  
  - [ ] **Step 25:** Canvas Drawing Tools (Miro/Excalidraw-style) 🎨 **IN PROGRESS** (October 15, 2025)
    **Goal:** Transform the board into a full-featured canvas app with drawing tools for annotations, planning, and design
    
    - [x] **25.1: Drawing Toolbar/Panel** ✅ **COMPLETED**
      - [x] 25.1.1: Add drawing tools panel to toolbar (can be a dropdown or side panel)
      - [x] 25.1.2: Tool selector with icons for each tool type
      - [x] 25.1.3: Active tool indicator (highlight selected tool)
      - [ ] 25.1.4: Keyboard shortcuts for quick tool switching
      - [ ] 25.1.5: **Mobile:** Touch-friendly tool selector (bottom drawer)
    
    - [ ] **25.2: Basic Shape Tools** ⏳ **IN PROGRESS**
      - [ ] 25.2.1: **Rectangle Tool** - Click-drag to draw rectangles
        - [ ] Configurable fill color and opacity
        - [ ] Configurable border color and width
        - [ ] Hold Shift for perfect squares
        - [ ] Corner radius option for rounded rectangles
      - [ ] 25.2.2: **Circle/Ellipse Tool** - Click-drag to draw circles/ellipses
        - [ ] Hold Shift for perfect circles
        - [ ] Configurable fill and border
      - [ ] 25.2.3: **Line Tool** - Click-drag to draw straight lines
        - [ ] Configurable line width and color
        - [ ] Dashed/dotted line styles
        - [ ] Hold Shift for horizontal/vertical/45° angles
      - [ ] 25.2.4: **Arrow Tool** - Click-drag to draw arrows
        - [ ] Single or double-headed arrows
        - [ ] Configurable arrowhead size and style
        - [ ] Useful for indicating flow, connections, or annotations
    
    - [ ] **25.3: Text Tool**
      - [ ] 25.3.1: Click to place text box on canvas
      - [ ] 25.3.2: Inline text editing (double-click to edit)
      - [ ] 25.3.3: Font size, color, and style options
      - [ ] 25.3.4: Text box background (optional, for visibility)
      - [ ] 25.3.5: Auto-resize text box or fixed width with wrapping
      - [ ] 25.3.6: Use cases: labels, notes, measurements, garden sections
    
    - [ ] **25.4: Freehand Drawing Tool (Pen/Pencil)**
      - [ ] 25.4.1: Click-drag to draw freehand paths
      - [ ] 25.4.2: Configurable brush size and color
      - [ ] 25.4.3: Smooth curve rendering (Konva Line with tension)
      - [ ] 25.4.4: Eraser mode (or separate eraser tool)
      - [ ] 25.4.5: Use cases: sketching paths, garden borders, irregular areas
    
    - [ ] **25.5: Grow Area Creation from Canvas**
      - [x] 25.5.1: **"Add Grow Area" button** (keep existing button - already implemented) ✅
        - Opens modal to create grow area with form inputs
        - Places at center of viewport or clicked position
        - This is the primary way to add functional grow areas
      - [ ] 25.5.2: **"Convert to Grow Area" functionality**
        - Right-click on any rectangle/circle shape
        - Option to "Convert to Grow Area"
        - Opens modal with dimensions pre-filled from shape
        - Replaces shape with proper GrowArea object
      - [ ] 25.5.3: **Quick Create Mode** (optional enhancement)
        - Special tool that creates grow areas directly on canvas
        - Click-drag draws rectangle, release opens quick-create modal
        - Dimensions auto-filled, just enter name and zone type
    
    - [ ] **25.6: Shape Properties Panel**
      - [ ] 25.6.1: Context panel appears when shape is selected
      - [ ] 25.6.2: Color picker for fill and stroke
      - [ ] 25.6.3: Opacity slider
      - [ ] 25.6.4: Border width slider
      - [ ] 25.6.5: Line style selector (solid, dashed, dotted)
      - [ ] 25.6.6: Z-index controls (bring to front, send to back)
      - [ ] 25.6.7: Delete button
      - [ ] 25.6.8: Duplicate button
    
    - [ ] **25.7: Canvas Layers and Grouping**
      - [ ] 25.7.1: Multiple layers support (like Photoshop/Figma)
        - Background layer (shapes/annotations)
        - Grow areas layer (always on top)
        - Grid layer (bottom)
      - [ ] 25.7.2: Group/ungroup shapes (select multiple, group them)
      - [ ] 25.7.3: Lock/unlock layers or individual shapes
      - [ ] 25.7.4: Show/hide layers
    
    - [x] **25.8: Backend Support for Canvas Objects** ✅ **COMPLETED**
      - [x] 25.8.1: Create `CanvasObject` entity/model ✅
        - Fields: id, gardenId, type (rectangle, circle, line, arrow, text, freehand)
        - Geometry: x, y, width, height, points (for lines/freehand)
        - Styling: fillColor, strokeColor, strokeWidth, opacity, fontSize (for text)
        - Content: text content for text objects
        - Metadata: zIndex, locked, layerId
      - [x] 25.8.2: Database migration to add `canvas_objects` table ✅
      - [x] 25.8.3: CRUD API endpoints for canvas objects ✅
        - GET /api/canvas-objects/garden/{gardenId}
        - POST /api/canvas-objects
        - PUT /api/canvas-objects/{id}
        - DELETE /api/canvas-objects/{id}
      - [x] 25.8.4: Batch operations for multiple objects ✅
      - [x] 25.8.5: Security: Ensure users can only access their garden's canvas objects ✅
    
    - [x] **25.9: Frontend Canvas Object Components** ✅ **COMPLETED**
      - [x] 25.9.1: Create CanvasRectangle component ✅
      - [x] 25.9.2: Create CanvasCircle component ✅
      - [x] 25.9.3: Create CanvasLine component ✅
      - [x] 25.9.4: Create CanvasArrow component ✅
      - [x] 25.9.5: Create CanvasText component ✅
      - [x] 25.9.6: Create CanvasFreehand component (path) ✅
      - [x] 25.9.7: Generic CanvasObject wrapper with common behavior ✅
    
    - [ ] **25.10: Drawing Interaction Logic** ⏳ **NEXT - IN PROGRESS**
      - [ ] 25.10.1: Tool state management (active tool, drawing mode)
      - [ ] 25.10.2: Mouse event handlers for drawing (onMouseDown, onMouseMove, onMouseUp)
      - [ ] 25.10.3: Preview while drawing (show shape as user drags)
      - [ ] 25.10.4: Finalize and save shape on mouse release
      - [ ] 25.10.5: Cancel drawing on Esc key
      - [ ] 25.10.6: Distinguish between panning canvas vs drawing (e.g., Space+drag = pan)
  
  - [ ] **Step 26:** Delete grow area from visual board
    - [ ] 26.1: Delete button appears when grow area is selected
    - [ ] 26.2: Keyboard shortcut: Delete/Backspace key
    - [ ] 26.3: Show confirmation dialog (reuse existing delete confirmation)
    - [ ] 26.4: Remove from canvas and call API to delete
    - [ ] 26.5: **Mobile:** Delete icon/button in selection toolbar
    - [ ] 26.6: **Note:** Generic canvas objects (shapes/text) can be deleted without confirmation
    - [ ] 26.7: Grow areas require confirmation (because they may have crop records)
  
  - [ ] **Step 27:** Auto-save layout positions (Miro-style)
    - [ ] 27.1: Debounced auto-save on drag end (500ms delay)
    - [ ] 27.2: Debounced auto-save on resize end (500ms delay)
    - [ ] 27.3: Visual indicator: "Saving..." → "Saved ✓" in toolbar
    - [ ] 27.4: Error handling: Show error toast if save fails, allow retry
    - [ ] 27.5: Optimistic updates: UI updates immediately, rollback on error
    - [ ] 27.6: Batch updates if multiple areas moved/resized quickly
  
  - [x] **Step 27.1:** Toggle between list view and board view ✅ **COMPLETED** (October 11, 2025)
    - [x] Add view mode selector in garden detail page header
    - [x] Tab/button toggle: "List View" | "Board View"
    - [x] Persist view preference in localStorage
    - [x] Ensure both views stay in sync (shared state/API)
    - [x] **Mobile:** Default to list view on small screens, with option to switch

- [ ] **Advanced Canvas Features (Steps 27.5-27.14)** 🎨 **NEW REQUIREMENTS** (October 15, 2025)
  
  - [ ] **Step 27.5:** Rotation functionality for grow areas
    - [ ] 27.5.1: Add rotation handle to selected grow area (Konva Transformer rotation)
    - [ ] 27.5.2: Add rotation field to GrowArea backend model (rotation angle in degrees)
    - [ ] 27.5.3: Database migration to add `rotation` column (DOUBLE PRECISION, default 0)
    - [ ] 27.5.4: Update API endpoints to save/load rotation
    - [ ] 27.5.5: Apply rotation transform to rendered grow areas
    - [ ] 27.5.6: Keyboard shortcuts: R to rotate 90° clockwise, Shift+R to rotate 90° counter-clockwise
    - [ ] 27.5.7: Rotation angle display in toolbar when selected
    - [ ] 27.5.8: Reset rotation button (back to 0°)
  
  - [ ] **Step 27.6:** Multi-select functionality
    - [ ] 27.6.1: Shift+Click to add/remove from selection
    - [ ] 27.6.2: Cmd/Ctrl+Click to toggle individual item selection
    - [ ] 27.6.3: Click-drag on empty canvas to draw selection rectangle
    - [ ] 27.6.4: Visual feedback for multi-selection (all selected areas highlighted)
    - [ ] 27.6.5: Bulk move: drag any selected area to move all together
    - [ ] 27.6.6: Bulk delete: delete button removes all selected areas (with confirmation)
    - [ ] 27.6.7: Selection count in toolbar (e.g., "3 areas selected")
    - [ ] 27.6.8: Deselect all: Esc key or click empty canvas
    - [ ] 27.6.9: Select all: Cmd/Ctrl+A
  
  - [ ] **Step 27.7:** Undo/Redo functionality
    - [ ] 27.7.1: Implement history stack (track position, size, rotation changes)
    - [ ] 27.7.2: Keyboard shortcuts: Cmd/Ctrl+Z for undo, Cmd/Ctrl+Shift+Z for redo
    - [ ] 27.7.3: Undo/Redo buttons in toolbar with enabled/disabled states
    - [ ] 27.7.4: Track creates, deletes, moves, resizes, rotations
    - [ ] 27.7.5: History limit (e.g., 50 actions)
    - [ ] 27.7.6: Clear history on garden change
    - [ ] 27.7.7: Visual feedback: toast showing "Undo: Moved 'Tomato Bed'" etc.
  
  - [ ] **Step 27.8:** Display current crops on grow areas
    - [ ] 27.8.1: Fetch active crop records for each grow area (CropStatus = PLANTED or GROWING)
    - [ ] 27.8.2: Display plant icons/emoji inside grow area box
    - [ ] 27.8.3: Grid layout for multiple crops (2x2 or 3x3 depending on area size)
    - [ ] 27.8.4: Crop count badge (e.g., "3 crops" if more than fit in grid)
    - [ ] 27.8.5: Hover to see full crop list
    - [ ] 27.8.6: Optional: Show crop planting date or status
    - [ ] 27.8.7: Toggle crops visibility (button in toolbar)
    - [ ] 27.8.8: Color-code by crop status (green for healthy, yellow for needs attention)
  
  - [ ] **Step 27.9:** Color customization for grow areas
    - [ ] 27.9.1: Add `customColor` field to GrowArea backend model (hex color string)
    - [ ] 27.9.2: Database migration to add `custom_color` column (VARCHAR(7), nullable)
    - [ ] 27.9.3: Color picker in edit modal (allow user to choose custom color)
    - [ ] 27.9.4: Default colors by zone type (current behavior if no custom color)
    - [ ] 27.9.5: Apply custom color to fill and border of grow area
    - [ ] 27.9.6: Color palette presets (common garden colors)
    - [ ] 27.9.7: Reset to default color button
    - [ ] 27.9.8: Ensure text remains readable (auto-adjust text color based on background)
  
  - [ ] **Step 27.10:** Mini-map overview
    - [ ] 27.10.1: Create MiniMap component (small canvas in corner)
    - [ ] 27.10.2: Show entire garden at small scale (fixed 100x100px or similar)
    - [ ] 27.10.3: Draw all grow areas as simplified rectangles
    - [ ] 27.10.4: Highlight current viewport as rectangle overlay
    - [ ] 27.10.5: Click on mini-map to jump to that location
    - [ ] 27.10.6: Drag viewport rectangle to pan main canvas
    - [ ] 27.10.7: Toggle mini-map visibility (button in toolbar)
    - [ ] 27.10.8: Position: bottom-right corner (movable/draggable?)
    - [ ] 27.10.9: **Mobile:** Auto-hide on small screens, or make collapsible
  
  - [ ] **Step 27.11:** Keyboard shortcuts
    - [ ] 27.11.1: Delete/Backspace: Delete selected area(s)
    - [ ] 27.11.2: Cmd/Ctrl+Z: Undo
    - [ ] 27.11.3: Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y: Redo
    - [ ] 27.11.4: Cmd/Ctrl+C: Copy selected area(s)
    - [ ] 27.11.5: Cmd/Ctrl+V: Paste (duplicate with offset position)
    - [ ] 27.11.6: Cmd/Ctrl+D: Duplicate selected area(s)
    - [ ] 27.11.7: Cmd/Ctrl+A: Select all
    - [ ] 27.11.8: Esc: Deselect all
    - [ ] 27.11.9: R: Rotate 90° clockwise
    - [ ] 27.11.10: Shift+R: Rotate 90° counter-clockwise
    - [ ] 27.11.11: G: Toggle grid visibility
    - [ ] 27.11.12: Arrow keys: Nudge selected area(s) by 1px (Shift+Arrow for 10px)
    - [ ] 27.11.13: +/=: Zoom in
    - [ ] 27.11.14: -: Zoom out
    - [ ] 27.11.15: 0: Reset zoom to 100%
    - [ ] 27.11.16: F: Fit to view
    - [ ] 27.11.17: Show keyboard shortcuts help: ? or Cmd/Ctrl+/
  
  - [ ] **Step 27.12:** Copy/Paste functionality
    - [ ] 27.12.1: Cmd/Ctrl+C copies selected area(s) to clipboard (internal state)
    - [ ] 27.12.2: Cmd/Ctrl+V pastes with slight offset (e.g., +20px x and y)
    - [ ] 27.12.3: Duplicate creates new grow area with same properties except position
    - [ ] 27.12.4: Auto-generate new name (e.g., "Tomato Bed" → "Tomato Bed (Copy)")
    - [ ] 27.12.5: Paste creates new database records (not just visual copies)
    - [ ] 27.12.6: Multi-paste: paste multiple times to create multiple copies
    - [ ] 27.12.7: Visual feedback: pasted items are selected after paste
  
  - [ ] **Step 27.13:** Export/Import garden layout (JSON backup)
    - [ ] 27.13.1: Export button in toolbar
    - [ ] 27.13.2: Generate JSON file with all grow areas (positions, dimensions, properties)
    - [ ] 27.13.3: Include metadata (garden name, export date, version)
    - [ ] 27.13.4: Download JSON file (e.g., "My-Garden-2025-10-15.json")
    - [ ] 27.13.5: Import button to upload JSON file
    - [ ] 27.13.6: Validate JSON structure before import
    - [ ] 27.13.7: Merge or replace options (merge adds to existing, replace clears first)
    - [ ] 27.13.8: Conflict resolution (what if area names already exist?)
    - [ ] 27.13.9: Preview import before confirming
    - [ ] 27.13.10: Error handling for invalid JSON
  
  - [ ] **Step 27.14:** Export garden layout as image/PDF
    - [ ] 27.14.1: Export as PNG button in toolbar
    - [ ] 27.14.2: Use Konva's `toDataURL()` to export canvas as image
    - [ ] 27.14.3: Export at current zoom level or always at 100%?
    - [ ] 27.14.4: Export visible area only, or entire garden (all grow areas)?
    - [ ] 27.14.5: Add option to include grid in export
    - [ ] 27.14.6: Add garden name and date as text overlay or watermark
    - [ ] 27.14.7: Export as PDF using library like jsPDF
    - [ ] 27.14.8: PDF includes multiple pages if garden is large
    - [ ] 27.14.9: Print-friendly layout (A4/Letter size)
    - [ ] 27.14.10: Include crop list or legend on PDF
    - [ ] 27.14.11: Preview export before downloading
  
  - [ ] **Step 27.15:** Keyboard shortcuts help modal
    - [ ] 27.15.1: Modal/overlay showing all available keyboard shortcuts
    - [ ] 27.15.2: Grouped by category (Selection, Editing, View, Navigation)
    - [ ] 27.15.3: Trigger with ? key or Cmd/Ctrl+/
    - [ ] 27.15.4: Close with Esc or click outside
    - [ ] 27.15.5: Accessible from toolbar help button
    - [ ] 27.15.6: Responsive design for mobile (show as bottom sheet)

- [ ] **Performance Optimization (for many grow areas)**
  - [ ] **Step 27.16:** Virtualization and optimization (formerly 27.2)
    - [ ] Use Konva's built-in performance optimizations
    - [ ] Only render grow areas in viewport (virtualization)
    - [ ] Limit number of simultaneously selected items
    - [ ] Throttle zoom/pan events
    - [ ] Use Konva's caching for static elements
    - [ ] Test with 50+ grow areas to ensure smooth performance

- [ ] **Mobile-Specific Features**
  - [ ] **Step 27.17:** Mobile UX enhancements (formerly 27.3)
    - [ ] Touch gesture library integration (pinch-zoom, two-finger pan)
    - [ ] Larger touch targets for buttons and handles (minimum 44x44px)
    - [ ] Simplified toolbar for small screens
    - [ ] Bottom sheet or drawer for grow area details (instead of modal)
    - [ ] Orientation support (landscape for better canvas view)
    - [ ] Prevent accidental zooms (disable page zoom, only canvas zoom)

- [ ] **Additional Features**
  - [ ] **Step 27.18:** Advanced board features (formerly 27.4)
    - [ ] Collision detection (warn if grow areas overlap)
    - [x] Multi-select (moved to Step 27.6)
    - [x] Bulk move/delete selected areas (moved to Step 27.6)
    - [x] Undo/Redo functionality (moved to Step 27.7)
    - [x] Copy/paste grow areas (moved to Step 27.12)
    - [ ] Garden layout templates (preset arrangements)
    - [x] Export layout as image (PNG/PDF) (moved to Step 27.14)
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
