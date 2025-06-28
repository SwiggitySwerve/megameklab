/**
 * Equipment Browser Controller - Facade coordinating all equipment browser services
 * Single responsibility for coordination and state management
 * Following SOLID principles - Facade pattern and Dependency Inversion
 */

import {
  IEquipmentBrowserController,
  IEquipmentDataService,
  IEquipmentFilterService,
  IEquipmentSortService,
  IEquipmentPaginationService,
  EquipmentVariant,
  EquipmentFilters,
  EquipmentSort,
  PaginationConfig,
  EquipmentBrowserConfig,
  EquipmentBrowserResult,
  DEFAULT_EQUIPMENT_BROWSER_CONFIG
} from './EquipmentBrowserTypes';
import { EquipmentObject } from '../criticalSlots/CriticalSlot';
import { EquipmentDataService } from './EquipmentDataService';
import { EquipmentFilterService } from './EquipmentFilterService';
import { EquipmentSortService } from './EquipmentSortService';
import { EquipmentPaginationService } from './EquipmentPaginationService';

export class EquipmentBrowserController implements IEquipmentBrowserController {
  
  private dataService: IEquipmentDataService;
  private filterService: IEquipmentFilterService;
  private sortService: IEquipmentSortService;
  private paginationService: IEquipmentPaginationService;
  
  private config: EquipmentBrowserConfig;
  private allEquipment: EquipmentVariant[] = [];
  private isInitialized = false;

  constructor(dependencies?: {
    dataService?: IEquipmentDataService;
    filterService?: IEquipmentFilterService;
    sortService?: IEquipmentSortService;
    paginationService?: IEquipmentPaginationService;
  }) {
    // Initialize services with dependency injection support
    this.dataService = dependencies?.dataService || new EquipmentDataService();
    this.filterService = dependencies?.filterService || new EquipmentFilterService();
    this.sortService = dependencies?.sortService || new EquipmentSortService();
    this.paginationService = dependencies?.paginationService || new EquipmentPaginationService();
    
    // Initialize with default configuration
    this.config = { ...DEFAULT_EQUIPMENT_BROWSER_CONFIG };
    
    console.log('[EquipmentBrowserController] Initialized with services:', {
      dataService: !!this.dataService,
      filterService: !!this.filterService,
      sortService: !!this.sortService,
      paginationService: !!this.paginationService
    });
  }

