/**
 * Equipment and State Management Interfaces for BattleTech Editor
 * 
 * Comprehensive interfaces for equipment, unit configuration, and state management
 * that provide complete type safety and eliminate the need for "as any" casting.
 * 
 * These interfaces enable proper SOLID refactoring by providing:
 * - Clear separation of concerns
 * - Dependency injection ready interfaces
 * - Type-safe state management
 * - Equipment management with full type coverage
 */

import {
  IIdentifiable,
  INamed,
  IDescribable,
  ITechBased,
  IRulesLeveled,
  IWeighted,
  ISlotted,
  ILocationRestricted,
  IEquipmentConfiguration,
  IRangeProfile,
  IService,
  IObservableService,
  IObserver,
  IObservable,
  EntityId,
  TechBase,
  RulesLevel,
  Severity,
  Priority,
  Result
} from './BaseTypes';

// ===== EQUIPMENT DEFINITION INTERFACES =====

/**
 * Core equipment interface - all equipment inherits from this
 */
export interface IEquipment extends IEquipmentConfiguration {
  readonly introductionYear: number;
  readonly extinctionYear?: number;
  readonly reintroductionYear?: number;
  readonly sourceBook?: string;
  readonly pageReference?: string;
  readonly battleValue?: number;
  readonly cost?: number;
  readonly availability?: IAvailabilityRating;
  readonly special?: string[];
  readonly variants?: IEquipmentVariant[];
}

/**
 * Availability rating for equipment
 */
export interface IAvailabilityRating {
  readonly rating: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'X';
  readonly era: string;
  readonly faction?: string;
  readonly notes?: string;
}

/**
 * Equipment variant (tech base specific)
 */
export interface IEquipmentVariant {
  readonly techBase: TechBase;
  readonly weight: number;
  readonly slots: number;
  readonly cost?: number;
  readonly battleValue?: number;
  readonly modifiers?: IEquipmentModifier[];
}

/**
 * Equipment modifier
 */
export interface IEquipmentModifier {
  readonly type: 'damage' | 'range' | 'heat' | 'accuracy' | 'special';
  readonly value: number;
  readonly description: string;
  readonly conditions?: string[];
}

/**
 * Weapon-specific interface
 */
export interface IWeapon extends IEquipment {
  readonly weaponType: IWeaponType;
  readonly damage: number | IDamageProfile;
  readonly range: IRangeProfile;
  readonly heatGeneration: number;
  readonly ammunition?: IAmmoRequirement[];
  readonly firingModes?: IFiringMode[];
  readonly mountingRestrictions?: IMountingRestriction[];
}

/**
 * Weapon type classification
 */
export interface IWeaponType {
  readonly category: 'energy' | 'ballistic' | 'missile' | 'physical' | 'artillery' | 'capital';
  readonly subCategory: string;
  readonly technology: 'standard' | 'advanced' | 'experimental' | 'prototype';
  readonly directFire: boolean;
  readonly areaEffect: boolean;
}

/**
 * Damage profile for complex weapons
 */
export interface IDamageProfile {
  readonly primary: number;
  readonly secondary?: number;
  readonly minimum?: number;
  readonly clustering?: number;
  readonly special?: IDamageSpecial[];
}

/**
 * Special damage properties
 */
export interface IDamageSpecial {
  readonly type: 'heat' | 'stun' | 'knockdown' | 'critical' | 'explosive';
  readonly value: number;
  readonly probability?: number;
  readonly conditions?: string[];
}

/**
 * Ammunition requirement
 */
export interface IAmmoRequirement {
  readonly ammoType: string;
  readonly shotsPerTon: number;
  readonly required: boolean;
  readonly alternatives?: string[];
}

/**
 * Firing mode
 */
export interface IFiringMode {
  readonly name: string;
  readonly damage: number;
  readonly range: IRangeProfile;
  readonly heat: number;
  readonly ammunition?: number;
  readonly special?: string[];
}

/**
 * Mounting restriction
 */
export interface IMountingRestriction {
  readonly type: 'location' | 'orientation' | 'adjacency' | 'special';
  readonly description: string;
  readonly allowedLocations?: string[];
  readonly forbiddenLocations?: string[];
  readonly requiredSupport?: string[];
}

/**
 * Ammunition interface
 */
