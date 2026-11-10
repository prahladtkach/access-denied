import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from 'react';
import type { Sound } from './audio';
import { UnknownAvatar } from './UnknownAvatar';
import './desktop-phase3.css';

export type AppId = 'terminal' | 'archivos' | 'registros' | 'diagnóstico' | 'configuración' | 'unknown';

const apps = {
  terminal: { name: 'Terminal', icon: '>_', subtitle: 'MANTENIMIENTO', color: '#60e9c2' },
  archivos: { name: 'Archivos', icon: '▰', subtitle: 'EXPLORADOR DE VOLUMEN', color: '#edbb77' },
  registros: { name: 'Registros', icon: '≡', subtitle: 'BITÁCORA DE SEGURIDAD', color: '#95afea' },
  diagnóstico: { name: 'Diagnóstico', icon: '＋', subtitle: 'CONTROL LOCAL', color: '#b3d88a' },
  configuración: { name: 'Configuración', icon: '⚙', subtitle: 'PREFERENCIAS LOCALES', color: '#c7cfd8' },
  unknown: { name: 'UNKNOWN', icon: 'RX', subtitle: 'ORIGEN NO VERIFICADO', color: '#fb9e8f' },
};
const shortcuts: AppId[] = ['terminal', 'archivos', 'registros', 'diagnóstico'];

type WindowInfo = {
  mode: 'open' | 'minimized' | 'closed';
  x: number;
  y: number;
  width?: number;
  height?: number;
};
const defaultWindows: Record<AppId, WindowInfo> = {
  terminal: { mode: 'open', x: 0.39, y: 0.25 },
  archivos: { mode: 'closed', x: 0.7, y: 0.4 },
  registros: { mode: 'closed', x: 0.76, y: 0.51 },
  diagnóstico: { mode: 'closed', x: 0.65, y: 0.6 },
  configuración: { mode: 'closed', x: 0.59, y: 0.31 },
  unknown: { mode: 'closed', x: 0.99, y: 0.09 },
};

const resizeEdges = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const;
type ResizeEdge = typeof resizeEdges[number];
const edgePadding = 8;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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
    setWindows(previous => ({ ...previous, [id]: { ...previous[id], x: clamp(x, 0, 1), y: clamp(y, 0, 1) } }));
  }

  function resize(id: AppId, geometry: Pick<WindowInfo, 'x' | 'y' | 'width' | 'height'>) {
    setWindows(previous => ({ ...previous, [id]: { ...previous[id], ...geometry } }));
  }

  function reset() {
    setWindows(defaultWindows);
    setStack(['terminal']);
  }

  return { windows, stack, active, focus, setMode, move, resize, reset };
}

export interface Notice {
  id: string;
  title: string;
  text: string;
  app: AppId;
  remote?: boolean;
}

function NoticeContents({ notice }: { notice: Notice }) {
  return <>
    {notice.remote && <UnknownAvatar />}
    <span className="os-notice-copy"><strong>{notice.title}</strong><span>{notice.text}</span></span>
  </>;
}

interface DesktopProps {
  state: ReturnType<typeof useDesktop>;
  leave: () => void;
  renderApp: (id: AppId) => ReactNode;
  notices: Notice[];
  clock: { time: string; date: string; stamp: string };
  onRemoteNotice: (notice: Notice) => void;
  interrupt?: ReactNode;
  booting: boolean;
  muted: boolean;
  toggleMute: () => void;
  security: number;
  play: (sound: Sound) => void;
}

