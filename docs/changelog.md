# GardenTime - Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Initial project documentation structure
- TODO.md for tracking feature development
- CHANGELOG.md for tracking project changes
- Session context documentation for development continuity

---

## [0.5.2] - 2025-10-12

### Fixed - Canvas Dragging Behavior in Garden Board View
- **Grow Area Dragging Issues**
  - Fixed critical bug where dragging one grow area would cause the canvas to move/snap
  - Fixed issue where dragging the background canvas itself was unreliable
  - Resolved problem where boxes appeared to interfere with each other during drag
  - Each grow area now drags independently with smooth, predictable movement
  
- **Backend Validation**
  - Confirmed position validation allows negative coordinates (required for infinite canvas with pan/zoom)
  - Positions can be negative when canvas is panned or items are placed in different quadrants
  
- **Canvas Background Dragging**
  - Background canvas now draggable at all times (like Miro/Excalidraw)
  - Stage is temporarily disabled during grow area drag to prevent interference
  - Click and drag empty space to pan the canvas smoothly
  - Canvas stays stationary when dragging grow areas

### Technical Details
- **Root Cause**: 
  - Stage and Group elements were both draggable simultaneously, causing interference
  - When dragging a grow area, the Stage would also start dragging, creating the "snapping" effect
  - React state updates during drag were causing ALL Groups to re-render with new props
  
