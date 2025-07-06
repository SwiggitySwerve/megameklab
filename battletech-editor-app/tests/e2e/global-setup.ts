import { chromium, FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Global setup for Playwright tests
 * Handles port conflicts and ensures clean test environment
 */
async function globalSetup(config: FullConfig) {
  console.log('🔧 Starting global setup...');
  
  // Kill any processes using our test ports
  await killProcessesOnPorts([3000, 3001, 3002, 8888]);
  
  // Clear test artifacts
  await clearTestArtifacts();
  
  // Verify test environment
  await verifyTestEnvironment();
  
  console.log('✅ Global setup completed');
}

/**
 * Kill processes using specified ports
 */
async function killProcessesOnPorts(ports: number[]) {
  console.log(`🔍 Checking for processes on ports: ${ports.join(', ')}`);
  
  for (const port of ports) {
    try {
      // Find processes using the port
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      
      if (stdout.trim()) {
        console.log(`⚠️  Found processes using port ${port}:`);
        console.log(stdout);
        
        // Extract PIDs and kill them
        const lines = stdout.split('\n');
        for (const line of lines) {
          const match = line.match(/\s+(\d+)$/);
          if (match) {
            const pid = match[1];
            try {
              await execAsync(`taskkill //PID ${pid} //F`);
              console.log(`✅ Killed process ${pid} on port ${port}`);
            } catch (error) {
              console.log(`⚠️  Failed to kill process ${pid}: ${error}`);
            }
          }
        }
      } else {
        console.log(`✅ Port ${port} is free`);
      }
    } catch (error) {
      // No processes found on this port
      console.log(`✅ Port ${port} is free`);
    }
  }
}

/**
 * Clear test artifacts and temporary files
 */
async function clearTestArtifacts() {
  console.log('🧹 Clearing test artifacts...');
  
  const artifactsToClear = [
    'test-results',
    'playwright-report',
    '.next',
    'node_modules/.cache'
  ];
  
  for (const artifact of artifactsToClear) {
    try {
      await execAsync(`rm -rf ${artifact}`);
      console.log(`✅ Cleared ${artifact}`);
    } catch (error) {
      console.log(`⚠️  Could not clear ${artifact}: ${error}`);
    }
  }
}

/**
 * Verify test environment is ready
 */
async function verifyTestEnvironment() {
  console.log('🔍 Verifying test environment...');
  
  // Check if npm is available
  try {
    await execAsync('npm --version');
    console.log('✅ npm is available');
  } catch (error) {
    throw new Error('npm is not available');
  }
  
  // Check if node_modules exists
  try {
    await execAsync('ls node_modules');
    console.log('✅ node_modules exists');
  } catch (error) {
    console.log('⚠️  node_modules not found, running npm install...');
    await execAsync('npm install');
  }
  
  // Check if package.json has required scripts
  try {
    const { stdout } = await execAsync('npm run');
    if (!stdout.includes('dev:test')) {
      throw new Error('dev:test script not found in package.json');
    }
    console.log('✅ Required npm scripts are available');
  } catch (error) {
    throw new Error(`npm scripts check failed: ${error}`);
  }
  
  // Verify test ports are available
  console.log('🔍 Verifying test ports are available...');
  await verifyPortsAvailable([3002]);
}

/**
 * Verify that ports are available for testing
 */
async function verifyPortsAvailable(ports: number[]) {
  for (const port of ports) {
    try {
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      if (stdout.trim()) {
        console.log(`⚠️  Port ${port} is still in use after cleanup attempt`);
        console.log(stdout);
      } else {
        console.log(`✅ Port ${port} is available for testing`);
      }
    } catch (error) {
      console.log(`✅ Port ${port} is available for testing`);
    }
  }
}

export default globalSetup; 