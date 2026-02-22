# GardenTime Backend Technical Debt Analysis

**Created:** 2026-02-22  
**Scope:** GardenTime Backend (`/src/main/kotlin/no/sogn/gardentime`)  
**Status:** Initial Assessment

---

## Executive Summary

The GardenTime backend is a well-structured Spring Boot + Kotlin application with a solid foundation. The rotation planning system is particularly well-designed. However, there are several areas of technical debt that, if addressed, will improve maintainability, testability, and code quality.

**Key Findings:**
- Architecture is generally sound, but inconsistencies exist in patterns across packages
- Security authorization checks are duplicated across controllers and services
- Test coverage appears limited and test dependencies have issues
- DTOs are scattered across multiple packages without clear organization
- Some services have grown too large (SeasonPlanningService)
- Missing validation layer for incoming requests

---

## Priority Matrix

| Priority | Category | Effort | Impact |
|----------|----------|--------|--------|
| P0 | Dependency Upgrades | Low | High |
| P1 | Build Configuration Fix | Low | High |
| P1 | Authorization Consolidation | Medium | High |
| P2 | DTO Organization | Medium | Medium |
| P2 | Service Layer Refactoring | High | High |
| P2 | Test Coverage Improvement | High | High |
| P3 | Model Layer Cleanup | Medium | Medium |
| P3 | API Response Consistency | Low | Medium |
| P4 | Performance Optimization | Medium | Low |

---

## P1: High Priority Issues

### 1.1 Build Configuration - Test Dependency Resolution

**Location:** `build.gradle.kts`

**Issue:** The `spring-boot-starter-security-test` dependency fails to resolve version.

**Current:**
```kotlin
testImplementation("org.springframework.boot:spring-boot-starter-security-test")
```

**Fix:** Add explicit version or ensure Spring Boot BOM properly manages this dependency:
```kotlin
testImplementation("org.springframework.boot:spring-boot-starter-test")
testImplementation("org.springframework.security:spring-security-test")
```

**Impact:** Tests cannot run, blocking CI/CD and quality assurance.

**Effort:** 15 minutes

---

### 1.2 Authorization Logic Duplication

**Locations:**
- `GardenService.kt` - Manual user ID checks
- `GrowAreaService.kt` - Manual user ID checks
- `SeasonPlanningController.kt` - Manual garden ownership verification
- Multiple other controllers

**Issue:** Every service/controller manually fetches `currentUserId` from `SecurityUtils` and checks ownership. This pattern is:
1. Repetitive (~50+ occurrences)
2. Error-prone (easy to miss a check)
3. Not utilizing Spring Security's authorization capabilities

**Current Pattern (repeated everywhere):**
```kotlin
val currentUserId = securityUtils.getCurrentUserId()
val garden = gardenRepository.findById(id).orElse(null)
if (garden.userId != currentUserId) {
    throw IllegalAccessException("You don't have permission...")
}
```

**Proposed Solution - Method Security with Custom Expression:**

1. Create a custom `@PreAuthorize` expression evaluator:
```kotlin
@Component("gardenSecurity")
class GardenSecurityEvaluator(
    private val gardenRepository: GardenRepository,
    private val growAreaRepository: GrowAreaRepository,
    private val securityUtils: SecurityUtils
) {
    fun isGardenOwner(gardenId: UUID): Boolean {
        val userId = securityUtils.getCurrentUserId()
        return gardenRepository.findById(gardenId)
            .map { it.userId == userId }
            .orElse(false)
    }
    
    fun isGrowAreaOwner(growAreaId: Long): Boolean {
        val userId = securityUtils.getCurrentUserId()
        val growArea = growAreaRepository.findById(growAreaId).orElse(null) ?: return false
        return gardenRepository.findById(growArea.gardenId)
            .map { it.userId == userId }
            .orElse(false)
    }
}
```

2. Use in controllers:
```kotlin
@PreAuthorize("@gardenSecurity.isGardenOwner(#gardenId)")
@GetMapping("/{gardenId}")
fun getGarden(@PathVariable gardenId: UUID): ResponseEntity<Garden> {
    // No manual auth check needed
    return ResponseEntity.ok(gardenService.getGardenById(gardenId))
}
```

3. Enable method security:
```kotlin
@EnableMethodSecurity(prePostEnabled = true)
class SecurityConfig { ... }
```

