import { Page, expect } from '@playwright/test';

/**
 * Helper functions for Overview Tab tests
 */

export interface TechProgressionState {
  chassis: 'Inner Sphere' | 'Clan';
  engine: 'Inner Sphere' | 'Clan';
  gyro: 'Inner Sphere' | 'Clan';
  heatsink: 'Inner Sphere' | 'Clan';
  targeting: 'Inner Sphere' | 'Clan';
  myomer: 'Inner Sphere' | 'Clan';
  movement: 'Inner Sphere' | 'Clan';
  armor: 'Inner Sphere' | 'Clan';
}

export interface OverviewState {
  techBase: 'Inner Sphere' | 'Clan' | 'Mixed';
  introductionYear: number;
  rulesLevel: 'Introductory' | 'Standard' | 'Advanced' | 'Experimental';
  techProgression: TechProgressionState;
}

/**
 * Navigate to the overview tab and wait for it to load
 */
export async function navigateToOverviewTab(page: Page) {
  await page.goto('/customizer-v2');
  await page.waitForSelector('text=Unit Overview', { timeout: 10000 });
  await page.click('button:has-text("Overview")');
  await page.waitForSelector('text=Technology Foundation', { timeout: 5000 });
}

/**
 * Get the tech base dropdown selector
 */
export function getTechBaseSelect(page: Page) {
  return page.locator('select[value="Inner Sphere"]');
}

/**
 * Get the introduction year input selector
 */
export function getYearInput(page: Page) {
  return page.locator('input[type="number"]').first();
}

/**
 * Get a tech progression button for a specific subsystem and tech base
 */
export function getTechProgressionButton(page: Page, subsystem: string, techBase: 'Inner Sphere' | 'Clan') {
  const subsystemLabel = `Tech/${subsystem.charAt(0).toUpperCase() + subsystem.slice(1)}`;
  return page.locator(`text=${subsystemLabel}`).locator('..').locator(`button:has-text("${techBase}")`);
}

/**
 * Get a rules level button
 */
export function getRulesLevelButton(page: Page, level: string) {
  return page.locator(`button:has-text("${level}")`);
}

/**
 * Set the tech base
 */
export async function setTechBase(page: Page, techBase: 'Inner Sphere' | 'Clan' | 'Mixed') {
  const techBaseSelect = getTechBaseSelect(page);
  await techBaseSelect.selectOption(techBase);
  await expect(techBaseSelect).toHaveValue(techBase);
}

/**
 * Set the introduction year
 */
export async function setIntroductionYear(page: Page, year: number) {
  const yearInput = getYearInput(page);
  await yearInput.clear();
  await yearInput.fill(year.toString());
  await expect(yearInput).toHaveValue(year.toString());
}

/**
 * Set a specific tech progression subsystem
 */
export async function setTechProgression(page: Page, subsystem: string, techBase: 'Inner Sphere' | 'Clan') {
  const button = getTechProgressionButton(page, subsystem, techBase);
  await button.click();
  
  // Verify the selection
  if (techBase === 'Clan') {
    await expect(button).toHaveClass(/bg-green-600/);
  } else {
    await expect(button).toHaveClass(/bg-orange-600/);
  }
}

/**
 * Set the rules level
 */
export async function setRulesLevel(page: Page, level: string) {
  const button = getRulesLevelButton(page, level);
  await button.click();
  await expect(button).toHaveClass(/bg-yellow-600/);
}

/**
 * Set the entire tech progression state
 */
export async function setTechProgressionState(page: Page, state: TechProgressionState) {
  for (const [subsystem, techBase] of Object.entries(state)) {
    await setTechProgression(page, subsystem, techBase);
  }
}

/**
 * Verify the current tech progression state
 */
export async function verifyTechProgressionState(page: Page, expectedState: TechProgressionState) {
  for (const [subsystem, expectedTechBase] of Object.entries(expectedState)) {
    const button = getTechProgressionButton(page, subsystem, expectedTechBase);
    if (expectedTechBase === 'Clan') {
      await expect(button).toHaveClass(/bg-green-600/);
    } else {
      await expect(button).toHaveClass(/bg-orange-600/);
    }
  }
}

/**
 * Get the current overview state
 */
export async function getOverviewState(page: Page): Promise<OverviewState> {
  const techBaseSelect = getTechBaseSelect(page);
  const yearInput = getYearInput(page);
  
  const techBase = await techBaseSelect.inputValue() as 'Inner Sphere' | 'Clan' | 'Mixed';
  const introductionYear = parseInt(await yearInput.inputValue());
  
  // Get rules level by finding which button has the selected class
  const rulesLevels = ['Introductory', 'Standard', 'Advanced', 'Experimental'];
  let rulesLevel = 'Standard' as 'Introductory' | 'Standard' | 'Advanced' | 'Experimental';
  
  for (const level of rulesLevels) {
    const button = getRulesLevelButton(page, level);
    const hasClass = await button.evaluate(el => el.classList.contains('bg-yellow-600'));
    if (hasClass) {
      rulesLevel = level as 'Introductory' | 'Standard' | 'Advanced' | 'Experimental';
      break;
    }
  }
  
  // Get tech progression state
  const subsystems = ['chassis', 'engine', 'gyro', 'heatsink', 'targeting', 'myomer', 'movement', 'armor'];
  const techProgression: TechProgressionState = {} as TechProgressionState;
  
  for (const subsystem of subsystems) {
    const clanButton = getTechProgressionButton(page, subsystem, 'Clan');
    const hasClanClass = await clanButton.evaluate(el => el.classList.contains('bg-green-600'));
    techProgression[subsystem as keyof TechProgressionState] = hasClanClass ? 'Clan' : 'Inner Sphere';
  }
  
  return {
    techBase,
    introductionYear,
    rulesLevel,
    techProgression
  };
}

/**
 * Verify the current overview state matches expected state
 */
export async function verifyOverviewState(page: Page, expectedState: OverviewState) {
  const currentState = await getOverviewState(page);
  
  expect(currentState.techBase).toBe(expectedState.techBase);
  expect(currentState.introductionYear).toBe(expectedState.introductionYear);
  expect(currentState.rulesLevel).toBe(expectedState.rulesLevel);
  
  for (const [subsystem, expectedTechBase] of Object.entries(expectedState.techProgression)) {
    expect(currentState.techProgression[subsystem as keyof TechProgressionState]).toBe(expectedTechBase);
  }
}

/**
 * Check if mixed tech notification is visible
 */
export async function isMixedTechNotificationVisible(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('text=Mixed Technology Configuration', { timeout: 1000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for the page to be in a stable state
 */
export async function waitForStableState(page: Page) {
  // Wait for any animations to complete
  await page.waitForTimeout(500);
  
  // Wait for network to be idle
  await page.waitForLoadState('networkidle');
}

/**
 * Take a screenshot for debugging
 */
export async function takeDebugScreenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `test-results/debug-${name}-${Date.now()}.png`,
    fullPage: true 
  });
} 