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

### Authentication & User Management ✅ COMPLETED (Steps 1-12)
- [x] **Steps 1-12:** User authentication, JWT tokens, Spring Security, protected routes, data access control

---

## 🟡 Medium Priority - Visual Board Features

### Backend Position/Dimension Support ✅ COMPLETED (Steps 13-16)
- [x] **Steps 13-16:** Added positionX, positionY, width, length, height fields to GrowArea model with database migration V4

### Visual Board Implementation (Steps 17-24)

- [x] **Step 17:** Choose canvas library: **react-konva** ✅
- [x] **Step 18:** GardenBoardView component with zoom, pan, grid ✅
- [x] **Step 19:** GrowAreaBox component with color coding, hover effects ✅
- [x] **Step 20:** Drag-and-drop for grow areas ✅
- [x] **Step 21:** Resize functionality with Konva Transformer ✅
- [x] **Step 22:** Visual scaling system (1cm = 1px) ✅
- [x] **Step 23:** Grid background (partially complete - snap-to-grid pending)
- [x] **Step 24:** Click to view/edit grow area details ✅

### Step 25: Canvas Drawing Tools 🎨 **IN PROGRESS** (60% complete)

**Goal:** Transform the board into a full-featured canvas app with drawing tools for annotations, planning, and design

- [x] **25.1: Drawing Toolbar/Panel** ✅ COMPLETED
  - [x] 25.1.1: Add drawing tools panel to toolbar
  - [x] 25.1.2: Tool selector with icons for each tool type
  - [x] 25.1.3: Active tool indicator (highlight selected tool)
  - [x] 25.1.4: Keyboard shortcuts for quick tool switching
  - [ ] 25.1.5: **Mobile:** Touch-friendly tool selector (bottom drawer)

- [ ] **25.2: Basic Shape Tools**
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
    - [ ] Make line endpoints adjustable after placement (drag endpoints, show handles)
  - [ ] 25.2.4: **Arrow Tool** - Click-drag to draw arrows
    - [ ] Single or double-headed arrows
    - [ ] Configurable arrowhead size and style
    - [ ] Make arrow endpoints adjustable after placement (drag endpoints, update arrowhead orientation)

- [ ] **25.3: Text Tool**
  - [ ] 25.3.1: Click to place text box on canvas
  - [ ] 25.3.2: Inline text editing (double-click to edit)
  - [ ] 25.3.3: Font size, color, and style options
  - [ ] 25.3.4: Text box background (optional, for visibility)
  - [ ] 25.3.5: Auto-resize text box or fixed width with wrapping

- [ ] **25.4: Freehand Drawing Tool**
  - [ ] 25.4.1: Click-drag to draw freehand paths
  - [ ] 25.4.2: Configurable brush size and color
  - [ ] 25.4.3: Smooth curve rendering (Konva Line with tension)
  - [ ] 25.4.4: Eraser mode

- [ ] **25.5: Grow Area Creation from Canvas**
  - [x] 25.5.1: "Add Grow Area" button (already implemented) ✅
  - [ ] 25.5.2: "Convert to Grow Area" functionality (right-click on shapes)
  - [ ] 25.5.3: Quick Create Mode (optional)

- [ ] **25.6: Shape Properties Panel**
  - [ ] 25.6.1: Context panel appears when shape is selected
  - [ ] 25.6.2: Color picker for fill and stroke
  - [ ] 25.6.3: Opacity slider
  - [ ] 25.6.4: Border width slider
  - [ ] 25.6.5: Line style selector
  - [ ] 25.6.6: Z-index controls
  - [ ] 25.6.7: Delete button
  - [ ] 25.6.8: Duplicate button

- [ ] **25.7: Canvas Layers and Grouping**
  - [ ] 25.7.1: Multiple layers support
  - [ ] 25.7.2: Group/ungroup shapes
  - [ ] 25.7.3: Lock/unlock layers or shapes
  - [ ] 25.7.4: Show/hide layers

- [x] **25.8: Backend Support for Canvas Objects** ✅ COMPLETED
  - [x] 25.8.1: Create `CanvasObject` entity/model
  - [x] 25.8.2: Database migration V5 for `canvas_objects` table
  - [x] 25.8.3: CRUD API endpoints
  - [x] 25.8.4: Batch operations
  - [x] 25.8.5: Security checks

- [x] **25.9: Frontend Canvas Object Components** ✅ COMPLETED
  - [x] 25.9.1-25.9.7: Created CanvasShape component for all shape types

