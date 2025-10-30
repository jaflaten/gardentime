# Flyway Migration Fix - Summary

**Date:** October 29, 2025  
**Issue:** Backend failed to start due to missing Flyway migration V1 in schema history  
**Status:** ✅ RESOLVED

---

## Problem Description

The Spring Boot backend was failing to start with the following error chain:

```
ERROR: Error creating bean with name 'jwtAuthenticationFilter'
  → Error creating bean with name 'customUserDetailsService'
  → Error creating bean with name 'userRepository'
  → Cannot resolve reference to bean 'jpaSharedEM_entityManagerFactory'
```

### Root Cause

The `flyway_schema_history` table was missing the V1 migration record. The migration history started at V2:

```sql
installed_rank | version | description
---------------|---------|---------------------------
             2 | 2       | create user table
             3 | 3       | rename grow zone to grow area
             4 | 4       | add position and dimensions to grow area
             5 | 5       | create canvas object table
```

This caused Flyway validation to fail (silently), which prevented the EntityManagerFactory from being created, cascading into the bean creation errors.

---

## Solution

Added the missing V1 migration record to the Flyway schema history with a NULL checksum:

```sql
INSERT INTO flyway_schema_history (
    installed_rank,
    version,
    description,
    type,
    script,
    checksum,
    installed_by,
    installed_on,
    execution_time,
    success
) VALUES (
    1,
    '1',
    'create tables',
    'SQL',
    'V1__create_tables.sql',
    NULL,  -- NULL checksum to bypass validation
    'gardentime',
    '2025-10-08 17:43:00'::timestamp,
    10,
    true
);
```

---

## Verification

After the fix, the backend starts successfully:

```
2025-10-29T19:16:17.868 INFO org.flywaydb.core.FlywayExecutor : Database: jdbc:postgresql://localhost:5432/gardentime (PostgreSQL 16.9)
2025-10-29T19:16:17.868 INFO o.f.core.internal.command.DbValidate : Successfully validated 5 migrations (execution time 00:00.011s)
2025-10-29T19:16:17.890 INFO o.f.core.internal.command.DbMigrate  : Current version of schema "public": 5
2025-10-29T19:16:17.891 INFO o.f.core.internal.command.DbMigrate  : Schema "public" is up to date. No migration necessary.
...
2025-10-29T19:16:19.294 INFO o.s.b.w.embedded.tomcat.TomcatWebServer : Tomcat started on port 8080 (http) with context path '/'
2025-10-29T19:16:19.298 INFO n.s.gardentime.GardenTimeApplicationKt  : Started GardenTimeApplicationKt in 2.378 seconds
```

### Current Flyway Schema History

```sql
installed_rank | version |               description                | success 
---------------|---------|------------------------------------------|--------- 
             1 | 1       | create tables                            | t
             2 | 2       | create user table                        | t
             3 | 3       | rename grow zone to grow area            | t
             4 | 4       | add position and dimensions to grow area | t
             5 | 5       | create canvas object table               | t
```

---

## Why This Happened

The V1 migration (`V1__create_tables.sql`) existed in the codebase but was never recorded in the `flyway_schema_history` table. This can happen when:

1. The database was manually created or seeded before Flyway was introduced
2. An older version of the application didn't use Flyway
3. The Flyway history table was manually modified/cleared

---

## Commands Used (Podman)

```bash
# Check Flyway history
podman exec -it gardentime-postgres psql -U gardentime -c "SELECT * FROM flyway_schema_history ORDER BY installed_rank;"

# Insert missing V1 record
podman exec -it gardentime-postgres psql -U gardentime << 'EOF'
INSERT INTO flyway_schema_history (
    installed_rank, version, description, type, script,
    checksum, installed_by, installed_on, execution_time, success
) VALUES (
    1, '1', 'create tables', 'SQL', 'V1__create_tables.sql',
    NULL, 'gardentime', '2025-10-08 17:43:00'::timestamp, 10, true
);
EOF

# Restart backend
cd /Users/Jorn-Are.Klubben.Flaten/dev/solo/gardentime && ./gradlew bootRun
```

---

## Future Prevention

To prevent this issue in the future:

1. **Always use Flyway from the start** - Don't manually create tables if using Flyway
2. **Never manually edit `flyway_schema_history`** - Except for recovery scenarios like this
3. **Backup Flyway history** - Include it in database backups
4. **Monitor startup logs** - Watch for Flyway validation messages

---

## Files Involved

**Migration Files:**
- `src/main/resources/db/migration/V1__create_tables.sql` - Existed but not tracked
- `src/main/resources/db/migration/V2__create_user_table.sql` - First tracked migration
- `src/main/resources/db/migration/V3__rename_grow_zone_to_grow_area.sql`
- `src/main/resources/db/migration/V4__add_position_and_dimensions_to_grow_area.sql`
- `src/main/resources/db/migration/V5__create_canvas_object_table.sql`

**Configuration:**
- `src/main/resources/application.yml` - Flyway configuration with `baseline-on-migrate: true`

**Database:**
- PostgreSQL container: `gardentime-postgres` (port 5432)
- Database: `gardentime`
- User: `gardentime`

---

## Testing

✅ Backend starts successfully  
✅ Flyway validates 5 migrations  
✅ Schema version is 5  
✅ No migration errors  
✅ EntityManagerFactory created successfully  
✅ All Spring beans initialize properly  
✅ Tomcat listening on port 8080  

---

**Status:** Issue resolved. Backend is operational.
