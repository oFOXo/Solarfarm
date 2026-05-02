import { useState, useRef, useCallback, useEffect } from 'react';
import { Universe } from './simulation/universe';
import { UniverseStats } from './simulation/types';
import { UniverseCanvas } from './components/UniverseCanvas';
import { StatsPanel } from './components/StatsPanel';

const GRID_W = 160;
const GRID_H = 90;
const CELL_SIZE = 5;

const universe = new Universe(GRID_W, GRID_H);

export default function App() {
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(2);
  const [rlEnabled, setRlEnabled] = useState(true);
  const [mutationEnabled, setMutationEnabled] = useState(true);
  const [stats, setStats] = useState<UniverseStats>(() => universe.computeStats());
  const [, forceRender] = useState(0);
  const statsTickRef = useRef(0);

  const handleTick = useCallback(() => {
    if (universe.tick - statsTickRef.current >= 10) {
      statsTickRef.current = universe.tick;
      setStats(universe.computeStats());
    }
  }, []);

  useEffect(() => {
    universe.enableRL = rlEnabled;
  }, [rlEnabled]);

  useEffect(() => {
    universe.enableMutation = mutationEnabled;
  }, [mutationEnabled]);

  const handleReset = () => {
    universe.reset();
    setStats(universe.computeStats());
    forceRender(n => n + 1);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#03040e',
      color: '#cdd',
      fontFamily: 'monospace',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid rgba(100,120,255,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexShrink: 0,
        background: 'rgba(10,12,30,0.8)',
      }}>
        <div>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, color: '#99aaff' }}>
            PIXEL UNIVERSE
          </span>
          <span style={{ fontSize: 11, color: '#446', marginLeft: 10, letterSpacing: 1 }}>
            SIMULATOR v1.0
          </span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#556' }}>
          <span>TICK <span style={{ color: '#adf' }}>{stats.tick.toLocaleString()}</span></span>
          <span>GEN <span style={{ color: '#ffa' }}>{stats.generation}</span></span>
          <span>COMPLEXITY <span style={{ color: '#afc' }}>{stats.complexity.toFixed(1)}</span></span>
          <span>ENTROPY <span style={{ color: '#fca' }}>{stats.entropy.toFixed(3)}</span></span>
        </div>
      </div>

      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        gap: 0,
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12,
          overflow: 'hidden',
          background: 'radial-gradient(ellipse at center, #060815 0%, #010208 100%)',
        }}>
          <div style={{ position: 'relative' }}>
            <UniverseCanvas
              universe={universe}
              cellSize={CELL_SIZE}
              running={running}
              speed={speed}
              onTick={handleTick}
            />
            <div style={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              fontSize: 10,
              color: 'rgba(100,120,255,0.5)',
              letterSpacing: 1,
              pointerEvents: 'none',
            }}>
              {GRID_W}×{GRID_H} CELLS · {CELL_SIZE}PX/CELL
            </div>
          </div>
        </div>

        <div style={{
          width: 280,
          flexShrink: 0,
          overflowY: 'auto',
          padding: '12px 14px',
          borderLeft: '1px solid rgba(100,120,255,0.12)',
          background: 'rgba(6,8,20,0.95)',
        }}>
          <StatsPanel
            stats={stats}
            running={running}
            speed={speed}
            rlEnabled={rlEnabled}
            mutationEnabled={mutationEnabled}
            onToggleRun={() => setRunning(r => !r)}
            onReset={handleReset}
            onSpeedChange={setSpeed}
            onToggleRL={() => setRlEnabled(v => !v)}
            onToggleMutation={() => setMutationEnabled(v => !v)}
          />

          <div style={{
            marginTop: 16,
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 6,
            fontSize: 10,
            color: '#445',
            lineHeight: 1.8,
          }}>
            <div style={{ color: '#667', marginBottom: 6, letterSpacing: 1 }}>HOW IT WORKS</div>
            <div>· Gravity pulls particles toward mass</div>
            <div>· Hydrogen clusters form nebulae</div>
            <div>· Nebulae ignite into protostars</div>
            <div>· Stars evolve → giants → BH/NS</div>
            <div>· Black holes accrete nearby matter</div>
            <div>· RL agent evolves physics constants</div>
            <div>· Random mutations drive exploration</div>
            <div>· Antimatter annihilates on contact</div>
            <div>· Dark energy drives expansion</div>
          </div>
        </div>
      </div>
    </div>
  );
}