**Impact:** Eliminates ~50+ duplicate code blocks, centralizes authorization logic, reduces security vulnerabilities.

**Effort:** 1-2 days

---

## P2: Medium Priority Issues

### 2.1 DTO Organization

**Current State:** DTOs are scattered across 4+ locations:
- `no.sogn.gardentime.dto/` - Season planning, auth, user DTOs
- `no.sogn.gardentime.rotation.dto/` - Rotation DTOs
- `no.sogn.gardentime.client.dto/` - Plant data API client DTOs
- `no.sogn.gardentime.api/` - Some request DTOs defined in controllers (e.g., `CreateGardenRequest`)
- `no.sogn.gardentime.model/` - Some DTOs mixed with entities (e.g., `CropRecordDTO`)

**Issues:**
1. No clear separation between request/response DTOs
2. Some DTOs defined inline in controllers
3. Domain models sometimes used directly in API responses
4. Naming inconsistency (some `*DTO`, some `*Request`, some `*Response`)

**Proposed Structure:**
```
no.sogn.gardentime/
├── api/
│   └── dto/
│       ├── request/     # Incoming request bodies
│       │   ├── CreateGardenRequest.kt
│       │   ├── UpdateGrowAreaRequest.kt
│       │   └── ...
│       └── response/    # API response bodies
│           ├── GardenResponse.kt
│           ├── GrowAreaResponse.kt
│           └── ...
├── client/
│   └── dto/             # External API DTOs (Plant Data Aggregator)
│       └── PlantDataApiDTOs.kt  # OK as-is
├── rotation/
│   └── dto/             # Rotation-specific DTOs (OK as-is)
└── model/               # Domain models ONLY (no DTOs)
```

**Migration Steps:**
1. Create `api/dto/request/` and `api/dto/response/` packages
2. Move inline DTOs from controllers to appropriate packages
3. Extract DTOs from model files (e.g., `CropRecordDTO` from `CropRecord.kt`)
4. Standardize naming: `*Request` for requests, `*Response` for responses
5. Delete empty `dto/` root package after migration

**Effort:** 4-6 hours

---

### 2.2 SeasonPlanningService Decomposition

**Location:** `service/SeasonPlanningService.kt` (439 lines)

**Issue:** This service handles too many responsibilities:
1. Season plan CRUD
2. Planned crop CRUD
3. Calendar event generation
4. Rotation planner execution
5. DTO conversions

**Proposed Decomposition:**

```kotlin
// Focus: Season plan lifecycle
class SeasonPlanService {
    fun getSeasonPlans(gardenId: UUID): List<SeasonPlanDTO>
    fun createSeasonPlan(gardenId: UUID, dto: CreateSeasonPlanDTO): SeasonPlanDTO
    fun deleteSeasonPlan(id: UUID)
}

// Focus: Planned crop management
class PlannedCropService {
    fun getPlannedCrops(seasonPlanId: UUID): List<PlannedCropDTO>
    fun addPlannedCrop(seasonPlanId: UUID, dto: CreatePlannedCropDTO): PlannedCropDTO
    fun updatePlannedCrop(id: UUID, dto: UpdatePlannedCropDTO): PlannedCropDTO
    fun deletePlannedCrop(id: UUID)
}

// Focus: Calendar aggregation
class CalendarService {
    fun getCalendarEvents(gardenId: UUID, startDate: LocalDate, endDate: LocalDate): CalendarResponseDTO
}

// Keep rotation planner integration in existing SeasonPlanningService
// or create dedicated CropPlacementService
```

**Benefits:**
- Single Responsibility Principle adherence
- Easier testing (smaller units)
- Better code organization
- Reduced merge conflicts

**Effort:** 1 day

---

### 2.3 Test Coverage Improvement

**Current Test Files (9 total):**
```
GardenTimeApplicationTests.kt
api/PlantDataControllerTest.kt
client/PlantDataApiClientTest.kt
client/PlantDataApiClientIntegrationTest.kt
repository/GardenRepositoryTest.kt
repository/PlantRepositoryTest.kt
rotation/RotationScoringServiceTest.kt
service/CropRecordServiceTest.kt
service/PlantServiceTest.kt
```

**Missing Critical Tests:**
| Component | Current Coverage | Priority |
|-----------|-----------------|----------|
| `GardenService` | None | High |
| `GrowAreaService` | None | High |
| `AuthService` | None | High |
| `SeasonPlanningService` | None | High |
| `RotationRecommendationService` | None | High |
| `GardenController` | None | Medium |
| `SeasonPlanningController` | None | Medium |
| `RotationController` | None | Medium |
| `UserController` | None | Low |

