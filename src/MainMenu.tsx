import { useEffect, useRef, useState } from 'react';
import './main-menu.css';

interface MainMenuProps {
  canContinue: boolean;
  newGame: () => void;
  continueGame: () => void;
  openOptions: () => void;
  active: boolean;
}

export function MainMenu({ canContinue, newGame, continueGame, openOptions, active }: MainMenuProps) {
  const [near, setNear] = useState(false);
  const [idle, setIdle] = useState(false);
  const monitor = useRef<HTMLButtonElement>(null);
  const firstOption = useRef<HTMLButtonElement>(null);
  const wake = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (idle || !active) return;
    let timer: number;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setIdle(true);
        requestAnimationFrame(() => wake.current?.focus({ preventScroll: true }));
      }, 45_000);
    };
    arm();
    window.addEventListener('pointermove', arm);
    window.addEventListener('keydown', arm);
    window.addEventListener('pointerdown', arm);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointermove', arm);
      window.removeEventListener('keydown', arm);
      window.removeEventListener('pointerdown', arm);
    };
  }, [idle, active]);

  function frameMonitor(closeUp: boolean) {
    setNear(closeUp);
    requestAnimationFrame(() => (closeUp ? firstOption : monitor).current?.focus({ preventScroll: true }));
  }

  function wakeMonitor() {
    setIdle(false);
    requestAnimationFrame(() => (near ? firstOption : monitor).current?.focus({ preventScroll: true }));
  }

  return <section className={'menu-scene' + (near ? ' menu-near' : '')} aria-label="Menú principal">
    <div className="menu-stage">
      <div className="menu-camera">
        <div className="menu-steam" aria-hidden="true"><i /><i /></div>
        <div className="menu-crt">
          <div className="menu-crt-content" inert={idle} aria-hidden={idle}>
            <div className="menu-crt-header">
              <p>● NEXUS SYSTEMS <span>/ INCIDENTE 07</span></p>
              {near && <button onClick={() => frameMonitor(false)} className="menu-pullback"><span aria-hidden="true">← </span>Alejar vista</button>}
            </div>
            <h1>ACCESS <em>DENIED</em></h1>
            <p className="menu-caption">El turno terminó. La puerta sigue cerrada.</p>
            <nav aria-label="Opciones de partida" aria-hidden={!near} inert={!near}>
              <button ref={firstOption} className="primary" onClick={newGame}><span aria-hidden="true">01</span>Nueva partida<span aria-hidden="true">↗</span></button>
              <button disabled={!canContinue} onClick={continueGame}><span aria-hidden="true">02</span>Continuar partida<span aria-hidden="true">↗</span></button>
              <button onClick={openOptions}><span aria-hidden="true">03</span>Opciones<span aria-hidden="true">↗</span></button>
            </nav>
          </div>
          {!near && !idle && <button ref={monitor} className="menu-monitor" onClick={() => frameMonitor(true)} aria-label="Acercarse al monitor" />}
          {idle && <button ref={wake} className="menu-saver" aria-label="Reactivar monitor" onClick={wakeMonitor}>
            <span aria-hidden="true">◇ NEXUS</span>
          </button>}
        </div>
      </div>
    </div>
    {!near && <div className="menu-scene-caption">
      <span>23:41 <i /> ÚLTIMO TURNO</span><span>↗ {idle ? 'Reactivá el monitor' : 'Activá el monitor para continuar'}</span>
    </div>}
  </section>;
}