export interface IAmmunition extends IEquipment {
  readonly ammoType: string;
  readonly compatibleWeapons: string[];
  readonly shotsPerTon: number;
  readonly specialMunitions?: ISpecialMunition[];
  readonly explosive: boolean;
  readonly caseRequired?: boolean;
}

/**
 * Special munition types
 */
export interface ISpecialMunition {
  readonly name: string;
  readonly effect: string;
  readonly damage?: number;
  readonly range?: IRangeProfile;
  readonly heat?: number;
  readonly cost?: number;
  readonly availability?: IAvailabilityRating;
}

/**
 * Heat management equipment
 */
export interface IHeatManagementEquipment extends IEquipment {
  readonly heatDissipation?: number;
  readonly heatReduction?: number;
  readonly coolingBonus?: number;
  readonly heatThreshold?: number;
  readonly engineIntegration?: boolean;
}

/**
 * Movement equipment
 */
export interface IMovementEquipment extends IEquipment {
  readonly movementBonus?: IMovementBonus;
  readonly jumpCapacity?: number;
  readonly speedMultiplier?: number;
  readonly maneuverabilityBonus?: number;
  readonly terrainModification?: ITerrainModification[];
}

/**
 * Movement bonus
 */
export interface IMovementBonus {
  readonly walkBonus: number;
  readonly runBonus: number;
  readonly jumpBonus: number;
  readonly conditions?: string[];
}

/**
 * Terrain modification
 */
export interface ITerrainModification {
  readonly terrainType: string;
  readonly movementModifier: number;
  readonly description: string;
}

/**
 * Electronic warfare equipment
 */
export interface IElectronicWarfareEquipment extends IEquipment {
  readonly ecmStrength?: number;
  readonly eccmStrength?: number;
  readonly sensorRange?: number;
  readonly jamming?: IJammingCapability[];
  readonly detection?: IDetectionCapability[];
}

/**
 * Jamming capability
 */
export interface IJammingCapability {
  readonly targetType: string;
  readonly effectiveness: number;
  readonly range: number;
  readonly powerRequirement: number;
}

/**
 * Detection capability
 */
export interface IDetectionCapability {
  readonly targetType: string;
  readonly range: number;
  readonly accuracy: number;
  readonly conditions?: string[];
}

// ===== EQUIPMENT ALLOCATION AND MANAGEMENT =====

/**
 * Equipment allocation in a unit
 */
export interface IEquipmentInstance {
  readonly id: EntityId;
  readonly equipmentId: EntityId;
  readonly equipment: IEquipment;
  readonly location: string;
  readonly slotIndex: number;
  readonly quantity: number;
  readonly facing?: string;
  readonly linkedEquipment?: EntityId[];
  readonly status: IEquipmentStatus;
  readonly configuration?: IEquipmentInstanceConfiguration;
}

/**
 * Equipment status
 */
export interface IEquipmentStatus {
  readonly operational: boolean;
  readonly damaged: boolean;
  readonly destroyed: boolean;
  readonly criticalHits: number;
  readonly jammedTurns?: number;
  readonly overheated?: boolean;
  readonly ammunition?: number;
}

/**
 * Equipment instance configuration
 */
export interface IEquipmentInstanceConfiguration {
  readonly firingMode?: string;
  readonly ammunition?: string;
  readonly linkingMode?: string;
  readonly customSettings?: Record<string, any>;
}

/**
 * Equipment group (for linked weapons)
 */
export interface IEquipmentGroup {
  readonly id: EntityId;
  readonly name: string;
  readonly type: 'weapon_group' | 'linked_systems' | 'ammunition_feed';
  readonly equipment: EntityId[];
  readonly firingSequence?: IFiringSequence[];
  readonly shared: ISharedResource[];
}

/**
 * Firing sequence for weapon groups
 */
export interface IFiringSequence {
  readonly equipmentId: EntityId;
  readonly order: number;
  readonly delay?: number;
  readonly conditions?: string[];
}

/**
 * Shared resource
 */
export interface ISharedResource {
  readonly resourceType: 'ammunition' | 'power' | 'cooling' | 'targeting';
  readonly capacity: number;
  readonly allocation: Record<EntityId, number>;
}

// ===== UNIT CONFIGURATION INTERFACES =====

/**
 * Complete unit configuration
 */
