export interface Mounted {
  name: string;
  type: string;
  rearMounted?: boolean;
  turretMounted?: boolean;
  podMounted?: boolean;
  location: number;
  secondLocation?: number;
  criticals: number;
  [key: string]: any;
}

export interface CriticalSlot {
  type: 'SYSTEM' | 'EQUIPMENT' | 'EMPTY';
  mount?: Mounted;
  mount2?: Mounted;
  system?: string;
}
