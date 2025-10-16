# RegenGarden - Current Session Context

**Last Updated:** October 16, 2025

## 🚀 Project Status: FULLY FUNCTIONAL

RegenGarden (formerly GardenTime) is a garden management app built with **Next.js 15 (BFF)** + **Spring Boot (Kotlin)** + **PostgreSQL**.

---

## 🎯 Current Work

**Recently Completed:** Search Functionality (Steps 28-34)
- ✅ Fixed 405 error in grow area search endpoint
- ✅ Implemented BFF route for grow area search
- ✅ Rebranded application from "GardenTime" to "RegenGarden" across all pages
- ✅ Both plant search and grow area search fully functional

**Previous:** Step 25 - Canvas Drawing Tools (25.10 - Drawing Interaction Logic)
- ✅ Backend infrastructure complete (CanvasObject entity, API, database)
- ✅ Frontend components complete (DrawingToolbar, CanvasShape)
- ⏳ **Next:** Implement mouse event handlers for drawing interactions

---

## 🏗️ Tech Stack

### Architecture
```
Browser → Next.js BFF (/app/api/*) → Spring Boot (localhost:8080) → PostgreSQL
```

### Key Technologies
- **Frontend:** Next.js 15, React, TypeScript, Konva (canvas), Tailwind CSS
- **Backend:** Spring Boot 3.x, Kotlin, JPA/Hibernate
- **Database:** PostgreSQL (via Podman/Docker)
- **Auth:** JWT tokens, Spring Security

### Running the App
```bash
# Terminal 1 - Backend
./gradlew bootRun

# Terminal 2 - Frontend
cd client-next && npm run dev
```
- Backend: http://localhost:8080
- Frontend: http://localhost:3000

---

## 🔑 Core Features Implemented

### Authentication ✅
- Login, registration, logout
- JWT-based auth with session management
- Protected routes and API endpoints

### Gardens ✅
- Full CRUD operations
- Garden detail pages
- User-scoped access control

### Grow Areas ✅
- Full CRUD with all fields (name, zoneType, zoneSize, nrOfRows, notes, position, dimensions)
- Visual board view with Konva canvas (drag, resize, zoom, pan)
- List view with cards
- View toggle with localStorage persistence

### Crop Records ✅
- Create/view crop records per grow area
- Status tracking (PLANTED, GROWING, HARVESTED, etc.)
- Active vs historical separation

### Canvas Board Features ✅
- Drag-and-drop grow areas
- Resize with handles (rectangles: 8 handles, circles: 4 handles)
- Zoom (50%-200%), pan, grid toggle
- Mouse wheel zoom-to-pointer
- Circular rendering for BUCKET type areas
- Zone type badges and visual indicators

---

## 💾 Data Model (UUID-based)

**CRITICAL:** All IDs are UUIDs (strings), not integers!

### GrowArea
```typescript
{
  id: string;           // UUID
  name: string;         // Required
  gardenId: string;     // UUID
  zoneType?: 'BOX' | 'FIELD' | 'BED' | 'BUCKET';
  zoneSize?: string;    // e.g., "80x120cm"
  width?: number;       // cm (real-world)
  length?: number;      // cm (real-world)
  height?: number;      // cm (optional)
  positionX?: number;   // pixels on canvas
  positionY?: number;   // pixels on canvas
  nrOfRows?: number;
  notes?: string;
}
```

### CanvasObject (NEW)
```typescript
{
  id: string;
  gardenId: string;
  type: 'RECTANGLE' | 'CIRCLE' | 'LINE' | 'ARROW' | 'TEXT' | 'FREEHAND';
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[];     // For lines/freehand
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  text?: string;         // For text objects
  fontSize?: number;
  locked: boolean;
  zIndex: number;
}
```

---

## 📂 Key Files

### Critical Backend Files
- `src/main/kotlin/no/sogn/gardentime/model/GrowArea.kt`
- `src/main/kotlin/no/sogn/gardentime/model/CanvasObject.kt`
- `src/main/kotlin/no/sogn/gardentime/service/GrowAreaService.kt`
- `src/main/kotlin/no/sogn/gardentime/api/GrowAreaController.kt`

### Critical Frontend Files
- `client-next/lib/api.ts` - API service (UUID types)
- `client-next/contexts/AuthContext.tsx` - Auth state
- `client-next/app/gardens/[id]/page.tsx` - Garden detail
- `client-next/app/gardens/[id]/components/GardenBoardView.tsx` - Canvas
- `client-next/app/gardens/[id]/components/DrawingToolbar.tsx` - Tools
- `client-next/app/api/**/*` - BFF routes

### Environment
```
# client-next/.env.local
SPRING_BACKEND_URL=http://localhost:8080
```

---

## 🐛 Known Issues / Gotchas

1. **UUID vs Integer:** Never use `parseInt()` on IDs - they're UUID strings
2. **Trailing Slashes:** Some Spring endpoints require trailing slash (e.g., `/api/plants/`)
3. **Snake Case Mapping:** Backend uses `@Column(name = "position_x")` to map Kotlin camelCase to DB snake_case

---

## 📚 See Also

- `todo.md` - Complete feature roadmap and next steps
- `playwright-tests.md` - E2E test documentation
- `changelog.md` - Recent feature highlights
