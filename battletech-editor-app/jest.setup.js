// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Set test timeout for database operations
jest.setTimeout(30000);

// Mock Next.js modules that might not be available in test environment
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: '',
      asPath: '/',
    };
  },
}));

// Suppress console warnings during tests (optional)
global.console = {
  ...console,
  // Uncomment to ignore specific warnings
  // warn: jest.fn(),
  // error: jest.fn(),
};
