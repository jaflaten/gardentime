import { test, expect } from '@playwright/test';

test.describe('Garden Management', () => {
  const createdGardens: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/gardens');
  });

  test('should display gardens list page', async ({ page }) => {
    await expect(page.locator('text=My Gardens')).toBeVisible();
  });

  test('should create a new garden', async ({ page }) => {
    // Open create garden modal
    await page.click('button:has-text("New Garden")');

    // Wait for modal to be visible
    await expect(page.locator('text=Create New Garden')).toBeVisible();

    // Fill in garden details using label-based selectors
    const gardenName = `Test Garden ${Date.now()}`;
    createdGardens.push(gardenName);
    await page.locator('input[type="text"]').first().fill(gardenName);
    await page.locator('textarea').fill('A beautiful test garden');
    await page.locator('input[type="text"]').nth(1).fill('Test Location');

    // Submit the form
    await page.click('button[type="submit"]:has-text("Create Garden")');

    // Wait for modal to close and garden to appear in list
    await expect(page.locator(`text=${gardenName}`)).toBeVisible({ timeout: 10000 });
  });

  test('should view garden details', async ({ page }) => {
    // Create a garden first
    await page.click('button:has-text("New Garden")');
    await expect(page.locator('text=Create New Garden')).toBeVisible();

    const gardenName = `Test Garden ${Date.now()}`;
    createdGardens.push(gardenName);
    await page.locator('input[type="text"]').first().fill(gardenName);
    await page.click('button[type="submit"]:has-text("Create Garden")');

    // Wait for garden to appear
    await expect(page.locator(`text=${gardenName}`)).toBeVisible({ timeout: 10000 });

    // Click on the garden to view details
    await page.click(`text=${gardenName}`);

    // Should navigate to garden detail page
    await expect(page).toHaveURL(/\/gardens\/[a-f0-9-]+$/, { timeout: 10000 });

    // Wait for the page to finish loading (check for "Grow Areas" heading)
    await expect(page.locator('h2:has-text("Grow Areas")')).toBeVisible({ timeout: 10000 });

    // Verify garden name is displayed in the page heading
    await expect(page.locator('h1').filter({ hasText: gardenName })).toBeVisible({ timeout: 10000 });
  });

  test.afterEach(async ({ page, request }) => {
    if (createdGardens.length === 0) return;
    try {
      // Retrieve auth token from the browser context
      const token = await page.evaluate(() => localStorage.getItem('authToken'));
      if (!token) {
        console.warn('No auth token found for cleanup. Skipping garden deletion.');
        createdGardens.length = 0;
        return;
      }
      // Fetch gardens with auth header
      const resp = await request.get('/api/gardens', { headers: { Authorization: `Bearer ${token}` } });
      if (!resp.ok()) {
        console.warn('Garden list fetch failed for cleanup:', resp.status());
        return;
      }
      const allGardens = await resp.json();
      for (const name of createdGardens) {
        const matches = allGardens.filter((g: any) => g.name === name);
        for (const g of matches) {
          try {
            const delResp = await request.delete(`/api/gardens/${g.id}`, { headers: { Authorization: `Bearer ${token}` } });
            if (!delResp.ok()) {
              console.warn('Failed to delete garden id', g.id, 'status', delResp.status());
            }
          } catch (e) {
            console.warn('Exception deleting garden', g.id, e);
          }
        }
      }
      // Verification (best-effort)
      const verifyResp = await request.get('/api/gardens', { headers: { Authorization: `Bearer ${token}` } });
      if (verifyResp.ok()) {
        const remaining = await verifyResp.json();
        const stillPresent = remaining.filter((g: any) => createdGardens.includes(g.name));
        if (stillPresent.length > 0) {
          console.warn('Some gardens still present after cleanup:', stillPresent.map((g: any) => g.id));
        }
      }
    } catch (err) {
      console.warn('Garden cleanup failed:', err);
    } finally {
      createdGardens.length = 0;
    }
  });
});
