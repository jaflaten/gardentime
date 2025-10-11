import { test, expect } from '@playwright/test';

test.describe('End-to-End User Journey', () => {
  let gardenName: string;
  let growAreaName: string;
  let gardenId: string;
  const createdGardenIds: string[] = [];

  test('complete user workflow: login -> create garden -> add grow area -> add crop record -> edit -> delete', async ({ page }) => {
    const timestamp = Date.now();

    // Step 1: Login
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/gardens');

    // Step 2: Create a garden
    await page.click('button:has-text("New Garden")');
    await expect(page.locator('text=Create New Garden')).toBeVisible();

    gardenName = `E2E Test Garden ${timestamp}`;
    await page.locator('input[type="text"]').first().fill(gardenName);
    await page.locator('textarea').fill('End-to-end test garden');
    await page.locator('input[type="text"]').nth(1).fill('Test Location');
    await page.click('button[type="submit"]:has-text("Create Garden")');
    await expect(page.locator(`text=${gardenName}`)).toBeVisible({ timeout: 10000 });

    // Step 3: Navigate to garden details
    await page.click(`text=${gardenName}`);
    await expect(page).toHaveURL(/\/gardens\/[a-f0-9-]+$/);

    // Extract gardenId from the URL for later cleanup
    const gardenMatch = page.url().match(/\/gardens\/([a-f0-9-]+)/);
    if (gardenMatch) {
      gardenId = gardenMatch[1];
      createdGardenIds.push(gardenId);
    }

    // Step 4: Create a grow area
    await page.click('button:has-text("New Grow Area")');
    await expect(page.locator('text=Create New Grow Area')).toBeVisible();

    growAreaName = `E2E Test Grow Area ${timestamp}`;
    await page.locator('input[type="text"]').first().fill(growAreaName);

    // Show advanced options if needed
    const advancedButton = page.locator('button:has-text("Show advanced options")');
    if (await advancedButton.isVisible()) {
      await advancedButton.click();

      // Fill in size field - second text input
      await page.locator('input[type="text"]').nth(1).fill('100x100cm');
    }

    await page.click('button[type="submit"]:has-text("Create")');
    await expect(page.locator(`text=${growAreaName}`)).toBeVisible({ timeout: 10000 });

    // Step 5: Navigate to grow area details
    await page.click(`text=${growAreaName}`);
    await expect(page).toHaveURL(/\/gardens\/[a-f0-9-]+\/grow-areas\/[a-f0-9-]+$/);

    // Step 6: Create a crop record
    await page.click('button:has-text("New Crop Record")');
    await expect(page.locator('text=Add New Crop Record')).toBeVisible();

    // Select a plant
    const plantSelect = page.locator('select#plantId');
    await expect(plantSelect).toBeVisible({ timeout: 5000 });
    await plantSelect.selectOption({ index: 1 });

    // Fill in date and quantity
    await page.locator('input#datePlanted').fill('2025-10-09');
    await page.locator('input#quantityHarvested').fill('25');

    await page.click('button[type="submit"]:has-text("Create Crop Record")');
    await expect(page.locator('text=Add New Crop Record')).not.toBeVisible();
    await page.waitForTimeout(1000);

    // Step 7: Edit the crop record
    // Wait for at least one crop record card to appear
    await expect(page.locator('[data-testid="crop-record-card"]')).toBeVisible({ timeout: 10000 });
    const editButton = page.locator('[data-testid="crop-record-card"] button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await expect(page.locator('input#quantityHarvested')).toBeVisible({ timeout: 10000 });
      await page.locator('input#quantityHarvested').clear();
      await page.locator('input#quantityHarvested').fill('30');
      await page.click('button[type="submit"]:has-text("Update Crop Record")');
      await page.waitForTimeout(500);
    }

    // Step 8: Delete the crop record
    const deleteButton = page.locator('[data-testid="crop-record-card"] button:has-text("Delete")').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      // Confirm deletion
      const confirmDelete = page.locator('button:has-text("Delete Crop Record")').last();
      await expect(confirmDelete).toBeVisible({ timeout: 10000 });
      await confirmDelete.click();
      // Wait for card to disappear
      await page.waitForTimeout(500);
    }

    // Step 9: Navigate back and delete the grow area
    await page.click('a:has-text("Back")');
    await page.waitForTimeout(1000);

    const growAreaCard = page.locator(`[data-testid="grow-area-card"]:has-text("${growAreaName}")`).first();
    await expect(growAreaCard).toBeVisible({ timeout: 10000 });
    await growAreaCard.locator('button[title="Delete"]').click();

    // Confirm deletion in the modal scoped by its heading
    const deleteModal = page.locator('h3:has-text("Delete Grow Area")').locator('..');
    await expect(deleteModal).toBeVisible({ timeout: 10000 });
    await deleteModal.locator('button:has-text("Delete")').click();

    // Wait for the modal to close
    await expect(deleteModal).not.toBeVisible({ timeout: 10000 });

    // Assert the grow area card is gone (count = 0)
    await expect(page.locator(`[data-testid="grow-area-card"]:has-text("${growAreaName}")`)).toHaveCount(0);

    // Step 10: Navigate back to gardens and verify (deleting garden from detail page might not be available)
    await page.click('a:has-text("Back to Gardens")');
    await expect(page).toHaveURL('/gardens');
  });

  test.afterEach(async ({ page, request }) => {
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    if (!token) {
      console.warn('No auth token found for workflow cleanup');
      createdGardenIds.length = 0;
      return;
    }
    // Grow area cleanup
    if (gardenId && growAreaName) {
      try {
        await page.goto(`/gardens/${gardenId}`);
        const targetCard = page.locator(`[data-testid="grow-area-card"]:has-text("${growAreaName}")`).first();
        if (await targetCard.count() > 0) {
          await targetCard.locator('button[title="Delete"]').click();
          const deleteModal = page.locator('h3:has-text("Delete Grow Area")').locator('..');
          await expect(deleteModal).toBeVisible({ timeout: 5000 });
          await deleteModal.locator('button:has-text("Delete")').click();
          await expect(page.locator(`[data-testid="grow-area-card"]:has-text("${growAreaName}")`)).toHaveCount(0, { timeout: 10000 });
        }
      } catch (err) {
        console.warn('Workflow grow area cleanup failed:', err);
      }
    }
    // Garden cleanup
    if (createdGardenIds.length > 0) {
      for (const gid of createdGardenIds) {
        try {
          const del = await request.delete(`/api/gardens/${gid}`, { headers: { Authorization: `Bearer ${token}` } });
          if (!del.ok()) console.warn('Garden deletion failed for workflow id', gid, 'status', del.status());
        } catch (err) {
          console.warn('Workflow garden deletion exception for', gid, err);
        }
      }
      const verify = await request.get('/api/gardens', { headers: { Authorization: `Bearer ${token}` } });
      if (verify.ok()) {
        const remaining = await verify.json();
        const still = remaining.filter((g: any) => createdGardenIds.includes(g.id));
        if (still.length) console.warn('Workflow gardens remain after cleanup:', still.map((g: any) => g.id));
      }
      createdGardenIds.length = 0;
    }
  });
});
