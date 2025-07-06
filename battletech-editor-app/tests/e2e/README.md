# End-to-End Testing with Playwright

This directory contains comprehensive end-to-end tests for the BattleTech Editor App, focusing on testing UI interactions with the data model integration.

## Overview

The E2E testing suite is designed to be robust and comprehensive, testing the full integration between the frontend UI and the underlying data model. This is where most real-world issues arise, making these tests critical for ensuring application reliability.

## Port Management

### Dedicated Test Ports

To avoid conflicts with your development server, the test suite uses dedicated ports:

- **Development Server**: `http://localhost:3000` (your main dev server)
- **Test Server**: `http://localhost:3002` (dedicated test server)
- **Report Server**: `http://localhost:9323` (test results viewer)

### Automatic Port Management

The test suite automatically:
- Kills any processes using ports 3000, 3001, 3002, and 8888 before starting
- Starts a dedicated test server on port 3002
- Cleans up all processes after test completion
- Verifies ports are available before running tests

## Test Architecture

### Core Principles

1. **Memory-First Testing**: Tests verify that UI changes properly update the underlying data model
2. **State Persistence**: Tests ensure that changes persist across page reloads and navigation
3. **Error Resilience**: Tests handle network errors, slow conditions, and edge cases gracefully
4. **Performance Monitoring**: Tests measure and validate performance characteristics
5. **Accessibility**: Tests verify proper ARIA labels, keyboard navigation, and color contrast

### Test Structure

```
tests/e2e/
├── global-setup.ts          # Global test setup and port management
├── global-teardown.ts       # Global cleanup and report generation
├── helpers/
│   ├── test-utils.ts        # Comprehensive test utilities
│   └── overview-helpers.ts  # Overview-specific helpers
├── overview-tab-robust.spec.ts  # Main robust test suite
├── overview-tab-simple.spec.ts  # Simplified test suite
└── overview-html-test.spec.ts   # Static HTML tests
```

## Key Features

### Robust Test Utilities (`test-utils.ts`)

- **Retry Logic**: Exponential backoff for flaky operations
- **Element Stability**: Wait for elements to be stable before interaction
- **Screenshot Capture**: Automatic screenshots with timestamps
- **State Logging**: Comprehensive page state logging for debugging
- **Network Mocking**: Mock API responses for testing error scenarios
- **Performance Metrics**: Capture and validate performance data

### Global Setup/Teardown

- **Port Management**: Automatically kill processes using test ports
- **Environment Verification**: Ensure test environment is properly configured
- **Artifact Cleanup**: Clean up test artifacts and temporary files
- **Process Management**: Kill remaining test processes after completion

### Test Categories

1. **Tech Base Selection**: Test dropdown changes and subsystem updates
2. **Introduction Year Input**: Test number input validation and edge cases
3. **Tech Progression Toggles**: Test individual subsystem tech type changes
4. **Rules Level Selection**: Test button group selection and state management
5. **State Persistence**: Test data model integration and persistence
6. **Error Handling**: Test network errors and slow conditions
7. **Performance**: Test load times and responsiveness
8. **Accessibility**: Test keyboard navigation and ARIA compliance

## Running Tests

### Prerequisites

```bash
# Install Playwright browsers
npm run test:e2e:install

# Build the application
npm run build
```

### Basic Test Execution

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suite
npm run test:e2e:overview:robust

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (visible browser)
npm run test:e2e:headed

# Run in debug mode
npm run test:e2e:debug
```

### Full Test Suite

```bash
# Clean, setup, and run full test suite
npm run test:e2e:full
```

### Static HTML Tests

```bash
# Run tests against static HTML file (no server needed)
npm run test:e2e:html
```

### Manual Test Server

```bash
# Start test server manually (for debugging)
npm run dev:test

# This starts the server on http://localhost:3002
```

## Test Configuration

### Playwright Config (`playwright.config.ts`)

- **Retry Logic**: 1 retry for local, 2 for CI
- **Parallel Execution**: 2 workers locally, 1 for CI
- **Timeout Settings**: 60s global, 10s for expectations
- **Browser Coverage**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Web Server**: Automatic test server startup on port 3002

### Environment Variables

- `SKIP_WEBSERVER`: Skip web server startup (for static tests)
- `CI`: Enable CI-specific settings (retries, single worker)

### Port Configuration

- **Test Server**: `http://localhost:3002` (dedicated test port)
- **Development Server**: `http://localhost:3000` (your main dev server)
- **Report Server**: `http://localhost:9323` (test results)

