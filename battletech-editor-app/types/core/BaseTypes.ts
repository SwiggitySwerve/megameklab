/**
 * Core Base Types for BattleTech Editor
 * 
 * Foundational interfaces and types that provide type safety and enable
 * proper SOLID refactoring by eliminating "as any" type casting.
 * 
 * These base types are designed to be:
 * - Minimal and focused (Single Responsibility)
 * - Composable (Open/Closed Principle)
 * - Substitutable (Liskov Substitution)
 * - Segregated (Interface Segregation)
 * - Dependency-injectable (Dependency Inversion)
 */

// ===== CORE FOUNDATION TYPES =====

/**
 * Universal identifier type for all entities
 */
export type EntityId = string;

/**
 * Tech base enum - strongly typed replacement for string literals
 */
export enum TechBase {
  INNER_SPHERE = 'Inner Sphere',
  CLAN = 'Clan',
  MIXED = 'Mixed'
}

/**
 * Rules level enum - strongly typed replacement for string literals
 */
export enum RulesLevel {
  INTRODUCTORY = 'Introductory',
  STANDARD = 'Standard',
  ADVANCED = 'Advanced',
  EXPERIMENTAL = 'Experimental'
}

/**
 * Severity levels for violations and recommendations
 */
export enum Severity {
  CRITICAL = 'critical',
  MAJOR = 'major',
  MINOR = 'minor',
  WARNING = 'warning'
}

/**
 * Difficulty levels for operations and recommendations
 */
export enum Difficulty {
  EASY = 'easy',
  MODERATE = 'moderate',
  HARD = 'hard'
}

/**
 * Priority levels for recommendations and actions
 */
export enum Priority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

// ===== BASE ENTITY INTERFACES =====

/**
 * Base interface for all identifiable entities
 */
export interface IIdentifiable {
  readonly id: EntityId;
}

/**
 * Base interface for entities with display names
 */
export interface INamed extends IIdentifiable {
  readonly name: string;
}

/**
 * Base interface for entities with descriptions
 */
export interface IDescribable extends INamed {
  readonly description?: string;
}

/**
 * Base interface for entities with tech base
 */
export interface ITechBased {
  readonly techBase: TechBase;
}

/**
 * Base interface for entities with rules level
 */
export interface IRulesLeveled {
  readonly rulesLevel: RulesLevel;
}

/**
 * Base interface for entities with weight
 */
export interface IWeighted {
  readonly weight: number;
}

/**
 * Base interface for entities with critical slots
 */
export interface ISlotted {
  readonly slots: number;
}

/**
 * Base interface for entities with location restrictions
 */
export interface ILocationRestricted {
  readonly allowedLocations?: string[];
  readonly forbiddenLocations?: string[];
}

// ===== VALIDATION BASE INTERFACES =====

/**
 * Base interface for validation results
 */
export interface IValidationResult {
  readonly isValid: boolean;
  readonly violations: IViolation[];
  readonly warnings: IWarning[];
  readonly timestamp: Date;
}

/**
 * Base interface for violations
 */
export interface IViolation {
  readonly type: string;
  readonly severity: Severity;
  readonly message: string;
  readonly component?: string;
  readonly location?: string;
  readonly suggestedFix?: string;
}

/**
 * Base interface for warnings
 */
export interface IWarning {
  readonly type: string;
  readonly message: string;
  readonly component?: string;
  readonly location?: string;
  readonly recommendation?: string;
}

/**
 * Base interface for recommendations
 */
export interface IRecommendation {
  readonly type: string;
  readonly priority: Priority;
  readonly difficulty: Difficulty;
  readonly description: string;
  readonly benefit: string;
  readonly estimatedImpact: number;
}

// ===== CALCULATION BASE INTERFACES =====

/**
 * Base interface for calculation results
 */
export interface ICalculationResult {
  readonly calculated: number;
  readonly expected?: number;
  readonly difference?: number;
  readonly isWithinTolerance: boolean;
  readonly calculationMethod: string;
  readonly timestamp: Date;
}

/**
 * Base interface for calculation contexts
 */
export interface ICalculationContext {
  readonly strictMode: boolean;
  readonly includeOptimizations: boolean;
  readonly techLevel: RulesLevel;
  readonly metadata?: Record<string, any>;
}

// ===== CONFIGURATION BASE INTERFACES =====

/**
 * Base interface for component configurations
 */
export interface IComponentConfiguration extends ITechBased, INamed {
  readonly type: string;
  readonly restrictions?: string[];
}

