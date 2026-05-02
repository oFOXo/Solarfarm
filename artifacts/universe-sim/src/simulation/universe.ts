import {
  ParticleType,
  Cell,
  PhysicsConstants,
  DEFAULT_PHYSICS,
  PARTICLE_MASS,
  UniverseStats,
} from './types';
import { RLAgent } from './rl-agent';

const RL_UPDATE_INTERVAL = 400;
const MUTATION_INTERVAL = 180;

function makeCell(type: ParticleType, temp = 0, density = 1): Cell {
  return { type, temperature: temp, density, age: 0 };
}

function idx(x: number, y: number, w: number) {
  return y * w + x;
}

export class Universe {
  width: number;
  height: number;
  cells: Cell[];
  nextCells: Cell[];
  physics: PhysicsConstants;
  rlAgent: RLAgent;
  tick: number = 0;
  enableRL: boolean = true;
  enableMutation: boolean = true;
  private shuffledIndices: number[];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.physics = { ...DEFAULT_PHYSICS };
    this.rlAgent = new RLAgent();
    this.cells = this.initBigBang();
    this.nextCells = this.cells.map(c => ({ ...c }));
    this.shuffledIndices = Array.from({ length: width * height }, (_, i) => i);
  }

  private initBigBang(): Cell[] {
    const cells: Cell[] = [];
    const cx = this.width / 2;
    const cy = this.height / 2;
    const totalCells = this.width * this.height;

    for (let i = 0; i < totalCells; i++) {
      cells.push(makeCell(ParticleType.VACUUM, 0, 0));
    }

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.min(this.width, this.height) / 2;
        const r = Math.random();

        if (dist < maxDist * 0.12) {
          cells[idx(x, y, this.width)] = makeCell(ParticleType.PLASMA, 800, 8);
        } else if (dist < maxDist * 0.25) {
          const t = r < 0.5 ? ParticleType.HYDROGEN : ParticleType.HELIUM;
          cells[idx(x, y, this.width)] = makeCell(t, 300 - dist * 3, 5);
        } else if (dist < maxDist * 0.55) {
          if (r < 0.45) cells[idx(x, y, this.width)] = makeCell(ParticleType.HYDROGEN, 80, 2);
          else if (r < 0.56) cells[idx(x, y, this.width)] = makeCell(ParticleType.HELIUM, 60, 2);
          else if (r < 0.62) cells[idx(x, y, this.width)] = makeCell(ParticleType.DARK_MATTER, 5, 3);
          else cells[idx(x, y, this.width)] = makeCell(ParticleType.VACUUM, 0, 0);
        } else if (dist < maxDist * 0.82) {
          if (r < 0.2) cells[idx(x, y, this.width)] = makeCell(ParticleType.HYDROGEN, 20, 1);
          else if (r < 0.25) cells[idx(x, y, this.width)] = makeCell(ParticleType.DARK_MATTER, 2, 3);
          else cells[idx(x, y, this.width)] = makeCell(ParticleType.VACUUM, 0, 0);
        } else {
          if (r < 0.04) cells[idx(x, y, this.width)] = makeCell(ParticleType.DARK_MATTER, 0, 3);
          else cells[idx(x, y, this.width)] = makeCell(ParticleType.VACUUM, 0, 0);
        }
      }
    }
    return cells;
  }

  private shuffle(arr: number[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
  }

  private get(x: number, y: number): Cell {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return makeCell(ParticleType.VACUUM);
    }
    return this.cells[idx(x, y, this.width)];
  }

  private computeGravity(x: number, y: number): [number, number] {
    let fx = 0, fy = 0;
    const R = 4;
    const G = this.physics.G;
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;
        const neighbor = this.cells[idx(nx, ny, this.width)];
        const mass = PARTICLE_MASS[neighbor.type];
        if (mass < 1) continue;
        const dist2 = dx * dx + dy * dy;
        const force = (G * mass) / dist2;
        const dist = Math.sqrt(dist2);
        fx += (force * dx) / dist;
        fy += (force * dy) / dist;
      }
    }
    return [fx, fy];
  }

  private countNeighborType(x: number, y: number, type: ParticleType, r = 2): number {
    let count = 0;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx === 0 && dy === 0) continue;
        const c = this.get(x + dx, y + dy);
        if (c.type === type) count++;
      }
    }
    return count;
  }

  private avgNeighborTemp(x: number, y: number, r = 1): number {
    let total = 0, count = 0;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const c = this.get(x + dx, y + dy);
        total += c.temperature;
        count++;
      }
    }
    return count > 0 ? total / count : 0;
  }

  step(): void {
    const { width, height, physics } = this;
    const total = width * height;

    for (let i = 0; i < total; i++) {
      this.nextCells[i] = { ...this.cells[i] };
      this.nextCells[i].age++;
    }

    this.shuffle(this.shuffledIndices);

    for (const i of this.shuffledIndices) {
      const x = i % width;
      const y = Math.floor(i / width);
      const cell = this.cells[i];

      if (cell.type === ParticleType.BLACK_HOLE) {
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
            const nidx = idx(nx, ny, width);
            const neighbor = this.cells[nidx];
            if (
              neighbor.type !== ParticleType.VACUUM &&
              neighbor.type !== ParticleType.BLACK_HOLE &&
              neighbor.type !== ParticleType.DARK_MATTER
            ) {
              const dist2 = dx * dx + dy * dy;
              const prob = Math.min(0.9, (physics.G * 50) / (dist2 * 8));
              if (Math.random() < prob) {
                this.nextCells[nidx] = makeCell(ParticleType.VACUUM, 0, 0);
                const me = this.nextCells[i];
                me.age = (me.age ?? 0) + 1;
              }
            }
          }
        }
        continue;
      }

      if (cell.type === ParticleType.NEUTRON_STAR) {
        this.nextCells[i].temperature = Math.min(2000, cell.temperature + 5);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
            const nidx = idx(nx, ny, width);
            this.nextCells[nidx].temperature = Math.min(
              this.nextCells[nidx].temperature + 30,
              2000
            );
          }
        }
        continue;
      }

      if (cell.type === ParticleType.STAR || cell.type === ParticleType.GIANT) {
        const heatOutput = cell.type === ParticleType.GIANT ? 80 : 55;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
            const nidx = idx(nx, ny, width);
            const dist2 = Math.max(1, dx * dx + dy * dy);
            this.nextCells[nidx].temperature = Math.min(
              2000,
              this.nextCells[nidx].temperature + heatOutput / dist2
            );
          }
        }

        const starAge = cell.age;
        const massLimit = physics.stellarMassLimit;
        if (cell.type === ParticleType.STAR && starAge > massLimit * 4) {
          if (Math.random() < 0.003) {
            const neighborMass = this.countNeighborType(x, y, ParticleType.STAR, 1);
            this.nextCells[i] = makeCell(
              neighborMass >= 2 ? ParticleType.BLACK_HOLE : ParticleType.GIANT,
              cell.temperature,
              cell.density
            );
          }
        } else if (cell.type === ParticleType.GIANT && starAge > 30) {
          if (Math.random() < 0.004) {
            this.nextCells[i] = makeCell(ParticleType.NEUTRON_STAR, 1500, cell.density);
            for (let dy = -3; dy <= 3; dy++) {
              for (let dx = -3; dx <= 3; dx++) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                if (Math.random() < 0.5) {
                  this.nextCells[idx(nx, ny, width)] = makeCell(
                    Math.random() < 0.3 ? ParticleType.PLASMA : ParticleType.HYDROGEN,
                    300, 2
                  );
                }
              }
            }
          }
        }
        continue;
      }

      if (cell.type === ParticleType.PROTOSTAR) {
        this.nextCells[i].temperature = Math.min(2000, cell.temperature + 15);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
            this.nextCells[idx(nx, ny, width)].temperature = Math.min(
              this.nextCells[idx(nx, ny, width)].temperature + 20, 2000
            );
          }
        }
        if (cell.temperature >= physics.fusionTemp * 0.85 && cell.age > 20) {
          this.nextCells[i] = makeCell(ParticleType.STAR, cell.temperature, cell.density);
        }
        continue;
      }

      if (cell.type === ParticleType.VACUUM || cell.type === ParticleType.DARK_MATTER) {
        continue;
      }

      let newTemp = cell.temperature * physics.coolingRate;
      const neighborTemp = this.avgNeighborTemp(x, y, 1);
      newTemp = newTemp * 0.85 + neighborTemp * 0.15;

      if (cell.type === ParticleType.PLASMA) {
        if (newTemp < physics.plasmaThreshold * 0.6) {
          this.nextCells[i] = makeCell(ParticleType.HYDROGEN, newTemp, cell.density);
          continue;
        }
      }

      if (cell.type === ParticleType.NEBULA) {
        const localH = this.countNeighborType(x, y, ParticleType.HYDROGEN, 2)
          + this.countNeighborType(x, y, ParticleType.HELIUM, 2)
          + this.countNeighborType(x, y, ParticleType.NEBULA, 2);
        if (localH >= physics.fusionDensity && newTemp >= physics.fusionTemp * 0.5) {
          this.nextCells[i] = makeCell(ParticleType.PROTOSTAR, newTemp + 100, cell.density);
          continue;
        }
        if (newTemp > physics.plasmaThreshold) {
          this.nextCells[i] = makeCell(ParticleType.PLASMA, newTemp, cell.density);
          continue;
        }
      }

      if (
        (cell.type === ParticleType.HYDROGEN || cell.type === ParticleType.HELIUM)
      ) {
        const localDensity = this.countNeighborType(x, y, ParticleType.HYDROGEN, 2)
          + this.countNeighborType(x, y, ParticleType.HELIUM, 2)
          + this.countNeighborType(x, y, ParticleType.NEBULA, 2);

        if (newTemp > physics.plasmaThreshold) {
          this.nextCells[i] = makeCell(ParticleType.PLASMA, newTemp, cell.density);
          continue;
        }

        if (localDensity >= physics.fusionDensity * 0.7 && Math.random() < 0.04) {
          this.nextCells[i] = makeCell(ParticleType.NEBULA, newTemp + 20, cell.density);
          continue;
        }
      }

      if (cell.type === ParticleType.ANTIMATTER) {
        const neighbors = [
          [0, -1], [0, 1], [-1, 0], [1, 0]
        ] as [number, number][];
        let annihilated = false;
        for (const [dx, dy] of neighbors) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const nidx = idx(nx, ny, width);
          const nc = this.cells[nidx];
          if (
            nc.type !== ParticleType.ANTIMATTER &&
            nc.type !== ParticleType.VACUUM &&
            nc.type !== ParticleType.DARK_MATTER
          ) {
            this.nextCells[i] = makeCell(ParticleType.VACUUM, 0, 0);
            this.nextCells[nidx] = makeCell(ParticleType.PLASMA, 1200, 4);
            annihilated = true;
            break;
          }
        }
        if (annihilated) continue;
      }

      if (cell.type !== ParticleType.VACUUM && cell.type !== ParticleType.DARK_MATTER) {
        const [fx, fy] = this.computeGravity(x, y);
        const magnitude = Math.sqrt(fx * fx + fy * fy);
        if (magnitude > 0.3) {
          const nx = Math.round(x + fx / magnitude);
          const ny = Math.round(y + fy / magnitude);
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nidx = idx(nx, ny, width);
            const neighbor = this.cells[nidx];
            const myMass = PARTICLE_MASS[cell.type];
            const nMass = PARTICLE_MASS[neighbor.type];
            if (nMass < myMass && Math.random() < Math.min(0.4, magnitude * 0.08)) {
              const tmp = { ...this.nextCells[i] };
              this.nextCells[i] = { ...this.nextCells[nidx] };
              this.nextCells[nidx] = tmp;
            }
          }
        }

        if (
          physics.expansionRate > 0 &&
          Math.random() < physics.expansionRate * physics.darkEnergy
        ) {
          const edx = x < width / 2 ? -1 : 1;
          const edy = y < height / 2 ? -1 : 1;
          const ex = x + edx, ey = y + edy;
          if (ex >= 0 && ex < width && ey >= 0 && ey < height) {
            const eidx = idx(ex, ey, width);
            if (this.cells[eidx].type === ParticleType.VACUUM) {
              this.nextCells[i] = makeCell(ParticleType.VACUUM, 0, 0);
              this.nextCells[eidx] = { ...cell, temperature: newTemp };
              continue;
            }
          }
        }
      }

      this.nextCells[i].temperature = Math.max(0, newTemp);
    }

    [this.cells, this.nextCells] = [this.nextCells, this.cells];
    this.tick++;

    if (this.enableRL && this.tick % RL_UPDATE_INTERVAL === 0) {
      const stats = this.computeStats();
      this.rlAgent.update(stats.counts, stats.totalCells, stats.avgTemperature);
      if (this.enableRL) {
        this.physics = this.rlAgent.applyAction(this.physics);
      }
    }

    if (this.enableMutation && this.tick % MUTATION_INTERVAL === 0) {
      this.physics = this.rlAgent.randomMutation(this.physics);
    }

    if (this.tick % 800 === 0) {
      this.spawnAntimatter();
    }
  }

  private spawnAntimatter(): void {
    const x = Math.floor(Math.random() * this.width);
    const y = Math.floor(Math.random() * this.height);
    const cell = this.cells[idx(x, y, this.width)];
    if (cell.type === ParticleType.VACUUM || cell.type === ParticleType.HYDROGEN) {
      this.cells[idx(x, y, this.width)] = makeCell(ParticleType.ANTIMATTER, 50, 1);
    }
  }

  computeStats(): UniverseStats {
    const counts: Partial<Record<ParticleType, number>> = {};
    let totalTemp = 0;
    let maxTemp = 0;
    let nonVacuum = 0;

    for (const cell of this.cells) {
      counts[cell.type] = (counts[cell.type] ?? 0) + 1;
      if (cell.type !== ParticleType.VACUUM) {
        totalTemp += cell.temperature;
        nonVacuum++;
        if (cell.temperature > maxTemp) maxTemp = cell.temperature;
      }
    }

    const total = this.cells.length;
    const typeCount = Object.values(counts).filter(v => (v ?? 0) > 0).length;
    const entropy = Math.log(Math.max(typeCount, 1));
    const avgTemp = nonVacuum > 0 ? totalTemp / nonVacuum : 0;
    const complexity = this.rlAgent.computeComplexity(counts, total, avgTemp);

    return {
      tick: this.tick,
      generation: this.rlAgent.generation,
      mutationCount: this.rlAgent.mutationCount,
      counts,
      totalCells: total,
      avgTemperature: avgTemp,
      maxTemperature: maxTemp,
      entropy,
      complexity,
      rlReward: this.rlAgent.lastReward,
      physics: { ...this.physics },
      rlAction: this.rlAgent.lastAction_name,
      epsilon: this.rlAgent.epsilon,
    };
  }

  reset(): void {
    this.tick = 0;
    this.physics = { ...DEFAULT_PHYSICS };
    this.rlAgent.resetToDefault();
    this.cells = this.initBigBang();
    this.nextCells = this.cells.map(c => ({ ...c }));
  }
}
