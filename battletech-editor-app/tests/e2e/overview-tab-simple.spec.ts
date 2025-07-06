import { test, expect } from '@playwright/test';

/**
 * Simplified end-to-end test suite for the Overview Tab functionality
 * Tests the actual elements present in the OverviewTabV2 component
 */

test.describe('Overview Tab - Simple E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the customizer page
    await page.goto('/customizer-v2');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for the overview tab to be visible
    await page.waitForSelector('text=Technology Foundation', { timeout: 10000 });
  });

  test('should display Technology Foundation section', async ({ page }) => {
    // Verify the main sections are present
    await expect(page.locator('text=Technology Foundation')).toBeVisible();
    await expect(page.locator('text=Technology Progression')).toBeVisible();
    await expect(page.locator('text=Rules Level')).toBeVisible();
    await expect(page.locator('text=Unit Summary')).toBeVisible();
  });

  test('should have tech base dropdown', async ({ page }) => {
    // Look for the tech base select element
    const techBaseSelect = page.locator('select').first();
    await expect(techBaseSelect).toBeVisible();
    
    // Verify it has the expected options
    await expect(techBaseSelect.locator('option[value="Inner Sphere"]')).toBeVisible();
    await expect(techBaseSelect.locator('option[value="Clan"]')).toBeVisible();
    await expect(techBaseSelect.locator('option[value="Mixed"]')).toBeVisible();
  });

  test('should have introduction year input', async ({ page }) => {
    // Look for the year input field
    const yearInput = page.locator('input[type="number"]').first();
    await expect(yearInput).toBeVisible();
    
    // Verify it has a reasonable value
    const value = await yearInput.inputValue();
    expect(parseInt(value)).toBeGreaterThan(2000);
    expect(parseInt(value)).toBeLessThan(4000);
  });

  test('should have tech progression buttons', async ({ page }) => {
    // Look for Inner Sphere and Clan buttons in the tech progression section
    const innerSphereButtons = page.locator('button:has-text("Inner Sphere")');
    const clanButtons = page.locator('button:has-text("Clan")');
    
    // Should have multiple buttons (one for each subsystem)
    await expect(innerSphereButtons).toHaveCount(8);
    await expect(clanButtons).toHaveCount(8);
  });

  test('should have rules level buttons', async ({ page }) => {
    // Look for rules level buttons
    const rulesButtons = [
      'button:has-text("Introductory")',
      'button:has-text("Standard")',
      'button:has-text("Advanced")',
      'button:has-text("Experimental")'
    ];
    
    for (const selector of rulesButtons) {
      await expect(page.locator(selector)).toBeVisible();
    }
  });

  test('should change tech base selection', async ({ page }) => {
    const techBaseSelect = page.locator('select').first();
    
    // Change to Clan
    await techBaseSelect.selectOption('Clan');
    
    // Verify the selection changed
    await expect(techBaseSelect).toHaveValue('Clan');
  });

  test('should change introduction year', async ({ page }) => {
    const yearInput = page.locator('input[type="number"]').first();
    
    // Change the year
    await yearInput.fill('3050');
    
    // Verify the value changed
    await expect(yearInput).toHaveValue('3050');
  });

  test('should toggle tech progression buttons', async ({ page }) => {
    // Find the first Clan button and click it
    const firstClanButton = page.locator('button:has-text("Clan")').first();
    await firstClanButton.click();
    
    // Verify it's now selected (should have green background)
    await expect(firstClanButton).toHaveClass(/bg-green-600/);
  });

  test('should change rules level', async ({ page }) => {
    // Click on Advanced rules level
    const advancedButton = page.locator('button:has-text("Advanced")');
    await advancedButton.click();
    
    // Verify it's selected (should have yellow background)
    await expect(advancedButton).toHaveClass(/bg-yellow-600/);
  });
}); 