export function Desktop({ state, leave, renderApp, notices, clock, onRemoteNotice, interrupt, booting, muted, toggleMute, security, play }: DesktopProps) {
  const { active, windows, stack, focus, setMode, move, resize } = state;
  const workspace = useRef<HTMLDivElement>(null);
  const controls = useRef<Partial<Record<AppId, HTMLButtonElement | null>>>({});
  const launchers = useRef<Partial<Record<AppId, HTMLButtonElement | null>>>({});
  const taskButtons = useRef<Partial<Record<AppId, HTMLButtonElement | null>>>({});
  const drag = useRef<{ id: AppId; originX: number; originY: number; left: number; top: number } | null>(null);
  const resizing = useRef<{
    id: AppId; edge: ResizeEdge; x: number; y: number; left: number; top: number; right: number; bottom: number;
  } | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [expiredToast, setExpiredToast] = useState<string | null>(null);
  const [showNotices, setShowNotices] = useState(false);
  const [popup, setPopup] = useState<'start' | 'context' | null>(null);
  const [context, setContext] = useState({ x: 0, y: 0 });
  const startButton = useRef<HTMLButtonElement>(null);
  const startFirst = useRef<HTMLButtonElement>(null);
  const locked = booting || Boolean(interrupt);

  useEffect(() => {
    if (popup) startFirst.current?.focus();
  }, [popup]);

  function open(id: AppId) {
    play(windows[id].mode === 'minimized' ? 'restore' : 'open');
    const previousFocus = document.activeElement;
    setPopup(null);
    setMode(id, 'open');
    requestAnimationFrame(() => {
      if (document.activeElement === previousFocus || document.activeElement === document.body) {
        controls.current[id]?.focus();
      }
    });
  }

  function hide(id: AppId, mode: 'minimized' | 'closed') {
    play(mode === 'minimized' ? 'minimize' : 'close');
    setMode(id, mode);
    const target = mode === 'minimized' ? taskButtons.current[id] : launchers.current[id];
    const nextWindow = stack.filter(item => item !== id && windows[item].mode === 'open').at(-1);
    (target ?? (nextWindow && controls.current[nextWindow]) ?? launchers.current.terminal)?.focus();
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

  function startResize(event: PointerEvent<HTMLSpanElement>, id: AppId, edge: ResizeEdge) {
    const frame = event.currentTarget.closest<HTMLElement>('.os-window');
    if (event.button !== 0 || !frame) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const { offsetLeft: left, offsetTop: top, offsetWidth: width, offsetHeight: height } = frame;
    resizing.current = { id, edge, x: event.clientX, y: event.clientY, left, top, right: left + width, bottom: top + height };
  }

  function updateResize(event: PointerEvent<HTMLSpanElement>, id: AppId) {
    const area = workspace.current;
    const start = resizing.current;
    if (!area || !start || start.id !== id) return;
    const rightBound = area.clientWidth - edgePadding;
    const bottomBound = area.clientHeight - edgePadding;
    const minWidth = Math.min(id === 'unknown' ? 250 : 340, rightBound - edgePadding);
    const minHeight = Math.min(232, bottomBound - edgePadding);
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const { edge } = start;
    const left = edge.includes('w') ? clamp(start.left + dx, edgePadding, start.right - minWidth) : start.left;
    const right = edge.includes('e') ? clamp(start.right + dx, start.left + minWidth, rightBound) : start.right;
    const top = edge.includes('n') ? clamp(start.top + dy, edgePadding, start.bottom - minHeight) : start.top;
    const bottom = edge.includes('s') ? clamp(start.bottom + dy, start.top + minHeight, bottomBound) : start.bottom;
    const width = right - left;
    const height = bottom - top;
    resize(id, {
      width, height,
      x: clamp((left - edgePadding) / Math.max(1, rightBound - edgePadding - width), 0, 1),
      y: clamp((top - edgePadding) / Math.max(1, bottomBound - edgePadding - height), 0, 1),
    });
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
  const toastId = latest?.id;
  useEffect(() => {
    if (!toastId) return;
    const timer = window.setTimeout(() => setExpiredToast(toastId), 6500);
    return () => window.clearTimeout(timer);
  }, [toastId]);
  function readNotice(notice: Notice) {
    setDismissed(previous => [...previous, notice.id]);
    setShowNotices(false);
    if (notice.remote) onRemoteNotice(notice);
    open(notice.app);
  }

  function showContext(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as Element).closest('button, nav, .os-window, .os-popup, .os-toast, .os-notice-center')) return;
    event.preventDefault();
    const area = event.currentTarget.getBoundingClientRect();
    setContext({
      x: Math.max(4, Math.min(event.clientX - area.left, area.width - 206)),
      y: Math.max(4, Math.min(event.clientY - area.top, area.height - 154)),
    });
    setShowNotices(false);
    setPopup('context');
  }

  return <section className="nexus-os" aria-label="Escritorio NEXUS OS" onClickCapture={event => {
    const control = (event.target as Element).closest('button');
    if (control && !control.closest('.os-icons, .os-running, .os-window-actions, .os-popup, .os-notice-row, .puzzle .primary')) play('mouse');
  }} onInputCapture={event => {
    if ((event.target as Element).matches('input:not([type]), input[type="text"]')) play('key');
  }} onKeyDown={event => {
    if (event.key === 'Escape' && (popup || showNotices)) {
      event.stopPropagation();
      setPopup(null);
      setShowNotices(false);
      startButton.current?.focus();
    }
  }}>
    <div className="os-workspace" ref={workspace} inert={locked} onContextMenu={showContext}
      onPointerDown={event => {
        if (!(event.target as HTMLElement).closest('.os-popup')) setPopup(null);
      }}>
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
        return <section key={id} aria-label={'Ventana de ' + app.name} aria-hidden={info.mode !== 'open'} inert={info.mode !== 'open'} data-mode={info.mode}
          className={'os-window ' + (active === id ? 'os-active ' : '') + (id === 'unknown' ? 'os-remote' : '')}
          style={{
            '--x': info.x, '--y': info.y, zIndex: stack.indexOf(id) + 2,
            '--resized-w': info.width ? info.width + 'px' : undefined,
            '--resized-h': info.height ? info.height + 'px' : undefined,
          } as CSSProperties}
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
          {resizeEdges.map(edge => <span key={edge} className="os-resize" data-edge={edge} aria-hidden="true"
            onPointerDown={event => startResize(event, id, edge)}
            onPointerMove={event => updateResize(event, id)}
            onLostPointerCapture={() => { resizing.current = null; }} />)}
        </section>;
      })}
      {popup === 'context' && <aside className="os-popup os-context" style={{ left: context.x, top: context.y }} aria-label="Acciones del escritorio">
        <span>ESCRITORIO LOCAL</span>
        <button ref={startFirst} onClick={() => open('terminal')}>Abrir terminal</button>
        <button onClick={() => open('configuración')}>Configurar escritorio</button>
        <button onClick={() => { setPopup(null); setShowNotices(true); }}>Ver avisos</button>
      </aside>}
      {latest && latest.id !== expiredToast && !showNotices && <aside key={latest.id} aria-live="polite" className={'os-toast ' + (latest.remote ? 'os-toast-remote' : '')} aria-label="Notificación reciente">
        <button className="os-toast-body os-notice-row" onClick={() => readNotice(latest)}><NoticeContents notice={latest} /></button>
        <button aria-label="Descartar notificación" onClick={() => setDismissed(previous => [...previous, latest.id])}>×</button>
      </aside>}
      {showNotices && <aside className="os-notice-center" aria-label="Centro de notificaciones">
        <div className="os-notice-title">CENTRO DE NOTIFICACIONES <button aria-label="Cerrar notificaciones" onClick={() => setShowNotices(false)}>×</button></div>
        {!notices.length && <p>No hay avisos en esta sesión.</p>}
        {notices.slice().reverse().map(notice => <button className="os-notice-row" key={notice.id} onClick={() => readNotice(notice)}>
          <NoticeContents notice={notice} />
        </button>)}
      </aside>}
    </div>
    {popup === 'start' && !locked && <nav className="os-popup os-start-menu" aria-label="Menú de inicio">
      <header><b>◇ NEXUS OS</b><small>TERMINAL 07 / LOCAL</small></header>
      {([...shortcuts, 'configuración'] as AppId[]).map((id, index) => <button key={id}
        ref={index === 0 ? startFirst : undefined} onClick={() => open(id)}>
        <span aria-hidden="true" style={{ color: apps[id].color }}>{apps[id].icon}</span>{apps[id].name}
      </button>)}
    </nav>}
    <div className="os-taskbar" inert={locked}>
      <button ref={startButton} className="os-start" aria-label="Inicio de NEXUS" aria-expanded={popup === 'start'}
        onClick={() => { setPopup(popup === 'start' ? null : 'start'); setShowNotices(false); }}>
        <span aria-hidden="true">◇</span> Inicio
      </button>
      <nav className="os-running" aria-label="Aplicaciones abiertas">
        {(Object.keys(apps) as AppId[]).filter(id => windows[id].mode !== 'closed').map(id => <button key={id} aria-label={'Alternar ' + apps[id].name}
          ref={element => { taskButtons.current[id] = element; }}
          aria-pressed={id === active} data-mode={windows[id].mode} title={apps[id].name + (windows[id].mode === 'minimized' ? ' · Minimizada' : id === active ? ' · Activa' : ' · Abierta')} onClick={() => id === active ? hide(id, 'minimized') : open(id)}>
          <span aria-hidden="true">{apps[id].icon}</span> {apps[id].name}
        </button>)}
      </nav>
      <button className="os-exit" onClick={leave}>← Habitación</button>
      <div className="os-tray" aria-label="Área de notificaciones">
        <button aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'} title={muted ? 'Activar sonido' : 'Silenciar sonido'}
          onClick={toggleMute}>{muted ? '♪×' : '♪'}</button>
        <button aria-label="Conexión y avisos" title="Conexión y avisos" className={unread.some(notice => notice.remote) ? 'os-incoming' : ''}
          aria-expanded={showNotices} onClick={() => { setPopup(null); setShowNotices(!showNotices); }}>
          <span aria-hidden="true">⇄</span>{unread.length > 0 && <sup>{unread.length}</sup>}
        </button>
        <button aria-label="Seguridad del sistema" title={'Seguridad · Intrusión ' + security + '/5'}
          className={security ? 'os-warning' : ''} onClick={() => open('diagnóstico')}>⬡</button>
      </div>
      <time className="os-clock" dateTime={clock.stamp} title="Hora de NEXUS OS"><b>{clock.time}</b><small>{clock.date}</small></time>
    </div>
    {booting && <div className="os-boot" aria-label="Arrancando NEXUS OS">
      <span aria-hidden="true">◇</span>
      <strong>NEXUS OS</strong><small>COMPROBANDO CANAL LOCAL</small><i aria-hidden="true" />
    </div>}
    {interrupt && <div className="os-interrupt">{interrupt}</div>}
  </section>;
}