**Test Strategy:**
1. **Unit Tests (Mock dependencies):**
   - All service layer classes
   - Focus on business logic validation
   
2. **Integration Tests:**
   - Controller endpoints with MockMvc
   - Repository tests with test database

3. **Key Test Scenarios:**
   - Authorization enforcement (user can only access own data)
   - Rotation scoring edge cases
   - Season plan lifecycle
   - Error handling paths

**Example Test Structure:**
```kotlin
@ExtendWith(MockitoExtension::class)
class GardenServiceTest {
    @Mock lateinit var gardenRepository: GardenRepository
    @Mock lateinit var growAreaService: GrowAreaService
    @Mock lateinit var cropRecordRepository: CropRecordRepository
    @Mock lateinit var securityUtils: SecurityUtils
    
    @InjectMocks lateinit var gardenService: GardenService
    
    @Test
    fun `getGardenById returns garden when user is owner`() { ... }
    
    @Test
    fun `getGardenById throws when user is not owner`() { ... }
    
    @Test
    fun `addGarden creates garden for current user`() { ... }
}
```

**Effort:** 3-5 days for comprehensive coverage

---

## P3: Lower Priority Issues

### 3.1 Model Layer Cleanup

**Issues in Model Files:**

1. **CropRecord.kt contains 4 classes:**
   - `CropRecordDTO` (should be in DTO package)
   - `CropRecord` (domain model)
   - `CropRecordEntity` (JPA entity)
   - `CropStatusConverter` (JPA converter)
   - Plus 3 mapper functions

   **Fix:** Extract DTOs, put converter in separate file, keep entity+domain together.

2. **Garden.kt contains 4 constructs:**
   - `Garden` (domain model)
   - `GardenInfo` (DTO - should move)
   - `GardenEntity` (JPA entity)
   - Mapper functions

3. **RotationModels.kt** - Unclear what this contains (filename suggests it might be misplaced)

**Proposed Pattern:**
```
model/
├── entity/           # JPA entities only
│   ├── GardenEntity.kt
│   ├── GrowAreaEntity.kt
│   └── ...
├── domain/          # Domain models (if needed separately)
│   ├── Garden.kt
│   └── ...
├── converter/       # JPA converters
│   ├── CropStatusConverter.kt
│   └── ZoneTypeConverter.kt
└── mapper/          # Model mappers
    └── GardenMapper.kt
```

**Effort:** 4-6 hours

---

### 3.2 Request Validation

**Issue:** No `@Valid` annotations or Bean Validation constraints on request DTOs.

**Current (no validation):**
```kotlin
@PostMapping
fun addGarden(@RequestBody request: CreateGardenRequest): ResponseEntity<Garden>
```

**Proposed:**
```kotlin
// DTO with validation
data class CreateGardenRequest(
    @field:NotBlank(message = "Garden name is required")
    @field:Size(min = 1, max = 100, message = "Name must be 1-100 characters")
    val name: String
)

// Controller with @Valid
@PostMapping
fun addGarden(@Valid @RequestBody request: CreateGardenRequest): ResponseEntity<Garden>
```

**Key DTOs needing validation:**
- `CreateGardenRequest` - name required
- `CreateGrowAreaRequest` - name required, dimensions > 0
- `RegisterRequest` - email format, password strength
- `LoginRequest` - credentials required
- `CreateSeasonPlanDTO` - season/year constraints
- `CreatePlannedCropDTO` - plant ID required

**Effort:** 2-3 hours

---

### 3.3 API Response Consistency

**Issue:** Inconsistent response patterns across controllers:

1. Some return domain models directly (`Garden`)
2. Some return DTOs (`SeasonPlanDTO`)
3. Error responses vary (some use `MessageResponse`, some use `ErrorResponse`)
4. Some use `ResponseEntity<*>` (wildcard type)

**Proposed Standard:**
```kotlin
// Always use DTOs for responses
fun getGarden(): ResponseEntity<GardenResponse>

// Standard error format via GlobalExceptionHandler (already exists)
// Remove inline error handling in controllers

// Avoid wildcard types
// BAD:  fun register(): ResponseEntity<*>
// GOOD: fun register(): ResponseEntity<AuthResponse>
```

