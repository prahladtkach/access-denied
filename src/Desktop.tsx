import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from 'react';

export type AppId = 'terminal' | 'archivos' | 'registros' | 'diagnóstico' | 'unknown';

const apps = {
  terminal: { name: 'Terminal', icon: '>_', subtitle: 'MANTENIMIENTO', color: '#60e9c2' },
  archivos: { name: 'Archivos', icon: '▰', subtitle: 'EXPLORADOR DE VOLUMEN', color: '#edbb77' },
  registros: { name: 'Registros', icon: '≡', subtitle: 'BITÁCORA DE SEGURIDAD', color: '#95afea' },
  diagnóstico: { name: 'Diagnóstico', icon: '＋', subtitle: 'CONTROL LOCAL', color: '#b3d88a' },
  unknown: { name: 'UNKNOWN', icon: 'RX', subtitle: 'ORIGEN NO VERIFICADO', color: '#fb9e8f' },
};
const shortcuts: AppId[] = ['terminal', 'archivos', 'registros', 'diagnóstico'];

type WindowInfo = {
  mode: 'open' | 'minimized' | 'closed';
  x: number;
  y: number;
};
const defaultWindows: Record<AppId, WindowInfo> = {
  terminal: { mode: 'open', x: 0.39, y: 0.25 },
  archivos: { mode: 'closed', x: 0.7, y: 0.4 },
  registros: { mode: 'closed', x: 0.76, y: 0.51 },
  diagnóstico: { mode: 'closed', x: 0.65, y: 0.6 },
  unknown: { mode: 'closed', x: 0.99, y: 0.09 },
};

export function useDesktop() {
  const [windows, setWindows] = useState(defaultWindows);
  const [stack, setStack] = useState<AppId[]>(['terminal']);
  const active = stack.filter(id => windows[id].mode === 'open').at(-1) ?? null;

  function focus(id: AppId) {
    setStack(previous => previous.at(-1) === id ? previous : [...previous.filter(item => item !== id), id]);
  }

  function setMode(id: AppId, mode: WindowInfo['mode']) {
    setWindows(previous => ({ ...previous, [id]: { ...previous[id], mode } }));
    if (mode === 'open') focus(id);
  }

  function move(id: AppId, x: number, y: number) {
    const clamp = (value: number) => Math.max(0, Math.min(1, value));
    setWindows(previous => ({ ...previous, [id]: { ...previous[id], x: clamp(x), y: clamp(y) } }));
  }

  function reset() {
    setWindows(defaultWindows);
    setStack(['terminal']);
  }

  return { windows, stack, active, focus, setMode, move, reset };
}

export interface Notice {
  id: string;
  title: string;
  text: string;
  app: AppId;
  remote?: boolean;
}

interface DesktopProps {
  state: ReturnType<typeof useDesktop>;
  leave: () => void;
  renderApp: (id: AppId) => ReactNode;
  notices: Notice[];
  bootTime: number;
  interrupt?: ReactNode;
}

