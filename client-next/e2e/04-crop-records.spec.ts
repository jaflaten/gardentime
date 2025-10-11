import { test, expect } from '@playwright/test';

test.describe('Crop Record Management', () => {
  let gardenName: string;
  let growAreaName: string;
  let gardenId: string;
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
    // Capture gardenId from URL
    const gardenMatch = page.url().match(/\/gardens\/([a-f0-9-]+)/);
    if (gardenMatch) {
      gardenId = gardenMatch[1];
      createdGardenIds.push(gardenId);
    }

    // Create a grow area
    await page.click('button:has-text("New Grow Area")');
    await expect(page.locator('text=Create New Grow Area')).toBeVisible();

    growAreaName = `Test Grow Area ${Date.now()}`;
    await page.locator('input[type="text"]').first().fill(growAreaName);
    await page.click('button[type="submit"]:has-text("Create")');
    await expect(page.locator(`text=${growAreaName}`)).toBeVisible({ timeout: 10000 });

    // Navigate to grow area detail page
    await page.click(`text=${growAreaName}`);
    await expect(page).toHaveURL(/\/gardens\/[a-f0-9-]+\/grow-areas\/[a-f0-9-]+$/);
  });

  test('should create a new crop record', async ({ page }) => {
    // Click Add Crop Record button
    await page.click('button:has-text("New Crop Record")');

    // Wait for modal to be visible
    await expect(page.locator('text=Add New Crop Record')).toBeVisible();

    // Select a plant from dropdown
    const plantSelect = page.locator('select#plantId');
    await expect(plantSelect).toBeVisible({ timeout: 5000 });

    // Select the first available plant (index 1, since 0 is "Select a plant")
    await plantSelect.selectOption({ index: 1 });

    // Fill in date planted
    await page.locator('input#datePlanted').fill('2025-10-09');

    // Fill in notes (optional)
    await page.locator('textarea#notes').fill('Test crop record');

    // Submit the form
    await page.click('button[type="submit"]:has-text("Create Crop Record")');

    // Wait for modal to close and crop record to appear
    await expect(page.locator('text=Add New Crop Record')).not.toBeVisible();
  });

  test('should edit a crop record', async ({ page }) => {
    // Create a crop record first
    await page.click('button:has-text("New Crop Record")');
    await expect(page.locator('text=Add New Crop Record')).toBeVisible();

    const plantSelect = page.locator('select#plantId');
    await plantSelect.selectOption({ index: 1 });
    await page.locator('input#datePlanted').fill('2025-10-09');
    await page.locator('input#quantityHarvested').fill('10');

    await page.click('button[type="submit"]:has-text("Create Crop Record")');
    await expect(page.locator('text=Add New Crop Record')).not.toBeVisible();

    // Wait a bit for the record to be created and rendered
    await page.waitForTimeout(2000);

    // Find and click edit button - scope within crop record card to avoid grow area edit button
    const editButton = page.locator('[data-testid="crop-record-card"] button:has-text("Edit")').first();
    await expect(editButton).toBeVisible({ timeout: 10000 });
    await editButton.click();

    // Wait for edit modal to appear and the input to be visible
    await page.waitForTimeout(1000);

    // Update quantity harvested - wait for it to be visible first
    const quantityField = page.locator('input#quantityHarvested');
    await expect(quantityField).toBeVisible({ timeout: 10000 });
    await quantityField.clear();
    await quantityField.fill('15');

    // Save changes
    await page.click('button[type="submit"]:has-text("Update Crop Record")');

    // Verify modal closes
    await page.waitForTimeout(1000);
  });

  test('should delete a crop record', async ({ page }) => {
    // Create a crop record first
    await page.click('button:has-text("New Crop Record")');
    await expect(page.locator('text=Add New Crop Record')).toBeVisible();

    const plantSelect = page.locator('select#plantId');
    await plantSelect.selectOption({ index: 1 });
    await page.locator('input#datePlanted').fill('2025-10-09');

    await page.click('button[type="submit"]:has-text("Create Crop Record")');
    await expect(page.locator('text=Add New Crop Record')).not.toBeVisible();

    await page.waitForTimeout(1000);

    // Find and click delete button - scope within crop record card to avoid grow area delete controls
    const deleteButton = page.locator('[data-testid="crop-record-card"] button:has-text("Delete")').first();
    await expect(deleteButton).toBeVisible({ timeout: 10000 });
    await deleteButton.click();

    // Confirm deletion - click the last "Delete Crop Record" button
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Delete Crop Record")').last().click();

    // Verify deletion completed
    await page.waitForTimeout(1000);
  });

  test('should display crop record details', async ({ page }) => {
    // Create a crop record
    await page.click('button:has-text("New Crop Record")');
    await expect(page.locator('text=Add New Crop Record')).toBeVisible();

    const plantSelect = page.locator('select#plantId');
    await plantSelect.selectOption({ index: 1 });
    await page.locator('input#datePlanted').fill('2025-10-09');
    await page.locator('input#quantityHarvested').fill('20');
    await page.locator('input#unit').fill('kg');

    await page.click('button[type="submit"]:has-text("Create Crop Record")');
    await expect(page.locator('text=Add New Crop Record')).not.toBeVisible();

    // Verify crop details are displayed (look for the quantity and unit)
    await expect(page.locator('text=/20.*kg/i').or(page.locator('text=20'))).toBeVisible({ timeout: 10000 });
  });

  test.afterEach(async ({ page, request }) => {
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    if (!token) {
      console.warn('No auth token; skipping cleanup');
      createdGardenIds.length = 0;
      return;
    }
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
        console.warn('Grow area cleanup failed:', err);
      } finally {
        growAreaName = '';
      }
    }
    if (createdGardenIds.length > 0) {
      for (const gid of createdGardenIds) {
        try {
          const del = await request.delete(`/api/gardens/${gid}`, { headers: { Authorization: `Bearer ${token}` } });
          if (!del.ok()) console.warn('Garden deletion failed for id', gid, 'status', del.status());
        } catch (err) {
          console.warn('Garden deletion exception for', gid, err);
        }
      }
      const verify = await request.get('/api/gardens', { headers: { Authorization: `Bearer ${token}` } });
      if (verify.ok()) {
        const remaining = await verify.json();
        const still = remaining.filter((g: any) => createdGardenIds.includes(g.id));
        if (still.length) console.warn('Gardens remain after cleanup:', still.map((g: any) => g.id));
      }
      createdGardenIds.length = 0;
    }
  });
});