**Effort:** 2-4 hours

---

### 3.4 Unused GraphQL Dependency

**Location:** `build.gradle.kts`

```kotlin
implementation("com.netflix.graphql.dgs:graphql-dgs-spring-graphql-starter")
testImplementation("com.netflix.graphql.dgs:graphql-dgs-spring-graphql-starter-test")
```

**Issue:** GraphQL DGS is included but no GraphQL schema or resolvers exist in the codebase. This adds unnecessary startup time and dependencies.

**Action:** If GraphQL is not planned for near-term, remove these dependencies.

**Effort:** 5 minutes

---

## P0: Dependency Upgrades

Several dependencies are outdated and should be upgraded for security patches, bug fixes, and new features.

### Option A: Conservative Upgrade (Spring Boot 3.4.x)

Recommended if you want minimal migration effort:

| Dependency | Current Version | Recommended Version | Priority | Notes |
|------------|----------------|---------------------|----------|-------|
| **Plugins** |
| Kotlin JVM/Spring/JPA | 2.2.21 | 2.3.20 | Medium | Latest stable Kotlin release |
| Spring Boot | 3.4.1 | 3.4.2 | High | Security patches |
| Spring Dependency Management | 1.1.7 | 1.1.7 | ✅ OK | Already latest |
| **Runtime Dependencies** |
| jjwt-api/impl/jackson | 0.12.3 | 0.12.5 | High | Security fixes for JWT handling |
| **Test Dependencies** |
| mockito-kotlin | 5.4.0 | 6.2.3 | Medium | Major version bump, better Kotlin support |
| wiremock-standalone | 3.3.1 | 3.13.2 | Medium | Bug fixes, new features |

### Option B: Major Upgrade (Spring Boot 4.0.x) ⭐ Recommended

Spring Boot 4.0.0 was released November 2025. This is a major upgrade with significant benefits:

| Dependency | Current Version | Recommended Version | Priority | Notes |
|------------|----------------|---------------------|----------|-------|
| **Plugins** |
| Kotlin JVM/Spring/JPA | 2.2.21 | 2.3.20 | High | Required for Spring Boot 4 |
| Spring Boot | 3.4.1 | **4.0.x** | High | Major upgrade, Spring Framework 7 |
| Spring Dependency Management | 1.1.7 | 1.1.7 | ✅ OK | Still compatible |
| **Runtime Dependencies** |
| jackson-module-kotlin | (managed) | **Jackson 3** | High | Jackson 2 deprecated in SB4 |
| jjwt-api/impl/jackson | 0.12.3 | 0.12.5+ | High | Check Jackson 3 compatibility |
| **Test Dependencies** |
| mockito-kotlin | 5.4.0 | 6.2.3 | Medium | Better Kotlin support |
| wiremock-standalone | 3.3.1 | 3.13.2 | Medium | Bug fixes |

### Spring Boot 4 + Jackson 3 Migration Guide

**Current Jackson usage in codebase:**
- `jackson-module-kotlin` dependency (implicit via Spring Boot starter)
- `ObjectMapper` used in `PlantDataControllerTest.kt`
- All DTOs rely on Jackson for JSON serialization

**Key Changes Required:**

1. **Package Changes:**
   ```kotlin
   // Jackson 2 (current)
   import com.fasterxml.jackson.databind.ObjectMapper
   
   // Jackson 3 (new)
   import tools.jackson.databind.json.JsonMapper
   ```

2. **ObjectMapper → JsonMapper (immutable builder pattern):**
   ```kotlin
   // Jackson 2 (mutable)
   val mapper = ObjectMapper()
   mapper.registerModule(KotlinModule.Builder().build())
   
   // Jackson 3 (immutable, builder-based)
   val mapper = JsonMapper.builder()
       .addModule(KotlinModule.Builder().build())
       .build()
   ```

3. **Annotations remain compatible:**
   - `@JsonProperty`, `@JsonIgnore`, etc. still work (same package)
   - `com.fasterxml.jackson.annotation` remains unchanged

4. **Spring Boot auto-configuration:**
   - Spring Boot 4 auto-configures Jackson 3 by default
   - Kotlin module should be auto-registered if `jackson-module-kotlin` is on classpath

**Files requiring Jackson 3 migration:**
```
src/test/kotlin/no/sogn/gardentime/api/v1/PlantDataControllerTest.kt
  - Line: import com.fasterxml.jackson.databind.ObjectMapper
  - Line: private lateinit var objectMapper: ObjectMapper
```

