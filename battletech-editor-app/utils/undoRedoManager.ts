import { EditableUnit } from '../types/editor';

interface UndoRedoState {
  unit: EditableUnit;
  timestamp: number;
  description: string;
}

export class UndoRedoManager {
  private history: UndoRedoState[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;
  private onChange?: (canUndo: boolean, canRedo: boolean) => void;

  constructor(onChange?: (canUndo: boolean, canRedo: boolean) => void) {
    this.onChange = onChange;
  }

  // Add a new state to history
  addState(unit: EditableUnit, description: string = 'Change') {
    // Remove any states after current index (branching history)
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Add new state
    this.history.push({
      unit: JSON.parse(JSON.stringify(unit)), // Deep clone
      timestamp: Date.now(),
      description,
    });

    // Maintain max history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }

    this.notifyChange();
  }

  // Undo to previous state
  undo(): EditableUnit | null {
    if (!this.canUndo()) return null;

    this.currentIndex--;
    const state = this.history[this.currentIndex];
    this.notifyChange();
    
    return JSON.parse(JSON.stringify(state.unit)); // Return deep clone
  }

  // Redo to next state
  redo(): EditableUnit | null {
    if (!this.canRedo()) return null;

    this.currentIndex++;
    const state = this.history[this.currentIndex];
    this.notifyChange();
    
    return JSON.parse(JSON.stringify(state.unit)); // Return deep clone
  }

  // Check if undo is available
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  // Check if redo is available
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  // Get current state description
  getCurrentDescription(): string {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex].description;
    }
    return '';
  }

  // Get undo description
  getUndoDescription(): string {
    if (this.canUndo()) {
      return this.history[this.currentIndex - 1].description;
    }
    return '';
  }

  // Get redo description
  getRedoDescription(): string {
    if (this.canRedo()) {
      return this.history[this.currentIndex + 1].description;
    }
    return '';
  }

  // Clear history
  clear() {
    this.history = [];
    this.currentIndex = -1;
    this.notifyChange();
  }

  // Get history info
  getHistoryInfo() {
    return {
      totalStates: this.history.length,
      currentIndex: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      history: this.history.map((state, index) => ({
        description: state.description,
        timestamp: state.timestamp,
        isCurrent: index === this.currentIndex,
      })),
    };
  }

  private notifyChange() {
    if (this.onChange) {
      this.onChange(this.canUndo(), this.canRedo());
    }
  }
}

// Hook for React components
import { useState, useCallback, useRef, useEffect } from 'react';

export function useUndoRedo(initialUnit?: EditableUnit) {
  const [unit, setUnit] = useState<EditableUnit | undefined>(initialUnit);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  const managerRef = useRef(new UndoRedoManager((undo, redo) => {
    setCanUndo(undo);
    setCanRedo(redo);
  }));

  // Initialize with initial unit
  useEffect(() => {
    if (initialUnit) {
      managerRef.current.addState(initialUnit, 'Initial state');
    }
  }, []);

  // Update unit with undo/redo tracking
  const updateUnit = useCallback((newUnit: EditableUnit, description?: string) => {
    setUnit(newUnit);
    managerRef.current.addState(newUnit, description);
  }, []);

  // Undo operation
  const undo = useCallback(() => {
    const previousUnit = managerRef.current.undo();
    if (previousUnit) {
      setUnit(previousUnit);
      return true;
    }
    return false;
  }, []);

  // Redo operation
  const redo = useCallback(() => {
    const nextUnit = managerRef.current.redo();
    if (nextUnit) {
      setUnit(nextUnit);
      return true;
    }
    return false;
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    managerRef.current.clear();
  }, []);

  // Get history info
  const getHistoryInfo = useCallback(() => {
    return managerRef.current.getHistoryInfo();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    unit,
    updateUnit,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    getHistoryInfo,
    undoDescription: managerRef.current.getUndoDescription(),
    redoDescription: managerRef.current.getRedoDescription(),
  };
}