export interface ICompleteUnitConfiguration {
  readonly id: EntityId;
  readonly name: string;
  readonly chassis: string;
  readonly model: string;
  readonly techBase: TechBase;
  readonly rulesLevel: RulesLevel;
  readonly era: string;
  readonly tonnage: number;
  readonly structure: IStructureConfiguration;
  readonly engine: IEngineConfiguration;
  readonly gyro: IGyroConfiguration;
  readonly cockpit: ICockpitConfiguration;
  readonly armor: IArmorConfiguration;
  readonly heatSinks: IHeatSinkConfiguration;
  readonly jumpJets: IJumpJetConfiguration;
  readonly enhancement: IEnhancementConfiguration;
  readonly equipment: IEquipmentInstance[];
  readonly groups: IEquipmentGroup[];
  readonly metadata: IUnitMetadata;
}

/**
 * Structure configuration
 */
export interface IStructureConfiguration {
  readonly type: string;
  readonly techBase: TechBase;
  readonly weight: number;
  readonly slots: number;
  readonly internalStructure: IInternalStructure;
  readonly features?: string[];
}

/**
 * Internal structure points by location
 */
export interface IInternalStructure {
  readonly head: number;
  readonly centerTorso: number;
  readonly leftTorso: number;
  readonly rightTorso: number;
  readonly leftArm: number;
  readonly rightArm: number;
  readonly leftLeg: number;
  readonly rightLeg: number;
}

/**
 * Engine configuration
 */
export interface IEngineConfiguration {
  readonly type: string;
  readonly rating: number;
  readonly techBase: TechBase;
  readonly weight: number;
  readonly slots: IEngineSlots;
  readonly heatSinks: number;
  readonly shielding?: number;
  readonly features?: string[];
}

/**
 * Engine slots by location
 */
export interface IEngineSlots {
  readonly centerTorso: number;
  readonly leftTorso: number;
  readonly rightTorso: number;
}

/**
 * Gyro configuration
 */
export interface IGyroConfiguration {
  readonly type: string;
  readonly techBase: TechBase;
  readonly weight: number;
  readonly slots: number;
  readonly stability: number;
  readonly features?: string[];
}

/**
 * Cockpit configuration
 */
export interface ICockpitConfiguration {
  readonly type: string;
  readonly techBase: TechBase;
  readonly weight: number;
  readonly slots: number;
  readonly pilot: IPilotInterface;
  readonly sensors: ISensorSuite;
  readonly features?: string[];
}

/**
 * Pilot interface
 */
export interface IPilotInterface {
  readonly type: 'standard' | 'advanced' | 'virtual' | 'drone';
  readonly rating: number;
  readonly bonuses?: IPilotBonus[];
}

/**
 * Pilot bonus
 */
export interface IPilotBonus {
  readonly type: string;
  readonly value: number;
  readonly conditions?: string[];
}

/**
 * Sensor suite
 */
export interface ISensorSuite {
  readonly range: number;
  readonly resolution: number;
  readonly special?: ISensorCapability[];
}

/**
 * Sensor capability
 */
export interface ISensorCapability {
  readonly type: string;
  readonly range: number;
  readonly effectiveness: number;
}

/**
 * Armor configuration
 */
export interface IArmorConfiguration {
  readonly type: string;
  readonly techBase: TechBase;
  readonly weight: number;
  readonly slots: number;
  readonly protection: number;
  readonly allocation: IArmorAllocation;
  readonly features?: string[];
}

/**
 * Armor allocation by location
 */
export interface IArmorAllocation {
  readonly head: ILocationArmor;
  readonly centerTorso: ILocationArmor;
  readonly leftTorso: ILocationArmor;
  readonly rightTorso: ILocationArmor;
  readonly leftArm: ILocationArmor;
  readonly rightArm: ILocationArmor;
  readonly leftLeg: ILocationArmor;
  readonly rightLeg: ILocationArmor;
}

/**
 * Location armor values
 */
export interface ILocationArmor {
  readonly front: number;
  readonly rear?: number;
  readonly type?: string;
  readonly special?: string[];
}

/**
 * Heat sink configuration
 */
export interface IHeatSinkConfiguration {
  readonly type: string;
  readonly techBase: TechBase;
  readonly engineHeatSinks: number;
  readonly externalHeatSinks: number;
  readonly totalDissipation: number;
  readonly distribution: IHeatSinkDistribution;
  readonly features?: string[];
}

/**
 * Heat sink distribution
 */
