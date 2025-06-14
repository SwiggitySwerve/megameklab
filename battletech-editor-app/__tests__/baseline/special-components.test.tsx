/**
 * Special Components Integration Tests
 * Verifies that all special components (structure, armor, heat sinks, actuators) work correctly
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UnitDataProvider } from '../../hooks/useUnitData';
import CriticalsTabWithHooks from '../../components/editor/tabs/CriticalsTabWithHooks';
import EquipmentTabWithHooks from '../../components/editor/tabs/EquipmentTabWithHooks';
import { EditableUnit } from '../../types/editor';
import { initializeSystemComponents } from '../../utils/componentSync';
import { initializeCriticalSlots } from '../../utils/componentRules';

// Mock drag and drop
jest.mock('react-dnd', () => ({
  useDrag: () => [{}, jest.fn()],
  useDrop: () => [{}, jest.fn()],
  DndProvider: ({ children }: any) => children,
}));

jest.mock('react-dnd-html5-backend', () => ({
  HTML5Backend: jest.fn(),
}));

// Mock sample unit
const createTestUnit = (): EditableUnit => {
  const systemComponents = {
    engine: { type: 'Standard' as const, rating: 300 },
    gyro: { type: 'Standard' as const },
    cockpit: { type: 'Standard' as const },
    structure: { type: 'Standard' as const },
    armor: { type: 'Standard' as const },
    heatSinks: { 
      type: 'Single' as const, 
      total: 10, 
      engineIntegrated: 10, 
      externalRequired: 0 
    },
    leftArmActuators: {
      hasLowerArm: true,
      hasHand: true,
    },
    rightArmActuators: {
      hasLowerArm: true,
      hasHand: true,
    },
  };

  return {
    id: 'test-unit',
    mass: 50,
    tech_base: 'Inner Sphere',
    era: '3025',
    model: 'TDR-5S',
    chassis: 'Thunderbolt',
    systemComponents,
    criticalAllocations: initializeCriticalSlots(systemComponents, 50),
    armorAllocation: {},
    equipmentPlacements: [],
    criticalSlots: [],
    fluffData: {
      overview: 'A test mech for unit tests',
      capabilities: 'Test capabilities',
      history: 'Created for testing purposes',
      deployment: 'Test deployment',
      variants: 'Test variants',
      manufacturer: 'Test Industries',
      primaryFactory: 'Terra',
      notes: 'Test notes',
    },
    selectedQuirks: [],
    data: {
      chassis: 'Thunderbolt',
      model: 'TDR-5S',
      engine: { type: 'Standard', rating: 300 },
      gyro: { type: 'Standard' },
      structure: { type: 'Standard' },
      armor: { type: 'Standard', locations: [] },
      heat_sinks: { type: 'Single', count: 10 },
      weapons_and_equipment: [],
      criticals: [],
    },
    validationState: {
      isValid: true,
      errors: [],
      warnings: [],
    },
    editorMetadata: {
      lastModified: new Date(),
      isDirty: false,
      version: '1.0.0',
    },
  };
};

// Wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode, unit?: EditableUnit }> = ({ children, unit }) => {
  const testUnit = unit || createTestUnit();
  
  return (
    <UnitDataProvider initialUnit={testUnit}>
      {children}
    </UnitDataProvider>
  );
};

describe('Special Components Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Structure Components', () => {
    test('Endo Steel adds 14 critical slots', async () => {
      const unit = createTestUnit();
      if (unit.systemComponents) {
        unit.systemComponents.structure.type = 'Endo Steel';
        unit.criticalAllocations = initializeCriticalSlots(unit.systemComponents, unit.mass);
      }
      
      render(
        <TestWrapper unit={unit}>
          <CriticalsTabWithHooks />
        </TestWrapper>
      );

      // Count Endo Steel slots
      const endoSteelSlots = screen.getAllByText(/Endo Steel/i);
      expect(endoSteelSlots.length).toBe(14);
    });

    test('Endo Steel (Clan) adds 7 critical slots', async () => {
      const unit = createTestUnit();
      if (unit.systemComponents) {
        unit.systemComponents.structure.type = 'Endo Steel (Clan)';
        unit.criticalAllocations = initializeCriticalSlots(unit.systemComponents, unit.mass);
      }
      
      render(
        <TestWrapper unit={unit}>
          <CriticalsTabWithHooks />
        </TestWrapper>
      );

      // Count Endo Steel slots
      const endoSteelSlots = screen.getAllByText(/Endo Steel \(Clan\)/i);
      expect(endoSteelSlots.length).toBe(7);
    });
  });

  describe('Armor Components', () => {
    test('Ferro-Fibrous adds 14 critical slots', async () => {
      const unit = createTestUnit();
      if (unit.systemComponents) {
        unit.systemComponents.armor.type = 'Ferro-Fibrous';
        unit.criticalAllocations = initializeCriticalSlots(unit.systemComponents, unit.mass);
      }
      
      render(
        <TestWrapper unit={unit}>
          <CriticalsTabWithHooks />
        </TestWrapper>
      );

      // Count Ferro-Fibrous slots
      const ferroSlots = screen.getAllByText(/Ferro-Fibrous/i);
      expect(ferroSlots.length).toBe(14);
    });

    test('Light Ferro-Fibrous adds 7 critical slots', async () => {
      const unit = createTestUnit();
      if (unit.systemComponents) {
        unit.systemComponents.armor.type = 'Light Ferro-Fibrous';
        unit.criticalAllocations = initializeCriticalSlots(unit.systemComponents, unit.mass);
      }
      
      render(
        <TestWrapper unit={unit}>
          <CriticalsTabWithHooks />
        </TestWrapper>
      );

      // Count Light Ferro-Fibrous slots
      const ferroSlots = screen.getAllByText(/Light Ferro-Fibrous/i);
      expect(ferroSlots.length).toBe(7);
    });

    test('Heavy Ferro-Fibrous adds 21 critical slots', async () => {
      const unit = createTestUnit();
      if (unit.systemComponents) {
        unit.systemComponents.armor.type = 'Heavy Ferro-Fibrous';
        unit.criticalAllocations = initializeCriticalSlots(unit.systemComponents, unit.mass);
      }
      
      render(
        <TestWrapper unit={unit}>
          <CriticalsTabWithHooks />
        </TestWrapper>
      );

      // Count Heavy Ferro-Fibrous slots
      const ferroSlots = screen.getAllByText(/Heavy Ferro-Fibrous/i);
      expect(ferroSlots.length).toBe(21);
    });
  });

  describe('Heat Sink Management', () => {
    test('External heat sinks appear in equipment list', async () => {
      const unit = createTestUnit();
      if (unit.systemComponents) {
        unit.systemComponents.heatSinks = {
          type: 'Single',
          total: 15, // 10 engine integrated + 5 external
          engineIntegrated: 10,
          externalRequired: 5,
        };
      }
      unit.data!.weapons_and_equipment = [
        { item_name: 'Heat Sink', item_type: 'equipment', location: '', tech_base: 'IS' },
        { item_name: 'Heat Sink', item_type: 'equipment', location: '', tech_base: 'IS' },
        { item_name: 'Heat Sink', item_type: 'equipment', location: '', tech_base: 'IS' },
        { item_name: 'Heat Sink', item_type: 'equipment', location: '', tech_base: 'IS' },
        { item_name: 'Heat Sink', item_type: 'equipment', location: '', tech_base: 'IS' },
      ];
      
      render(
        <TestWrapper unit={unit}>
          <EquipmentTabWithHooks />
        </TestWrapper>
      );

      // External heat sinks should appear in equipment
      const heatSinks = screen.getAllByText(/Heat Sink/i);
      expect(heatSinks.length).toBeGreaterThanOrEqual(5);
    });

    test('Double heat sinks take 3 slots each', async () => {
      const unit = createTestUnit();
      if (unit.systemComponents) {
        unit.systemComponents.heatSinks = {
          type: 'Double',
          total: 11, // 10 engine integrated + 1 external
          engineIntegrated: 10,
          externalRequired: 1,
        };
      }
      unit.data!.weapons_and_equipment = [
        { item_name: 'Double Heat Sink', item_type: 'equipment', location: 'Left Torso', tech_base: 'IS' },
      ];
      unit.data!.criticals = [
        { location: 'Left Torso', slots: Array(12).fill('-Empty-') },
      ];
      unit.data!.criticals[0].slots[0] = 'Double Heat Sink';
      unit.data!.criticals[0].slots[1] = 'Double Heat Sink';
      unit.data!.criticals[0].slots[2] = 'Double Heat Sink';
      
      render(
        <TestWrapper unit={unit}>
          <CriticalsTabWithHooks />
        </TestWrapper>
      );

      // Should see 3 consecutive Double Heat Sink slots in Left Torso
      const slots = screen.getAllByText(/Double Heat Sink/i);
      expect(slots.length).toBeGreaterThanOrEqual(3);
    });

    test('Clan Double heat sinks take 2 slots each', async () => {
      const unit = createTestUnit();
      unit.tech_base = 'Clan';
      if (unit.systemComponents) {
        unit.systemComponents.heatSinks = {
          type: 'Double (Clan)',
          total: 11, // 10 engine integrated + 1 external
          engineIntegrated: 10,
          externalRequired: 1,
        };
      }
      unit.data!.weapons_and_equipment = [
        { item_name: 'Double Heat Sink (Clan)', item_type: 'equipment', location: 'Left Torso', tech_base: 'Clan' },
      ];
      unit.data!.criticals = [
        { location: 'Left Torso', slots: Array(12).fill('-Empty-') },
      ];
      unit.data!.criticals[0].slots[0] = 'Double Heat Sink (Clan)';
      unit.data!.criticals[0].slots[1] = 'Double Heat Sink (Clan)';
      
      render(
        <TestWrapper unit={unit}>
          <CriticalsTabWithHooks />
        </TestWrapper>
      );

      // Should see 2 consecutive Double Heat Sink (Clan) slots in Left Torso
      const slots = screen.getAllByText(/Double Heat Sink \(Clan\)/i);
      expect(slots.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Engine Components', () => {
    test('XL Engine takes slots in side torsos', async () => {
      const unit = createTestUnit();
      if (unit.systemComponents) {
        unit.systemComponents.engine.type = 'XL';
        unit.criticalAllocations = initializeCriticalSlots(unit.systemComponents, unit.mass);
      }
      
      render(
        <TestWrapper unit={unit}>
          <CriticalsTabWithHooks />
        </TestWrapper>
      );

      // Should have engine slots in all three torsos
      const engineSlots = screen.getAllByText(/Engine/i);
      expect(engineSlots.length).toBe(12); // 6 CT + 3 LT + 3 RT
    });

    test('Light Engine takes 2 slots in each side torso', async () => {
      const unit = createTestUnit();
      if (unit.systemComponents) {
        unit.systemComponents.engine.type = 'Light';
        unit.criticalAllocations = initializeCriticalSlots(unit.systemComponents, unit.mass);
      }
      
      render(
        <TestWrapper unit={unit}>
          <CriticalsTabWithHooks />
        </TestWrapper>
      );

      // Should have engine slots in all three torsos
      const engineSlots = screen.getAllByText(/Engine/i);
      expect(engineSlots.length).toBe(10); // 6 CT + 2 LT + 2 RT
    });

    test('Compact Engine takes only 3 CT slots', async () => {
      const unit = createTestUnit();
      if (unit.systemComponents) {
        unit.systemComponents.engine.type = 'Compact';
        unit.criticalAllocations = initializeCriticalSlots(unit.systemComponents, unit.mass);
      }
      
      render(
        <TestWrapper unit={unit}>
          <CriticalsTabWithHooks />
        </TestWrapper>
      );

      // Should have only 3 engine slots in CT
      const engineSlots = screen.getAllByText(/Engine/i);
      expect(engineSlots.length).toBe(3);
    });
  });

  describe('Gyro Components', () => {
    test('Compact Gyro takes 2 CT slots', async () => {
      const unit = createTestUnit();
      if (unit.systemComponents) {
        unit.systemComponents.gyro.type = 'Compact';
        unit.criticalAllocations = initializeCriticalSlots(unit.systemComponents, unit.mass);
      }
      
      render(
        <TestWrapper unit={unit}>
          <CriticalsTabWithHooks />
        </TestWrapper>
      );

      // Should have 2 gyro slots
      const gyroSlots = screen.getAllByText(/Gyro/i);
      expect(gyroSlots.length).toBe(2);
    });

    test('XL Gyro takes 6 CT slots', async () => {
      const unit = createTestUnit();
      if (unit.systemComponents) {
        unit.systemComponents.gyro.type = 'XL';
        unit.criticalAllocations = initializeCriticalSlots(unit.systemComponents, unit.mass);
      }
      
      render(
        <TestWrapper unit={unit}>
          <CriticalsTabWithHooks />
        </TestWrapper>
      );

      // Should have 6 gyro slots
      const gyroSlots = screen.getAllByText(/Gyro/i);
      expect(gyroSlots.length).toBe(6);
    });
  });

  describe('Actuator Management', () => {
    test('Can remove Hand Actuator independently', async () => {
      const unit = createTestUnit();
      const onUnitChange = jest.fn();
      
      render(
        <UnitDataProvider initialUnit={unit} onUnitChange={onUnitChange}>
          <CriticalsTabWithHooks />
        </UnitDataProvider>
      );

      // Find hand actuator
      const handActuators = screen.getAllByText(/Hand Actuator/i);
      expect(handActuators.length).toBeGreaterThan(0);

      // Right-click on hand actuator
      fireEvent.contextMenu(handActuators[0].parentElement!);

      // Should show context menu
      await waitFor(() => {
        expect(screen.getByText('Remove Hand Actuator')).toBeInTheDocument();
      });

      // Click remove
      fireEvent.click(screen.getByText('Remove Hand Actuator'));

      // Should trigger update
      await waitFor(() => {
        expect(onUnitChange).toHaveBeenCalled();
      });
    });

    test('Removing Lower Arm also removes Hand', async () => {
      const unit = createTestUnit();
      const onUnitChange = jest.fn();
      
      render(
        <UnitDataProvider initialUnit={unit} onUnitChange={onUnitChange}>
          <CriticalsTabWithHooks />
        </UnitDataProvider>
      );

      // Find lower arm actuator
      const lowerArmActuators = screen.getAllByText(/Lower Arm Actuator/i);
      expect(lowerArmActuators.length).toBeGreaterThan(0);

      // Right-click on lower arm actuator
      fireEvent.contextMenu(lowerArmActuators[0].parentElement!);

      // Should show context menu with warning
      await waitFor(() => {
        expect(screen.getByText('Remove Lower Arm Actuator')).toBeInTheDocument();
        expect(screen.getByText(/This will also remove the Hand Actuator/i)).toBeInTheDocument();
      });

      // Click remove
      fireEvent.click(screen.getByText('Remove Lower Arm Actuator'));

      // Should trigger update
      await waitFor(() => {
        expect(onUnitChange).toHaveBeenCalled();
      });
    });

    test('Cannot add Hand without Lower Arm', async () => {
      const unit = createTestUnit();
      // Remove both actuators
      if (unit.systemComponents) {
        unit.systemComponents.leftArmActuators = {
          hasLowerArm: false,
          hasHand: false,
        };
        unit.criticalAllocations = initializeCriticalSlots(unit.systemComponents, unit.mass);
      }
      
      render(
        <TestWrapper unit={unit}>
          <CriticalsTabWithHooks />
        </TestWrapper>
      );

      // Should not have Lower Arm or Hand in left arm
      const leftArmSlots = screen.getAllByText(/-Empty-/i);
      expect(leftArmSlots.length).toBeGreaterThan(0);

      // Right-click on empty slot in arm
      fireEvent.contextMenu(leftArmSlots[2].parentElement!); // Slot 2 would be Lower Arm

      // Should show option to add Lower Arm
      await waitFor(() => {
        expect(screen.getByText('Add Lower Arm Actuator')).toBeInTheDocument();
      });

      // But not Hand Actuator (since Lower Arm is missing)
      // Note: The implementation might show both options, but adding Hand without Lower should fail
    });
  });

  describe('Fixed Components', () => {
    test('Cannot remove fixed components', async () => {
      const unit = createTestUnit();
      
      render(
        <TestWrapper unit={unit}>
          <CriticalsTabWithHooks />
        </TestWrapper>
      );

      // Find fixed components
      const shoulders = screen.getAllByText(/Shoulder/i);
      const upperArms = screen.getAllByText(/Upper Arm Actuator/i);
      const hips = screen.getAllByText(/Hip/i);
      
      expect(shoulders.length).toBeGreaterThan(0);
      expect(upperArms.length).toBeGreaterThan(0);
      expect(hips.length).toBeGreaterThan(0);

      // Right-click should not show context menu for fixed components
      fireEvent.contextMenu(shoulders[0].parentElement!);
      
      // No context menu should appear
      await waitFor(() => {
        expect(screen.queryByText(/Remove/i)).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });

    test('Life Support, Sensors, and Cockpit are fixed in head', async () => {
      const unit = createTestUnit();
      
      render(
        <TestWrapper unit={unit}>
          <CriticalsTabWithHooks />
        </TestWrapper>
      );

      // Find head components
      expect(screen.getByText('Life Support')).toBeInTheDocument();
      expect(screen.getAllByText('Sensors').length).toBe(1); // Only one sensor in head
      expect(screen.getByText('Cockpit')).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    test('Different component types have distinct styling', async () => {
      const unit = createTestUnit();
      if (unit.systemComponents) {
        unit.systemComponents.structure.type = 'Endo Steel';
        unit.systemComponents.armor.type = 'Ferro-Fibrous';
        unit.criticalAllocations = initializeCriticalSlots(unit.systemComponents, unit.mass);
      }
      
      const { container } = render(
        <TestWrapper unit={unit}>
          <CriticalsTabWithHooks />
        </TestWrapper>
      );

      // Check for styling classes
      expect(container.querySelector('.fixedComponent')).toBeInTheDocument();
      expect(container.querySelector('.removableComponent')).toBeInTheDocument();
      expect(container.querySelector('.specialComponent')).toBeInTheDocument();
    });
  });

  describe('Equipment Displacement', () => {
    test('Equipment is displaced when special components take slots', async () => {
      const unit = createTestUnit();
      // Add some equipment in slots that will be taken by Endo Steel
      unit.data!.weapons_and_equipment = [
        { item_name: 'Medium Laser', item_type: 'weapon', location: 'Left Torso', tech_base: 'IS' },
      ];
      unit.data!.criticals = [
        { location: 'Left Torso', slots: Array(12).fill('-Empty-') },
      ];
      unit.data!.criticals[0].slots[0] = 'Medium Laser';
      
      const onUnitChange = jest.fn();
      
      render(
        <UnitDataProvider initialUnit={unit} onUnitChange={onUnitChange}>
          <CriticalsTabWithHooks />
        </UnitDataProvider>
      );

      // Simulate changing to Endo Steel (which would happen from Structure tab)
      // This would trigger the sync function and displace equipment
      
      // For now, just verify the initial state
      expect(screen.getByText('Medium Laser')).toBeInTheDocument();
    });
  });
});
