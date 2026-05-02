import { PhysicsConstants, DEFAULT_PHYSICS } from './types';

const ACTIONS = [
  { name: 'G ↑', key: 'G' as keyof PhysicsConstants, delta: 0.2 },
  { name: 'G ↓', key: 'G' as keyof PhysicsConstants, delta: -0.2 },
  { name: 'FusionTemp ↑', key: 'fusionTemp' as keyof PhysicsConstants, delta: 30 },
  { name: 'FusionTemp ↓', key: 'fusionTemp' as keyof PhysicsConstants, delta: -30 },
  { name: 'Expansion ↑', key: 'expansionRate' as keyof PhysicsConstants, delta: 0.002 },
  { name: 'Expansion ↓', key: 'expansionRate' as keyof PhysicsConstants, delta: -0.002 },
  { name: 'DarkEnergy ↑', key: 'darkEnergy' as keyof PhysicsConstants, delta: 0.05 },
  { name: 'DarkEnergy ↓', key: 'darkEnergy' as keyof PhysicsConstants, delta: -0.05 },
  { name: 'Cooling ↑', key: 'coolingRate' as keyof PhysicsConstants, delta: 0.005 },
  { name: 'Cooling ↓', key: 'coolingRate' as keyof PhysicsConstants, delta: -0.005 },
  { name: 'PlasmaThresh ↑', key: 'plasmaThreshold' as keyof PhysicsConstants, delta: 20 },
  { name: 'PlasmaThresh ↓', key: 'plasmaThreshold' as keyof PhysicsConstants, delta: -20 },
];

const NUM_ACTIONS = ACTIONS.length;

const BOUNDS: Record<keyof PhysicsConstants, [number, number]> = {
  G: [0.3, 4.0],
  fusionTemp: [150, 900],
  fusionDensity: [4, 18],
  expansionRate: [0.0005, 0.025],
  coolingRate: [0.92, 0.999],
  darkEnergy: [0, 0.6],
  stellarMassLimit: [40, 200],
  plasmaThreshold: [80, 500],
};

function encodeState(
  vacuumFrac: number,
  hydroFrac: number,
  starFrac: number,
  bhFrac: number,
  avgTemp: number,
  entropy: number,
): number {
  const b0 = vacuumFrac > 0.7 ? 2 : vacuumFrac > 0.4 ? 1 : 0;
  const b1 = hydroFrac > 0.3 ? 2 : hydroFrac > 0.1 ? 1 : 0;
  const b2 = starFrac > 0.05 ? 2 : starFrac > 0.01 ? 1 : 0;
  const b3 = bhFrac > 0.01 ? 2 : bhFrac > 0.002 ? 1 : 0;
  const b4 = avgTemp > 300 ? 2 : avgTemp > 80 ? 1 : 0;
  const b5 = entropy > 1.5 ? 2 : entropy > 0.8 ? 1 : 0;
  return b0 + 3 * b1 + 9 * b2 + 27 * b3 + 81 * b4 + 243 * b5;
}

export class RLAgent {
  private qTable: Float32Array;
  private stateSize = 729;
  epsilon: number = 0.6;
  private alpha = 0.15;
  private gamma = 0.9;
  private lastState: number = -1;
  private lastAction: number = -1;
  generation: number = 0;
  mutationCount: number = 0;
  lastAction_name: string = 'idle';
  lastReward: number = 0;

  constructor() {
    this.qTable = new Float32Array(this.stateSize * NUM_ACTIONS).fill(0);
  }

  computeComplexity(
    counts: Partial<Record<number, number>>,
    totalCells: number,
    avgTemp: number,
  ): number {
    const typeCount = Object.values(counts).filter(v => (v ?? 0) > 0).length;
    const starCount = (counts[7] ?? 0) + (counts[8] ?? 0);
    const bhCount = counts[10] ?? 0;
    const nebulaCount = counts[4] ?? 0;
    const vacuumFrac = (counts[0] ?? 0) / totalCells;

    let score = typeCount * 12;
    score += starCount * 6;
    score += bhCount * 4;
    score += nebulaCount * 2;
    score -= vacuumFrac * 60;
    score += Math.min(avgTemp / 50, 10);
    return Math.max(0, score);
  }

  update(
    counts: Partial<Record<number, number>>,
    totalCells: number,
    avgTemp: number,
  ): string {
    const vacuumFrac = (counts[0] ?? 0) / totalCells;
    const hydroFrac = ((counts[2] ?? 0) + (counts[3] ?? 0)) / totalCells;
    const starFrac = ((counts[7] ?? 0) + (counts[8] ?? 0)) / totalCells;
    const bhFrac = (counts[10] ?? 0) / totalCells;
    const typeCount = Object.values(counts).filter(v => (v ?? 0) > 0).length;
    const entropy = Math.log(Math.max(typeCount, 1));

    const currentState = encodeState(vacuumFrac, hydroFrac, starFrac, bhFrac, avgTemp, entropy);
    const currentComplexity = this.computeComplexity(counts, totalCells, avgTemp);
    const reward = currentComplexity;
    this.lastReward = reward;

    if (this.lastState >= 0 && this.lastAction >= 0) {
      const oldQ = this.qTable[this.lastState * NUM_ACTIONS + this.lastAction];
      let maxQ = -Infinity;
      for (let a = 0; a < NUM_ACTIONS; a++) {
        const q = this.qTable[currentState * NUM_ACTIONS + a];
        if (q > maxQ) maxQ = q;
      }
      const newQ = oldQ + this.alpha * (reward + this.gamma * maxQ - oldQ);
      this.qTable[this.lastState * NUM_ACTIONS + this.lastAction] = newQ;
    }

    let action: number;
    if (Math.random() < this.epsilon) {
      action = Math.floor(Math.random() * NUM_ACTIONS);
    } else {
      let bestQ = -Infinity;
      action = 0;
      for (let a = 0; a < NUM_ACTIONS; a++) {
        const q = this.qTable[currentState * NUM_ACTIONS + a];
        if (q > bestQ) { bestQ = q; action = a; }
      }
    }

    this.lastState = currentState;
    this.lastAction = action;
    this.generation++;
    this.epsilon = Math.max(0.05, this.epsilon * 0.998);
    this.lastAction_name = ACTIONS[action].name;
    return ACTIONS[action].name;
  }

  applyAction(physics: PhysicsConstants): PhysicsConstants {
    if (this.lastAction < 0) return physics;
    const action = ACTIONS[this.lastAction];
    const key = action.key;
    const newVal = (physics[key] as number) + action.delta;
    const [lo, hi] = BOUNDS[key];
    return { ...physics, [key]: Math.max(lo, Math.min(hi, newVal)) };
  }

  randomMutation(physics: PhysicsConstants): PhysicsConstants {
    this.mutationCount++;
    const keys = Object.keys(BOUNDS) as (keyof PhysicsConstants)[];
    const key = keys[Math.floor(Math.random() * keys.length)];
    const [lo, hi] = BOUNDS[key];
    const range = hi - lo;
    const perturbation = (Math.random() - 0.5) * range * 0.08;
    const newVal = Math.max(lo, Math.min(hi, (physics[key] as number) + perturbation));
    return { ...physics, [key]: newVal };
  }

  resetToDefault(): void {
    this.qTable.fill(0);
    this.epsilon = 0.6;
    this.generation = 0;
    this.mutationCount = 0;
    this.lastState = -1;
    this.lastAction = -1;
    this.lastAction_name = 'idle';
  }
}

export type { PhysicsConstants };
export { DEFAULT_PHYSICS };
