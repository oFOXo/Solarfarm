import { UniverseStats } from '../simulation/types';
import { ParticleType, PARTICLE_NAMES, PARTICLE_COLORS } from '../simulation/types';

interface Props {
  stats: UniverseStats;
  running: boolean;
  speed: number;
  rlEnabled: boolean;
  mutationEnabled: boolean;
  onToggleRun: () => void;
  onReset: () => void;
  onSpeedChange: (s: number) => void;
  onToggleRL: () => void;
  onToggleMutation: () => void;
}

function colorStr([r, g, b]: [number, number, number]) {
  return `rgb(${r},${g},${b})`;
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 2, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 11, color: '#aaa', width: 44, textAlign: 'right' }}>{value.toLocaleString()}</span>
    </div>
  );
}

const SHOWN_TYPES = [
  ParticleType.VACUUM,
  ParticleType.DARK_MATTER,
  ParticleType.HYDROGEN,
  ParticleType.HELIUM,
  ParticleType.NEBULA,
  ParticleType.PLASMA,
  ParticleType.PROTOSTAR,
  ParticleType.STAR,
  ParticleType.GIANT,
  ParticleType.NEUTRON_STAR,
  ParticleType.BLACK_HOLE,
  ParticleType.ANTIMATTER,
];

export function StatsPanel({
  stats,
  running,
  speed,
  rlEnabled,
  mutationEnabled,
  onToggleRun,
  onReset,
  onSpeedChange,
  onToggleRL,
  onToggleMutation,
}: Props) {
  const maxCount = Math.max(...SHOWN_TYPES.map(t => stats.counts[t] ?? 0), 1);

  const physicsItems: { label: string; value: string }[] = [
    { label: 'Gravity (G)', value: stats.physics.G.toFixed(2) },
    { label: 'Fusion Temp', value: stats.physics.fusionTemp.toFixed(0) },
    { label: 'Fusion Density', value: stats.physics.fusionDensity.toFixed(1) },
    { label: 'Expansion Rate', value: stats.physics.expansionRate.toFixed(4) },
    { label: 'Cooling Rate', value: stats.physics.coolingRate.toFixed(3) },
    { label: 'Dark Energy', value: stats.physics.darkEnergy.toFixed(2) },
    { label: 'Plasma Thresh', value: stats.physics.plasmaThreshold.toFixed(0) },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      color: '#cdd',
      fontFamily: 'monospace',
      fontSize: 12,
    }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={onToggleRun}
          style={{
            flex: 1, padding: '8px 0', borderRadius: 4,
            background: running ? 'rgba(255,80,80,0.15)' : 'rgba(80,200,120,0.15)',
            border: `1px solid ${running ? 'rgba(255,80,80,0.4)' : 'rgba(80,200,120,0.4)'}`,
            color: running ? '#ff8888' : '#88ee99',
            cursor: 'pointer', fontSize: 12, fontFamily: 'monospace',
          }}
        >
          {running ? '⏸ PAUSE' : '▶ PLAY'}
        </button>
        <button
          onClick={onReset}
          style={{
            flex: 1, padding: '8px 0', borderRadius: 4,
            background: 'rgba(100,140,255,0.1)',
            border: '1px solid rgba(100,140,255,0.3)',
            color: '#88aaff', cursor: 'pointer', fontSize: 12, fontFamily: 'monospace',
          }}
        >
          ⚡ BIG BANG
        </button>
      </div>

      <div>
        <div style={{ fontSize: 10, color: '#778', marginBottom: 5, letterSpacing: 1 }}>SIMULATION SPEED</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 5, 10].map(s => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              style={{
                flex: 1, padding: '5px 0', borderRadius: 3,
                background: speed === s ? 'rgba(140,100,255,0.25)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${speed === s ? 'rgba(140,100,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
                color: speed === s ? '#cc99ff' : '#667',
                cursor: 'pointer', fontSize: 11, fontFamily: 'monospace',
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onToggleRL}
          style={{
            flex: 1, padding: '6px 0', borderRadius: 4,
            background: rlEnabled ? 'rgba(255,180,50,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${rlEnabled ? 'rgba(255,180,50,0.4)' : 'rgba(255,255,255,0.1)'}`,
            color: rlEnabled ? '#ffcc66' : '#556',
            cursor: 'pointer', fontSize: 11, fontFamily: 'monospace',
          }}
        >
          {rlEnabled ? '◉' : '○'} RL AGENT
        </button>
        <button
          onClick={onToggleMutation}
          style={{
            flex: 1, padding: '6px 0', borderRadius: 4,
            background: mutationEnabled ? 'rgba(80,220,180,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${mutationEnabled ? 'rgba(80,220,180,0.4)' : 'rgba(255,255,255,0.1)'}`,
            color: mutationEnabled ? '#66ddbb' : '#556',
            cursor: 'pointer', fontSize: 11, fontFamily: 'monospace',
          }}
        >
          {mutationEnabled ? '◉' : '○'} MUTATION
        </button>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '10px 12px' }}>
        <div style={{ fontSize: 10, color: '#778', marginBottom: 8, letterSpacing: 1 }}>UNIVERSE STATE</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
          {[
            { label: 'Tick', value: stats.tick.toLocaleString() },
            { label: 'RL Gen', value: stats.generation.toLocaleString() },
            { label: 'Mutations', value: stats.mutationCount.toLocaleString() },
            { label: 'Complexity', value: stats.complexity.toFixed(1) },
            { label: 'Avg Temp', value: stats.avgTemperature.toFixed(0) },
            { label: 'Max Temp', value: stats.maxTemperature.toFixed(0) },
            { label: 'Entropy', value: stats.entropy.toFixed(3) },
            { label: 'RL Reward', value: stats.rlReward.toFixed(1) },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#667' }}>{item.label}</span>
              <span style={{ color: '#adf' }}>{item.value}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#667' }}>RL Action</span>
          <span style={{ color: '#ffc', fontSize: 11 }}>{stats.rlAction}</span>
        </div>
        <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#667' }}>Epsilon</span>
          <span style={{ color: '#aaa' }}>{(stats.epsilon * 100).toFixed(1)}%</span>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '10px 12px' }}>
        <div style={{ fontSize: 10, color: '#778', marginBottom: 8, letterSpacing: 1 }}>PARTICLE DISTRIBUTION</div>
        {SHOWN_TYPES.map(t => {
          const count = stats.counts[t] ?? 0;
          if (count === 0 && t === ParticleType.VACUUM) return null;
          const [r, g, b] = PARTICLE_COLORS[t];
          const color = count === 0 ? '#333' : `rgb(${r},${g},${b})`;
          return (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 1, background: colorStr(PARTICLE_COLORS[t]), flexShrink: 0 }} />
              <span style={{ width: 90, color: count === 0 ? '#445' : '#99a', flexShrink: 0, fontSize: 11 }}>
                {PARTICLE_NAMES[t]}
              </span>
              <div style={{ flex: 1 }}>
                <Bar value={count} max={maxCount} color={color} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '10px 12px' }}>
        <div style={{ fontSize: 10, color: '#778', marginBottom: 8, letterSpacing: 1 }}>PHYSICS CONSTANTS</div>
        {physicsItems.map(item => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#667' }}>{item.label}</span>
            <span style={{ color: '#cfc', fontFamily: 'monospace' }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
