import { test, expect } from '@playwright/test';

/**
 * Test suite for the HTML test file
 * This tests the overview functionality without the complex React build system
 */

test.describe('Overview HTML Test File', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the HTML test file
    await page.goto('file://' + process.cwd() + '/test-overview.html');
    
    // Wait for the page to load
    await page.waitForSelector('text=Overview Tab Test', { timeout: 10000 });
  });

  test('should load the test page successfully', async ({ page }) => {
    // Verify the page loaded
    await expect(page.locator('h1:has-text("Overview Tab Test")')).toBeVisible();
    
    // Verify all test sections are present
    await expect(page.locator('h2:has-text("Tech Base Selection")')).toBeVisible();
    await expect(page.locator('h2:has-text("Introduction Year")')).toBeVisible();
    await expect(page.locator('h2:has-text("Tech Progression")')).toBeVisible();
    await expect(page.locator('h2:has-text("Rules Level")')).toBeVisible();
    await expect(page.locator('h2:has-text("ReadOnly Mode")')).toBeVisible();
  });

  test('should change tech base selection', async ({ page }) => {
    const techBaseSelect = page.locator('#techBaseSelect');
    
    // Test changing to Clan
    await techBaseSelect.selectOption('Clan');
    await expect(techBaseSelect).toHaveValue('Clan');
    
    // Test changing to Mixed
    await techBaseSelect.selectOption('Mixed');
    await expect(techBaseSelect).toHaveValue('Mixed');
    
    // Test changing back to Inner Sphere
    await techBaseSelect.selectOption('Inner Sphere');
    await expect(techBaseSelect).toHaveValue('Inner Sphere');
  });

  test('should change introduction year', async ({ page }) => {
    const yearInput = page.locator('#yearInput');
    
    // Test changing year
    await yearInput.clear();
    await yearInput.fill('3050');
    await expect(yearInput).toHaveValue('3050');
    
    // Test another year
    await yearInput.clear();
    await yearInput.fill('3080');
    await expect(yearInput).toHaveValue('3080');
  });

  test('should toggle tech progression subsystems', async ({ page }) => {
    // Test chassis
    await page.click('button[onclick*="testTechProgression(\'chassis\', \'Clan\')"]');
    await page.click('button[onclick*="testTechProgression(\'chassis\', \'Inner Sphere\')"]');
    
    // Test engine
    await page.click('button[onclick*="testTechProgression(\'engine\', \'Clan\')"]');
    await page.click('button[onclick*="testTechProgression(\'engine\', \'Inner Sphere\')"]');
    
    // Test gyro
    await page.click('button[onclick*="testTechProgression(\'gyro\', \'Clan\')"]');
    await page.click('button[onclick*="testTechProgression(\'gyro\', \'Inner Sphere\')"]');
  });

  test('should change rules level', async ({ page }) => {
    const rulesLevels = ['Introductory', 'Advanced', 'Experimental'];
    
    for (const level of rulesLevels) {
      await page.click(`button[onclick*="testRulesLevel('${level}')"]`);
      
      // Verify the log shows the change
      const logOutput = page.locator('#logOutput');
      await expect(logOutput).toContainText(`Rules level clicked: ${level}`);
    }
  });

  test('should toggle readonly mode', async ({ page }) => {
    const readonlyToggle = page.locator('#readOnlyToggle');
    
    // Enable readonly mode
    await readonlyToggle.click();
    await expect(readonlyToggle).toHaveText('Disable ReadOnly');
    
    // Try to make changes while readonly
    await page.click('button[onclick*="testTechBaseChange()"]');
    
    // Verify readonly mode prevented changes
    const logOutput = page.locator('#logOutput');
    await expect(logOutput).toContainText('ReadOnly mode enabled - skipping');
    
    // Disable readonly mode
    await readonlyToggle.click();
    await expect(readonlyToggle).toHaveText('Enable ReadOnly');
    
    // Verify changes work again
    await page.click('button[onclick*="testTechBaseChange()"]');
    await expect(logOutput).toContainText('Tech base change:');
  });

  test('should log all interactions', async ({ page }) => {
    const logOutput = page.locator('#logOutput');
    
    // Perform some actions
    await page.locator('#techBaseSelect').selectOption('Clan');
    await page.locator('#yearInput').clear();
    await page.locator('#yearInput').fill('3050');
    await page.click('button[onclick*="testTechProgression(\'chassis\', \'Clan\')"]');
    await page.click('button[onclick*="testRulesLevel(\'Advanced\')"]');
    
    // Verify all actions were logged
    await expect(logOutput).toContainText('Tech base change:');
    await expect(logOutput).toContainText('Year change:');
    await expect(logOutput).toContainText('Tech progression change:');
    await expect(logOutput).toContainText('Rules level clicked:');
  });

  test('should clear log', async ({ page }) => {
    // Perform some actions to generate log entries
    await page.locator('#techBaseSelect').selectOption('Clan');
    
    // Verify log has content
    const logOutput = page.locator('#logOutput');
    await expect(logOutput).toContainText('Tech base change:');
    
    // Clear the log
    await page.click('button:has-text("Clear Log")');
    
    // Verify log is empty
    await expect(logOutput).toHaveText('');
  });

  test('should display current state', async ({ page }) => {
    // Perform some actions
    await page.locator('#techBaseSelect').selectOption('Clan');
    await page.locator('#yearInput').clear();
    await page.locator('#yearInput').fill('3050');
    
    // Verify state is displayed in log
    const logOutput = page.locator('#logOutput');
    await expect(logOutput).toContainText('"techBase": "Clan"');
    await expect(logOutput).toContainText('"introductionYear": 3050');
  });

  test('should handle rapid state changes', async ({ page }) => {
    const techBaseSelect = page.locator('#techBaseSelect');
    
    // Rapidly change tech base
    await techBaseSelect.selectOption('Clan');
    await techBaseSelect.selectOption('Mixed');
    await techBaseSelect.selectOption('Inner Sphere');
    
    // Should end up in a consistent state
    await expect(techBaseSelect).toHaveValue('Inner Sphere');
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test basic functionality
    await page.locator('#techBaseSelect').selectOption('Clan');
    await page.locator('#yearInput').clear();
    await page.locator('#yearInput').fill('3050');
    
    // Verify functionality still works
    await expect(page.locator('#techBaseSelect')).toHaveValue('Clan');
    await expect(page.locator('#yearInput')).toHaveValue('3050');
  });

  test('should handle complex mixed tech configuration', async ({ page }) => {
    // Create a complex mixed tech configuration
    const subsystems = ['chassis', 'engine', 'gyro'];
    const techBases = ['Clan', 'Inner Sphere', 'Clan'];
    
    for (let i = 0; i < subsystems.length; i++) {
      await page.click(`button[onclick*="testTechProgression('${subsystems[i]}', '${techBases[i]}')"]`);
    }
    
    // Set tech base to Mixed
    await page.locator('#techBaseSelect').selectOption('Mixed');
    
    // Verify the configuration
    const logOutput = page.locator('#logOutput');
    await expect(logOutput).toContainText('"techBase": "Mixed"');
  });
}); 