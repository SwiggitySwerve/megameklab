/**
 * WeightBalanceService - Legacy compatibility layer
 * 
 * This file now serves as a compatibility layer that exports the new modular
 * weight balance system while maintaining the same interface for existing code.
 * 
 * The original monolithic service has been broken down into focused modules:
 * - WeightCalculationService: Core weight calculations
 * - BalanceAnalysisService: Weight distribution and stability
 * - OptimizationService: Suggestions and weight reduction
 * - ValidationService: Tonnage and constraint validation
 * - ArmorEfficiencyService: Specialized armor calculations
 * 
 * @see ./weight-balance/ for the modular implementation
 */

// Re-export types and interfaces
export type * from './weight-balance/types';

// Import the main exports for backward compatibility
import { 
  WeightBalanceService, 
  WeightBalanceServiceImpl, 
  createWeightBalanceService 
} from './weight-balance';

// Export for backward compatibility
export { WeightBalanceService, WeightBalanceServiceImpl, createWeightBalanceService };

// Default export maintains compatibility
export default WeightBalanceServiceImpl;
