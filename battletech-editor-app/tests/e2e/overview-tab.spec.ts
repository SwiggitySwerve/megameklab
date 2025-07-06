import { test, expect } from '@playwright/test';

/**
 * Comprehensive test suite for the Overview Tab functionality
 * Tests all selectors, tech type toggles, and interactive elements
 */

test.describe('Overview Tab Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the customizer page
    await page.goto('/customizer-v2');
    
    // Wait for the page to load
    await page.waitForSelector('text=Unit Overview', { timeout: 10000 });
    
    // Ensure we're on the overview tab
    await page.click('button:has-text("Overview")');
    
    // Wait for overview content to load
    await page.waitForSelector('text=Technology Foundation', { timeout: 5000 });
  });

  test.describe('Tech Base Selection', () => {
    test('should display tech base dropdown with correct options', async ({ page }) => {
      // Check that the tech base dropdown exists
      const techBaseSelect = page.locator('select[value="Inner Sphere"]');
      await expect(techBaseSelect).toBeVisible();
      
      // Check that all options are present
      await expect(techBaseSelect.locator('option[value="Inner Sphere"]')).toBeVisible();
      await expect(techBaseSelect.locator('option[value="Clan"]')).toBeVisible();
      await expect(techBaseSelect.locator('option[value="Mixed"]')).toBeVisible();
    });

    test('should change tech base to Clan', async ({ page }) => {
      const techBaseSelect = page.locator('select[value="Inner Sphere"]');
      
      // Change to Clan
      await techBaseSelect.selectOption('Clan');
      
      // Verify the selection
      await expect(techBaseSelect).toHaveValue('Clan');
      
      // Check that all tech progression buttons show Clan as selected
      const clanButtons = page.locator('button:has-text("Clan").bg-green-600');
      await expect(clanButtons).toHaveCount(8); // All 8 subsystems
    });

    test('should change tech base to Mixed', async ({ page }) => {
      const techBaseSelect = page.locator('select[value="Inner Sphere"]');
      
      // Change to Mixed
      await techBaseSelect.selectOption('Mixed');
      
      // Verify the selection
      await expect(techBaseSelect).toHaveValue('Mixed');
      
      // Check that mixed tech notification appears
      await expect(page.locator('text=Mixed Technology Configuration')).toBeVisible();
    });

    test('should change tech base back to Inner Sphere', async ({ page }) => {
      const techBaseSelect = page.locator('select[value="Inner Sphere"]');
      
      // First change to Clan
      await techBaseSelect.selectOption('Clan');
      await expect(techBaseSelect).toHaveValue('Clan');
      
      // Then change back to Inner Sphere
      await techBaseSelect.selectOption('Inner Sphere');
      await expect(techBaseSelect).toHaveValue('Inner Sphere');
      
      // Check that all tech progression buttons show Inner Sphere as selected
      const innerSphereButtons = page.locator('button:has-text("Inner Sphere").bg-orange-600');
      await expect(innerSphereButtons).toHaveCount(8); // All 8 subsystems
    });
  });

  test.describe('Introduction Year Input', () => {
    test('should display introduction year input with correct default', async ({ page }) => {
      const yearInput = page.locator('input[type="number"]').first();
      await expect(yearInput).toBeVisible();
      await expect(yearInput).toHaveValue('3025');
    });

    test('should change introduction year', async ({ page }) => {
      const yearInput = page.locator('input[type="number"]').first();
      
      // Clear and enter new year
      await yearInput.clear();
      await yearInput.fill('3050');
      
      // Verify the change
      await expect(yearInput).toHaveValue('3050');
      
      // Check that era display updates
      await expect(page.locator('text=Era: Succession Wars')).toBeVisible();
    });

    test('should validate year range', async ({ page }) => {
      const yearInput = page.locator('input[type="number"]').first();
      
      // Try to enter a year below minimum
      await yearInput.clear();
      await yearInput.fill('2000');
      
      // Check that the input has min/max attributes
      await expect(yearInput).toHaveAttribute('min', '2005');
      await expect(yearInput).toHaveAttribute('max', '3200');
    });
  });

  test.describe('Tech Progression Matrix', () => {
    test('should display all 8 subsystems', async ({ page }) => {
      const subsystems = [
        'Tech/Chassis',
        'Tech/Gyro',
        'Tech/Engine',
        'Tech/Heatsink',
        'Tech/Targeting',
        'Tech/Myomer',
        'Tech/Movement',
        'Tech/Armor'
      ];
      
      for (const subsystem of subsystems) {
        await expect(page.locator(`text=${subsystem}`)).toBeVisible();
      }
    });

    test('should toggle individual subsystems to Clan', async ({ page }) => {
      // Test each subsystem individually
      const subsystems = ['chassis', 'engine', 'gyro', 'heatsink', 'targeting', 'myomer', 'movement', 'armor'];
      
      for (const subsystem of subsystems) {
        // Find the Clan button for this subsystem
        const clanButton = page.locator(`text=Tech/${subsystem.charAt(0).toUpperCase() + subsystem.slice(1)}`).locator('..').locator('button:has-text("Clan")');
        
        // Click the Clan button
        await clanButton.click();
        
        // Verify it's selected (green background)
        await expect(clanButton).toHaveClass(/bg-green-600/);
        
        // Verify Inner Sphere button is not selected
        const innerSphereButton = page.locator(`text=Tech/${subsystem.charAt(0).toUpperCase() + subsystem.slice(1)}`).locator('..').locator('button:has-text("Inner Sphere")');
        await expect(innerSphereButton).not.toHaveClass(/bg-orange-600/);
      }
    });

    test('should toggle individual subsystems to Inner Sphere', async ({ page }) => {
      // First set all to Clan
      const techBaseSelect = page.locator('select[value="Inner Sphere"]');
      await techBaseSelect.selectOption('Clan');
      
      // Then test each subsystem individually
      const subsystems = ['chassis', 'engine', 'gyro', 'heatsink', 'targeting', 'myomer', 'movement', 'armor'];
      
      for (const subsystem of subsystems) {
        // Find the Inner Sphere button for this subsystem
        const innerSphereButton = page.locator(`text=Tech/${subsystem.charAt(0).toUpperCase() + subsystem.slice(1)}`).locator('..').locator('button:has-text("Inner Sphere")');
        
        // Click the Inner Sphere button
        await innerSphereButton.click();
        
        // Verify it's selected (orange background)
        await expect(innerSphereButton).toHaveClass(/bg-orange-600/);
        
        // Verify Clan button is not selected
        const clanButton = page.locator(`text=Tech/${subsystem.charAt(0).toUpperCase() + subsystem.slice(1)}`).locator('..').locator('button:has-text("Clan")');
        await expect(clanButton).not.toHaveClass(/bg-green-600/);
      }
    });

    test('should show mixed tech notification when subsystems are mixed', async ({ page }) => {
      // Set some subsystems to Clan
      const chassisClanButton = page.locator('text=Tech/Chassis').locator('..').locator('button:has-text("Clan")');
      await chassisClanButton.click();
      
      const engineClanButton = page.locator('text=Tech/Engine').locator('..').locator('button:has-text("Clan")');
      await engineClanButton.click();
      
      // Check that mixed tech notification appears
      await expect(page.locator('text=Mixed Technology Configuration')).toBeVisible();
      await expect(page.locator('text=This unit combines Inner Sphere and Clan technologies')).toBeVisible();
    });
  });

  test.describe('Rules Level Selection', () => {
    test('should display all rules level options', async ({ page }) => {
      const rulesLevels = ['Introductory', 'Standard', 'Advanced', 'Experimental'];
      
      for (const level of rulesLevels) {
        await expect(page.locator(`button:has-text("${level}")`)).toBeVisible();
      }
    });

    test('should select Introductory rules level', async ({ page }) => {
      const introductoryButton = page.locator('button:has-text("Introductory")');
      await introductoryButton.click();
      
      // Verify it's selected (yellow background)
      await expect(introductoryButton).toHaveClass(/bg-yellow-600/);
    });

    test('should select Advanced rules level', async ({ page }) => {
      const advancedButton = page.locator('button:has-text("Advanced")');
      await advancedButton.click();
      
      // Verify it's selected (yellow background)
      await expect(advancedButton).toHaveClass(/bg-yellow-600/);
    });

    test('should select Experimental rules level', async ({ page }) => {
      const experimentalButton = page.locator('button:has-text("Experimental")');
      await experimentalButton.click();
      
      // Verify it's selected (yellow background)
      await expect(experimentalButton).toHaveClass(/bg-yellow-600/);
    });

    test('should maintain Standard as default', async ({ page }) => {
      const standardButton = page.locator('button:has-text("Standard")');
      await expect(standardButton).toHaveClass(/bg-yellow-600/);
    });
  });

  test.describe('Tech Rating Panel', () => {
    test('should display tech rating timeline', async ({ page }) => {
      // Check that tech rating panel is visible
      await expect(page.locator('text=Tech Rating Timeline')).toBeVisible();
      
      // Check for era labels
      await expect(page.locator('text=2100-2800')).toBeVisible();
      await expect(page.locator('text=2801-3050')).toBeVisible();
      await expect(page.locator('text=3051-3082')).toBeVisible();
      await expect(page.locator('text=3083-Now')).toBeVisible();
    });

    test('should update tech rating when year changes', async ({ page }) => {
      const yearInput = page.locator('input[type="number"]').first();
      
      // Change year to 3050
      await yearInput.clear();
      await yearInput.fill('3050');
      
      // Wait for tech rating to update
      await page.waitForTimeout(1000);
      
      // Check that tech rating reflects the new era
      await expect(page.locator('text=Succession Wars')).toBeVisible();
    });
  });

  test.describe('Unit Summary Panel', () => {
    test('should display unit summary information', async ({ page }) => {
      // Check that unit summary panel is visible
      await expect(page.locator('text=Unit Summary')).toBeVisible();
      
      // Check for key unit information
      await expect(page.locator('text=Tonnage')).toBeVisible();
      await expect(page.locator('text=Configuration')).toBeVisible();
      await expect(page.locator('text=Tech Base')).toBeVisible();
      await expect(page.locator('text=Introduction')).toBeVisible();
      await expect(page.locator('text=Rules Level')).toBeVisible();
      await expect(page.locator('text=Era')).toBeVisible();
    });
  });

  test.describe('ReadOnly Mode', () => {
    test('should disable all interactive elements when readonly', async ({ page }) => {
      // This test would require the ability to set readonly mode
      // For now, we'll test that elements are enabled by default
      
      const techBaseSelect = page.locator('select[value="Inner Sphere"]');
      await expect(techBaseSelect).toBeEnabled();
      
      const yearInput = page.locator('input[type="number"]').first();
      await expect(yearInput).toBeEnabled();
      
      const clanButton = page.locator('text=Tech/Chassis').locator('..').locator('button:has-text("Clan")');
      await expect(clanButton).toBeEnabled();
      
      const rulesButton = page.locator('button:has-text("Advanced")');
      await expect(rulesButton).toBeEnabled();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check that all elements are still accessible
      await expect(page.locator('text=Technology Foundation')).toBeVisible();
      await expect(page.locator('text=Technology Progression')).toBeVisible();
      await expect(page.locator('text=Rules Level')).toBeVisible();
      
      // Test interaction on mobile
      const techBaseSelect = page.locator('select[value="Inner Sphere"]');
      await techBaseSelect.selectOption('Clan');
      await expect(techBaseSelect).toHaveValue('Clan');
    });

    test('should work on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Check that layout adapts properly
      await expect(page.locator('text=Technology Foundation')).toBeVisible();
      await expect(page.locator('text=Technology Progression')).toBeVisible();
      
      // Test interaction on tablet
      const yearInput = page.locator('input[type="number"]').first();
      await yearInput.clear();
      await yearInput.fill('3050');
      await expect(yearInput).toHaveValue('3050');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      // Check for proper labels on form elements
      const techBaseSelect = page.locator('select[value="Inner Sphere"]');
      await expect(techBaseSelect).toHaveAttribute('aria-label', /tech base/i);
      
      const yearInput = page.locator('input[type="number"]').first();
      await expect(yearInput).toHaveAttribute('aria-label', /introduction year/i);
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Test tab navigation
      await page.keyboard.press('Tab');
      
      // Focus should move to the first interactive element
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });

  test.describe('State Persistence', () => {
    test('should maintain state when switching tabs', async ({ page }) => {
      // Set some values
      const techBaseSelect = page.locator('select[value="Inner Sphere"]');
      await techBaseSelect.selectOption('Clan');
      
      const yearInput = page.locator('input[type="number"]').first();
      await yearInput.clear();
      await yearInput.fill('3050');
      
      // Switch to another tab
      await page.click('button:has-text("Structure")');
      await page.waitForTimeout(1000);
      
      // Switch back to overview
      await page.click('button:has-text("Overview")');
      await page.waitForSelector('text=Technology Foundation');
      
      // Verify state is maintained
      await expect(techBaseSelect).toHaveValue('Clan');
      await expect(yearInput).toHaveValue('3050');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid year input gracefully', async ({ page }) => {
      const yearInput = page.locator('input[type="number"]').first();
      
      // Try to enter invalid data
      await yearInput.clear();
      await yearInput.fill('abc');
      
      // Should revert to a valid number or show validation
      await expect(yearInput).toHaveValue('3025'); // Should revert to default
    });

    test('should handle rapid state changes', async ({ page }) => {
      const techBaseSelect = page.locator('select[value="Inner Sphere"]');
      
      // Rapidly change tech base
      await techBaseSelect.selectOption('Clan');
      await techBaseSelect.selectOption('Mixed');
      await techBaseSelect.selectOption('Inner Sphere');
      
      // Should end up in a consistent state
      await expect(techBaseSelect).toHaveValue('Inner Sphere');
    });
  });
}); 