import { test, expect } from '@playwright/test';

test.describe('Garden Management', () => {
  const createdGardenIds: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/gardens');
  });

  test('should display gardens list page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'My Gardens' })).toBeVisible();
  });

  test('should create a new garden', async ({ page, request }) => {
    // Open create garden modal
    await page.click('button:has-text("New Garden")');

    // Wait for modal to be visible
    await expect(page.locator('text=Create New Garden')).toBeVisible();

    // Fill in garden details using label-based selectors
    const gardenName = `Test Garden ${Date.now()}`;
    await page.locator('input[type="text"]').first().fill(gardenName);
    await page.locator('textarea').fill('A beautiful test garden');
    await page.locator('input[type="text"]').nth(1).fill('Test Location');

    // Submit the form
    await page.click('button[type="submit"]:has-text("Create Garden")');

    // Wait for modal to close and garden to appear in list
    await expect(page.locator(`text=${gardenName}`)).toBeVisible({ timeout: 10000 });

    // Get the garden ID for cleanup
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    if (token) {
      const resp = await request.get('/api/gardens', { headers: { Authorization: `Bearer ${token}` } });
      if (resp.ok()) {
        const gardens = await resp.json();
        const created = gardens.find((g: any) => g.name === gardenName);
        if (created) createdGardenIds.push(created.id);
      }
    }
  });

  test('should view garden details', async ({ page, request }) => {
    // Create a garden first
    await page.click('button:has-text("New Garden")');
    await expect(page.locator('text=Create New Garden')).toBeVisible();

    const gardenName = `Test Garden ${Date.now()}`;
    await page.locator('input[type="text"]').first().fill(gardenName);
    await page.click('button[type="submit"]:has-text("Create Garden")');

    // Wait for garden to appear
    await expect(page.locator(`text=${gardenName}`)).toBeVisible({ timeout: 10000 });

    // Capture garden ID immediately via API (before navigation which might fail)
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    if (token) {
      const resp = await request.get('/api/gardens', { headers: { Authorization: `Bearer ${token}` } });
      if (resp.ok()) {
        const gardens = await resp.json();
        const created = gardens.find((g: any) => g.name === gardenName);
        if (created) createdGardenIds.push(created.id);
      }
    }

    // Click on the garden to view details
    await page.click(`text=${gardenName}`);

    // Should navigate to garden detail page (now redirects to /dashboard)
    await expect(page).toHaveURL(/\/gardens\/([a-f0-9-]+)/, { timeout: 10000 });

    // Verify garden name is displayed in the page
    await expect(page.locator('h1').filter({ hasText: gardenName })).toBeVisible({ timeout: 10000 });
  });

  test.afterEach(async ({ page, request }) => {
    if (createdGardenIds.length === 0) return;
    try {
      const token = await page.evaluate(() => localStorage.getItem('authToken'));
      if (!token) {
        console.warn('No auth token found for cleanup. Skipping garden deletion.');
        createdGardenIds.length = 0;
        return;
      }
      for (const gid of createdGardenIds) {
        try {
          const delResp = await request.delete(`/api/gardens/${gid}`, { headers: { Authorization: `Bearer ${token}` } });
          if (!delResp.ok()) {
            console.warn('Failed to delete garden id', gid, 'status', delResp.status());
          }
        } catch (e) {
          console.warn('Exception deleting garden', gid, e);
        }
      }
      // Verification
      const verifyResp = await request.get('/api/gardens', { headers: { Authorization: `Bearer ${token}` } });
      if (verifyResp.ok()) {
        const remaining = await verifyResp.json();
        const stillPresent = remaining.filter((g: any) => createdGardenIds.includes(g.id));
        if (stillPresent.length > 0) {
          console.warn('Some gardens still present after cleanup:', stillPresent.map((g: any) => g.id));
        }
      }
    } catch (err) {
      console.warn('Garden cleanup failed:', err);
    } finally {
      createdGardenIds.length = 0;
    }
  });
});
