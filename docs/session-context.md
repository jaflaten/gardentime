# GardenTime - Session Context

## ✅ NEXT.JS MIGRATION COMPLETE (October 8, 2025)

### Migration Status: FULLY FUNCTIONAL

The application has been successfully migrated from Vite to Next.js 15 with a complete BFF (Backend for Frontend) architecture.

### Important Implementation Details

#### UUID Type System
**CRITICAL:** Spring Boot backend uses UUID for all IDs, NOT integers!
- All IDs are strings in TypeScript (e.g., `id: string`)
- Never parse IDs with `parseInt()` - keep them as strings
- UUIDs look like: `8549a1b2-3c4d-5e6f-7890-1a2b3c4d5e6f`

#### Architecture
```
Browser (React Client)
    ↓ (string UUIDs)
Next.js BFF API Routes (/app/api/*)
    ↓ (string UUIDs → forwarded to Spring Boot)
Spring Boot REST API (UUID type)
    ↓
PostgreSQL Database
```

### Completed Routes & Features

#### Pages (Frontend)
- ✅ `/` - Landing page with auto-redirect for authenticated users
- ✅ `/login` - Login page
- ✅ `/register` - Registration page  
- ✅ `/gardens` - Gardens list page with create modal
- ✅ `/gardens/[id]` - Garden detail page (view/create grow areas)
- ✅ `/gardens/[id]/grow-areas/[growAreaId]` - Grow area detail (view/create crop records)

#### BFF API Routes (Next.js → Spring Boot)
All routes properly handle:
- JWT token extraction and forwarding
- UUID string parameters
- Error handling and logging

**Authentication:**
- `POST /api/auth/login`
- `POST /api/auth/register`

**Gardens:**
- `GET /api/gardens` - List all user's gardens
- `POST /api/gardens` - Create garden
- `GET /api/gardens/[id]` - Get garden by UUID
- `PUT /api/gardens/[id]` - Update garden
- `DELETE /api/gardens/[id]` - Delete garden
- `GET /api/gardens/[id]/grow-areas` - Get grow areas for garden

**Grow Areas:**
- `GET /api/grow-areas` - List all grow areas
- `POST /api/grow-areas` - Create grow area
- `GET /api/grow-areas/[id]` - Get grow area by UUID
- `PUT /api/grow-areas/[id]` - Update grow area
- `DELETE /api/grow-areas/[id]` - Delete grow area
- `GET /api/grow-areas/[id]/crop-records` - Get crop records

**Crop Records & Plants:**
- `POST /api/crop-records` - Create crop record
- `GET /api/plants` - List all plants

### Key Files

**Critical Files (DO NOT DELETE):**
- `client-next/lib/api.ts` - Client API service with UUID string types
- `client-next/lib/spring-api.ts` - Spring Boot connection helper
- `client-next/contexts/AuthContext.tsx` - Auth state management
- `client-next/app/api/**/*` - All BFF API routes

**Environment Configuration:**
- `client-next/.env.local`:
  ```
  SPRING_BACKEND_URL=http://localhost:8080
  ```

### Running the Application

1. **Start Spring Boot backend:**
   ```bash
   ./gradlew bootRun
   ```
   Running on: http://localhost:8080

2. **Start Next.js frontend:**
   ```bash
   cd client-next
   npm run dev
   ```
   Running on: http://localhost:3000

3. **Test credentials:**
   - Username: `testuser`
   - Password: `password123`

### TypeScript Type Definitions

**IMPORTANT:** All entity IDs are UUID strings:

```typescript
export interface Garden {
  id: string;  // UUID string
  name: string;
  description?: string;
  location?: string;
  userId: string;  // UUID string
  createdAt: string;
  updatedAt: string;
}

export interface GrowArea {
  id: string;  // UUID string
  gardenId: string;  // UUID string
  name: string;
  // ...
}

export interface CropRecord {
  id: string;  // UUID string
  growAreaId: string;  // UUID string
  plantId: string;  // UUID string
  // ...
}
```

### Common Issues & Solutions

**Issue:** "Invalid UUID string: 8549"
**Solution:** Don't parse IDs with `parseInt()` - keep them as strings

**Issue:** "No static resource api/gardens/..."
**Solution:** Ensure BFF API route exists in `/app/api/` directory

**Issue:** "Unauthorized" errors
**Solution:** Check that JWT token is being stored in localStorage and forwarded in headers

### Tech Stack

**Frontend:**
- Next.js 15 (App Router)
- React 18
- TypeScript
- Tailwind CSS (v4 with @tailwindcss/postcss)
- Axios

**Backend:**
- Spring Boot (Kotlin)
- PostgreSQL with UUID primary keys
- JWT Authentication
- Flyway migrations

### What Changed from Vite

1. **BFF Pattern:** All API calls now go through Next.js API routes instead of directly to Spring Boot
2. **File-based routing:** Pages in `/app/` directory instead of React Router
3. **Server Components Ready:** Can add SSR/SSG in future
4. **Type Safety:** Fixed UUID type handling throughout the stack

### Next Development Steps

- Old Vite client (`/client`) can be archived or removed
- All future development should use Next.js client (`/client-next`)
- BFF layer allows for future enhancements like caching, rate limiting, etc.

---

**Migration Date:** October 8, 2025  
**Status:** ✅ Production Ready  
**All Features:** Working End-to-End