- **Solution**: 
  1. **Stage Dragging Control**: Made Stage always `draggable={true}` instead of state-controlled
  2. **Prevent Simultaneous Drag**: When a grow area drag starts, temporarily disable Stage dragging:
     ```typescript
     onDragStart={(e) => {
       draggingIdRef.current = growArea.id;
       e.cancelBubble = true;
       stage.draggable(false); // Disable stage during item drag
     }}
     ```
  3. **Re-enable After Drag**: When grow area drag ends, re-enable Stage dragging:
     ```typescript
     onDragEnd={(e) => {
       // ... save position ...
       stage.draggable(true); // Re-enable stage
     }}
     ```
  4. **State Update Timing**: Backend saves first, then React state updates only after success
  5. **Drag Tracking**: Use `useRef` to track which item is being dragged (doesn't trigger re-renders)

- **Files Modified**: 
  - `GardenBoardView.tsx` - Fixed Stage/Group dragging interference, added drag state tracking
  - `page.tsx` - State updates after backend save completes (not during drag)
  
- **Result**: 
  - ✅ Drag a grow area → Only that box moves, canvas stays still
  - ✅ Drag empty space → Canvas pans smoothly
  - ✅ Each box moves independently without affecting others
  - ✅ Behavior matches Miro/Excalidraw expectations
  - ✅ Positions persist correctly to backend

---

## [0.5.1] - 2025-10-08

### Fixed - Grow Area Detail Page & Missing API Endpoints
- **Crop Records Endpoint Missing**
  - Added `GET /api/croprecord/growarea/{growAreaId}` endpoint in `CropRecordController`
  - Added `getCropRecordsByGrowAreaId(Long)` method in `CropRecordService` with security checks
  - Fixed Next.js BFF route `/api/grow-areas/[id]/crop-records` to call correct Spring Boot endpoint
  - Grow area detail page now loads crop records correctly

- **Plants API Trailing Slash Issue**
  - Fixed `/api/plants` route to call `/api/plants/` (with trailing slash) on Spring Boot
  - Resolved 404 errors when fetching plants list

- **Edit Functionality in Grow Area Detail Page**
  - Edit button in grow area detail page (`/gardens/{id}/grow-areas/{growAreaId}`) now fully functional
  - Modal appears with pre-populated grow area data
  - All fields editable (name, zone type, size, rows, notes)
  - Advanced options collapsible section works correctly
  - Updates save successfully to backend

### Technical Details
- Backend: Added missing endpoint to fetch crop records by grow area ID
- Backend: Proper security checks ensure users can only access their own data
- Frontend: Fixed API route mapping for crop records and plants
- All grow area management features now working in both list view and detail page

---

## [0.5.0] - 2025-10-08

### Changed - Major Refactoring
- **GrowZone → GrowArea Terminology Update**
  - Renamed all GrowZone classes to GrowArea for better clarity
  - Updated model: GrowZone → GrowArea, GrowZoneEntity → GrowAreaEntity
  - Updated service: GrowZoneService → GrowAreaService
  - Updated repository: GrowZoneRepository → GrowAreaRepository
  - Updated controller: GrowZoneController → GrowAreaController
  - Updated exception: GrowZoneIdNotFoundException → GrowAreaIdNotFoundException
  - Updated API endpoint: /api/growzone → /api/growarea
  - Updated Garden model to use growAreas instead of growZones
  - Updated all frontend components to use "Grow Area" terminology
  - Updated GlobalExceptionHandler error messages

### Added
- AddGrowZoneModal component for creating new grow areas
- Modal-based UI for adding grow areas to gardens
- Auto-refresh functionality after adding grow areas

### Technical Details
- Maintained backward compatibility in database (column names unchanged for now)
- All references updated across 15+ files
- Frontend and backend terminology now aligned
- Build successful with zero compilation errors

---

## [0.4.0] - 2025-10-08

### Added - Data Access Control & Security
- **SecurityUtils Component**
  - Utility class to get current authenticated user from security context
  - Helper methods to retrieve user ID and username
  - Centralized security context access
  
- **User-Scoped Data Access**
  - All gardens filtered by authenticated user
  - Grow zones accessible only through user's gardens
  - Crop records accessible only through user's grow zones
  - Automatic user assignment when creating new gardens
  
- **Authorization Checks**
  - Security validation in GardenService (view, create, delete)
  - Security validation in GrowZoneService (view, create, delete)
  - Security validation in CropRecordService (view, create, delete)
  - IllegalAccessException thrown for unauthorized access attempts
  
- **API Updates**
  - Updated GardenController to use authenticated user context
  - Changed endpoint from `/api/garden` to `/api/gardens`
  - Removed userId from URL parameters (uses auth context)
  - Simplified garden creation (POST /api/gardens with just name)
  
- **Test Data**
  - Enhanced DataInitializer to create test garden for test user
  - "My First Garden" automatically created for testuser on startup

### Changed
- GardenService methods now use SecurityUtils instead of accepting userId parameter
- GrowZoneService enforces garden ownership before operations
- CropRecordService verifies garden ownership through grow zone
- All service methods validate user permissions before data access

### Security
- Multi-tenant data isolation implemented
- Users cannot access other users' data
- All CRUD operations protected by ownership checks
- Defense in depth: security at service layer, not just controller

### Technical Details
- Spring Security Context used for user identification
- Ownership verification on all sensitive operations
- Proper exception handling for unauthorized access

---

## [0.3.0] - 2025-10-08

### Added - Frontend Authentication
- **Authentication Context**
  - React Context API for global auth state management
  - `useAuth` hook for accessing auth state and functions
  - Persistent authentication (stores token and user in localStorage)
  - Auto-restore session on page reload
  
- **Authentication Pages**
  - Login page with username/password form
  - Registration page with email, username, password, and optional name fields
  - Form validation (password matching, minimum length)
  - Error handling and display
  - Loading states during API calls
  - Links between login and registration pages
  
- **Protected Routes**
  - `ProtectedRoute` component to guard authenticated pages
  - Automatic redirect to login for unauthenticated users
  - Preserves intended destination for post-login redirect
  
- **API Service**
  - Axios-based API client with interceptors
  - Automatic JWT token attachment to requests
  - Automatic token refresh on 401 responses
  - Session expiration handling
  
- **User Experience**
  - User information display in navigation sidebar
  - Logout button with navigation to login
  - Token stored in localStorage for persistence
  - Seamless login/logout flow

### Changed
- Updated App.tsx to include AuthProvider wrapper
- Added public routes (/login, /register) and protected routes (all others)
- Enhanced NavBar with user profile and logout functionality
- All application routes now require authentication

### Technical Details
- Auth state management using React Context API
- JWT tokens stored in localStorage
- Axios interceptors for token management
- TypeScript interfaces for type safety
- Tailwind CSS for styling

---

## [0.2.0] - 2025-10-08

### Added - Authentication & Security
- **User Management**
  - User model and entity with support for UserDetails interface
  - User repository with custom JPQL queries
  - User roles (USER, ADMIN) support
  - Email and username uniqueness constraints
  
- **JWT Authentication**
  - JWT token generation and validation service
  - JWT authentication filter for request processing
  - Token expiration handling (24-hour default)
  - Secure password encoding with BCrypt
  
- **Security Configuration**
  - Spring Security integration
  - JWT-based stateless authentication
  - Custom UserDetailsService implementation
  - CORS configuration for frontend integration
  - Protected API endpoints (all except /api/auth/*)
  
- **Authentication Endpoints**
  - POST /api/auth/register - User registration
  - POST /api/auth/login - User login
  - Returns JWT token with user information
  
- **Database**
  - PostgreSQL migration (V2__create_user_table.sql)
  - User table with UUID primary key
  - Foreign key relationship: garden.user_id → user.id
  - Database indexes for email and username lookups
  
- **Infrastructure**
  - Docker Compose configuration for PostgreSQL
  - PostgreSQL driver and Flyway PostgreSQL support
  - Updated application.yml for PostgreSQL connection

### Changed
- Migrated from H2 in-memory database to PostgreSQL
- Updated build.gradle.kts with Spring Security and JWT dependencies
- CORS configuration now integrated into SecurityConfig
- All API endpoints now require authentication (except auth endpoints)

### Fixed
- UserEntity property naming conflicts with UserDetails interface methods
- JWT library API compatibility issues (updated to use newer Jwts.parser() API)
- UserRepository query resolution for renamed private fields

### Technical Details
- Spring Security 6.x
- JWT library: io.jsonwebtoken:jjwt 0.12.3
- PostgreSQL 16 (Alpine)
- BCrypt password encoding
- Stateless session management

---

## [0.1.0] - 2025-10-08

### Added - Backend
- **Database Schema**
# GardenTime - Vite to Next.js Migration

## Migration Status: Complete ✅

### Completed Tasks

#### 1. Infrastructure Setup
- ✅ Set up Next.js project structure
- ✅ Configured package.json with dependencies (React 18, Next.js 15, axios, TypeScript)
- ✅ Created environment configuration files
- ✅ Set up Tailwind CSS (already configured)

#### 2. BFF (Backend for Frontend) Layer
- ✅ Created Next.js API routes to proxy requests to Spring Boot backend
- ✅ Implemented authentication endpoints (`/api/auth/login`, `/api/auth/register`)
- ✅ Implemented garden endpoints (`/api/gardens`, `/api/gardens/[id]`)
- ✅ Implemented grow area endpoints (`/api/grow-areas`, `/api/grow-areas/[id]`)
- ✅ Implemented crop record endpoints (`/api/crop-records`)
- ✅ Implemented plant endpoints (`/api/plants`)
- ✅ Created Spring API helper utility for backend communication

#### 3. Client-Side Services
- ✅ Created comprehensive API service layer (`lib/api.ts`)
- ✅ Implemented TypeScript interfaces for all data types
- ✅ Set up axios with authentication interceptors

#### 4. Authentication & Context
- ✅ Created AuthContext for global auth state management
- ✅ Implemented login/logout functionality
- ✅ Token management with localStorage
- ✅ Protected route logic

#### 5. Pages & Components
- ✅ Home/Landing page (`/`)
- ✅ Login page (`/login`)
- ✅ Register page (`/register`)
- ✅ Gardens list page (`/gardens`)
- ✅ Garden detail page (`/gardens/[id]`)
- ✅ Grow area detail page (`/gardens/[id]/grow-areas/[growAreaId]`)

#### 6. Features Implemented
- ✅ User authentication (login/register)
- ✅ Auto-redirect authenticated users
- ✅ List all gardens
- ✅ Create new gardens
- ✅ View garden details
- ✅ List grow areas per garden
- ✅ Create new grow areas
- ✅ View grow area details
- ✅ List crop records per grow area
- ✅ Create new crop records
- ✅ Plant selection from database
- ✅ Crop outcome tracking (Excellent/Good/Fair/Poor)
- ✅ Harvest tracking with quantity and units

### Architecture

**BFF Pattern Implementation:**
```
Client (Browser) → Next.js API Routes → Spring Boot Backend
```

The Next.js API routes act as a Backend for Frontend (BFF) layer that:
- Handles authentication token forwarding
- Provides a clean API interface to the client
- Can be extended for caching, data transformation, etc.

### Environment Variables

Create a `.env.local` file with:
```
SPRING_BACKEND_URL=http://localhost:8080
```

### Running the Application

1. Start Spring Boot backend:
   ```bash
   ./gradlew bootRun
   ```

2. Start Next.js frontend:
   ```bash
   cd client-next
   npm install
   npm run dev
   ```

3. Access the app at `http://localhost:3000`

### Migration Benefits

- ✅ **Server-Side Rendering (SSR)** capabilities
- ✅ **API Routes** for BFF pattern
- ✅ **Better SEO** potential
- ✅ **Improved routing** with file-based system
- ✅ **Modern React** with Server Components support
- ✅ **Type-safe** API layer with TypeScript
- ✅ **Optimized performance** with Next.js optimizations

### Next Steps (Optional Enhancements)

- [ ] Add server-side rendering for public pages
- [ ] Implement middleware for route protection
- [ ] Add loading states with Suspense
- [ ] Implement error boundaries
- [ ] Add data revalidation strategies
- [ ] Consider using React Server Components for data fetching
- [ ] Add unit and integration tests
- [ ] Implement optimistic UI updates
- [ ] Add image optimization for plant/garden photos
- [ ] Consider implementing NextAuth for authentication
  - Garden entity with name and user_id fields
  - GrowZone entity with name, size, type, notes, and number of rows
  - Plant entity with comprehensive fields (name, scientific name, plant type, maturity time, growing season, sun/water/soil requirements)
  - CropRecord entity to track planting history
  - Database migrations using Flyway (V1__create_tables.sql)
  
- **Domain Models**
  - Garden, GrowZone, Plant, CropRecord data classes
  - Enums: PlantType, GrowingSeason, CropStatus, ZoneType, Outcome, GrowthQuality
  - Entity-to-domain mapping functions
  
- **Repository Layer**
  - GardenRepository
  - GrowZoneRepository
  - PlantRepository
  - CropRecordRepository
  
- **Service Layer**
  - GardenService with CRUD operations
  - GrowZoneService with CRUD operations
  - PlantService with CRUD operations
  - CropRecordService with CRUD operations
  
- **API Controllers**
  - GardenController (REST endpoints)
  - GrowZoneController (REST endpoints)
  - PlantController (REST endpoints)
  - CropRecordController (REST endpoints)
  
- **Configuration**
  - CORS configuration for frontend communication
  - Application configuration (application.yml)
  - Gradle build configuration (Kotlin DSL)

### Added - Frontend
- **React + TypeScript Setup**
  - Vite build tool configuration
  - React Router for navigation
  - TailwindCSS for styling
  
- **Components**
  - NavBar with navigation items
  - GrowZonesListView for displaying grow areas
  - GrowZoneView for individual grow area details
  - GardenView for garden display
  - CropRecordCard for crop information display
  
- **Pages/Routes**
  - Layout component with navigation
  - Gardens page
  - Overview page
  - NoPage (404) component
  
- **Types/Interfaces**
  - GrowZoneViewInfo interface

### Technical Stack
- **Backend**: Kotlin, Spring Boot, JPA/Hibernate, PostgreSQL (implied from UUID types)
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, React Router
- **Build Tools**: Gradle (Kotlin DSL), npm/vite
- **Database Migration**: Flyway

### Known Issues
- No user authentication implemented
- Users can see all gardens (not filtered by user)
- Edit and delete buttons in GrowZonesListView are not functional
- "Add Grow Area" button not implemented
- No visual board/canvas view for garden layout
- Limited plant database
- No search functionality
- GrowZone terminology inconsistent (should rename to GrowArea)

---

## Version History

### Version Numbering
- **0.x.x**: Pre-release/Development versions
- **1.0.0**: First production-ready release (requires authentication, core features complete)

### Upcoming Milestones
- **0.2.0**: User authentication and authorization
- **0.3.0**: Visual garden board (drag-and-drop layout)
- **0.4.0**: Search and filtering
- **0.5.0**: Enhanced plant database and crop rotation intelligence
- **1.0.0**: Production-ready release

---

## Development Guidelines

### Adding to Changelog
When making changes, add entries under the `[Unreleased]` section using these categories:

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

### Example Entry Format
```markdown
### Added
- User authentication with JWT tokens (#123)
- Visual garden board with drag-and-drop support (#124)

### Fixed
- Crop record deletion not removing from database (#125)
```

---

## Notes
- Project started: October 2025
- Initial development phase focuses on core functionality
- Authentication is the highest priority for next release
