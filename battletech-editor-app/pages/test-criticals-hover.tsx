import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import CriticalsTabWithHooks from '../components/editor/tabs/CriticalsTabWithHooks';
import { UnitDataProvider } from '../hooks/useUnitData';

// Create a test unit with some equipment
const createTestUnit = () => {
  const baseUnit = {
    id: 'test-atlas',
    model: 'AS7-D',
    chassis: 'Atlas',
    mass: 100,
    tech_base: 'Inner Sphere' as const,
    engine_rating: 300,
    engine_type: 'Standard' as const,
    gyro_type: 'Standard' as const,
    structure_type: 'Standard' as const,
    armor_type: 'Standard' as const,
    heat_sink_type: 'Single' as const,
    heat_sinks: 20,
    walk_mp: 3,
    jump_mp: 0,
    armor_total: 304,
    structure_total: 152,
    cost: 9626000,
    bv: 1897,
    rules_level: 'Tournament Legal' as const,
    data: {
      unit_type: 'BipedMech',
      sub_type: 'Biped',
      tech_rating: 'D',
      design_year: 2755,
      date_introduced: '2755',
      era: 'Star League',
      production_year: 2755,
      cost_multiplier: 1,
      dry_weight: 0,
      chassis_config: 'Biped',
      myomer_type: 'Standard',
      partial_wing: false,
      quirks: {
        positive: [],
        negative: []
      },
      equipment_layout: 'Standard',
      weapons_and_equipment: [
        // Multi-slot weapons to test hovering
        { item_name: 'LRM 20', location: '', item_type: 'weapon' as const, tech_base: 'IS' as const },
        { item_name: 'LRM 20', location: '', item_type: 'weapon' as const, tech_base: 'IS' as const },
        { item_name: 'LRM 20', location: '', item_type: 'weapon' as const, tech_base: 'IS' as const },
        { item_name: 'LRM 20', location: '', item_type: 'weapon' as const, tech_base: 'IS' as const },
        { item_name: 'LRM 20', location: '', item_type: 'weapon' as const, tech_base: 'IS' as const },
        { item_name: 'AC/10', location: '', item_type: 'weapon' as const, tech_base: 'IS' as const },
        { item_name: 'AC/10', location: '', item_type: 'weapon' as const, tech_base: 'IS' as const },
        { item_name: 'Medium Laser', location: '', item_type: 'weapon' as const, tech_base: 'IS' as const },
        { item_name: 'Medium Laser', location: '', item_type: 'weapon' as const, tech_base: 'IS' as const },
        // Heat sinks with different slot counts
        { item_name: 'Heat Sink', location: '', item_type: 'equipment' as const, tech_base: 'IS' as const },
        { item_name: 'Heat Sink', location: '', item_type: 'equipment' as const, tech_base: 'IS' as const },
        { item_name: 'Heat Sink', location: '', item_type: 'equipment' as const, tech_base: 'IS' as const },
        { item_name: 'Heat Sink', location: '', item_type: 'equipment' as const, tech_base: 'IS' as const },
        { item_name: 'Heat Sink', location: '', item_type: 'equipment' as const, tech_base: 'IS' as const },
        { item_name: 'Heat Sink', location: '', item_type: 'equipment' as const, tech_base: 'IS' as const },
        { item_name: 'Heat Sink', location: '', item_type: 'equipment' as const, tech_base: 'IS' as const },
        { item_name: 'Heat Sink', location: '', item_type: 'equipment' as const, tech_base: 'IS' as const },
        { item_name: 'Heat Sink', location: '', item_type: 'equipment' as const, tech_base: 'IS' as const },
        { item_name: 'Heat Sink', location: '', item_type: 'equipment' as const, tech_base: 'IS' as const },
      ],
    }
  };

  return baseUnit as any;
};

export default function TestCriticalsHover() {
  const testUnit = createTestUnit();

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '20px' }}>Critical Slots Multi-Slot Hover Test</h1>
      
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: '10px' }}>Instructions:</h2>
        <ol style={{ marginBottom: '20px' }}>
          <li>The unallocated equipment panel on the right shows various weapons and equipment</li>
          <li>LRM 20 weapons take 5 critical slots each</li>
          <li>AC/10 weapons take 3 critical slots each</li>
          <li>Medium Lasers take 1 critical slot each</li>
          <li>Heat Sinks take 1 critical slot each</li>
          <li><strong>When you hover over a critical slot while dragging equipment, all slots that would be occupied should highlight in blue</strong></li>
        </ol>
      </div>

      <div style={{ marginTop: '20px' }}>
        <UnitDataProvider initialUnit={testUnit}>
          <CriticalsTabWithHooks />
        </UnitDataProvider>
      </div>
    </div>
  );
}
