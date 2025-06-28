/**
 * Movement Calculations - Shared utility for consistent movement display across all components
 * Handles enhancement effects and ensures consistent formatting with proper spacing
 */

export interface MovementDisplay {
  walkDisplay: string;
  runDisplay: string;
  jumpDisplay: string;
  combinedDisplay: string; // "4 / 6 / 0" format with spaces
  walkValue: number;
  runValue: number;
  jumpValue: number;
}

export interface UnitConfiguration {
  walkMP: number;
  runMP: number;
  jumpMP?: number;
  enhancementType?: 'MASC' | 'Triple Strength Myomer' | null;
}

/**
 * Calculate enhanced movement with proper display formatting
 * @param config Unit configuration containing movement and enhancement data
 * @returns MovementDisplay object with all formatted strings and raw values
 */
export function calculateEnhancedMovement(config: UnitConfiguration): MovementDisplay {
  const baseWalkMP = config.walkMP;
  const baseRunMP = Math.floor(baseWalkMP * 1.5); // Standard BattleTech calculation
  const jumpMP = config.jumpMP || 0;
  
  let walkDisplay: string;
  let runDisplay: string;
  let walkValue = baseWalkMP;
  let runValue = baseRunMP;
  
  if (config.enhancementType === 'Triple Strength Myomer') {
    // TSM: +1 Walk MP at 9+ heat, Run MP = (Walk + 1) × 1.5 rounded up
    const enhancedWalkMP = baseWalkMP + 1;
    const enhancedRunMP = Math.ceil(enhancedWalkMP * 1.5);
    
    walkDisplay = `${baseWalkMP} [${enhancedWalkMP}]`;
    runDisplay = `${baseRunMP} [${enhancedRunMP}]`;
    // Keep base values for data model consistency
    walkValue = baseWalkMP;
    runValue = baseRunMP;
    
  } else if (config.enhancementType === 'MASC') {
    // MASC: Run MP = Walk MP × 2 when active
    const mascRunMP = baseWalkMP * 2;
    
    walkDisplay = `${baseWalkMP}`;
    runDisplay = `${baseRunMP} [${mascRunMP}]`;
    walkValue = baseWalkMP;
    runValue = baseRunMP;
    
  } else {
    // No enhancement
    walkDisplay = `${baseWalkMP}`;
    runDisplay = `${baseRunMP}`;
    walkValue = baseWalkMP;
    runValue = baseRunMP;
  }
  
  const jumpDisplay = `${jumpMP}`;
  
  // Combined display with proper spacing around slash delimiters
  const combinedDisplay = `${walkDisplay} / ${runDisplay} / ${jumpDisplay}`;
  
  return {
    walkDisplay,
    runDisplay,
    jumpDisplay,
    combinedDisplay,
    walkValue,
    runValue,
    jumpValue: jumpMP
  };
}

/**
 * Format movement for engine info display
 * @param walkMP Walk movement points
 * @param runMP Run movement points (base, without enhancements)
 * @param maxWalkMP Maximum possible walk MP for this tonnage
 * @returns Formatted string for engine section
 */
export function formatEngineMovementInfo(walkMP: number, runMP: number, maxWalkMP: number): string {
  return `Walk: ${walkMP} MP | Run: ${runMP} MP | Max: ${maxWalkMP} MP`;
}

/**
 * Get individual movement values with enhancement calculations
 * @param config Unit configuration
 * @returns Object with all movement values including enhanced values
 */
export function getMovementValues(config: UnitConfiguration) {
  const movement = calculateEnhancedMovement(config);
  
  return {
    base: {
      walk: movement.walkValue,
      run: movement.runValue,
      jump: movement.jumpValue
    },
    enhanced: config.enhancementType ? {
      walk: config.enhancementType === 'Triple Strength Myomer' ? movement.walkValue + 2 : movement.walkValue,
      run: config.enhancementType === 'MASC' 
        ? movement.walkValue * 2 
        : config.enhancementType === 'Triple Strength Myomer' 
          ? Math.ceil((movement.walkValue + 2) * 1.5)
          : movement.runValue,
      jump: movement.jumpValue
    } : null,
    display: movement
  };
}

/**
 * Format condensed movement display for top bar
 * Returns format: "walk / run [maxWalk] / jump"
 * @param config Unit configuration containing movement and enhancement data
 * @param tonnage Unit tonnage for max walk calculation
 * @returns Condensed movement string like "4 / 6 [8] / 0" or "4 [5] / 6 [8] / 0" with TSM
 */
export function formatCondensedMovement(config: UnitConfiguration, tonnage: number): string {
  const maxWalkMP = Math.floor(400 / tonnage);
  const jumpMP = config.jumpMP || 0;
  
  if (config.enhancementType === 'Triple Strength Myomer') {
    // TSM: show enhanced values in brackets, no separate maxWalk
    const enhancedWalkMP = config.walkMP + 1;
    const enhancedRunMP = Math.ceil(enhancedWalkMP * 1.5);
    
    return `${config.walkMP} [${enhancedWalkMP}] / ${config.runMP} [${enhancedRunMP}] / ${jumpMP}`;
  } else if (config.enhancementType === 'MASC') {
    // MASC: enhanced run replaces maxWalk position
    const enhancedRunMP = config.walkMP * 2;
    
    return `${config.walkMP} / ${config.runMP} [${enhancedRunMP}] / ${jumpMP}`;
  } else {
    // No enhancement: show maxWalk in brackets
    return `${config.walkMP} / ${config.runMP} [${maxWalkMP}] / ${jumpMP}`;
  }
}
