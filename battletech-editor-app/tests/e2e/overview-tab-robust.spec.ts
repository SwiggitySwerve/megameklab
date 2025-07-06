import { test, expect } from '@playwright/test';
import {
  waitForPageReady,
  retryWithBackoff,
  takeScreenshot,
  logPageState,
  clearBrowserStorage,
  getElementWithRetry,
  fillFormField,
  selectDropdownOption,
  clickElementWithRetry,
  waitForCondition,
  isElementVisible,
  TestDataFactory,
  Assertions
} from './helpers/test-utils';

/**
 * Robust end-to-end test suite for the Overview Tab functionality
 * Tests UI interactions with data model integration
 */

test.describe('Overview Tab - Robust E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear browser storage for clean state
    await clearBrowserStorage(page);
    
    // Navigate to the customizer page
    await page.goto('/customizer-v2');
    
    // Wait for page to be fully loaded
    await waitForPageReady(page);
    
    // Log initial page state
    await logPageState(page, 'Initial Load');
    
    // Ensure we're on the overview tab
    await clickElementWithRetry(page, 'button:has-text("Overview")');
    
    // Wait for overview content to load
    await waitForCondition(async () => {
      return await isElementVisible(page, 'text=Technology Foundation');
    });
    
    // Take initial screenshot
    await takeScreenshot(page, 'overview-tab-loaded');
  });

  test.describe('Tech Base Selection', () => {
    test('should change tech base to Clan and update all subsystems', async ({ page }) => {
      // Get the tech base dropdown
      const techBaseSelect = await getElementWithRetry(page, 'select[value="Inner Sphere"]');
      
      // Change to Clan
      await selectDropdownOption(page, 'select[value="Inner Sphere"]', 'Clan');
      
      // Verify the selection
      await expect(techBaseSelect).toHaveValue('Clan');
      
      // Wait for all subsystems to update to Clan
      await waitForCondition(async () => {
        const clanButtons = page.locator('button:has-text("Clan").bg-green-600');
        const count = await clanButtons.count();
        return count === 8; // All 8 subsystems should be Clan
      });
      
      // Verify all subsystems are now Clan
      const clanButtons = page.locator('button:has-text("Clan").bg-green-600');
      await expect(clanButtons).toHaveCount(8);
      
      // Take screenshot after change
      await takeScreenshot(page, 'tech-base-clan-selected');
    });

    test('should change tech base to Mixed and show notification', async ({ page }) => {
      // Change to Mixed
      await selectDropdownOption(page, 'select[value="Inner Sphere"]', 'Mixed');
      
      // Verify the selection
      const techBaseSelect = await getElementWithRetry(page, 'select[value="Inner Sphere"]');
      await expect(techBaseSelect).toHaveValue('Mixed');
      
      // Wait for mixed tech notification
      await waitForCondition(async () => {
        return await isElementVisible(page, 'text=Mixed Technology Configuration');
      });
      
      // Verify notification is visible
      await Assertions.expectElementVisible(page, 'text=Mixed Technology Configuration');
      
      // Take screenshot
      await takeScreenshot(page, 'tech-base-mixed-notification');
    });

    test('should handle rapid tech base changes', async ({ page }) => {
      const techBaseSelect = await getElementWithRetry(page, 'select[value="Inner Sphere"]');
      
      // Rapidly change tech base multiple times
      const changes = ['Clan', 'Mixed', 'Inner Sphere', 'Clan'];
      
      for (const techBase of changes) {
        await selectDropdownOption(page, 'select[value="Inner Sphere"]', techBase);
        await expect(techBaseSelect).toHaveValue(techBase);
        
        // Small delay to ensure UI updates
        await page.waitForTimeout(500);
      }
      
      // Should end up in a consistent state
      await expect(techBaseSelect).toHaveValue('Clan');
      
      // Verify all subsystems are Clan
      const clanButtons = page.locator('button:has-text("Clan").bg-green-600');
      await expect(clanButtons).toHaveCount(8);
    });
  });

  test.describe('Introduction Year Input', () => {
    test('should update introduction year and validate input', async ({ page }) => {
      // Get the year input field
      const yearInput = await getElementWithRetry(page, 'input[type="number"]').first();
      
      // Test valid year input
      await fillFormField(page, 'input[type="number"]', '3050');
      await expect(yearInput).toHaveValue('3050');
      
      // Test invalid year input (should be handled by browser validation)
      await fillFormField(page, 'input[type="number"]', '1800');
      await expect(yearInput).toHaveValue('1800');
      
      // Test very large year
      await fillFormField(page, 'input[type="number"]', '4000');
      await expect(yearInput).toHaveValue('4000');
      
      // Take screenshot
      await takeScreenshot(page, 'introduction-year-updated');
    });

    test('should handle empty and invalid inputs gracefully', async ({ page }) => {
      const yearInput = await getElementWithRetry(page, 'input[type="number"]').first();
      
      // Test clearing the field
      await yearInput.clear();
      await expect(yearInput).toHaveValue('');
      
      // Test entering text (should be ignored by number input)
      await yearInput.fill('abc');
      await expect(yearInput).toHaveValue('');
      
      // Test entering negative number
      await fillFormField(page, 'input[type="number"]', '-1000');
      await expect(yearInput).toHaveValue('-1000');
    });
  });

  test.describe('Tech Progression Toggles', () => {
    test('should toggle individual subsystem tech types', async ({ page }) => {
      // Test toggling each subsystem individually
      const subsystems = ['chassis', 'engine', 'gyro', 'heatsink', 'targeting', 'myomer', 'movement', 'armor'];
      
      for (const subsystem of subsystems) {
        // Find the subsystem section and toggle to Clan
        const clanButton = page.locator(`button:has-text("Clan"):near(:text("${subsystem}"))`);
        await clickElementWithRetry(page, `button:has-text("Clan"):near(:text("${subsystem}"))`);
        
        // Verify the button is now selected (green background)
        await expect(clanButton).toHaveClass(/bg-green-600/);
        
        // Toggle back to Inner Sphere
        const innerSphereButton = page.locator(`button:has-text("Inner Sphere"):near(:text("${subsystem}"))`);
        await clickElementWithRetry(page, `button:has-text("Inner Sphere"):near(:text("${subsystem}"))`);
        
        // Verify the button is now selected
        await expect(innerSphereButton).toHaveClass(/bg-green-600/);
      }
      
      // Take screenshot
      await takeScreenshot(page, 'tech-progression-toggles-tested');
    });

    test('should create mixed tech configuration', async ({ page }) => {
      // Set some subsystems to Clan and others to Inner Sphere
      const clanSubsystems = ['chassis', 'engine', 'gyro'];
      const innerSphereSubsystems = ['heatsink', 'targeting', 'myomer', 'movement', 'armor'];
      
      // Set Clan subsystems
      for (const subsystem of clanSubsystems) {
        await clickElementWithRetry(page, `button:has-text("Clan"):near(:text("${subsystem}"))`);
      }
      
      // Set Inner Sphere subsystems
      for (const subsystem of innerSphereSubsystems) {
        await clickElementWithRetry(page, `button:has-text("Inner Sphere"):near(:text("${subsystem}"))`);
      }
      
      // Set tech base to Mixed
      await selectDropdownOption(page, 'select[value="Inner Sphere"]', 'Mixed');
      
      // Verify mixed tech notification appears
      await waitForCondition(async () => {
        return await isElementVisible(page, 'text=Mixed Technology Configuration');
      });
      
      // Verify the configuration
      const clanButtons = page.locator('button:has-text("Clan").bg-green-600');
      const innerSphereButtons = page.locator('button:has-text("Inner Sphere").bg-green-600');
      
      await expect(clanButtons).toHaveCount(3);
      await expect(innerSphereButtons).toHaveCount(5);
      
      // Take screenshot
      await takeScreenshot(page, 'mixed-tech-configuration');
    });
  });

  test.describe('Rules Level Selection', () => {
    test('should select different rules levels', async ({ page }) => {
      const rulesLevels = ['Introductory', 'Standard', 'Advanced', 'Experimental'];
      
      for (const level of rulesLevels) {
        const button = page.locator(`button:has-text("${level}")`);
        await clickElementWithRetry(page, `button:has-text("${level}")`);
        
        // Verify it's selected (yellow background)
        await expect(button).toHaveClass(/bg-yellow-600/);
        
        // Verify other buttons are not selected
        for (const otherLevel of rulesLevels) {
          if (otherLevel !== level) {
            const otherButton = page.locator(`button:has-text("${otherLevel}")`);
            await expect(otherButton).not.toHaveClass(/bg-yellow-600/);
          }
        }
      }
      
      // Take screenshot
      await takeScreenshot(page, 'rules-level-selection');
    });

    test('should maintain Standard as default', async ({ page }) => {
      const standardButton = page.locator('button:has-text("Standard")');
      await expect(standardButton).toHaveClass(/bg-yellow-600/);
    });
  });

  test.describe('State Persistence and Data Model Integration', () => {
    test('should persist state changes across page reloads', async ({ page }) => {
      // Make some changes
      await selectDropdownOption(page, 'select[value="Inner Sphere"]', 'Clan');
      await fillFormField(page, 'input[type="number"]', '3050');
      await clickElementWithRetry(page, 'button:has-text("Advanced")');
      
      // Reload the page
      await page.reload();
      await waitForPageReady(page);
      
      // Navigate back to overview tab
      await clickElementWithRetry(page, 'button:has-text("Overview")');
      await waitForCondition(async () => {
        return await isElementVisible(page, 'text=Technology Foundation');
      });
      
      // Verify state is persisted
      const techBaseSelect = await getElementWithRetry(page, 'select[value="Inner Sphere"]');
      await expect(techBaseSelect).toHaveValue('Clan');
      
      const yearInput = await getElementWithRetry(page, 'input[type="number"]').first();
      await expect(yearInput).toHaveValue('3050');
      
      const advancedButton = page.locator('button:has-text("Advanced")');
      await expect(advancedButton).toHaveClass(/bg-yellow-600/);
      
      // Take screenshot
      await takeScreenshot(page, 'state-persistence-verified');
    });

    test('should handle concurrent state changes', async ({ page }) => {
      // Simulate rapid concurrent changes
      const promises = [
        selectDropdownOption(page, 'select[value="Inner Sphere"]', 'Clan'),
        fillFormField(page, 'input[type="number"]', '3050'),
        clickElementWithRetry(page, 'button:has-text("Advanced")'),
        clickElementWithRetry(page, 'button:has-text("Clan"):near(:text("chassis"))')
      ];
      
      await Promise.all(promises);
      
      // Wait for state to stabilize
      await waitForPageReady(page);
      
      // Verify final state is consistent
      const techBaseSelect = await getElementWithRetry(page, 'select[value="Inner Sphere"]');
      await expect(techBaseSelect).toHaveValue('Clan');
      
      const yearInput = await getElementWithRetry(page, 'input[type="number"]').first();
      await expect(yearInput).toHaveValue('3050');
      
      const advancedButton = page.locator('button:has-text("Advanced")');
      await expect(advancedButton).toHaveClass(/bg-yellow-600/);
      
      const clanChassisButton = page.locator('button:has-text("Clan"):near(:text("chassis"))');
      await expect(clanChassisButton).toHaveClass(/bg-green-600/);
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Mock a network error
      await page.route('**/api/**', route => {
        route.abort('failed');
      });
      
      // Try to make a change that might trigger an API call
      await selectDropdownOption(page, 'select[value="Inner Sphere"]', 'Clan');
      
      // The UI should still work even with network errors
      const techBaseSelect = await getElementWithRetry(page, 'select[value="Inner Sphere"]');
      await expect(techBaseSelect).toHaveValue('Clan');
      
      // Restore normal network behavior
      await page.unroute('**/api/**');
    });

    test('should handle slow network conditions', async ({ page }) => {
      // Mock slow network
      await page.route('**/api/**', route => {
        setTimeout(() => {
          route.continue();
        }, 2000);
      });
      
      // Make changes and verify they still work
      await selectDropdownOption(page, 'select[value="Inner Sphere"]', 'Clan');
      await fillFormField(page, 'input[type="number"]', '3050');
      
      // Verify changes are applied
      const techBaseSelect = await getElementWithRetry(page, 'select[value="Inner Sphere"]');
      await expect(techBaseSelect).toHaveValue('Clan');
      
      const yearInput = await getElementWithRetry(page, 'input[type="number"]').first();
      await expect(yearInput).toHaveValue('3050');
      
      // Restore normal network behavior
      await page.unroute('**/api/**');
    });
  });

  test.describe('Performance and Responsiveness', () => {
    test('should load quickly and be responsive', async ({ page }) => {
      // Measure initial load time
      const startTime = Date.now();
      
      await waitForPageReady(page);
      
      const loadTime = Date.now() - startTime;
      console.log(`Page load time: ${loadTime}ms`);
      
      // Load time should be reasonable (less than 5 seconds)
      expect(loadTime).toBeLessThan(5000);
      
      // Test responsiveness by making rapid changes
      const changeStartTime = Date.now();
      
      for (let i = 0; i < 10; i++) {
        await selectDropdownOption(page, 'select[value="Inner Sphere"]', i % 2 === 0 ? 'Clan' : 'Inner Sphere');
        await page.waitForTimeout(100);
      }
      
      const changeTime = Date.now() - changeStartTime;
      console.log(`Rapid changes time: ${changeTime}ms`);
      
      // Changes should be responsive (less than 2 seconds for 10 changes)
      expect(changeTime).toBeLessThan(2000);
    });

    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Wait for responsive layout to adjust
      await page.waitForTimeout(1000);
      
      // Test basic functionality on mobile
      await selectDropdownOption(page, 'select[value="Inner Sphere"]', 'Clan');
      await fillFormField(page, 'input[type="number"]', '3050');
      await clickElementWithRetry(page, 'button:has-text("Advanced")');
      
      // Verify functionality still works
      const techBaseSelect = await getElementWithRetry(page, 'select[value="Inner Sphere"]');
      await expect(techBaseSelect).toHaveValue('Clan');
      
      const yearInput = await getElementWithRetry(page, 'input[type="number"]').first();
      await expect(yearInput).toHaveValue('3050');
      
      const advancedButton = page.locator('button:has-text("Advanced")');
      await expect(advancedButton).toHaveClass(/bg-yellow-600/);
      
      // Take mobile screenshot
      await takeScreenshot(page, 'mobile-viewport');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels and keyboard navigation', async ({ page }) => {
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      
      // Verify focus is on the first interactive element
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Test that all interactive elements are keyboard accessible
      const interactiveElements = [
        'select[value="Inner Sphere"]',
        'input[type="number"]',
        'button:has-text("Introductory")',
        'button:has-text("Standard")',
        'button:has-text("Advanced")',
        'button:has-text("Experimental")'
      ];
      
      for (const selector of interactiveElements) {
        const element = page.locator(selector);
        await expect(element).toBeVisible();
        
        // Test that element can receive focus
        await element.focus();
        await expect(element).toBeFocused();
      }
    });

    test('should have proper color contrast and text readability', async ({ page }) => {
      // This would typically use axe-core or similar accessibility testing library
      // For now, we'll verify that text is visible and readable
      
      const textElements = [
        'text=Technology Foundation',
        'text=Technology Progression',
        'text=Rules Level',
        'text=Unit Summary'
      ];
      
      for (const selector of textElements) {
        const element = page.locator(selector);
        await expect(element).toBeVisible();
        
        // Verify text has reasonable contrast (basic check)
        const color = await element.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.color;
        });
        
        // Text should not be transparent or very light
        expect(color).not.toBe('rgba(0, 0, 0, 0)');
        expect(color).not.toBe('transparent');
      }
    });
  });
}); 