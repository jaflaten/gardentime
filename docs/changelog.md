# GardenTime - Changelog

Recent changes and feature highlights. For complete roadmap, see `todo.md`.

---

## [Unreleased]

### October 30, 2025 - Advanced Board Features (Steps 27.5, 27.6, 27.9)
- **Step 27.5 - Rotation Functionality:** 
  - Rotation slider (0-360°) with visual angle display
  - Quick rotation buttons (0°, 90°, 180°, 270°)
  - Integrated with auto-save and undo/redo
- **Step 27.6 - Multi-Select Bulk Operations:**
  - New BulkActionsPanel for multi-selected canvas objects
  - Bulk color change (fill and stroke with 10 presets)
  - Bulk opacity and stroke width adjustment
  - Bulk layer order operations (bring to front/send to back)
  - Bulk delete with undo/redo support
  - Keyboard Delete works for bulk selection
- **Step 27.9 - Grow Area Color Customization:**
  - New GrowAreaPropertiesPanel component
  - Custom color picker with 10 preset colors
  - Reset to default color functionality
  - Persistent color storage via API
  - Visual feedback on board immediately
- **Delete Confirmation Improvements:**
  - Removed confirmation for canvas shapes (undo/redo available)
  - Kept confirmation for grow areas (data protection)

### October 15, 2025 - Canvas Drawing Tools (Step 25)
- Added CanvasObject backend model and API (RECTANGLE, CIRCLE, LINE, ARROW, TEXT, FREEHAND)
- Created DrawingToolbar component with 8 drawing tools
- Created CanvasShape component for rendering canvas objects
- Database migration V5 for canvas_objects table

### October 12-13, 2025 - Board View Enhancements
- **Viewport Position Memory:** Board view remembers zoom, position, and grid visibility per garden (localStorage)
- **Resize Functionality (Steps 20-21):** Interactive resize handles with Konva Transformer
  - Rectangles: 8 handles, Circles: 4 handles for proportional scaling
  - Auto-save dimensions on resize completion
  - Minimum 44x44px touch targets
- **Zone Type Badge Positioning:** Fixed badge repositioning after resize with dynamic React keys
- **GrowAreaBox Component (Step 19):** Dedicated component with color coding, hover effects, selection markers

### October 11, 2025 - Visual Board View
- **Board View Implementation (Steps 17-18):** Konva canvas with zoom (50%-200%), pan, grid toggle
- **Dual View System:** Toggle between List View and Board View with localStorage persistence
- **Mouse Wheel Zoom:** Smooth zoom-to-pointer functionality
- **Backend Position/Dimension Fields (Steps 13-16):** Added positionX, positionY, width, length, height to GrowArea
- Database migration V4 for position and dimension columns

### October 8, 2025 - Grow Area Management
- **Complete CRUD (Steps 53-58):** Full grow area management with all fields
- **API Fixes:** Fixed missing crop records endpoint, plants API trailing slash
- **UX Improvements:** Better text visibility, zone type icons, collapsible advanced options
- Backend: CreateGrowAreaRequest/UpdateGrowAreaRequest DTOs

### Earlier - Core Features
- ✅ Next.js 15 migration with BFF architecture complete
- ✅ Authentication (login, register, JWT)
- ✅ Gardens CRUD
- ✅ Crop Records with status tracking
- ✅ Playwright E2E tests with cleanup

---

## Version History

- **[0.5.4]** - Zone type badge positioning fixes
- **[0.5.3]** - Resize functionality and GrowAreaBox component
- **[0.5.1]** - API endpoint fixes for grow area details
- **[0.5.0]** - Next.js migration complete

For detailed historical changes, see git history.
