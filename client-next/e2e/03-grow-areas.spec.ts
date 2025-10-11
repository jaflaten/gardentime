import { test, expect } from '@playwright/test';

test.describe('Grow Area Management', () => {
  let gardenName: string;
  let gardenId: string;
  const createdGrowAreas: string[] = [];
  const createdGardenIds: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/gardens');

    // Create a test garden
    await page.click('button:has-text("New Garden")');
    await expect(page.locator('text=Create New Garden')).toBeVisible();

    gardenName = `Test Garden ${Date.now()}`;
    await page.locator('input[type="text"]').first().fill(gardenName);
    await page.locator('textarea').fill('Test garden description');
    await page.locator('input[type="text"]').nth(1).fill('Test Location');
    await page.click('button[type="submit"]:has-text("Create Garden")');
    await expect(page.locator(`text=${gardenName}`)).toBeVisible({ timeout: 10000 });

    // Navigate to garden detail page
    await page.click(`text=${gardenName}`);
    await expect(page).toHaveURL(/\/gardens\/[a-f0-9-]+$/);
    // Capture gardenId for cleanup
    const match = page.url().match(/\/gardens\/([a-f0-9-]+)/);
    if (match) {
      gardenId = match[1];
      createdGardenIds.push(gardenId);
    }
    await expect(page.locator('h2:has-text("Grow Areas")')).toBeVisible({ timeout: 10000 });
  });

  test('should create a new grow area with basic fields', async ({ page }) => {
    // Click Add Grow Area button
    await page.click('button:has-text("New Grow Area")');

    // Wait for modal to be visible
    await expect(page.locator('text=Create New Grow Area')).toBeVisible();

    // Fill in grow area name - it's the first text input in the modal
    const growAreaName = `Test Grow Area ${Date.now()}`;
    createdGrowAreas.push(growAreaName);
    await page.locator('input[type="text"]').first().fill(growAreaName);

    // Submit the form
    await page.click('button[type="submit"]:has-text("Create")');

    // Wait for grow area to appear in list
    await expect(page.locator(`text=${growAreaName}`)).toBeVisible({ timeout: 10000 });
  });

  test('should create a grow area with advanced fields', async ({ page }) => {
    // Click Add Grow Area button
    await page.click('button:has-text("New Grow Area")');
    await expect(page.locator('text=Create New Grow Area')).toBeVisible();

    const growAreaName = `Advanced Grow Area ${Date.now()}`;
    createdGrowAreas.push(growAreaName);
    await page.locator('input[type="text"]').first().fill(growAreaName);

    // Show advanced options
    await page.click('button:has-text("Show advanced options")');

    // Fill in zone type dropdown
    await page.locator('select').selectOption('BOX');

    // Fill in size field - second text input
    await page.locator('input[type="text"]').nth(1).fill('120x80cm');

    // Fill in number of rows - number input
    await page.locator('input[type="number"]').fill('4');

    // Fill in notes - textarea
    await page.locator('textarea').fill('This is a test grow area with advanced options');

    // Submit
    await page.click('button[type="submit"]:has-text("Create")');

    await expect(page.locator(`text=${growAreaName}`)).toBeVisible({ timeout: 10000 });
  });

  test('should edit a grow area', async ({ page }) => {
    // Create a grow area first
    await page.click('button:has-text("New Grow Area")');
    await expect(page.locator('text=Create New Grow Area')).toBeVisible();

    const growAreaName = `Grow Area to Edit ${Date.now()}`;
    createdGrowAreas.push(growAreaName);
    await page.locator('input[type="text"]').first().fill(growAreaName);
    await page.click('button[type="submit"]:has-text("Create")');
    await expect(page.locator(`text=${growAreaName}`)).toBeVisible({ timeout: 10000 });

    // Find the grow area card by its name and click the Edit button inside it
    const growAreaCard = page.locator(`[data-testid="grow-area-card"]:has-text("${growAreaName}")`).first();
    await expect(growAreaCard.locator('button[title="Edit"]')).toBeVisible({ timeout: 10000 });
    await growAreaCard.locator('button[title="Edit"]').click();

    // Wait for edit modal
    await expect(page.locator('text=Edit Grow Area')).toBeVisible();

    // Update the name
    const updatedName = `${growAreaName} Updated`;
    // Replace original name with updated name for cleanup
    const idx = createdGrowAreas.indexOf(growAreaName);
    if (idx >= 0) createdGrowAreas[idx] = updatedName;
    await page.locator('input[type="text"]').first().fill(updatedName);

    // Save changes
    await page.click('button[type="submit"]:has-text("Update")');

    // Verify the update
    await expect(page.locator(`text=${updatedName}`)).toBeVisible({ timeout: 10000 });
  });

  test('should delete a grow area', async ({ page }) => {
    // Create a grow area first
    await page.click('button:has-text("New Grow Area")');
    await expect(page.locator('text=Create New Grow Area')).toBeVisible();

    const growAreaName = `Grow Area to Delete ${Date.now()}`;
    createdGrowAreas.push(growAreaName);
    await page.locator('input[type="text"]').first().fill(growAreaName);
    await page.click('button[type="submit"]:has-text("Create")');
    await expect(page.locator(`text=${growAreaName}`)).toBeVisible({ timeout: 10000 });

    // Find and click delete button for this grow area
    const growAreaCard = page.locator(`[data-testid="grow-area-card"]:has-text("${growAreaName}")`).first();
    await expect(growAreaCard.locator('button[title="Delete"]')).toBeVisible({ timeout: 10000 });
    await growAreaCard.locator('button[title="Delete"]').click();

    // Confirm deletion
    await page.click('button:has-text("Delete")');

    // Verify grow area is not in the list anymore (check the card container, not just text)
    await expect(growAreaCard).not.toBeVisible({ timeout: 10000 });
  });

  test('should view grow area details', async ({ page }) => {
    // Create a grow area first
    await page.click('button:has-text("New Grow Area")');
    await expect(page.locator('text=Create New Grow Area')).toBeVisible();

    const growAreaName = `Grow Area Details ${Date.now()}`;
    createdGrowAreas.push(growAreaName);
    await page.locator('input[type="text"]').first().fill(growAreaName);
    await page.click('button[type="submit"]:has-text("Create")');
    await expect(page.locator(`text=${growAreaName}`)).toBeVisible({ timeout: 10000 });

    // Click on the grow area to view details
    await page.click(`text=${growAreaName}`);

    // Should navigate to grow area detail page
    await expect(page).toHaveURL(/\/gardens\/[a-f0-9-]+\/grow-areas\/[a-f0-9-]+$/);
    await expect(page.locator('h1').filter({ hasText: growAreaName })).toBeVisible();
  });

  test.afterEach(async ({ page, request }) => {
    // Delete any grow areas created in the test that still exist
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    if (!token) {
      console.warn('No auth token found for cleanup; skipping.');
      createdGrowAreas.length = 0;
      createdGardenIds.length = 0;
      return;
    }
    if (gardenId && createdGrowAreas.length > 0) {
      try {
        await page.goto(`/gardens/${gardenId}`);
        for (const name of createdGrowAreas) {
          const card = page.locator(`[data-testid="grow-area-card"]:has-text("${name}")`).first();
          if (await card.count() > 0) {
            await card.locator('button[title="Delete"]').click();
            const deleteModal = page.locator('h3:has-text("Delete Grow Area")').locator('..');
            await expect(deleteModal).toBeVisible({ timeout: 5000 });
            await deleteModal.locator('button:has-text("Delete")').click();
            await expect(page.locator(`[data-testid="grow-area-card"]:has-text("${name}")`)).toHaveCount(0, { timeout: 10000 });
          }
        }
      } catch (err) {
        console.warn('Grow area cleanup failed:', err);
      } finally {
        createdGrowAreas.length = 0;
      }
    }
    // Delete the garden(s) created in this test via API
    if (createdGardenIds.length > 0) {
      for (const gid of createdGardenIds) {
        try {
          const del = await request.delete(`/api/gardens/${gid}`, { headers: { Authorization: `Bearer ${token}` } });
          if (!del.ok()) {
            console.warn('Garden deletion failed for id', gid, 'status', del.status());
          }
        } catch (err) {
          console.warn('Garden cleanup exception for id', gid, err);
        }
      }
      // Verify
      const verify = await request.get('/api/gardens', { headers: { Authorization: `Bearer ${token}` } });
      if (verify.ok()) {
        const remaining = await verify.json();
        const still = remaining.filter((g: any) => createdGardenIds.includes(g.id));
        if (still.length) console.warn('Gardens still present after cleanup:', still.map((g: any) => g.id));
      }
      createdGardenIds.length = 0;
    }
  });
});
