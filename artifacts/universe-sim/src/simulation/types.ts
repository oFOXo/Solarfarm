export enum ParticleType {
  VACUUM = 0,
  DARK_MATTER = 1,
  HYDROGEN = 2,
  HELIUM = 3,
  NEBULA = 4,
  PLASMA = 5,
  PROTOSTAR = 6,
  STAR = 7,
  GIANT = 8,
  NEUTRON_STAR = 9,
  BLACK_HOLE = 10,
  ANTIMATTER = 11,
}

export const PARTICLE_COLORS: Record<ParticleType, [number, number, number]> = {
  [ParticleType.VACUUM]: [2, 2, 10],
  [ParticleType.DARK_MATTER]: [22, 15, 38],
  [ParticleType.HYDROGEN]: [15, 35, 110],
  [ParticleType.HELIUM]: [30, 65, 170],
  [ParticleType.NEBULA]: [90, 15, 130],
  [ParticleType.PLASMA]: [255, 130, 15],
  [ParticleType.PROTOSTAR]: [255, 210, 60],
  [ParticleType.STAR]: [255, 255, 210],
  [ParticleType.GIANT]: [255, 80, 20],
  [ParticleType.NEUTRON_STAR]: [80, 210, 255],
  [ParticleType.BLACK_HOLE]: [4, 0, 12],
  [ParticleType.ANTIMATTER]: [255, 0, 180],
};

export const PARTICLE_GLOW: Record<ParticleType, number> = {
  [ParticleType.VACUUM]: 0,
  [ParticleType.DARK_MATTER]: 0,
  [ParticleType.HYDROGEN]: 0.05,
  [ParticleType.HELIUM]: 0.08,
  [ParticleType.NEBULA]: 0.15,
  [ParticleType.PLASMA]: 0.6,
  [ParticleType.PROTOSTAR]: 0.8,
  [ParticleType.STAR]: 1.0,
  [ParticleType.GIANT]: 0.9,
  [ParticleType.NEUTRON_STAR]: 0.95,
  [ParticleType.BLACK_HOLE]: 0,
  [ParticleType.ANTIMATTER]: 0.9,
};

export const PARTICLE_NAMES: Record<ParticleType, string> = {
  [ParticleType.VACUUM]: 'Vacuum',
  [ParticleType.DARK_MATTER]: 'Dark Matter',
  [ParticleType.HYDROGEN]: 'Hydrogen',
  [ParticleType.HELIUM]: 'Helium',
  [ParticleType.NEBULA]: 'Nebula',
  [ParticleType.PLASMA]: 'Plasma',
  [ParticleType.PROTOSTAR]: 'Protostar',
  [ParticleType.STAR]: 'Star',
  [ParticleType.GIANT]: 'Red Giant',
  [ParticleType.NEUTRON_STAR]: 'Neutron Star',
  [ParticleType.BLACK_HOLE]: 'Black Hole',
  [ParticleType.ANTIMATTER]: 'Antimatter',
};

export const PARTICLE_MASS: Record<ParticleType, number> = {
  [ParticleType.VACUUM]: 0,
  [ParticleType.DARK_MATTER]: 3,
  [ParticleType.HYDROGEN]: 1,
  [ParticleType.HELIUM]: 1.5,
  [ParticleType.NEBULA]: 2,
  [ParticleType.PLASMA]: 1.5,
  [ParticleType.PROTOSTAR]: 5,
  [ParticleType.STAR]: 10,
  [ParticleType.GIANT]: 15,
  [ParticleType.NEUTRON_STAR]: 25,
  [ParticleType.BLACK_HOLE]: 50,
  [ParticleType.ANTIMATTER]: 1,
};

export interface Cell {
  type: ParticleType;
  temperature: number;
  density: number;
  age: number;
}

export interface PhysicsConstants {
  G: number;
  fusionTemp: number;
  fusionDensity: number;
  expansionRate: number;
  coolingRate: number;
  darkEnergy: number;
  stellarMassLimit: number;
  plasmaThreshold: number;
}

export const DEFAULT_PHYSICS: PhysicsConstants = {
  G: 1.5,
  fusionTemp: 450,
  fusionDensity: 8,
  expansionRate: 0.003,
  coolingRate: 0.985,
  darkEnergy: 0.1,
  stellarMassLimit: 100,
  plasmaThreshold: 200,
};

export interface UniverseStats {
  tick: number;
  generation: number;
  mutationCount: number;
  counts: Partial<Record<ParticleType, number>>;
  totalCells: number;
  avgTemperature: number;
  maxTemperature: number;
  entropy: number;
  complexity: number;
  rlReward: number;
  physics: PhysicsConstants;
  rlAction: string;
  epsilon: number;
}
