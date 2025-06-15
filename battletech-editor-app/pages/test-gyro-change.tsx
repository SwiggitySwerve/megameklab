import React, { useEffect, useState } from 'react';
import { testGyroChangeScenario } from '../utils/testCriticalSlotRebuild';

export default function TestGyroChange() {
  const [testResult, setTestResult] = useState<string>('');
  
  useEffect(() => {
    // Capture console output
    const originalLog = console.log;
    let output = '';
    
    console.log = (...args) => {
      output += args.join(' ') + '\n';
      originalLog(...args);
    };
    
    // Run the test
    testGyroChangeScenario();
    
    // Restore console.log and set result
    console.log = originalLog;
    setTestResult(output);
  }, []);
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Test Gyro Change: Standard → XL</h1>
      <pre style={{ 
        background: '#f0f0f0', 
        padding: '20px', 
        borderRadius: '5px',
        whiteSpace: 'pre-wrap'
      }}>
        {testResult}
      </pre>
    </div>
  );
}
