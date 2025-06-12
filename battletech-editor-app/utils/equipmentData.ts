// Equipment data that can be shared across components
export interface EquipmentItem {
  id: string;
  name: string;
  damage: string | number;
  heat: number;
  minRange: number;
  range: string;
  shots: string;
  base: string;
  bv: number;
  weight: number;
  crits: number;
  reference: string;
  year: number;
  techBase: string;
  category: string;
  isPrototype: boolean;
  isOneShot: boolean;
  isTorpedo: boolean;
  isAmmo: boolean;
  weaponType?: string;
}

export const EQUIPMENT_DATABASE: EquipmentItem[] = [
  { id: '1', name: 'AC/2', damage: 2, heat: 1, minRange: 4, range: '8/16/24', shots: '-', base: 'All', bv: 37, weight: 6, crits: 1, reference: '208, TM', year: 2300, techBase: 'IS', category: 'Ballistic', isPrototype: false, isOneShot: false, isTorpedo: false, isAmmo: false },
  { id: '2', name: 'AC/5', damage: 5, heat: 1, minRange: 3, range: '6/12/18', shots: '-', base: 'All', bv: 70, weight: 8, crits: 4, reference: '208, TM', year: 2300, techBase: 'IS', category: 'Ballistic', isPrototype: false, isOneShot: false, isTorpedo: false, isAmmo: false },
  { id: '3', name: 'AC/10', damage: 10, heat: 3, minRange: 0, range: '5/10/15', shots: '-', base: 'All', bv: 123, weight: 12, crits: 7, reference: '208, TM', year: 2300, techBase: 'IS', category: 'Ballistic', isPrototype: false, isOneShot: false, isTorpedo: false, isAmmo: false },
  { id: '4', name: 'AC/20', damage: 20, heat: 7, minRange: 0, range: '3/6/9', shots: '-', base: 'All', bv: 178, weight: 14, crits: 10, reference: '208, TM', year: 2300, techBase: 'IS', category: 'Ballistic', isPrototype: false, isOneShot: false, isTorpedo: false, isAmmo: false },
  { id: '5', name: 'Medium Laser', damage: 5, heat: 3, minRange: 0, range: '3/6/9', shots: '-', base: 'All', bv: 46, weight: 1, crits: 1, reference: '227, TM', year: 2300, techBase: 'IS', category: 'Energy', isPrototype: false, isOneShot: false, isTorpedo: false, isAmmo: false },
  { id: '6', name: 'Large Laser', damage: 8, heat: 8, minRange: 0, range: '5/10/15', shots: '-', base: 'All', bv: 123, weight: 5, crits: 2, reference: '227, TM', year: 2300, techBase: 'IS', category: 'Energy', isPrototype: false, isOneShot: false, isTorpedo: false, isAmmo: false },
  { id: '7', name: 'Small Laser', damage: 3, heat: 1, minRange: 0, range: '1/2/3', shots: '-', base: 'All', bv: 9, weight: 0.5, crits: 1, reference: '227, TM', year: 2300, techBase: 'IS', category: 'Energy', isPrototype: false, isOneShot: false, isTorpedo: false, isAmmo: false },
  { id: '8', name: 'PPC', damage: 10, heat: 10, minRange: 3, range: '6/12/18', shots: '-', base: 'All', bv: 176, weight: 7, crits: 3, reference: '229, TM', year: 2751, techBase: 'IS', category: 'Energy', isPrototype: false, isOneShot: false, isTorpedo: false, isAmmo: false },
  { id: '9', name: 'LRM 5', damage: '1/msl', heat: 2, minRange: 6, range: '7/14/21', shots: '-', base: 'IS', bv: 45, weight: 2, crits: 1, reference: '229, TM', year: 2300, techBase: 'IS', category: 'Missile', isPrototype: false, isOneShot: false, isTorpedo: false, isAmmo: false },
  { id: '10', name: 'LRM 10', damage: '1/msl', heat: 4, minRange: 6, range: '7/14/21', shots: '-', base: 'IS', bv: 104, weight: 5, crits: 2, reference: '229, TM', year: 2300, techBase: 'IS', category: 'Missile', isPrototype: false, isOneShot: false, isTorpedo: false, isAmmo: false },
  { id: '11', name: 'LRM 15', damage: '1/msl', heat: 5, minRange: 6, range: '7/14/21', shots: '-', base: 'IS', bv: 157, weight: 7, crits: 3, reference: '229, TM', year: 2300, techBase: 'IS', category: 'Missile', isPrototype: false, isOneShot: false, isTorpedo: false, isAmmo: false },
  { id: '12', name: 'LRM 20', damage: '1/msl', heat: 6, minRange: 6, range: '7/14/21', shots: '-', base: 'IS', bv: 210, weight: 10, crits: 5, reference: '229, TM', year: 2300, techBase: 'IS', category: 'Missile', isPrototype: false, isOneShot: false, isTorpedo: false, isAmmo: false },
  { id: '13', name: 'SRM 2', damage: '2/msl', heat: 2, minRange: 0, range: '3/6/9', shots: '-', base: 'All', bv: 21, weight: 1, crits: 1, reference: '229, TM', year: 2370, techBase: 'IS', category: 'Missile', isPrototype: false, isOneShot: false, isTorpedo: false, isAmmo: false },
  { id: '14', name: 'SRM 4', damage: '2/msl', heat: 3, minRange: 0, range: '3/6/9', shots: '-', base: 'All', bv: 39, weight: 2, crits: 1, reference: '229, TM', year: 2370, techBase: 'IS', category: 'Missile', isPrototype: false, isOneShot: false, isTorpedo: false, isAmmo: false },
  { id: '15', name: 'SRM 6', damage: '2/msl', heat: 4, minRange: 0, range: '3/6/9', shots: '-', base: 'All', bv: 59, weight: 3, crits: 2, reference: '229, TM', year: 2370, techBase: 'IS', category: 'Missile', isPrototype: false, isOneShot: false, isTorpedo: false, isAmmo: false },
  { id: '16', name: 'Enhanced LRM 5', damage: '1/msl', heat: 3, minRange: 3, range: '7/14/21', shots: '-', base: 'IS', bv: 67, weight: 3, crits: 2, reference: '326, TO', year: 3058, techBase: 'IS', category: 'Missile', isPrototype: false, isOneShot: false, isTorpedo: false, isAmmo: false },
  { id: '17', name: 'Enhanced LRM 10', damage: '1/msl', heat: 6, minRange: 3, range: '7/14/21', shots: '-', base: 'IS', bv: 134, weight: 6, crits: 4, reference: '326, TO', year: 3058, techBase: 'IS', category: 'Missile', isPrototype: false, isOneShot: false, isTorpedo: false, isAmmo: false },
  { id: '18', name: 'Enhanced LRM 15', damage: '1/msl', heat: 8, minRange: 3, range: '7/14/21', shots: '-', base: 'IS', bv: 200, weight: 9, crits: 6, reference: '326, TO', year: 3058, techBase: 'IS', category: 'Missile', isPrototype: false, isOneShot: false, isTorpedo: false, isAmmo: false },
  { id: '19', name: 'Enhanced LRM 20', damage: '1/msl', heat: 10, minRange: 3, range: '7/14/21', shots: '-', base: 'IS', bv: 268, weight: 12, crits: 8, reference: '326, TO', year: 3058, techBase: 'IS', category: 'Missile', isPrototype: false, isOneShot: false, isTorpedo: false, isAmmo: false },
  { id: '20', name: 'Flamer', damage: 2, heat: 3, minRange: 0, range: '1/2/3', shots: '-', base: 'All', bv: 6, weight: 1, crits: 1, reference: '218, TM', year: 2025, techBase: 'IS', category: 'Energy', isPrototype: false, isOneShot: false, isTorpedo: false, isAmmo: false },
  { id: '21', name: 'Machine Gun', damage: 2, heat: 0, minRange: 0, range: '1/2/3', shots: '-', base: 'All', bv: 5, weight: 0.5, crits: 1, reference: '228, TM', year: 1950, techBase: 'IS', category: 'Ballistic', isPrototype: false, isOneShot: false, isTorpedo: false, isAmmo: false },
];

// Calculate heat generation from weapons
export function calculateHeatGeneration(weapons: { item_name: string }[]): number {
  return weapons.reduce((total, weapon) => {
    const equipment = EQUIPMENT_DATABASE.find(e => e.name === weapon.item_name);
    return total + (equipment?.heat || 0);
  }, 0);
}

// Calculate total equipment weight
export function calculateEquipmentWeight(equipment: { item_name: string }[]): number {
  return equipment.reduce((total, item) => {
    const equip = EQUIPMENT_DATABASE.find(e => e.name === item.item_name);
    return total + (equip?.weight || 0);
  }, 0);
}

// Calculate total critical slots used
export function calculateCriticalSlots(equipment: { item_name: string }[]): number {
  return equipment.reduce((total, item) => {
    const equip = EQUIPMENT_DATABASE.find(e => e.name === item.item_name);
    return total + (equip?.crits || 0);
  }, 0);
}

// Calculate battle value from equipment
export function calculateEquipmentBV(equipment: { item_name: string }[]): number {
  return equipment.reduce((total, item) => {
    const equip = EQUIPMENT_DATABASE.find(e => e.name === item.item_name);
    return total + (equip?.bv || 0);
  }, 0);
}