export function Desktop({ state, leave, renderApp, notices, bootTime, interrupt }: DesktopProps) {
  const { active, windows, stack, focus, setMode, move } = state;
  const workspace = useRef<HTMLDivElement>(null);
  const controls = useRef<Partial<Record<AppId, HTMLButtonElement | null>>>({});
  const launchers = useRef<Partial<Record<AppId, HTMLButtonElement | null>>>({});
  const taskButtons = useRef<Partial<Record<AppId, HTMLButtonElement | null>>>({});
  const drag = useRef<{ id: AppId; originX: number; originY: number; left: number; top: number } | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [showNotices, setShowNotices] = useState(false);
  const [clock, setClock] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  function open(id: AppId) {
    setMode(id, 'open');
    requestAnimationFrame(() => controls.current[id]?.focus());
  }

  function hide(id: AppId, mode: 'minimized' | 'closed') {
    setMode(id, mode);
    requestAnimationFrame(() => {
      const target = mode === 'minimized' ? taskButtons.current[id] : launchers.current[id];
      const nextWindow = stack.filter(item => item !== id && windows[item].mode === 'open').at(-1);
      (target ?? (nextWindow && controls.current[nextWindow]) ?? launchers.current.terminal)?.focus();
    });
  }

  function getTravel(handle: HTMLElement) {
    const area = workspace.current;
    const frame = handle.closest<HTMLElement>('.os-window');
    if (!area || !frame) return { x: 1, y: 1 };
    return { x: Math.max(1, area.clientWidth - frame.offsetWidth - 16), y: Math.max(1, area.clientHeight - frame.offsetHeight - 16) };
  }

  function startDrag(event: PointerEvent<HTMLButtonElement>, id: AppId) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const travel = getTravel(event.currentTarget);
    drag.current = {
      id, originX: event.clientX, originY: event.clientY,
      left: windows[id].x * travel.x, top: windows[id].y * travel.y,
    };
  }

  function updateDrag(event: PointerEvent<HTMLButtonElement>, id: AppId) {
    if (drag.current?.id !== id) return;
    const start = drag.current;
    const travel = getTravel(event.currentTarget);
    move(id, (start.left + event.clientX - start.originX) / travel.x,
      (start.top + event.clientY - start.originY) / travel.y);
  }

  function moveWithKeyboard(event: KeyboardEvent<HTMLButtonElement>, id: AppId) {
    const offset: Record<string, [number, number]> = {
      ArrowUp: [0, -24], ArrowDown: [0, 24], ArrowLeft: [-24, 0], ArrowRight: [24, 0],
    };
    if (!offset[event.key]) return;
    event.preventDefault();
    const [dx, dy] = offset[event.key];
    const travel = getTravel(event.currentTarget);
    move(id, windows[id].x + dx / travel.x, windows[id].y + dy / travel.y);
  }

  const unread = notices.filter(notice => !dismissed.includes(notice.id));
  const latest = unread.at(-1);
  const elapsed = Math.max(0, Math.floor((clock - bootTime) / 60_000));
  const minutes = (23 * 60 + 41 + elapsed) % (24 * 60);
  const time = [Math.floor(minutes / 60), minutes % 60].map(part => String(part).padStart(2, '0')).join(':');
  function readNotice(notice: Notice) {
    setDismissed(previous => [...previous, notice.id]);
    setShowNotices(false);
    open(notice.app);
  }

  return <section className="nexus-os" aria-label="Escritorio NEXUS OS">
    <div className="os-workspace" ref={workspace} inert={Boolean(interrupt)}>
      <div className="os-wallpaper" aria-hidden="true">
        <div className="os-watermark"><span>◇</span>NEXUS<span className="os-os">OS</span><small>INFRAESTRUCTURA / TERMINAL 07</small></div>
        <div className="os-wallnote">NX / 07<br/>SISTEMA LOCAL<br/>CANAL AISLADO</div>
      </div>
      <nav className="os-icons" aria-label="Aplicaciones del escritorio">
        {shortcuts.map(id => <button key={id} ref={element => { launchers.current[id] = element; }} onClick={() => open(id)}>
          <span className="os-icon" aria-hidden="true" style={{ color: apps[id].color }}>{apps[id].icon}</span>{apps[id].name}
        </button>)}
      </nav>
      {(Object.keys(apps) as AppId[]).map(id => {
        const app = apps[id];
        const info = windows[id];
        return <section key={id} aria-label={'Ventana de ' + app.name} hidden={info.mode !== 'open'}
          className={'os-window ' + (active === id ? 'os-active ' : '') + (id === 'unknown' ? 'os-remote' : '')}
          style={{ '--x': info.x, '--y': info.y, zIndex: stack.indexOf(id) + 2 } as CSSProperties}
          onPointerDown={() => focus(id)} onFocusCapture={() => focus(id)}>
          <div className="os-titlebar">
            <button type="button" className="os-handle" aria-label={'Mover ' + app.name + ' con las flechas'}
              ref={element => { controls.current[id] = element; }}
              onPointerDown={event => startDrag(event, id)} onPointerMove={event => updateDrag(event, id)}
              onLostPointerCapture={() => { drag.current = null; }}
              onKeyDown={event => moveWithKeyboard(event, id)}>
              <span aria-hidden="true">{app.icon}</span> {app.name}
            </button>
            <div className="os-window-actions">
              <button aria-label={'Minimizar ' + app.name} onClick={() => hide(id, 'minimized')}>−</button>
              <button aria-label={'Cerrar ' + app.name} onClick={() => hide(id, 'closed')}>×</button>
            </div>
          </div>
          <div className="os-window-body">{renderApp(id)}</div>
          <div className="os-window-status">{app.subtitle}<span>{id === 'unknown' ? 'EXTERNO' : 'LOCAL'}</span></div>
        </section>;
      })}
      {latest && !showNotices && <aside className={'os-toast ' + (latest.remote ? 'os-toast-remote' : '')} aria-label="Notificación reciente">
        <button className="os-toast-body" onClick={() => readNotice(latest)}><strong>{latest.title}</strong><span>{latest.text}</span></button>
        <button aria-label="Descartar notificación" onClick={() => setDismissed(previous => [...previous, latest.id])}>×</button>
      </aside>}
      {showNotices && <aside className="os-notice-center" aria-label="Centro de notificaciones">
        <div className="os-notice-title">CENTRO DE NOTIFICACIONES <button aria-label="Cerrar notificaciones" onClick={() => setShowNotices(false)}>×</button></div>
        {!notices.length && <p>No hay avisos en esta sesión.</p>}
        {notices.slice().reverse().map(notice => <button key={notice.id} onClick={() => readNotice(notice)}>
          <strong>{notice.title}</strong><span>{notice.text}</span>
        </button>)}
      </aside>}
    </div>
    <div className="os-taskbar" inert={Boolean(interrupt)}>
      <button className="os-exit" onClick={leave}>← Habitación</button>
      <nav className="os-running" aria-label="Aplicaciones abiertas">
        {stack.filter(id => windows[id].mode !== 'closed').map(id => <button key={id} aria-label={'Alternar ' + apps[id].name}
          ref={element => { taskButtons.current[id] = element; }}
          aria-pressed={id === active} onClick={() => id === active ? hide(id, 'minimized') : open(id)}>
          <span aria-hidden="true">{apps[id].icon}</span> {apps[id].name}
        </button>)}
      </nav>
      <button className="os-notifications" aria-expanded={showNotices} onClick={() => setShowNotices(!showNotices)}>
        Avisos{unread.length ? ' [' + unread.length + ']' : ''}
      </button>
      <time className="os-clock">{time}</time>
    </div>
    {interrupt && <div className="os-interrupt">{interrupt}</div>}
  </section>;
}


