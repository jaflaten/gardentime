# Playwright End-to-End & Component Test Documentation

This document summarizes how our Playwright tests in `client-next/e2e` are structured, how they interact with the application, and the conventions we follow for reliability and maintainability.

## 1. Overview
We use [Playwright](https://playwright.dev/) to validate core user flows against the running Next.js frontend and Spring Boot backend. The Playwright config (`client-next/playwright.config.ts`) starts two servers:

- Backend: `./gradlew bootRun` (served at `http://localhost:8080`)
- Frontend: `npm run dev` (served at `http://localhost:3000`)

All tests use `baseURL: http://localhost:3000`, so every `page.goto('/login')` resolves against the Next.js dev server.

## 2. Test Directory & Key Files
Location: `client-next/e2e`

Current test files:
- `01-authentication.spec.ts` – Auth flows (login, logout, registration). Creates users; currently no automatic user cleanup.
- `02-gardens.spec.ts` – Garden listing and creation; now includes API-based garden cleanup.
- `03-grow-areas.spec.ts` – Grow area CRUD inside a freshly created garden; cleans up grow areas and garden.
- `04-crop-records.spec.ts` – Crop record CRUD within a grow area; cleans up grow area and garden.
- `05-complete-workflow.spec.ts` – Full journey; cleans up grow area and garden.

Other earlier-numbered specs cover auth, gardens, and grow areas (not detailed here but follow similar patterns).

## 3. Test Data Creation & Cleanup Strategy
Previously, tests created gardens/grow areas and left them in the database, causing clutter for the shared `testuser`. We added **per-test cleanup** logic to delete the grow area created during each test.

### Garden & Grow Area Cleanup (Updated)
All specs that create gardens or grow areas implement `afterEach` cleanup:
- Grow areas: removed via UI (ensures modal + UI flow still works) before deleting their parent garden.
- Gardens: deleted via Playwright `request` fixture hitting `/api/gardens/{id}` for speed and reliability (UI lacks a garden delete control on the list page).

Example combined cleanup snippet:
```ts
const createdGardenIds: string[] = [];
const createdGrowAreas: string[] = [];

test.afterEach(async ({ page, request }) => {
  // Remove grow areas through UI (verify modal behavior)
  for (const gid of createdGardenIds) {
    await page.goto(`/gardens/${gid}`);
    for (const name of createdGrowAreas) {
      const card = page.locator(`[data-testid="grow-area-card"]:has-text("${name}")`).first();
      if (await card.count()) {
        await card.locator('button[title="Delete"]').click();
        const modal = page.locator('h3:has-text("Delete Grow Area")').locator('..');
        await expect(modal).toBeVisible();
        await modal.locator('button:has-text("Delete")').click();
        await expect(card).toHaveCount(0);
      }
    }
  }
  // Fast API-level garden deletion
  for (const gid of createdGardenIds) {
    try { await request.delete(`/api/gardens/${gid}`); } catch {}
  }
  createdGrowAreas.length = 0;
  createdGardenIds.length = 0;
});
```

## 4. Selector Strategy & Stability
We rely on three tiers of selectors:

1. **Semantic role/text selectors** (e.g., `button:has-text("New Crop Record")`) for stable UI actions.
2. **`data-testid` attributes** for disambiguation when multiple identical actions exist on the same page (crop record edit/delete vs grow area edit/delete).
3. **Scoped locators** using `:has-text()` inside a parent test id (e.g., `[data-testid="grow-area-card"]:has-text("NAME")`).

### Added Test IDs
- `data-testid="grow-area-card"` on garden detail cards.
- `data-testid="crop-record-card"` and dynamic edit/delete button IDs in grow area detail pages.

### Modal Handling
We added consistent overlay/backdrop classes (`fixed inset-0 bg-black bg-opacity-50`) to ensure Playwright can interact with modal contents without underlying elements interfering.

## 5. Timestamp-Based Uniqueness
Each test builds unique names using `Date.now()`:
- Gardens: `Test Garden <timestamp>` / `E2E Test Garden <timestamp>`
- Grow Areas: `Test Grow Area <timestamp>` / `E2E Test Grow Area <timestamp>`

This prevents collisions when tests run concurrently or when manual runs leave stale data prior to cleanup.

## 6. Editing vs Wrong Modal Pitfall
Original failures occurred because the test clicked the first `Edit` button on grow area detail pages—sometimes selecting the grow area edit instead of the crop record edit.

Fix: Scope edit/delete buttons to crop record cards:
```ts
const editButton = page.locator('[data-testid="crop-record-card"] button:has-text("Edit")').first();
```
This change eliminated false positives and missing form field errors.

## 7. Running the Tests
From `client-next/`:

```bash
# UI mode 
npx playwright test --ui

# All tests headless
npx playwright test

# Specific test file
npx playwright test e2e/05-complete-workflow.spec.ts

# Headed mode (debug visually)
npx playwright test --headed e2e/04-crop-records.spec.ts

# UI mode (interactive runner)
npx playwright test --ui

# Show last HTML report
npx playwright show-report
```

Or via npm scripts:
```bash
npm run test:e2e          # All tests
npm run test:e2e:headed   # Headed mode
npm run test:e2e:ui       # UI test runner
npm run test:e2e:report   # Open HTML report
```

## 8. Common Wait Patterns
We avoid arbitrary long waits except when necessary for backend propagation. Preferred patterns:

- `await expect(locator).toBeVisible({ timeout: 10000 })` – robust element readiness
- `await expect(locator).not.toBeVisible()` – modal dismissal
- Short `page.waitForTimeout(500)` only after an async mutation where no direct UI state is exposed (e.g., after deletion confirmation).

To further improve reliability we can replace those small timeouts with polling for the disappearance of the previous element.

## 9. Adding New Tests – Guidelines
When introducing a new E2E spec:
1. Use a descriptive file prefix (`06-...`) to preserve ordering in reports.
2. Generate unique entity names with `Date.now()` or `crypto.randomUUID()`.
3. Add `data-testid` attributes for any interactive elements that could have duplicates.
4. Implement cleanup for every persisted entity you create unless intentionally validating retention.
5. Prefer chaining locators rather than large XPath or brittle DOM traversal.
6. Keep modal interactions scoped (e.g., `const modal = page.locator('h3:has-text("Title")').locator('..')`).

## 10. Future Enhancements (Optional)
- Add optional cleanup for registered test users (requires backend endpoint or admin token).
- Centralize entity creation & cleanup via Playwright fixtures to reduce duplication.
- Replace remaining `waitForTimeout` calls with explicit disappearance/assertion waits.
- Add network wait helpers (`page.waitForResponse`) tied to create/update/delete endpoints.
- Parallelize independent specs (currently `fullyParallel` false) once backend can handle concurrency.

## 11. Troubleshooting
| Symptom | Likely Cause | Suggested Fix |
|---------|--------------|---------------|
| `element(s) not found` for modal fields | Wrong modal targeted (ambiguous selector) | Add `data-testid` & scope parents |
| Tests leave data behind | Missing cleanup hook | Add `test.afterEach` with deletion logic |
| Flaky visibility assertions | Slow backend or race conditions | Increase timeout OR wait for response completion |
| Multiple matches strict mode error | Generic `text=` locator matches multiple nodes | Narrow with parent + `:has-text()` or `nth()` |

## 12. Code Snippet – Standard Cleanup Pattern
```ts
test.afterEach(async ({ page }) => {
  if (!gardenId || !growAreaName) return;
  await page.goto(`/gardens/${gardenId}`);
  const card = page.locator(`[data-testid="grow-area-card"]:has-text("${growAreaName}")`).first();
  if (await card.count()) {
    await card.locator('button[title="Delete"]').click();
    const modal = page.locator('h3:has-text("Delete Grow Area")').locator('..');
    await expect(modal).toBeVisible();
    await modal.locator('button:has-text("Delete")').click();
    await expect(card).toHaveCount(0);
  }
});
```

## 13. Conventions Summary
- Unique names via timestamps (or UUIDs) to avoid collisions.
- Always clean up created grow areas AND gardens after tests to keep database lean.
- Use UI deletion for grow areas (exercise modal flow) and API deletion for gardens (faster, fewer selectors).
- Avoid brittle selectors; prefer chained locators + `data-testid`.

---
If you have suggestions or notice test drift (e.g., changing UI labels), update selectors and this doc accordingly.