- [x] **25.10: Drawing Interaction Logic** ✅ COMPLETED
  - [x] 25.10.1: Tool state management (active tool, drawing mode)
  - [x] 25.10.2: Mouse event handlers (onMouseDown, onMouseMove, onMouseUp)
  - [x] 25.10.3: Preview while drawing
  - [x] 25.10.4: Finalize and save shape on mouse release
  - [x] 25.10.5: Cancel drawing on Esc key
  - [x] 25.10.6: Distinguish between panning canvas vs drawing

- [ ] **25.11: Advanced Drawing Features**
  - [ ] 25.11.1: Snap to grid for shapes
  - [ ] 25.11.2: Smart guides (alignment lines)
  - [ ] 25.11.3: Duplicate shapes with Alt+Drag
  - [ ] 25.11.4: Resize shapes after creation
  - [ ] 25.11.5: Rotate shapes
  - [ ] 25.11.6: Flip shapes

- [ ] **25.12: Use Cases & Templates**
  - [ ] Garden zone boundaries, pathways, irrigation lines, notes, etc.
  - [ ] Template library for common elements

### Board Enhancements (Steps 26-27)
- [ ] **Step 26:** Delete grow area from board with confirmation
- [ ] **Step 27:** Auto-save with debouncing (Miro-style)
- [x] **Step 27.1:** List/Board view toggle ✅

### Advanced Board Features (Steps 27.5-27.18)
- [ ] **Step 27.5:** Rotation functionality
- [ ] **Step 27.6:** Multi-select (Shift+Click, drag rectangle, bulk operations)
- [ ] **Step 27.7:** Undo/Redo (Cmd/Ctrl+Z)
- [ ] **Step 27.8:** Display current crops on grow areas
- [ ] **Step 27.9:** Color customization per grow area
- [ ] **Step 27.10:** Mini-map overview
- [ ] **Step 27.11:** Keyboard shortcuts (Delete, arrows, zoom, etc.)
- [ ] **Step 27.12:** Copy/paste functionality
- [ ] **Step 27.13:** Export/import layout (JSON)
- [ ] **Step 27.14:** Export as image/PDF
- [ ] **Step 27.15:** Keyboard shortcuts help modal
- [ ] **Step 27.16:** Performance optimization (virtualization)
- [ ] **Step 27.17:** Mobile UX enhancements
- [ ] **Step 27.18:** Collision detection, templates, measurement tool

### Search Functionality (Steps 28-34) ✅ COMPLETED
- [x] **Steps 28-34:** Grow area search and plant/crop search with autocomplete ✅
  - [x] Backend search endpoint implemented (`/api/growarea/search`)
  - [x] BFF route created (`/app/api/grow-areas/search/route.ts`)
  - [x] GrowAreaSearch component with debounced autocomplete
  - [x] PlantSearch component with autocomplete
  - [x] Dedicated search page (`/search`) with both search types
  - [x] Keyboard navigation support (arrow keys, Enter, Escape)
  - [x] Security: User-scoped search (only searches own grow areas)

### Plant Database (Steps 35-40, 97)
- [ ] Expand plant varieties, companion planting, crop families
- [ ] Plant management UI (add/edit/delete plants)

### Crop Rotation Intelligence (Steps 41-44)
- [ ] Crop family tracking, warnings, suggestions, timeline

---

## 🟢 Low Priority - UX & Polish

### Frontend Modernization (Steps 45-52)
- [ ] Responsive design, loading states, error handling, dark mode, animations
- [x] **Step 50:** Delete confirmations ✅

### Grow Zone Management (Steps 53-58) ✅ COMPLETED
- [x] **Steps 53-58:** Full CRUD with all fields, modals, icons

### Crop Record Management (Steps 59-63)
- [x] **Step 59:** Separated active/historical crops ✅
- [ ] **Step 60-60.1:** Quick view page for all user's crops
- [ ] **Step 61-63:** Timeline, batch operations, export

### Garden Management (Steps 64-68)
- [ ] Dashboard, statistics, garden switching, templates

---

## 🔧 Technical Debt

### Code Quality (Steps 69-74)
- [x] **Step 69:** Rename GrowZone → GrowArea ✅
- [ ] **Steps 70-74:** Error handling, validation, API docs, tests

### Database (Steps 75-78)
- [ ] Indexes, constraints, soft delete, timestamps

### Frontend (Steps 79-83)
- [ ] State management, component structure, TypeScript, performance

---

## 📋 Future Backlog (Steps 84-96)

- Weather integration, calendar, notifications, photos, pest tracking, yield analytics
- Collaborative gardens, mobile app, PWA, import/export
- Backend modularization

---

## 📊 Current Status

**Overall Project:** ~65% complete

**Next Priority:** Step 25.11 - Advanced Drawing Features
