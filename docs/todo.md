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
- [ ] **Backend Requirements**
  - [ ] **Step 13:** Add position/coordinates to GrowZone model (x, y positions)
  - [ ] **Step 14:** Add dimensions to GrowZone (width, length, height in cm)
  - [ ] **Step 15:** Create migration for new position fields
  - [ ] **Step 16:** Update GrowZone API to support position data
  
- [ ] **Frontend Implementation**
  - [ ] **Step 17:** Research and choose canvas/board library (react-grid-layout, react-dnd, Konva, etc.)
  - [ ] **Step 18:** Create visual garden board component
  - [ ] **Step 19:** Implement drag-and-drop for grow zones
  - [ ] **Step 20:** Add resize functionality for grow zones
  - [ ] **Step 21:** Visual representation of grow zone size (scale)
  - [ ] **Step 22:** Add grid/snap-to-grid functionality
  - [ ] **Step 23:** Click to view/edit grow zone details
  - [ ] **Step 24:** Add new grow zone by clicking/drawing on board
  - [ ] **Step 25:** Delete grow zone from visual board
  - [ ] **Step 26:** Save layout positions to backend
  - [ ] **Step 27:** Toggle between list view and visual board view

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
- [ ] **Step 50:** Add confirmation dialogs for delete actions
- [ ] **Step 51:** Implement dark mode support
- [ ] **Step 52:** Add animations and transitions

### Grow Zone Management
- [ ] **Step 53:** Implement "Add Grow Area" button functionality
- [ ] **Step 54:** Create modal/form for adding new grow zone
- [ ] **Step 55:** Implement edit functionality (currently shows "edit" but not functional)
- [ ] **Step 56:** Implement delete functionality with confirmation
- [ ] **Step 57:** Show more grow zone information in list view (size, type, current crops)
- [ ] **Step 58:** Add filtering and sorting options

### Crop Record Management
- [ ] **Step 59:** Improve crop record card display
- [ ] **Step 60:** Add quick view of current vs historical crops
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
