/**
 * Test Utilities - Loop detection and timeout helpers for state tests
 */

export interface LoopDetectionOptions {
  maxIterations?: number
  timeoutMs?: number
  debugMode?: boolean
}

export interface LoopDetectionResult {
  completed: boolean
  iterations: number
  timeElapsed: number
  timedOut: boolean
  loopDetected: boolean
  error?: Error
}

/**
 * Execute function with loop detection and timeout protection
 */
export async function executeWithLoopDetection<T>(
  fn: () => T | Promise<T>,
  options: LoopDetectionOptions = {}
): Promise<{ result: T | null; detection: LoopDetectionResult }> {
  const {
    maxIterations = 1000,
    timeoutMs = 5000,
    debugMode = false
  } = options

  const startTime = Date.now()
  let iterations = 0
  let result: T | null = null
  let error: Error | undefined

  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`))
    }, timeoutMs)
  })

  try {
    // Race between execution and timeout
    result = await Promise.race([
      Promise.resolve(fn()),
      timeoutPromise
    ])
    
    iterations = 1 // Single execution completed
  } catch (err) {
    error = err instanceof Error ? err : new Error(String(err))
    
    if (debugMode) {
      console.warn('Loop detection caught error:', error.message)
    }
  }

  const timeElapsed = Date.now() - startTime
  const timedOut = error?.message.includes('timed out') || false
  
  return {
    result,
    detection: {
      completed: !error && result !== null,
      iterations,
      timeElapsed,
      timedOut,
      loopDetected: false, // Single execution can't loop
      error
    }
  }
}

/**
 * Execute iterative function with loop detection
 */
export async function executeIterativeWithLoopDetection<T>(
  fn: (iteration: number) => T | Promise<T>,
  condition: (result: T) => boolean,
  options: LoopDetectionOptions = {}
): Promise<{ result: T | null; detection: LoopDetectionResult }> {
  const {
    maxIterations = 1000,
    timeoutMs = 10000,
    debugMode = false
  } = options

  const startTime = Date.now()
  let iterations = 0
  let result: T | null = null
  let error: Error | undefined
  let loopDetected = false

  try {
    while (iterations < maxIterations) {
      // Check timeout
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(`Operation timed out after ${timeoutMs}ms at iteration ${iterations}`)
      }

      // Execute iteration
      result = await fn(iterations)
      iterations++

      if (debugMode && iterations % 100 === 0) {
        console.log(`Loop detection: iteration ${iterations}, elapsed ${Date.now() - startTime}ms`)
      }

      // Check completion condition
      if (condition(result)) {
        break
      }

      // Simple loop detection - if we've exceeded reasonable iterations
      if (iterations >= maxIterations) {
        loopDetected = true
        throw new Error(`Potential infinite loop detected after ${iterations} iterations`)
      }
    }
  } catch (err) {
    error = err instanceof Error ? err : new Error(String(err))
    
    if (debugMode) {
      console.warn('Iterative loop detection caught error:', error.message)
    }
  }

  const timeElapsed = Date.now() - startTime
  const timedOut = error?.message.includes('timed out') || false
  
  return {
    result,
    detection: {
      completed: !error && result !== null,
      iterations,
      timeElapsed,
      timedOut,
      loopDetected,
      error
    }
  }
}

/**
 * State change monitoring utility
 */
export class StateChangeMonitor {
  private changes: Array<{ timestamp: number; state: any }> = []
  private maxHistory = 50

  recordChange(state: any): void {
    this.changes.push({
      timestamp: Date.now(),
      state: JSON.parse(JSON.stringify(state)) // Deep clone
    })

    // Keep only recent changes
    if (this.changes.length > this.maxHistory) {
      this.changes.shift()
    }
  }

  detectRapidChanges(windowMs: number = 1000): {
    hasRapidChanges: boolean
    changesInWindow: number
    suspiciousPatterns: string[]
  } {
    const now = Date.now()
    const recentChanges = this.changes.filter(change => 
      now - change.timestamp < windowMs
    )

    const changesInWindow = recentChanges.length
    const suspiciousPatterns: string[] = []

    // Check for rapid fire changes (>10 in 1 second)
    if (changesInWindow > 10) {
      suspiciousPatterns.push(`${changesInWindow} changes in ${windowMs}ms`)
    }

    // Check for oscillating values - improved detection
    if (recentChanges.length >= 4) {
      const values = recentChanges.map(c => JSON.stringify(c.state))
      const uniqueValues = new Set(values)
      
      // Simple oscillation: A-B-A-B pattern
      if (uniqueValues.size === 2) {
        const [valueA, valueB] = Array.from(uniqueValues)
        let oscillations = 0
        
        for (let i = 1; i < values.length; i++) {
          if (values[i] !== values[i-1]) {
            oscillations++
          }
        }
        
        // If more than half the changes are oscillations, it's suspicious
        if (oscillations >= Math.floor(values.length / 2)) {
          suspiciousPatterns.push('Oscillating between two states')
        }
      }
      
      // Repetitive pattern detection
      if (uniqueValues.size <= 3 && recentChanges.length > uniqueValues.size * 3) {
        suspiciousPatterns.push(`Repetitive pattern detected (${uniqueValues.size} unique states in ${recentChanges.length} changes)`)
      }
    }

    return {
      hasRapidChanges: changesInWindow > 10,
      changesInWindow,
      suspiciousPatterns
    }
  }

  getChangeHistory(): Array<{ timestamp: number; state: any }> {
    return [...this.changes]
  }

  clear(): void {
    this.changes = []
  }
}

/**
 * React useEffect loop detection hook (for testing)
 */
export function createUseEffectMonitor() {
  const effectCalls = new Map<string, number>()
  const suspiciousEffects = new Set<string>()

  return {
    trackEffect(effectId: string): void {
      const currentCount = effectCalls.get(effectId) || 0
      const newCount = currentCount + 1
      effectCalls.set(effectId, newCount)

      // Flag as suspicious if called more than 20 times
      if (newCount > 20) {
        suspiciousEffects.add(effectId)
        console.warn(`Suspicious useEffect: ${effectId} called ${newCount} times`)
      }
    },

    getSuspiciousEffects(): string[] {
      return Array.from(suspiciousEffects)
    },

    getEffectCounts(): Map<string, number> {
      return new Map(effectCalls)
    },

    reset(): void {
      effectCalls.clear()
      suspiciousEffects.clear()
    }
  }
}

/**
 * Jest test wrapper with automatic timeout and loop detection
 */
export function testWithLoopDetection(
  testName: string,
  testFn: () => void | Promise<void>,
  timeoutMs: number = 15000
) {
  return test(testName, async () => {
    const monitor = new StateChangeMonitor()
    const effectMonitor = createUseEffectMonitor()

    // Add to global for components to use
    ;(global as any).__TEST_STATE_MONITOR__ = monitor
    ;(global as any).__TEST_EFFECT_MONITOR__ = effectMonitor

    try {
      const { result, detection } = await executeWithLoopDetection(
        () => testFn(),
        { timeoutMs, debugMode: true }
      )

      // Check for suspicious patterns
      const rapidChanges = monitor.detectRapidChanges()
      const suspiciousEffects = effectMonitor.getSuspiciousEffects()

      if (rapidChanges.hasRapidChanges) {
        console.warn(`Test "${testName}" had rapid state changes:`, rapidChanges)
      }

      if (suspiciousEffects.length > 0) {
        console.warn(`Test "${testName}" had suspicious useEffect calls:`, suspiciousEffects)
      }

      if (detection.timedOut) {
        throw new Error(`Test "${testName}" timed out after ${detection.timeElapsed}ms`)
      }

      if (detection.error) {
        throw detection.error
      }

    } finally {
      // Cleanup
      delete (global as any).__TEST_STATE_MONITOR__
      delete (global as any).__TEST_EFFECT_MONITOR__
    }
  }, timeoutMs + 1000) // Add buffer to Jest timeout
}

/**
 * Utility to add loop detection to existing Jest tests
 */
export function wrapExistingTest(
  originalTest: jest.It,
  defaultTimeout: number = 15000
) {
  return (name: string, fn?: jest.ProvidesCallback, timeout?: number) => {
    return originalTest(name, fn, timeout || defaultTimeout)
  }
}
