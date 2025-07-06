import { Page, expect, Locator } from '@playwright/test';

/**
 * Test utilities for robust end-to-end testing
 */

export interface TestConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}

export const DEFAULT_CONFIG: TestConfig = {
  baseUrl: 'http://localhost:3002',
  timeout: 30000,
  retryAttempts: 3
};

/**
 * Wait for page to be fully loaded and stable
 */
export async function waitForPageReady(page: Page, timeout = 10000) {
  await page.waitForLoadState('networkidle', { timeout });
  await page.waitForLoadState('domcontentloaded', { timeout });
  
  // Wait for any loading indicators to disappear
  try {
    await page.waitForSelector('[data-testid="loading"], .loading, .spinner', { 
      state: 'hidden', 
      timeout: 5000 
    });
  } catch {
    // Loading indicator might not exist, which is fine
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Wait for an element to be stable (not changing for a period)
 */
export async function waitForElementStable(
  page: Page,
  selector: string,
  stabilityTime = 1000
) {
  let lastContent = '';
  let stableCount = 0;
  const requiredStableCount = 3;
  
  while (stableCount < requiredStableCount) {
    await page.waitForTimeout(stabilityTime / requiredStableCount);
    
    const currentContent = await page.locator(selector).textContent() || '';
    
    if (currentContent === lastContent) {
      stableCount++;
    } else {
      stableCount = 0;
      lastContent = currentContent;
    }
  }
}

/**
 * Take a screenshot with timestamp
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `test-results/screenshot-${name}-${timestamp}.png`;
  
  await page.screenshot({ 
    path: filename,
    fullPage: true 
  });
  
  console.log(`📸 Screenshot saved: ${filename}`);
  return filename;
}

/**
 * Log page state for debugging
 */
export async function logPageState(page: Page, context = '') {
  const url = page.url();
  const title = await page.title();
  
  console.log(`🔍 Page State [${context}]:`);
  console.log(`  URL: ${url}`);
  console.log(`  Title: ${title}`);
  
  // Log any console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  if (errors.length > 0) {
    console.log(`  Console Errors: ${errors.join(', ')}`);
  }
}

/**
 * Wait for network requests to complete
 */
export async function waitForNetworkIdle(page: Page, timeout = 10000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Clear browser storage
 */
export async function clearBrowserStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
  });
}

/**
 * Mock API responses for testing
 */
export async function mockApiResponse(
  page: Page,
  url: string,
  response: any,
  status = 200
) {
  await page.route(url, route => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response)
    });
  });
}

/**
 * Wait for a specific condition with timeout
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  timeout = 10000,
  interval = 100
) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Get element with retry logic
 */
export async function getElementWithRetry(
  page: Page,
  selector: string,
  timeout = 10000
): Promise<Locator> {
  const element = page.locator(selector);
  
  await retryWithBackoff(async () => {
    await expect(element).toBeVisible({ timeout: 5000 });
  });
  
  return element;
}

/**
 * Fill form field with validation
 */
export async function fillFormField(
  page: Page,
  selector: string,
  value: string,
  validate = true
) {
  const field = await getElementWithRetry(page, selector);
  
  await field.clear();
  await field.fill(value);
  
  if (validate) {
    await expect(field).toHaveValue(value);
  }
}

/**
 * Click element with retry logic
 */
export async function clickElementWithRetry(
  page: Page,
  selector: string,
  timeout = 10000
) {
  const element = await getElementWithRetry(page, selector, timeout);
  
  await retryWithBackoff(async () => {
    await element.click();
  });
}

/**
 * Select dropdown option with validation
 */
export async function selectDropdownOption(
  page: Page,
  selector: string,
  value: string
) {
  const dropdown = await getElementWithRetry(page, selector);
  
  await dropdown.selectOption(value);
  await expect(dropdown).toHaveValue(value);
}

/**
 * Wait for toast/notification to appear
 */
export async function waitForToast(
  page: Page,
  message?: string,
  timeout = 5000
) {
  const toastSelector = '[data-testid="toast"], .toast, .notification';
  
  if (message) {
    await page.waitForSelector(`${toastSelector}:has-text("${message}")`, { timeout });
  } else {
    await page.waitForSelector(toastSelector, { timeout });
  }
}

/**
 * Check if element is visible with timeout
 */
export async function isElementVisible(
  page: Page,
  selector: string,
  timeout = 5000
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for element to disappear
 */
export async function waitForElementToDisappear(
  page: Page,
  selector: string,
  timeout = 10000
) {
  await page.waitForSelector(selector, { state: 'hidden', timeout });
}

/**
 * Get page performance metrics
 */
export async function getPerformanceMetrics(page: Page) {
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
    };
  });
  
  return metrics;
}

/**
 * Test data factory for creating test configurations
 */
export const TestDataFactory = {
  createUnitConfiguration: (overrides = {}) => ({
    techBase: 'Inner Sphere',
    introductionYear: 3025,
    rulesLevel: 'Standard',
    techProgression: {
      chassis: 'Inner Sphere',
      engine: 'Inner Sphere',
      gyro: 'Inner Sphere',
      heatsink: 'Inner Sphere',
      targeting: 'Inner Sphere',
      myomer: 'Inner Sphere',
      movement: 'Inner Sphere',
      armor: 'Inner Sphere'
    },
    ...overrides
  }),
  
  createEquipmentData: (overrides = {}) => ({
    id: 'test-equipment-1',
    name: 'Test Equipment',
    category: 'weapons',
    techBase: 'Inner Sphere',
    introductionYear: 3025,
    ...overrides
  })
};

/**
 * Assertion helpers for common test scenarios
 */
export const Assertions = {
  async expectPageTitle(page: Page, expectedTitle: string) {
    await expect(page).toHaveTitle(expectedTitle);
  },
  
  async expectElementText(page: Page, selector: string, expectedText: string) {
    const element = await getElementWithRetry(page, selector);
    await expect(element).toHaveText(expectedText);
  },
  
  async expectElementValue(page: Page, selector: string, expectedValue: string) {
    const element = await getElementWithRetry(page, selector);
    await expect(element).toHaveValue(expectedValue);
  },
  
  async expectElementVisible(page: Page, selector: string) {
    const element = await getElementWithRetry(page, selector);
    await expect(element).toBeVisible();
  },
  
  async expectElementHidden(page: Page, selector: string) {
    await expect(page.locator(selector)).toBeHidden();
  }
}; 