**Migration Steps for Spring Boot 4:**

1. Update `build.gradle.kts`:
   ```kotlin
   plugins {
       kotlin("jvm") version "2.3.20"
       kotlin("plugin.spring") version "2.3.20"
       kotlin("plugin.jpa") version "2.3.20"
       id("org.springframework.boot") version "4.0.0"
       id("io.spring.dependency-management") version "1.1.7"
   }
   
   dependencies {
       // Jackson 3 Kotlin module (check for latest compatible version)
       implementation("tools.jackson.module:jackson-module-kotlin")
       
       // jjwt - verify Jackson 3 compatibility
       implementation("io.jsonwebtoken:jjwt-api:0.12.5")
       runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.5")
       runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.5")  // May need Jackson 3 version
   }
   ```

2. Update test imports:
   ```kotlin
   // PlantDataControllerTest.kt
   import tools.jackson.databind.json.JsonMapper
   // ... use JsonMapper instead of ObjectMapper
   ```

3. Run full test suite and fix any serialization issues

**Temporary compatibility option:**
```properties
# application.properties - use only during migration
spring.jackson.use-jackson2-defaults=true
```

### Recommended build.gradle.kts Changes (Option A - Conservative)

```kotlin
plugins {
    kotlin("jvm") version "2.3.20"                    // Was: 2.2.21
    kotlin("plugin.spring") version "2.3.20"          // Was: 2.2.21
    kotlin("plugin.jpa") version "2.3.20"             // Was: 2.2.21
    id("org.springframework.boot") version "3.4.2"    // Was: 3.4.1
    id("io.spring.dependency-management") version "1.1.7"  // OK
}

dependencies {
    // JWT - upgrade all three modules together
    implementation("io.jsonwebtoken:jjwt-api:0.12.5")        // Was: 0.12.3
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.5")          // Was: 0.12.3
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.5")       // Was: 0.12.3
    
    // Test dependencies
    testImplementation("org.mockito.kotlin:mockito-kotlin:6.2.3")  // Was: 5.4.0
    testImplementation("org.wiremock:wiremock-standalone:3.13.2")  // Was: 3.3.1
}
```

### Upgrade Notes

**Kotlin 2.2 → 2.3:**
- K2 compiler is now default (improved performance)
- Check for deprecated API usage warnings after upgrade
- Run full test suite after upgrade

**mockito-kotlin 5.x → 6.x:**
- Major version change - check for breaking changes
- Better inline function mocking support
- May require test adjustments

**jjwt 0.12.3 → 0.12.5:**
- Patch release, should be drop-in compatible
- Contains security fixes

**WireMock 3.3 → 3.13:**
- Many patch releases with bug fixes
- Should be backward compatible

**Spring Boot 3.4 → 4.0 (if choosing Option B):**
- Requires Java 17+ (already using Java 21 ✅)
- Jackson 2 → Jackson 3 migration required
- Spring Framework 6 → 7
- Jakarta EE 10 → 11
- Review: https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide

### Upgrade Sequence

**Option A (Conservative):**
1. Upgrade Spring Boot (3.4.1 → 3.4.2) - minimal risk
2. Upgrade jjwt (security priority)
3. Upgrade Kotlin plugins (test thoroughly)
4. Upgrade test dependencies (mockito-kotlin, wiremock)

**Option B (Spring Boot 4):**
1. Upgrade Kotlin plugins first (2.2.21 → 2.3.20)
2. Upgrade Spring Boot (3.4.1 → 4.0.x)
3. Migrate Jackson 2 → Jackson 3 (update imports, ObjectMapper → JsonMapper)
4. Upgrade jjwt (verify Jackson 3 compatibility)
5. Upgrade test dependencies
6. Run full test suite, fix any issues

### Dependencies to Remove

| Dependency | Reason |
|------------|--------|
| `com.netflix.graphql.dgs:graphql-dgs-spring-graphql-starter` | Not used - no GraphQL schema exists |
| `com.netflix.graphql.dgs:graphql-dgs-spring-graphql-starter-test` | Not used |
| `io.projectreactor.kotlin:reactor-kotlin-extensions` | Not used - no reactive code |
| DGS BOM import | Not needed if removing DGS |

