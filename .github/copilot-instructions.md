# GardenTime Copilot Instructions

## Project Overview

GardenTime is a garden management system for regenerative agriculture. It has three main components:

1. **GardenTime Backend** (root `/src`) - Spring Boot + Kotlin (port 8080)
2. **Plant Data Aggregator** (`/plant-data-aggregator`) - Separate Spring Boot + Kotlin service (port 8081)
3. **Frontend** (`/client-next`) - Next.js + TypeScript + Tailwind (port 3000)

Both backends share a PostgreSQL database but maintain separate schemas via Flyway migrations.

## Build & Test Commands

### Backend (from root)
```bash
./gradlew build                    # Build
./gradlew test                     # Run all tests
./gradlew test --tests "*ServiceTest"  # Run tests matching pattern
./gradlew test --tests "RotationScoringServiceTest.scoreRotation*"  # Single test
./gradlew bootRun                  # Start server
```

### Plant Data Aggregator
```bash
cd plant-data-aggregator
./gradlew build
./gradlew test
./gradlew bootRun
```

### Frontend
```bash
cd client-next
npm run dev                        # Dev server
npm run build                      # Production build
npm run lint                       # ESLint
npm run test:e2e                   # All Playwright tests
npx playwright test e2e/02-gardens.spec.ts  # Single test file
npx playwright test --headed       # Visual debugging
```

### Database
```bash
podman-compose up -d               # Start PostgreSQL on port 5433
```

## Architecture

### Three-Tier Design
```
Frontend (Next.js:3000) 
    ↓ HTTP/REST
GardenTime Backend (:8080) ──API key auth──→ Plant Data Aggregator (:8081)
    ↓                                            ↓
PostgreSQL (gardentime schema)         PostgreSQL (plant data schema)
```

### Key Architectural Decisions

**Rotation logic lives in GardenTime**, not Plant Data Aggregator, because it needs user context (garden history, grow areas, past plantings). Plant Data Aggregator is stateless botanical reference data.

**Frontend uses BFF pattern** - API routes in `/client-next/app/api/` proxy requests to backends, adding session auth.

### Backend Package Structure (GardenTime)
```
no.sogn.gardentime/
├── api/           # REST controllers
├── service/       # Business logic
├── rotation/      # Rotation scoring engine (RotationScoringService, RotationRecommendationService)
├── client/        # PlantDataApiClient for calling aggregator
├── db/            # Spring Data JPA repositories
├── model/         # JPA entities
├── dto/           # Request/response DTOs
├── security/      # JWT auth, filters
└── config/        # Spring configuration
```

### Plant Data Aggregator Package Structure
```
no.sogn.plantdata/
├── controller/    # REST controllers (PlantDataController is main API)
├── service/       # PlantDataService, CompanionPlantingService, PestDiseaseService
├── repository/    # JPA repositories
├── model/         # JPA entities (Plant, CompanionRelationship, etc.)
├── dto/           # DTOs for API responses
├── scraper/       # Web scraping for plant data (AlmanacScraper, etc.)
└── security/      # API key auth
```

### Frontend Structure
```
client-next/
├── app/
│   ├── api/       # BFF proxy routes
│   ├── gardens/   # Garden pages (uses App Router)
│   └── ...
├── components/    # React components
├── contexts/      # React contexts (auth, etc.)
├── hooks/         # Custom hooks
├── lib/           # API clients, utilities
├── types/         # TypeScript types
└── e2e/           # Playwright tests
```

## Key Conventions

### Database Migrations
- GardenTime: `/src/main/resources/db/migration/V*.sql`
- Plant Data: `/plant-data-aggregator/src/main/resources/db/migration/V*.sql`
- Use Flyway naming: `V{number}__{description}.sql`

### API Design
- GardenTime REST: `/api/gardens/{id}/...`, `/api/users/...`
- Plant Data REST: `/api/v1/plant-data/plants/...`, `/api/v1/plant-data/families/...`
- Plant Data requires API key header: `X-API-Key`

### Rotation Scoring System
The 5-factor scoring (0-100 points) in `RotationScoringService`:
1. Family Rotation (35 pts) - 2-4 year intervals by plant family
2. Nutrient Balance (25 pts) - Heavy/moderate/light feeders
3. Disease Risk (20 pts) - Soil-borne disease history
4. Root Depth Diversity (10 pts) - Alternate root depths
5. Companion Compatibility (10 pts) - Neighbor interactions

### Testing Patterns
- Backend: JUnit 5 + Mockito Kotlin (`org.mockito.kotlin:mockito-kotlin`)
- Use `whenever()` and `mock()` from mockito-kotlin
- Frontend E2E: Playwright with `data-testid` attributes
- E2E tests clean up created data in `afterEach` hooks

### Playwright Conventions
- Use `data-testid` for disambiguation
- Use timestamp-based unique names: `Test Garden ${Date.now()}`
- Clean up via API for gardens, via UI for grow areas (exercises modal flow)
- Avoid `waitForTimeout`; prefer `expect(locator).toBeVisible({ timeout: 10000 })`

## Development Philosophy

From CLAUDE.md:
1. Break problems to fundamentals, reason up from there
2. Challenge every assumption - delete unnecessary parts
3. Simplify before optimizing
4. Automate only after design is right

## Allowed Shell Commands

Standard Unix commands are permitted: `mkdir`, `find`, `sed`, `grep`, `cat`, `rm`, etc.

Git operations allowed: `git add`, `git commit`, `git status`, `git diff`, `git checkout`, etc.

## Documentation

- `AI_DOCS/` - Implementation summaries, architecture docs
- `docs/` - Feature specs, implementation guides
- `AI_DOCS/GARDENTIME_APPLICATION_SUMMARY.md` - Comprehensive project overview
- `docs/playwright-tests.md` - E2E testing guide
