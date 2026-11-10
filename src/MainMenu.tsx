import { useEffect, useRef, useState } from 'react';
import type { Sound } from './audio';
import './main-menu.css';

interface MainMenuProps {
  canContinue: boolean;
  newGame: () => void;
  continueGame: () => void;
  openOptions: () => void;
  active: boolean;
  play: (sound: Sound) => void;
}

export function MainMenu({ canContinue, newGame, continueGame, openOptions, active, play }: MainMenuProps) {
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

  return <section className={'menu-scene' + (near ? ' menu-near' : '')} aria-label="Menú principal"
    onClickCapture={event => {
      if ((event.target as Element).closest('button:not(:disabled)')) play('menu');
    }} onPointerOver={event => {
      const control = (event.target as Element).closest('button:not(:disabled)');
      if (control && !(event.relatedTarget instanceof Node && control.contains(event.relatedTarget))) play('hover');
    }}>
    <div className="menu-stage">
      <div className="menu-camera">
        <div className="menu-steam" aria-hidden="true"><i /><i /><i /><i /></div>
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
            <span aria-hidden="true">
              <svg viewBox="0 0 125 26">
                <path d="M13 0 26 13 13 26 0 13zm0 5L5 13l8 8 8-8z" fill="currentColor" fillRule="evenodd" />
                <path d="M34 24V2l14 22V2m19 0H56v22h11M56 13h10m8-11 14 22m0-22L74 24M95 2v22h12V2m18 0h-11v11h9v11h-11"
                  stroke="currentColor" strokeWidth="2.8" fill="none" />
              </svg>
            </span>
          </button>}
        </div>
      </div>
    </div>
    {!near && <div className="menu-scene-caption">
      <span>23:41 <i /> ÚLTIMO TURNO</span><span>↗ {idle ? 'Reactivá el monitor' : 'Activá el monitor para continuar'}</span>
    </div>}
  </section>;
}