export interface IHeatSinkDistribution {
  readonly centerTorso: number;
  readonly leftTorso: number;
  readonly rightTorso: number;
  readonly leftArm: number;
  readonly rightArm: number;
  readonly leftLeg: number;
  readonly rightLeg: number;
}

/**
 * Jump jet configuration
 */
export interface IJumpJetConfiguration {
  readonly type: string;
  readonly techBase: TechBase;
  readonly count: number;
  readonly jumpMP: number;
  readonly weight: number;
  readonly distribution: IJumpJetDistribution;
  readonly features?: string[];
}

/**
 * Jump jet distribution
 */
export interface IJumpJetDistribution {
  readonly centerTorso: number;
  readonly leftTorso: number;
  readonly rightTorso: number;
  readonly leftLeg: number;
  readonly rightLeg: number;
}

/**
 * Enhancement configuration
 */
export interface IEnhancementConfiguration {
  readonly type: string;
  readonly techBase: TechBase;
  readonly weight: number;
  readonly slots: number;
  readonly effect: IEnhancementEffect;
  readonly features?: string[];
}

/**
 * Enhancement effect
 */
export interface IEnhancementEffect {
  readonly movementBonus?: number;
  readonly heatReduction?: number;
  readonly armorBonus?: number;
  readonly weaponBonus?: number;
  readonly special?: string[];
}

/**
 * Unit metadata
 */
export interface IUnitMetadata {
  readonly bv: number;
  readonly cost: number;
  readonly availability: IAvailabilityRating;
  readonly designDate: Date;
  readonly manufacturer?: string;
  readonly primaryFactory?: string;
  readonly notes?: string[];
  readonly variants?: IUnitVariant[];
}

/**
 * Unit variant
 */
export interface IUnitVariant {
  readonly name: string;
  readonly model: string;
  readonly changes: IVariantChange[];
  readonly era: string;
  readonly notes?: string;
}

/**
 * Variant change
 */
export interface IVariantChange {
  readonly component: string;
  readonly change: 'add' | 'remove' | 'replace' | 'modify';
  readonly from?: string;
  readonly to?: string;
  readonly description: string;
}

// ===== STATE MANAGEMENT INTERFACES =====

/**
 * Complete unit state for persistence
 */
export interface ICompleteUnitState {
  readonly configuration: ICompleteUnitConfiguration;
  readonly unallocatedEquipment: IUnallocatedEquipment[];
  readonly criticalSlots: ICriticalSlotState;
  readonly validation: IValidationState;
  readonly metadata: IStateMetadata;
}

/**
 * Unallocated equipment pool
 */
export interface IUnallocatedEquipment {
  readonly id: EntityId;
  readonly equipmentId: EntityId;
  readonly equipment: IEquipment;
  readonly quantity: number;
  readonly source: 'added' | 'removed' | 'moved';
  readonly timestamp: Date;
}

/**
 * Critical slot state
 */
export interface ICriticalSlotState {
  readonly slots: Record<string, ICriticalSlot[]>;
  readonly utilization: Record<string, number>;
  readonly overflow: string[];
  readonly violations: ICriticalSlotViolation[];
}

/**
 * Individual critical slot
 */
export interface ICriticalSlot {
  readonly index: number;
  readonly equipment?: IEquipmentInstance;
  readonly system?: string;
  readonly empty: boolean;
  readonly damaged: boolean;
  readonly destroyed: boolean;
  readonly special?: string[];
}

/**
 * Critical slot violation
 */
export interface ICriticalSlotViolation {
  readonly type: string;
  readonly location: string;
  readonly slotIndex?: number;
  readonly equipmentId?: EntityId;
  readonly severity: Severity;
  readonly message: string;
  readonly suggestedFix?: string;
}

/**
 * Validation state
 */
export interface IValidationState {
  readonly isValid: boolean;
  readonly lastValidation: Date;
  readonly violations: IStateViolation[];
  readonly warnings: IStateWarning[];
  readonly score: number;
}

/**
 * State violation
 */
export interface IStateViolation {
  readonly id: EntityId;
  readonly type: string;
  readonly category: string;
  readonly severity: Severity;
  readonly message: string;
  readonly component?: string;
  readonly location?: string;
  readonly timestamp: Date;
}

/**
 * State warning
 */
export interface IStateWarning {
  readonly id: EntityId;
  readonly type: string;
  readonly message: string;
  readonly recommendation?: string;
  readonly timestamp: Date;
}