**After removing unused dependencies:**
```kotlin
// DELETE these lines:
// extra["netflixDgsVersion"] = "10.0.1"
// implementation("com.netflix.graphql.dgs:graphql-dgs-spring-graphql-starter")
// implementation("io.projectreactor.kotlin:reactor-kotlin-extensions")
// testImplementation("com.netflix.graphql.dgs:graphql-dgs-spring-graphql-starter-test")
// dependencyManagement { imports { mavenBom("com.netflix.graphql.dgs:...") } }
```

---

## P4: Future Improvements

### 4.1 Caching Strategy Review

**Current:** Caching exists in `PlantDataApiClient` using Spring Cache + Caffeine.

**Observations:**
- Cache keys use string concatenation (fragile)
- No cache statistics/monitoring
- Consider adding cache warming on startup for frequently accessed data

### 4.2 API Versioning

**Current:** Mix of versioning approaches:
- `/api/gardens/...` (no version)
- `/api/v1/plant-data/...` (versioned)

**Consideration:** Standardize on versioned APIs for future flexibility.

### 4.3 Observability

**Missing:**
- Structured logging (consider JSON format for production)
- Metrics endpoints (Micrometer/Actuator)
- Distributed tracing (if multi-service)

---

## Refactoring Sequence

**Recommended order (minimizes risk, maximizes early wins):**

### Week 1: Foundation Fixes
1. ✓ Upgrade dependencies (Spring Boot, jjwt, Kotlin)
2. ✓ Remove unused dependencies (GraphQL DGS, Reactor)
3. ✓ Fix build.gradle.kts test dependency issue
4. ✓ Add request validation to critical endpoints

### Week 2: Security Consolidation
5. Implement `@PreAuthorize` security expressions
6. Migrate authorization checks from services to method security
7. Write security tests to verify authorization

### Week 3-4: Structure Improvements
8. Reorganize DTOs into clear package structure
9. Clean up model layer (extract DTOs, organize entities)
10. Decompose `SeasonPlanningService`

### Week 5-6: Test Coverage
11. Write unit tests for all services
12. Write integration tests for controllers
13. Set up coverage reporting

---

## Metrics to Track

| Metric | Current | Target |
|--------|---------|--------|
| Test coverage | Unknown (tests won't run) | >80% |
| Authorization code duplication | ~50 occurrences | <5 |
| DTO locations | 4+ packages | 2 packages |
| Services >300 LOC | 2 | 0 |
| Controllers with manual auth | ~10 | 0 |

---

## Appendix: Files Reviewed

```
api/
├── AuthController.kt
├── CanvasObjectController.kt
├── CropRecordController.kt
├── GardenController.kt
├── GardenDashboardController.kt
├── GlobalExceptionHandler.kt
├── GrowAreaController.kt
├── PlantDataProxyController.kt
├── RotationController.kt
├── SeasonPlanningController.kt
└── UserController.kt

service/
├── AuthService.kt
├── CanvasObjectService.kt
├── CropRecordService.kt
├── GardenDashboardService.kt
├── GardenService.kt
├── GrowAreaService.kt
├── PlantService.kt
├── PlantingDateCalculatorService.kt
├── SeasonPlanningService.kt
└── UserService.kt

rotation/
├── RotationMessageService.kt
├── RotationRecommendationService.kt
├── RotationRules.kt
├── RotationScoringService.kt
└── dto/

model/
├── CanvasObject.kt
├── CropRecord.kt
├── Garden.kt
├── GardenClimateInfo.kt
├── GardenDashboard.kt
├── GrowArea.kt
├── PlannedCrop.kt
├── Plant.kt
├── PlantDetails.kt
├── RotationModels.kt
├── SeasonPlan.kt
├── User.kt
└── ZoneType.kt

client/
├── PlantDataApiClient.kt
└── dto/

security/
├── CustomUserDetailsService.kt
├── JwtAuthenticationFilter.kt
├── JwtService.kt
├── SecurityConfig.kt
└── SecurityUtils.kt

config/
├── DataInitializer.kt
└── PlantDataApiConfig.kt

db/ (repositories)
dto/
exceptions/
```

---

## Notes

- The rotation planning system (`rotation/` package) is well-designed and serves as a model for other features
- The project follows Kotlin idioms well (data classes, null safety)
- Spring Boot configuration appears correct and up-to-date
- Consider adding OpenAPI/Swagger documentation in future

---

*Document maintained in AI_DOCS for collaboration between developers and AI assistants.*