  /**
   * Initialize the controller and load data
   */
  async initialize(): Promise<void> {
    console.log('[EquipmentBrowserController] Initializing controller');
    
    if (this.isInitialized) {
      console.log('[EquipmentBrowserController] Already initialized');
      return;
    }

    try {
      // Load all equipment data
      this.allEquipment = await this.dataService.loadAllEquipment();
      this.isInitialized = true;
      
      console.log(`[EquipmentBrowserController] Initialization complete: ${this.allEquipment.length} equipment variants loaded`);
    } catch (error) {
      console.error('[EquipmentBrowserController] Initialization failed:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Get equipment with current configuration
   */
  async getEquipment(): Promise<EquipmentBrowserResult> {
    console.log('[EquipmentBrowserController] Getting equipment with current config');
    
    if (!this.isInitialized) {
      console.log('[EquipmentBrowserController] Not initialized, initializing now...');
      await this.initialize();
    }

    try {
      // Apply filters
      const filteredEquipment = this.filterService.applyFilters(this.allEquipment, this.config.filters);
      
      // Apply sorting
      const sortedEquipment = this.sortService.sortEquipment(filteredEquipment, this.config.sort);
      
      // Apply pagination
      const paginatedResult = this.paginationService.paginate(sortedEquipment, this.config.pagination);
      
      // Get categories and tech bases
      const categories = this.dataService.getCategories();
      const techBases = this.dataService.getTechBases();
      
      const result: EquipmentBrowserResult = {
        equipment: paginatedResult,
        categories,
        techBases,
        config: { ...this.config } // Return copy to prevent mutation
      };
      
      console.log(`[EquipmentBrowserController] Returning ${paginatedResult.items.length} items on page ${paginatedResult.currentPage}/${paginatedResult.totalPages}`);
      return result;
      
    } catch (error) {
      console.error('[EquipmentBrowserController] Error getting equipment:', error);
      throw error;
    }
  }

  /**
   * Update filters and return new results
   */
  async setFilters(filters: Partial<EquipmentFilters>): Promise<EquipmentBrowserResult> {
    console.log('[EquipmentBrowserController] Setting filters:', filters);
    
    // Update configuration
    this.config.filters = { ...this.config.filters, ...filters };
    
    // Reset to first page when filters change
    this.config.pagination.currentPage = 1;
    
    return this.getEquipment();
  }

  /**
   * Update sort configuration and return new results
   */
  async setSort(sort: Partial<EquipmentSort>): Promise<EquipmentBrowserResult> {
    console.log('[EquipmentBrowserController] Setting sort:', sort);
    
    // Update configuration
    this.config.sort = { ...this.config.sort, ...sort };
    
    // Reset to first page when sort changes
    this.config.pagination.currentPage = 1;
    
    return this.getEquipment();
  }

  /**
   * Update pagination and return new results
   */
  async setPagination(pagination: Partial<PaginationConfig>): Promise<EquipmentBrowserResult> {
    console.log('[EquipmentBrowserController] Setting pagination:', pagination);
    
    // Update configuration
    this.config.pagination = { ...this.config.pagination, ...pagination };
    
    return this.getEquipment();
  }

  /**
   * Reset all filters to defaults and return new results
   */
  async resetFilters(): Promise<EquipmentBrowserResult> {
    console.log('[EquipmentBrowserController] Resetting filters to defaults');
    
    // Reset configuration to defaults
    this.config = { ...DEFAULT_EQUIPMENT_BROWSER_CONFIG };
    
    return this.getEquipment();
  }

  /**
   * Get equipment variant by ID
   */
  getEquipmentById(id: string): EquipmentVariant | null {
    return this.dataService.getEquipmentById(id);
  }

  /**
   * Convert equipment variant to equipment object for allocation
   */
  convertToEquipmentObject(variant: EquipmentVariant): EquipmentObject {
    return this.dataService.convertToEquipmentObject(variant);
  }

  /**
   * Check if controller is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.dataService.isReady();
  }

  /**
   * Get current configuration
   */
  getConfig(): EquipmentBrowserConfig {
    return { ...this.config }; // Return copy to prevent mutation
  }

  /**
   * Set complete configuration
   */
  async setConfig(config: Partial<EquipmentBrowserConfig>): Promise<EquipmentBrowserResult> {
    console.log('[EquipmentBrowserController] Setting complete config:', config);
    
    if (config.filters) {
      this.config.filters = { ...this.config.filters, ...config.filters };
    }
    
    if (config.sort) {
      this.config.sort = { ...this.config.sort, ...config.sort };
    }
    
    if (config.pagination) {
      this.config.pagination = { ...this.config.pagination, ...config.pagination };
    }
    
    return this.getEquipment();
  }

  /**
   * Get filter statistics
   */
  async getFilterStats(): Promise<{
    totalItems: number;
    filteredItems: number;
    filterPercentage: number;
    categoryCounts: Record<string, number>;
    techBaseCounts: Record<string, number>;
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const filteredEquipment = this.filterService.applyFilters(this.allEquipment, this.config.filters);
    
    return this.filterService.getFilterStats(this.allEquipment, filteredEquipment);
  }

  /**
   * Search for equipment with suggestions
   */
  getFilterSuggestions(searchTerm: string, maxSuggestions: number = 10): {
    names: string[];
    categories: string[];
    techBases: string[];
  } {
    if (!this.isInitialized) {
      return { names: [], categories: [], techBases: [] };
    }

    return this.filterService.getFilterSuggestions(this.allEquipment, searchTerm, maxSuggestions);
  }

  /**
   * Get service instances for advanced usage
   */
  getDataService(): IEquipmentDataService {
    return this.dataService;
  }

  getFilterService(): IEquipmentFilterService {
    return this.filterService;
  }

  getSortService(): IEquipmentSortService {
    return this.sortService;
  }

  getPaginationService(): IEquipmentPaginationService {
    return this.paginationService;
  }

  /**
   * Clear all cached data and reinitialize
   */
  async refresh(): Promise<void> {
    console.log('[EquipmentBrowserController] Refreshing data');
    
    // Clear data service cache if available
    if ('clearCache' in this.dataService && typeof this.dataService.clearCache === 'function') {
      this.dataService.clearCache();
    }
    
    // Reset initialization state
    this.isInitialized = false;
    this.allEquipment = [];
    
    // Reinitialize
    await this.initialize();
  }
}

// Singleton instance for global use
let globalEquipmentBrowserController: EquipmentBrowserController | null = null;

/**
 * Get or create global equipment browser controller instance
 */
export function getEquipmentBrowserController(): EquipmentBrowserController {
  if (!globalEquipmentBrowserController) {
    globalEquipmentBrowserController = new EquipmentBrowserController();
  }
  return globalEquipmentBrowserController;
}

/**
 * Initialize global equipment browser controller with specific services
 */
export function initializeEquipmentBrowserController(dependencies: {
  dataService?: IEquipmentDataService;
  filterService?: IEquipmentFilterService;
  sortService?: IEquipmentSortService;
  paginationService?: IEquipmentPaginationService;
}): EquipmentBrowserController {
  globalEquipmentBrowserController = new EquipmentBrowserController(dependencies);
  return globalEquipmentBrowserController;
}

/**
 * Reset global equipment browser controller (for testing)
 */
export function resetEquipmentBrowserController(): void {
  globalEquipmentBrowserController = null;
}
