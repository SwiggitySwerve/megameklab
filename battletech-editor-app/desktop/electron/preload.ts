/**
 * BattleTech Editor - Electron Preload Script
 * 
 * This script runs in the renderer process and provides a secure bridge
 * between the main process and the web content. It exposes a limited
 * set of APIs to the renderer while maintaining security.
 * 
 * Security Features:
 * - Context isolation enabled
 * - Node integration disabled
 * - Limited API surface
 * - Type-safe IPC communication
 */

import { contextBridge, ipcRenderer } from 'electron';

// Define the API that will be exposed to the renderer
interface IElectronAPI {
  // Application info
  getAppInfo(): Promise<IAppInfo>;
  
  // Window operations
  minimizeWindow(): Promise<void>;
  maximizeWindow(): Promise<void>;
  closeWindow(): Promise<void>;
  
  // File operations
  saveFile(defaultPath: string, filters: IFileFilter[]): Promise<ISaveDialogResult>;
  openFile(filters: IFileFilter[]): Promise<IOpenDialogResult>;
  readFile(filePath: string): Promise<IFileResult>;
  writeFile(filePath: string, data: string): Promise<IFileResult>;
  
  // Service operations
  serviceCall(method: string, ...args: any[]): Promise<IServiceResult>;
  
  // Backup operations
  createBackup(): Promise<boolean>;
  restoreBackup(backupPath: string): Promise<boolean>;
  
  // Event listeners
  onAutoSaveTrigger(callback: () => void): void;
  onImportUnitFile(callback: (filePath: string) => void): void;
  onImportUnitUrl(callback: (url: string) => void): void;
  onOpenUnit(callback: (unitId: string) => void): void;
  onCreateNewUnit(callback: () => void): void;
  
  // Remove event listeners
  removeAllListeners(channel: string): void;
}

// Type definitions for the exposed API
interface IAppInfo {
  version: string;
  platform: string;
  userDataPath: string;
  developmentMode: boolean;
}

interface IFileFilter {
  name: string;
  extensions: string[];
}

interface ISaveDialogResult {
  canceled: boolean;
  filePath?: string;
}

interface IOpenDialogResult {
  canceled: boolean;
  filePaths: string[];
}

interface IFileResult {
  success: boolean;
  data?: string;
  error?: string;
}

interface IServiceResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Electron API implementation
 */
const electronAPI: IElectronAPI = {
  // Application info
  async getAppInfo(): Promise<IAppInfo> {
    return await ipcRenderer.invoke('get-app-info');
  },

  // Window operations
  async minimizeWindow(): Promise<void> {
    return await ipcRenderer.invoke('minimize-window');
  },

  async maximizeWindow(): Promise<void> {
    return await ipcRenderer.invoke('maximize-window');
  },

  async closeWindow(): Promise<void> {
    return await ipcRenderer.invoke('close-window');
  },

  // File operations
  async saveFile(defaultPath: string, filters: IFileFilter[]): Promise<ISaveDialogResult> {
    return await ipcRenderer.invoke('save-file', defaultPath, filters);
  },

  async openFile(filters: IFileFilter[]): Promise<IOpenDialogResult> {
    return await ipcRenderer.invoke('open-file', filters);
  },

  async readFile(filePath: string): Promise<IFileResult> {
    return await ipcRenderer.invoke('read-file', filePath);
  },

  async writeFile(filePath: string, data: string): Promise<IFileResult> {
    return await ipcRenderer.invoke('write-file', filePath, data);
  },

  // Service operations
  async serviceCall(method: string, ...args: any[]): Promise<IServiceResult> {
    return await ipcRenderer.invoke('service-call', method, ...args);
  },

  // Backup operations
  async createBackup(): Promise<boolean> {
    return await ipcRenderer.invoke('create-backup');
  },

  async restoreBackup(backupPath: string): Promise<boolean> {
    return await ipcRenderer.invoke('restore-backup', backupPath);
  },

  // Event listeners
  onAutoSaveTrigger(callback: () => void): void {
    ipcRenderer.on('auto-save-trigger', callback);
  },

  onImportUnitFile(callback: (filePath: string) => void): void {
    ipcRenderer.on('import-unit-file', (_event, filePath) => callback(filePath));
  },

  onImportUnitUrl(callback: (url: string) => void): void {
    ipcRenderer.on('import-unit-url', (_event, url) => callback(url));
  },

  onOpenUnit(callback: (unitId: string) => void): void {
    ipcRenderer.on('open-unit', (_event, unitId) => callback(unitId));
  },

  onCreateNewUnit(callback: () => void): void {
    ipcRenderer.on('create-new-unit', callback);
  },

  // Remove event listeners
  removeAllListeners(channel: string): void {
    ipcRenderer.removeAllListeners(channel);
  }
};

/**
 * Expose the API to the renderer process
 */
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

/**
 * Enhanced API for development mode
 */
if (process.env.NODE_ENV === 'development') {
  const devAPI = {
    // Development utilities
    openDevTools(): void {
      ipcRenderer.send('open-dev-tools');
    },
    
    reloadWindow(): void {
      ipcRenderer.send('reload-window');
    },
    
    getEnvironment(): string {
      return process.env.NODE_ENV || 'production';
    }
  };

  contextBridge.exposeInMainWorld('electronDevAPI', devAPI);
}

/**
 * Security hardening - prevent access to Node.js APIs
 */
declare global {
  interface Window {
    electronAPI: IElectronAPI;
    electronDevAPI?: {
      openDevTools(): void;
      reloadWindow(): void;
      getEnvironment(): string;
    };
  }
}

// Security hardening: Remove Node.js globals from the window object
// Type-safe window cleanup for Electron security
interface NodeWindow extends Window {
  global?: any;
  process?: any;
  Buffer?: any;
}

const nodeWindow = window as NodeWindow;
delete nodeWindow.global;
delete nodeWindow.process;
delete nodeWindow.Buffer;

// Log preload script loaded
console.log('🔌 BattleTech Editor preload script loaded');

export type { IElectronAPI, IAppInfo, IFileFilter, IFileResult, IServiceResult };