/**
 * State metadata
 */
export interface IStateMetadata {
  readonly version: string;
  readonly created: Date;
  readonly modified: Date;
  readonly author?: string;
  readonly checksum: string;
  readonly size: number;
  readonly compressionRatio?: number;
}

// ===== SERVICE INTERFACES =====

/**
 * Equipment database service
 */
export interface IEquipmentDatabase extends IService {
  getAllEquipment(): Promise<Result<IEquipment[]>>;
  getEquipmentById(id: EntityId): Promise<Result<IEquipment>>;
  getEquipmentByCategory(category: string): Promise<Result<IEquipment[]>>;
  getEquipmentByTechBase(techBase: TechBase): Promise<Result<IEquipment[]>>;
  getEquipmentByRulesLevel(rulesLevel: RulesLevel): Promise<Result<IEquipment[]>>;
  searchEquipment(query: IEquipmentQuery): Promise<Result<IEquipment[]>>;
  getWeapons(): Promise<Result<IWeapon[]>>;
  getAmmunition(): Promise<Result<IAmmunition[]>>;
  getHeatManagement(): Promise<Result<IHeatManagementEquipment[]>>;
  getMovementEquipment(): Promise<Result<IMovementEquipment[]>>;
  getElectronicWarfare(): Promise<Result<IElectronicWarfareEquipment[]>>;
}

/**
 * Equipment query interface
 */
export interface IEquipmentQuery {
  readonly name?: string;
  readonly category?: string[];
  readonly techBase?: TechBase[];
  readonly rulesLevel?: RulesLevel[];
  readonly era?: string;
  readonly minWeight?: number;
  readonly maxWeight?: number;
  readonly minSlots?: number;
  readonly maxSlots?: number;
  readonly requiresAmmo?: boolean;
  readonly allowedLocations?: string[];
  readonly forbiddenLocations?: string[];
  readonly special?: string[];
  readonly sortBy?: 'name' | 'weight' | 'slots' | 'cost' | 'bv';
  readonly sortOrder?: 'asc' | 'desc';
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Unit configuration service
 */
export interface IUnitConfigurationService extends IObservableService {
  createConfiguration(template?: IConfigurationTemplate): Promise<Result<ICompleteUnitConfiguration>>;
  updateConfiguration(id: EntityId, updates: Partial<ICompleteUnitConfiguration>): Promise<Result<ICompleteUnitConfiguration>>;
  validateConfiguration(config: ICompleteUnitConfiguration): Promise<Result<IValidationState>>;
  cloneConfiguration(id: EntityId): Promise<Result<ICompleteUnitConfiguration>>;
  exportConfiguration(id: EntityId, format: 'json' | 'xml' | 'mtf' | 'pdf'): Promise<Result<string>>;
  importConfiguration(data: string, format: 'json' | 'xml' | 'mtf'): Promise<Result<ICompleteUnitConfiguration>>;
}

/**
 * Configuration template
 */
export interface IConfigurationTemplate {
  readonly name: string;
  readonly chassis: string;
  readonly tonnage: number;
  readonly techBase: TechBase;
  readonly rulesLevel: RulesLevel;
  readonly era: string;
  readonly preset?: 'basic' | 'advanced' | 'custom';
}

/**
 * Equipment allocation service
 */
export interface IEquipmentAllocationService extends IObservableService {
  allocateEquipment(
    configId: EntityId,
    equipmentId: EntityId,
    location: string,
    slotIndex?: number
  ): Promise<Result<IEquipmentInstance>>;

  deallocateEquipment(
    configId: EntityId,
    instanceId: EntityId
  ): Promise<Result<void>>;

  moveEquipment(
    configId: EntityId,
    instanceId: EntityId,
    newLocation: string,
    newSlotIndex?: number
  ): Promise<Result<IEquipmentInstance>>;

  createEquipmentGroup(
    configId: EntityId,
    equipmentIds: EntityId[],
    groupType: string
  ): Promise<Result<IEquipmentGroup>>;

  addToUnallocated(
    configId: EntityId,
    equipmentId: EntityId,
    quantity?: number
  ): Promise<Result<IUnallocatedEquipment>>;

  removeFromUnallocated(
    configId: EntityId,
    unallocatedId: EntityId
  ): Promise<Result<void>>;