## Debugging Tests

### Screenshots and Videos

- Screenshots are automatically taken on test failures
- Videos are recorded for failed tests
- All artifacts are saved to `test-results/` directory

### Console Logging

Tests include comprehensive logging:
- Page state changes
- Element interactions
- Performance metrics
- Error conditions
- Port availability status

### Interactive Debugging

```bash
# Run with debug mode
npm run test:e2e:debug

# Run with UI mode for step-by-step debugging
npm run test:e2e:ui

# Start test server manually for manual testing
npm run dev:test
```

## Test Data Management

### Test Data Factory

The `TestDataFactory` provides consistent test data:

```typescript
// Create unit configuration
const config = TestDataFactory.createUnitConfiguration({
  techBase: 'Clan',
  introductionYear: 3050
});

// Create equipment data
const equipment = TestDataFactory.createEquipmentData({
  name: 'Test Weapon',
  techBase: 'Inner Sphere'
});
```

### State Management

Tests automatically:
- Clear browser storage before each test
- Verify state persistence across operations
- Test concurrent state changes
- Validate data model integration

## Performance Testing

### Metrics Captured

- Page load time
- DOM content loaded time
- First paint time
- First contentful paint time
- Rapid interaction responsiveness

### Performance Assertions

```typescript
// Verify page loads quickly
expect(loadTime).toBeLessThan(5000);

// Verify interactions are responsive
expect(changeTime).toBeLessThan(2000);
```

## Error Handling

### Network Error Testing

```typescript
// Mock network errors
await page.route('**/api/**', route => {
  route.abort('failed');
});

// Verify UI still works
await selectDropdownOption(page, 'select', 'Clan');
await expect(element).toHaveValue('Clan');
```

### Slow Network Testing

```typescript
// Mock slow network
await page.route('**/api/**', route => {
  setTimeout(() => route.continue(), 2000);
});

// Verify UI remains responsive
await fillFormField(page, 'input', '3050');
await expect(element).toHaveValue('3050');
```

## Accessibility Testing

### Keyboard Navigation

- Tab navigation through all interactive elements
- Focus management and visibility
- Keyboard event handling

### ARIA Compliance

- Proper ARIA labels
- Color contrast validation
- Screen reader compatibility

## Continuous Integration

### CI Configuration

Tests are configured for CI environments:
- Single worker execution
- Increased retry attempts
- Artifact collection
- Report generation

### Pre-commit Hooks

```bash
# Run before committing
npm run test:e2e:overview:robust
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Global setup automatically kills conflicting processes
2. **Flaky Tests**: Retry logic and element stability checks handle most flakiness
3. **Slow Tests**: Performance monitoring identifies bottlenecks
4. **Network Issues**: Mock responses test error scenarios

### Debug Commands

```bash
# Check for port conflicts
netstat -ano | findstr :3002

# Kill processes on test ports
taskkill //PID <PID> //F

# Clear test artifacts
npm run test:e2e:clean

# Reinstall browsers
npm run test:e2e:install

# Start test server manually
npm run dev:test
```

### Port Management

```bash
# Check what's running on test ports
netstat -ano | findstr ":3000\|:3001\|:3002\|:8888"

# Kill all Node.js processes (use with caution)
taskkill /IM node.exe /F

# Kill specific port
netstat -ano | findstr :3002 | findstr LISTENING
# Then use the PID from the output to kill the process
```

## Best Practices

1. **Use Helper Functions**: Always use test utilities for consistency
2. **Wait for Stability**: Use `waitForElementStable` for dynamic content
3. **Take Screenshots**: Capture state at key points for debugging
4. **Test Edge Cases**: Include error scenarios and boundary conditions
5. **Validate State**: Always verify that UI changes update the data model
6. **Performance Monitor**: Track and validate performance metrics
7. **Accessibility**: Ensure keyboard navigation and ARIA compliance
8. **Port Management**: Use dedicated test ports to avoid conflicts

## Future Enhancements

- Visual regression testing
- Cross-browser compatibility testing
- Mobile device testing
- Performance benchmarking
- Accessibility audit integration
- API contract testing
- Database state validation 