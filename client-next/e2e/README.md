# End-to-End Tests with Playwright

This directory contains comprehensive end-to-end tests for the GardenTime application using Playwright.

## Test Coverage

The E2E test suite covers the following user workflows:

### 1. Authentication (`01-authentication.spec.ts`)
- ✅ Redirect to login when not authenticated
- ✅ Login with valid credentials
- ✅ Show error with invalid credentials
- ✅ Logout functionality
- ✅ User registration

### 2. Garden Management (`02-gardens.spec.ts`)
- ✅ Display gardens list page
- ✅ Create a new garden
- ✅ View garden details
- ✅ Edit a garden
- ✅ Delete a garden

### 3. Grow Area Management (`03-grow-areas.spec.ts`)
- ✅ Create a new grow area with basic fields
- ✅ Create a grow area with advanced fields (size, rows, notes)
- ✅ Edit a grow area
- ✅ Delete a grow area
- ✅ View grow area details

### 4. Crop Record Management (`04-crop-records.spec.ts`)
- ✅ Create a new crop record
- ✅ Edit a crop record
- ✅ Delete a crop record
- ✅ Display crop record details

### 5. Complete Workflow (`05-complete-workflow.spec.ts`)
- ✅ Full user journey from login to cleanup
- ✅ Tests entire application flow in a single test

## Prerequisites

Before running the tests, ensure:

1. **Backend is running**: The Spring Boot backend must be running on `http://localhost:8080`
2. **Frontend is running**: The Next.js frontend must be running on `http://localhost:3000`
3. **Test user exists**: A test user with username `testuser` and password `password123` must exist in the database

## Running Tests

### Run all tests (headless mode)
```bash
npm run test:e2e
```

### Run tests with UI (interactive mode)
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Debug a specific test
```bash
npm run test:e2e:debug
```

### View test report
```bash
npm run test:e2e:report
```

### Run a specific test file
```bash
npx playwright test e2e/01-authentication.spec.ts
```

### Run tests matching a pattern
```bash
npx playwright test --grep "create a new garden"
```

## Configuration

The Playwright configuration is in `playwright.config.ts`. Key settings:

- **Base URL**: `http://localhost:3000`
- **Test Directory**: `./e2e`
- **Browsers**: Chromium (default), Firefox and Webkit available
- **Auto-start servers**: Configured to automatically start both Spring Boot and Next.js servers

## Test Structure

Each test file follows this pattern:

```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login, navigate, create test data
  });

  test('should do something', async ({ page }) => {
    // Test actions and assertions
  });
});
```

## Writing New Tests

When adding new tests:

1. Create a new `.spec.ts` file in the `e2e` directory
2. Use descriptive test names that explain what is being tested
3. Use `page.locator()` with accessible selectors (text, role, label)
4. Add proper wait conditions with `expect().toBeVisible()`
5. Clean up test data when possible

Example:
```typescript
import { test, expect } from '@playwright/test';

test.describe('My New Feature', () => {
  test('should do something amazing', async ({ page }) => {
    await page.goto('/my-page');
    await page.click('button:has-text("Click Me")');
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

## Debugging Tips

### Visual debugging with UI mode
```bash
npm run test:e2e:ui
```
This opens an interactive UI where you can:
- See test execution step by step
- Inspect DOM snapshots at each step
- Time travel through test execution
- Debug failing tests

### Debug mode
```bash
npm run test:e2e:debug
```
This opens Playwright Inspector for step-by-step debugging.

### Screenshots and traces
Failed tests automatically capture:
- Screenshots (saved to `test-results/`)
- Traces (for detailed debugging)

View traces with:
```bash
npx playwright show-trace test-results/path-to-trace.zip
```

## CI/CD Integration

The tests are configured to work in CI environments:
- Retries: 2 attempts on CI
- Workers: 1 worker on CI (sequential execution)
- `forbidOnly`: Prevents accidentally committed `.only` tests

## Troubleshooting

### "Timeout waiting for element"
- Increase timeout: `await expect(locator).toBeVisible({ timeout: 10000 })`
- Check if element selector is correct
- Ensure data is loaded before interacting

### "Element is not visible"
- Add wait: `await page.waitForTimeout(1000)`
- Use `await expect(locator).toBeVisible()` instead of direct actions

### Backend/Frontend not running
The config auto-starts servers, but if issues occur:
1. Start Spring Boot: `./gradlew bootRun` (from project root)
2. Start Next.js: `npm run dev` (from client-next directory)
3. Run tests with existing servers: Set `reuseExistingServer: true`

## Test Data

Tests create unique test data using timestamps to avoid conflicts:
```typescript
const gardenName = `Test Garden ${Date.now()}`;
```

This ensures:
- Tests can run in parallel
- No cleanup required between runs
- Tests are isolated from each other

## Best Practices

1. ✅ **Use semantic selectors**: Prefer text/role over CSS classes
2. ✅ **Wait for elements**: Always use `expect().toBeVisible()` before interactions
3. ✅ **Unique test data**: Use timestamps to create unique names
4. ✅ **Clean navigation**: Use proper page navigation and URL checks
5. ✅ **Descriptive assertions**: Use clear error messages in expects
6. ✅ **Isolate tests**: Each test should be independent

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)

