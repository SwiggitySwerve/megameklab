import { FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Global teardown for Playwright tests
 * Cleans up test artifacts and processes
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...');
  
  // Kill any remaining test processes
  await killTestProcesses();
  
  // Clean up test artifacts
  await cleanupTestArtifacts();
  
  // Generate test report
  await generateTestReport();
  
  console.log('✅ Global teardown completed');
}

/**
 * Kill any remaining test-related processes
 */
async function killTestProcesses() {
  console.log('🔍 Cleaning up test processes...');
  
  try {
    // Kill any Node.js processes that might be running our dev server
    const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV');
    
    if (stdout.includes('node.exe')) {
      console.log('⚠️  Found Node.js processes, killing them...');
      await execAsync('taskkill /IM node.exe /F');
      console.log('✅ Killed Node.js processes');
    } else {
      console.log('✅ No Node.js processes found');
    }
  } catch (error) {
    console.log('⚠️  Could not check for Node.js processes:', error);
  }
  
  // Kill processes on test ports
  await killProcessesOnPorts([3000, 3001, 3002, 8888]);
}

/**
 * Kill processes using specified ports
 */
async function killProcessesOnPorts(ports: number[]) {
  for (const port of ports) {
    try {
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      
      if (stdout.trim()) {
        console.log(`⚠️  Found processes using port ${port}, killing them...`);
        
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
      }
    } catch (error) {
      // No processes found on this port
    }
  }
}

/**
 * Clean up test artifacts
 */
async function cleanupTestArtifacts() {
  console.log('🧹 Cleaning up test artifacts...');
  
  const artifactsToClean = [
    'test-results/tmp',
    'test-results/.cache',
    'playwright-report/.cache'
  ];
  
  for (const artifact of artifactsToClean) {
    try {
      await execAsync(`rm -rf ${artifact}`);
      console.log(`✅ Cleaned ${artifact}`);
    } catch (error) {
      // Ignore errors for optional cleanup
    }
  }
}

/**
 * Generate test report summary
 */
async function generateTestReport() {
  console.log('📊 Generating test report...');
  
  try {
    // Check if test results exist
    const { stdout } = await execAsync('ls test-results/results.json 2>/dev/null || echo "no-results"');
    
    if (!stdout.includes('no-results')) {
      console.log('✅ Test results found');
      
      // Generate HTML report if not already present
      try {
        await execAsync('npx playwright show-report --host 0.0.0.0 --port 9323');
        console.log('✅ Test report available at http://localhost:9323');
      } catch (error) {
        console.log('⚠️  Could not start report server:', error);
      }
    } else {
      console.log('⚠️  No test results found');
    }
  } catch (error) {
    console.log('⚠️  Could not generate test report:', error);
  }
}

export default globalTeardown; 