/**
 * Base interface for equipment configurations
 */
export interface IEquipmentConfiguration extends IComponentConfiguration, IWeighted, ISlotted, ILocationRestricted {
  readonly category: string;
  readonly requiresAmmo: boolean;
  readonly heatGeneration?: number;
  readonly range?: IRangeProfile;
}

/**
 * Range profile interface
 */
export interface IRangeProfile {
  readonly minimum?: number;
  readonly short?: number;
  readonly medium?: number;
  readonly long?: number;
  readonly extreme?: number;
}

// ===== SERVICE BASE INTERFACES =====

/**
 * Base interface for all services - enables dependency injection
 */
export interface IService {
  readonly serviceName: string;
  readonly version: string;
  initialize?(): Promise<void>;
  cleanup?(): Promise<void>;
}

/**
 * Base interface for services that can be configured
 */
export interface IConfigurableService extends IService {
  configure(config: IServiceConfiguration): void;
  getConfiguration(): IServiceConfiguration;
}

/**
 * Base service configuration interface
 */
export interface IServiceConfiguration {
  readonly enableDebugLogging?: boolean;
  readonly enableCaching?: boolean;
  readonly enableValidation?: boolean;
  readonly metadata?: Record<string, any>;
}

/**
 * Base interface for observable services
 */
export interface IObservableService extends IService {
  subscribe(listener: (event: IServiceEvent) => void): () => void;
  unsubscribe(listener: (event: IServiceEvent) => void): void;
}

/**
 * Base interface for service events
 */
export interface IServiceEvent {
  readonly type: string;
  readonly timestamp: Date;
  readonly data?: any;
}

// ===== FACTORY BASE INTERFACES =====

/**
 * Base interface for all factories
 */
export interface IFactory<T> {
  readonly factoryName: string;
  create(...args: any[]): T;
}

/**
 * Base interface for configurable factories
 */
export interface IConfigurableFactory<T> extends IFactory<T> {
  createWithConfiguration(config: any): T;
}

/**
 * Base interface for strategy factories
 */
export interface IStrategyFactory<T> extends IFactory<T> {
  readonly availableStrategies: string[];
  createStrategy(strategyName: string): T;
}

// ===== OBSERVER BASE INTERFACES =====

/**
 * Base interface for observers
 */
export interface IObserver<T> {
  update(data: T): void;
}

/**
 * Base interface for observable subjects
 */
export interface IObservable<T> {
  subscribe(observer: IObserver<T>): () => void;
  unsubscribe(observer: IObserver<T>): void;
  notify(data: T): void;
}

// ===== COMMAND BASE INTERFACES =====

/**
 * Base interface for commands (Command Pattern)
 */
export interface ICommand<T = any> {
  readonly name: string;
  execute(): Promise<T>;
  undo?(): Promise<void>;
  canUndo?: boolean;
}

/**
 * Base interface for command contexts
 */
export interface ICommandContext {
  readonly requestId: string;
  readonly timestamp: Date;
  readonly metadata?: Record<string, any>;
}

// ===== STRATEGY BASE INTERFACES =====

/**
 * Base interface for all strategies
 */
export interface IStrategy {
  readonly strategyName: string;
  readonly description: string;
}

/**
 * Base interface for validation strategies
 */
export interface IValidationStrategy extends IStrategy {
  validate(data: any): Promise<IValidationResult>;
}

/**
 * Base interface for calculation strategies
 */
export interface ICalculationStrategy extends IStrategy {
  calculate(data: any, context: ICalculationContext): Promise<ICalculationResult>;
}

// ===== BUILDER BASE INTERFACES =====

/**
 * Base interface for all builders
 */
export interface IBuilder<T> {
  build(): T;
  reset(): IBuilder<T>;
}

/**
 * Base interface for fluent builders
 */
export interface IFluentBuilder<T> extends IBuilder<T> {
  // Fluent methods return this for chaining
}

// ===== UTILITY TYPE HELPERS =====

/**
 * Helper type for making properties optional
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Helper type for making properties required
 */
export type RequiredProps<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Helper type for readonly variants
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Helper type for partial deep types
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Helper type for extracting method names
 */
export type MethodNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

/**
 * Helper type for extracting property names
 */
export type PropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

// ===== RESULT TYPES =====

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Helper function to create success result
 */
export function success<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Helper function to create error result
 */
export function failure<E = Error>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Type guard for success results
 */
export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

/**
 * Type guard for error results
 */
export function isFailure<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}