  getUnallocatedEquipment(configId: EntityId): Promise<Result<IUnallocatedEquipment[]>>;
  getAllocatedEquipment(configId: EntityId): Promise<Result<IEquipmentInstance[]>>;
  getEquipmentByLocation(configId: EntityId, location: string): Promise<Result<IEquipmentInstance[]>>;
}

/**
 * State persistence service
 */
export interface IStatePersistenceService extends IService {
  saveState(configId: EntityId, state: ICompleteUnitState): Promise<Result<void>>;
  loadState(configId: EntityId): Promise<Result<ICompleteUnitState>>;
  saveConfiguration(config: ICompleteUnitConfiguration): Promise<Result<EntityId>>;
  loadConfiguration(configId: EntityId): Promise<Result<ICompleteUnitConfiguration>>;
  deleteConfiguration(configId: EntityId): Promise<Result<void>>;
  listConfigurations(): Promise<Result<IConfigurationSummary[]>>;
  exportState(configId: EntityId, format: 'json' | 'binary'): Promise<Result<Blob>>;
  importState(data: Blob, format: 'json' | 'binary'): Promise<Result<ICompleteUnitState>>;
}

/**
 * Configuration summary
 */
export interface IConfigurationSummary {
  readonly id: EntityId;
  readonly name: string;
  readonly chassis: string;
  readonly model: string;
  readonly tonnage: number;
  readonly techBase: TechBase;
  readonly created: Date;
  readonly modified: Date;
  readonly isValid: boolean;
  readonly size: number;
}

/**
 * Critical slot management service
 */
export interface ICriticalSlotManagementService extends IObservableService {
  getSlotState(configId: EntityId): Promise<Result<ICriticalSlotState>>;
  updateSlotState(configId: EntityId, state: ICriticalSlotState): Promise<Result<void>>;
  allocateSlot(configId: EntityId, location: string, slotIndex: number, equipment: IEquipmentInstance): Promise<Result<void>>;
  deallocateSlot(configId: EntityId, location: string, slotIndex: number): Promise<Result<void>>;
  getAvailableSlots(configId: EntityId, location: string): Promise<Result<number[]>>;
  validateSlotAllocation(configId: EntityId, equipment: IEquipmentInstance, location: string, slotIndex: number): Promise<Result<boolean>>;
  optimizeSlotLayout(configId: EntityId): Promise<Result<ICriticalSlotState>>;
}

/**
 * Unit synchronization service
 */
export interface IUnitSynchronizationService extends IObservableService {
  synchronizeUnit(configId: EntityId): Promise<Result<void>>;
  createSnapshot(configId: EntityId): Promise<Result<IUnitSnapshot>>;
  restoreSnapshot(configId: EntityId, snapshotId: EntityId): Promise<Result<void>>;
  compareConfigurations(configId1: EntityId, configId2: EntityId): Promise<Result<IConfigurationComparison>>;
  mergeConfigurations(configIds: EntityId[]): Promise<Result<ICompleteUnitConfiguration>>;
}

/**
 * Unit snapshot
 */
export interface IUnitSnapshot {
  readonly id: EntityId;
  readonly configId: EntityId;
  readonly name: string;
  readonly timestamp: Date;
  readonly state: ICompleteUnitState;
  readonly checksum: string;
}

/**
 * Configuration comparison
 */
export interface IConfigurationComparison {
  readonly config1: EntityId;
  readonly config2: EntityId;
  readonly differences: IConfigurationDifference[];
  readonly similarity: number;
  readonly summary: IComparisonSummary;
}

/**
 * Configuration difference
 */
export interface IConfigurationDifference {
  readonly type: 'added' | 'removed' | 'modified';
  readonly category: string;
  readonly path: string;
  readonly oldValue?: any;
  readonly newValue?: any;
  readonly description: string;
  readonly impact: Severity;
}

/**
 * Comparison summary
 */
export interface IComparisonSummary {
  readonly totalDifferences: number;
  readonly addedItems: number;
  readonly removedItems: number;
  readonly modifiedItems: number;
  readonly categories: Record<string, number>;
  readonly significantChanges: IConfigurationDifference[];
}

// ===== OBSERVER INTERFACES =====

/**
 * Unit configuration observer
 */
export interface IUnitConfigurationObserver extends IObserver<ICompleteUnitConfiguration> {
  onConfigurationChanged(config: ICompleteUnitConfiguration): void;
  onValidationChanged(validation: IValidationState): void;
  onEquipmentChanged(equipment: IEquipmentInstance[]): void;
}

/**
 * Equipment allocation observer
 */
export interface IEquipmentAllocationObserver extends IObserver<IEquipmentInstance[]> {
  onEquipmentAllocated(instance: IEquipmentInstance): void;
  onEquipmentDeallocated(instanceId: EntityId): void;
  onEquipmentMoved(instance: IEquipmentInstance, oldLocation: string): void;
  onEquipmentGrouped(group: IEquipmentGroup): void;
}

/**
 * Critical slot observer
 */
export interface ICriticalSlotObserver extends IObserver<ICriticalSlotState> {
  onSlotAllocated(location: string, slotIndex: number, equipment: IEquipmentInstance): void;
  onSlotDeallocated(location: string, slotIndex: number): void;
  onSlotViolation(violation: ICriticalSlotViolation): void;
  onSlotOptimized(oldState: ICriticalSlotState, newState: ICriticalSlotState): void;
}

// ===== FACTORY INTERFACES =====

/**
 * Equipment factory
 */
export interface IEquipmentFactory {
  createWeapon(definition: IWeaponDefinition): Result<IWeapon>;
  createAmmunition(definition: IAmmunitionDefinition): Result<IAmmunition>;
  createHeatManagement(definition: IHeatManagementDefinition): Result<IHeatManagementEquipment>;
  createMovementEquipment(definition: IMovementDefinition): Result<IMovementEquipment>;
  createElectronicWarfare(definition: IElectronicWarfareDefinition): Result<IElectronicWarfareEquipment>;
  createCustomEquipment(definition: ICustomEquipmentDefinition): Result<IEquipment>;
}

/**
 * Equipment definition interfaces for factory
 */
export interface IWeaponDefinition {
  readonly name: string;
  readonly techBase: TechBase;
  readonly damage: number;
  readonly range: IRangeProfile;
  readonly heat: number;
  readonly weight: number;
  readonly slots: number;
  readonly cost?: number;
  readonly special?: string[];
}

export interface IAmmunitionDefinition {
  readonly name: string;
  readonly techBase: TechBase;
  readonly ammoType: string;
  readonly shotsPerTon: number;
  readonly weight: number;
  readonly explosive: boolean;
  readonly special?: string[];
}

export interface IHeatManagementDefinition {
  readonly name: string;
  readonly techBase: TechBase;
  readonly dissipation: number;
  readonly weight: number;
  readonly slots: number;
  readonly engineIntegration?: boolean;
}

export interface IMovementDefinition {
  readonly name: string;
  readonly techBase: TechBase;
  readonly movementBonus: IMovementBonus;
  readonly weight: number;
  readonly slots: number;
}

export interface IElectronicWarfareDefinition {
  readonly name: string;
  readonly techBase: TechBase;
  readonly ecmStrength?: number;
  readonly sensorRange?: number;
  readonly weight: number;
  readonly slots: number;
}

export interface ICustomEquipmentDefinition {
  readonly name: string;
  readonly techBase: TechBase;
  readonly category: string;
  readonly weight: number;
  readonly slots: number;
  readonly cost?: number;
  readonly special?: string[];
}

/**
 * Configuration factory
 */
export interface IConfigurationFactory {
  createBasicConfiguration(template: IConfigurationTemplate): Result<ICompleteUnitConfiguration>;
  createFromChassis(chassisId: EntityId, variant?: string): Result<ICompleteUnitConfiguration>;
  createCustomConfiguration(specs: ICustomConfigurationSpecs): Result<ICompleteUnitConfiguration>;
  cloneConfiguration(source: ICompleteUnitConfiguration, changes?: Partial<ICompleteUnitConfiguration>): Result<ICompleteUnitConfiguration>;
}

/**
 * Custom configuration specifications
 */
export interface ICustomConfigurationSpecs {
  readonly name: string;
  readonly chassis: string;
  readonly tonnage: number;
  readonly techBase: TechBase;
  readonly rulesLevel: RulesLevel;
  readonly era: string;
  readonly engineRating?: number;
  readonly armorType?: string;
  readonly structureType?: string;
  readonly presets?: IConfigurationPreset[];
}

/**
 * Configuration preset
 */
export interface IConfigurationPreset {
  readonly category: string;
  readonly type: string;
  readonly value: any;
  readonly justification?: string;
}