import { useEffect, useReducer, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { attacks, isCorrect, main, recovery, seal } from './puzzles';
import { canSeal, checkpointNames, loadGame, mainLock, reducer, saveGame, scriptedAttack } from './game';
import type { Ending, FileId, ObjectId } from './game';
import { endings, files, objects } from './story';
import { PuzzleForm } from './PuzzleForm';
import './style.css';

type Tab = 'terminal' | 'archivos' | 'registros' | 'diagnóstico';
type Challenge = 'main' | 'recovery' | 'seal';
const tabs: Tab[] = ['terminal', 'archivos', 'registros', 'diagnóstico'];

function App() {
  const [game, dispatch] = useReducer(reducer, undefined, () => loadGame(localStorage));
  const [view, setView] = useState<'room' | 'pc'>('room');
  const [tab, setTab] = useState<Tab>('terminal');
  const [inspected, setInspected] = useState<ObjectId | null>(null);
  const [file, setFile] = useState<FileId | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [feedback, setFeedback] = useState('');
  const [paused, setPaused] = useState(false);
  const [confirm, setConfirm] = useState<'transfer' | 'reset' | null>(null);
  const [backupLight, setBackupLight] = useState(false);
  const [effects, setEffects] = useState(true);
  const [volume, setVolume] = useState(25);
  const audioContext = useRef<AudioContext | null>(null);
  const p = game.progress;
  const due = scriptedAttack(p);
  const lost = p.intrusion === 5;
  const dark = p.intrusion >= 3 && !backupLight;
  const timing = game.attack?.remaining != null;
  const canInterrupt = !paused && !confirm && !challenge && !file && !game.attack &&
    !due && !lost && !game.ending && view === 'pc' && tab === 'terminal' && p.stage >= 2 && p.stage <= 4;

  useEffect(() => saveGame(localStorage, game), [game]);
  useEffect(() => {
    if (paused || !timing) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const seconds = Math.floor((now - last) / 1000);
      if (!seconds) return;
      last += seconds * 1000;
      dispatch({type:'tick', at:Date.now(), seconds});
    }, 200);
    return () => window.clearInterval(timer);
  }, [paused, timing]);

  useEffect(() => {
    if (!canInterrupt) return;
    const timer = window.setTimeout(() => {
      setFeedback('');
      dispatch({type:'attack', at:Date.now()});
    }, Math.max(30_000, 90_000 - (Date.now() - game.lastAttack)));
    return () => window.clearTimeout(timer);
  }, [canInterrupt, game.lastAttack]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !event.repeat) setPaused(value => !value);
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  function tone() {
    if (!volume || !window.AudioContext) return;
    const context = audioContext.current ?? new AudioContext();
    audioContext.current = context;
    void context.resume().catch(() => {});
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 165;
    gain.gain.value = volume / 500;
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.3);
  }

  function changeView(target: 'room' | 'pc') {
    setView(target);
    setChallenge(null);
    setFile(null);
    setFeedback('');
  }

  function inspect(id: ObjectId) {
    setInspected(id);
    if (id !== 'rack' || !dark || p.clues.includes('rack')) dispatch({type:'inspect', id});
  }

  function retry(stage: number) {
    dispatch({type:'retry', checkpoint:stage});
    setInspected(null);
    setBackupLight(false);
    setTab('terminal');
    setConfirm(null);
    setPaused(false);
    changeView(stage ? 'pc' : 'room');
  }

  function openChallenge(value: Challenge) {
    setFeedback('');
    setChallenge(value);
  }

  function submitChallenge(input: string) {
    if (!challenge) return;
    const puzzle = challenge === 'main' ? main[p.stage] : challenge === 'seal' ? seal : recovery;
    if (isCorrect(puzzle, input)) {
      setFeedback('VALIDADO · ' + puzzle.explanation);
      setChallenge(null);
    } else {
      setFeedback(challenge === 'main' && p.stage === 5
        ? 'ADVERTENCIA · UNKNOWN interceptó el primer intento. Revisá la pista o restaurá el último punto. Otro fallo le cederá el control.'
        : 'La respuesta no coincide. Revisá la pista y probá de nuevo.');
    }
    dispatch({type:'challenge', challenge, input});
  }

  function read(id: FileId) {
    setFile(id);
    dispatch({type:'read', id});
  }

  function finish(ending: Ending) {
    setConfirm(null);
    dispatch({type:'finish', ending});
  }

  const act = p.stage < 2 ? 'I / EL ENCIERRO' : p.stage < 4 ? 'II / LA BRECHA' : 'III / PROTOCOLO FINAL';
  const objective = [
    'Inspeccioná la nota y encendé la consola.',
    'Repará la autenticación de la terminal.',
    'Recuperá el control del armario.',
    'Buscá la tarjeta del armario y montá el servidor.',
    'Inspeccioná el rack y recuperá los módulos de la puerta.',
    'Decidí quién tendrá control de la cerradura.',
    'Elegí cómo salir del laboratorio.',
  ][p.stage];
  const checkpoint = game.checkpoints[game.checkpoints.length - 1].stage;
  const attackPuzzle = game.attack ? attacks[game.attack.index] : null;
  const intrusions = ['Sistemas estables','Interferencia detectada','Cámaras comprometidas','Iluminación comprometida','Cerradura comprometida','Control perdido'];

  let screen;
  if (game.ending) {
    const end = endings[game.ending];
    screen = <section className="end-panel">
      <p className="eyebrow">ARCHIVO DE SESIÓN / FIN</p><h1>{game.ending}</h1>
      <h2>{end.label}</h2><p className="status-line">{end.line}</p><p>{end.text}</p>
      <div className="actions">
        {game.checkpoints.some(cp => cp.stage === 5) && <button className="primary" onClick={() => retry(5)}>Volver al punto de control final</button>}
        <button onClick={() => setConfirm('reset')}>Nueva partida</button>
      </div>
    </section>;
  } else if (lost) {
    screen = <section className="end-panel danger">
      <p className="eyebrow">INTRUSIÓN / 5 DE 5</p><h1>SYSTEM FAILURE</h1>
      <p>La red local perdió el control. Podés restaurar el último punto seguro y volver a intentarlo.</p>
      <button className="primary" onClick={() => retry(checkpoint)}>Reintentar · {checkpointNames[checkpoint]}</button>
    </section>;
  } else if (game.attack && attackPuzzle) {
    screen = <section className="terminal-panel attack">
      <div className="terminal-bar"><span>⚠ INTRUSIÓN EN CURSO</span><span>{timing ? game.attack.remaining + ' s' : 'EN ESPERA'}</span></div>
      {!timing ? <div className="pane">
        <p className="eyebrow">MENSAJE / UNKNOWN</p><h2>{attackPuzzle.title}</h2>
        <p>«Si querés mantener el control, vas a tener que defenderlo.»</p>
        <p>{attackPuzzle.kind === 'debug' ? 'Escribí la condición corregida en C.' :
          attackPuzzle.kind === 'secuencia' ? 'Armá una rutina de C ordenando las líneas.' : 'Interpretá los datos del fragmento de C y escribí la clave.'}
          {' '}Tenés {attackPuzzle.seconds} segundos desde que iniciás la defensa. Un error o agotar el tiempo aumenta la intrusión.</p>
        <button className="primary" onClick={() => { tone(); dispatch({type:'start'}); }}>Iniciar defensa</button>
      </div> : <div className="pane">
        <PuzzleForm key={attackPuzzle.id} puzzle={attackPuzzle} onSubmit={input => {
          setFeedback(isCorrect(attackPuzzle, input) ? 'ATAQUE BLOQUEADO · ' + attackPuzzle.explanation :
            'DEFENSA FALLIDA · Intrusión +1. ' + attackPuzzle.explanation);
          dispatch({type:'defend', input, at:Date.now()});
        }} />
      </div>}
    </section>;
  } else if (view === 'room') {
    screen = <section className="room-panel">
      <div className="terminal-bar"><span>01 / LABORATORIO DE PROGRAMACIÓN</span><span>23:41</span></div>
      <div className={'scene' + (dark ? ' lights-out' : '')}>
        <div className="ceiling" /><div className="back-wall" /><div className="floor" />
        <div className="sign" aria-hidden="true">NEXUS<br/>SYSTEMS</div>
        <div className="lamp" aria-hidden="true" />
        {(['door','desk','note','cabinet','rack'] as const).map(id =>
          <button className={'hotspot ' + id + (inspected === id ? ' selected' : '')} key={id} onClick={() => inspect(id)}>
            <span className="prop" aria-hidden="true" /><span className="tag">{objects[id].name}</span>
          </button>)}
      </div>
      <div className="inspect-panel">
        {inspected ? <>
          <p className="eyebrow">OBJETO / {objects[inspected].name}</p>
          <p>{inspected === 'cabinet' && p.stage < 3 ? 'Un cerrojo magnético bloquea el armario.' :
            inspected === 'rack' && p.stage < 4 ? 'El rack está activo. El manual permanece detrás del panel bloqueado.' :
            inspected === 'rack' && dark && !p.clues.includes('rack') ? 'El panel quedó a oscuras. Encendé la luz auxiliar para leer el manual.' :
            inspected === 'door' && p.stage === 6 ? 'CONTROL LOCAL. La puerta ya responde.' : objects[inspected].text}</p>
          {inspected === 'rack' && p.stage >= 4 && dark && !p.clues.includes('rack') &&
            <button onClick={() => { setBackupLight(true); dispatch({type:'inspect', id:'rack'}); }}>Encender luz auxiliar</button>}
          {inspected === 'rack' && p.clues.includes('rack') && (p.reportRoute
            ? <p className="hint">Ruta recuperada: /archivo/informe_original.txt. Ya aparece en Archivos.</p>
            : <button onClick={() => dispatch({type:'findReport'})}>Revisar el reverso del manual</button>)}
          {p.intrusion >= 2 && inspected === 'rack' && <p className="unknown"><strong>UNKNOWN</strong> · Te vi acercarte al rack.</p>}
          {inspected === 'desk' && <button className="primary" onClick={() => changeView('pc')}>Usar computadora</button>}
          {inspected === 'door' && p.stage === 6 && <button className="primary" onClick={() => finish('ESCAPE')}>Salir del laboratorio</button>}
        </> : <>
          <p className="eyebrow">23:41 / NEXUS SYSTEMS</p>
          <p>Se apagaron las luces del pasillo. La puerta no responde. Desde el escritorio llega el zumbido de un monitor.</p>
        </>}
      </div>
    </section>;
  } else {
    screen = <section className="terminal-panel">
      <div className="terminal-bar"><span>NEXUS / SISTEMA DE MANTENIMIENTO</span><button onClick={() => changeView('room')}>← Habitación</button></div>
      <nav className="tabs" aria-label="Aplicaciones de la computadora">
        {tabs.map(item => <button key={item} aria-current={tab === item ? 'page' : undefined} onClick={() => {
          setTab(item); setChallenge(null); setFile(null);
        }}>{item[0].toUpperCase() + item.slice(1)}</button>)}
      </nav>
      <div className="pane">
        {challenge && <><button onClick={() => setChallenge(null)}>← Cerrar editor</button>
          {challenge === 'main' && p.stage === 5 && game.finalErrors > 0 &&
            <p className="unknown">Último intento. Otro error le cederá el control a UNKNOWN.</p>}
          <PuzzleForm key={challenge + p.stage} puzzle={challenge === 'main' ? main[p.stage] : challenge === 'seal' ? seal : recovery} onSubmit={submitChallenge} />
        </>}
        {!challenge && tab === 'terminal' && <>
          <p className="eyebrow">CONSOLA / SESIÓN LOCAL</p>
          <h2>{p.stage === 6 ? 'Control local recuperado' : objective}</h2>
          {p.stage >= 2 && p.stage < 6 && <p className="unknown"><strong>UNKNOWN</strong> · {p.stage < 4
            ? 'Montá el servidor y quizás te deje salir.'
            : p.log === 'kept' ? 'Ese registro no te protege. Entregame el acceso y terminemos.'
            : p.log === 'deleted' ? 'Bien. Ya borraste mi rastro. Ahora necesito el acceso.'
            : 'NEXUS enterró mi informe. Leé el correo y después entregame el acceso.'}</p>}
          {p.intrusion === 4 && <p className="hint">La cerradura está comprometida. Abrí Diagnóstico para recuperar el control.</p>}
          {due && <div className="notice"><p>Hay una amenaza pendiente. La consola requiere una defensa antes de continuar.</p>
            <button onClick={() => { setFeedback(''); dispatch({type:'attack', at:Date.now(), scripted:true}); }}>Abrir alerta de intrusión</button>
          </div>}
          {!due && p.stage < 6 && <>
            {mainLock(p) ? <p className="hint">{mainLock(p)}</p> :
              <button className="primary" disabled={p.intrusion === 4} onClick={() => openChallenge('main')}>Abrir reto · {main[p.stage].id}</button>}
            {p.stage === 5 && <div className="notice">
              <p>Podés validar el protocolo local o responder a UNKNOWN. Si falla la primera validación, tendrás un último intento.</p>
              <button onClick={() => setConfirm('transfer')}>Responder a UNKNOWN</button>
              {game.finalErrors > 0 && <button onClick={() => retry(5)}>Restaurar el punto de control final</button>}
            </div>}
          </>}
          {p.stage === 6 && <>
            <p>La puerta ya se puede abrir. También podés resguardar las pruebas si encontraste las tres y conservaste la bitácora.</p>
            <div className="actions">
              <button onClick={() => { changeView('room'); inspect('door'); }}>Ir a la puerta</button>
              {canSeal(p) && !p.sealed && <button className="primary" onClick={() => openChallenge('seal')}>Preparar copia de las pruebas</button>}
              {p.sealed && <button className="primary" onClick={() => finish('THE TRUTH')}>Resguardar las pruebas y salir</button>}
            </div>
          </>}
        </>}
        {!challenge && (tab === 'archivos' || tab === 'registros') && <>
          <p className="eyebrow">VOLUMEN NEXUS / {tab.toUpperCase()}</p>
          <h2>{tab === 'archivos' ? 'Explorador de archivos' : 'Registro de seguridad'}</h2>
          {p.stage < 4 ? <p>Volumen bloqueado. Montá el servidor para leer su contenido.</p> : <>
            <div className="actions">
              {tab === 'archivos' ? <>
                <button onClick={() => read('mail')}>{files.mail.name}</button>
                {p.reportRoute && <button onClick={() => read('report')}>{files.report.name}</button>}
              </> : <button disabled={p.log === 'deleted'} onClick={() => read('access')}>{files.access.name}</button>}
            </div>
            {file && (file !== 'access' || p.log !== 'deleted') && <article className="file">
              <p className="eyebrow">{files[file].source}</p><p>{files[file].text}</p>
              {file === 'access' && p.log === 'pending' && <>
                <p className="unknown"><strong>UNKNOWN</strong> · Borrá ese registro. No tiene nada que ver con el informe.</p>
                <div className="actions">
                  <button onClick={() => dispatch({type:'log', keep:true})}>Conservar registro</button>
                  <button onClick={() => dispatch({type:'log', keep:false})}>Borrar registro</button>
                </div>
              </>}
            </article>}
            {tab === 'registros' && p.log !== 'pending' && <p className="hint">{p.log === 'kept' ? 'Registro protegido contra escritura.' : 'Registro eliminado por orden local.'}</p>}
          </>}
        </>}
        {!challenge && tab === 'diagnóstico' && <>
          <h2>Diagnóstico del sistema</h2>
          <p>Intrusión {p.intrusion}/5 · {intrusions[p.intrusion]}.</p>
          <p>Pruebas leídas: {p.files.length}/3 · Punto seguro: {checkpointNames[checkpoint]}.</p>
          {p.intrusion === 4 && <button className="primary" onClick={() => openChallenge('recovery')}>Recuperar cerradura</button>}
          <ul>{p.clues.map(id => <li key={id}>{objects[id].name}</li>)}</ul>
        </>}
      </div>
    </section>;
  }

  const previousAttack = useRef(false);
  useEffect(() => {
    if (previousAttack.current && !game.attack && !feedback && !lost) {
      setFeedback('TIEMPO AGOTADO · Intrusión +1. Revisá el diagnóstico antes de seguir.');
    }
    previousAttack.current = Boolean(game.attack);
  }, [game.attack, feedback, lost]);

  return <main className={effects && p.intrusion > 0 ? 'effects' : ''}>
    <header className="top">
      <div><p className="eyebrow">NEXUS SYSTEMS / INCIDENTE 07</p><strong className="logo">ACCESS DENIED</strong></div>
      <button onClick={() => setPaused(!paused)}>{paused ? 'Reanudar' : 'Pausa y ajustes'}</button>
    </header>
    <div className="hud">
      <span>{act}</span>
      <span className="intrusion" aria-label={'Intrusión ' + p.intrusion + ' de 5'}>INTRUSIÓN
        <span className="meter" aria-hidden="true">{Array.from({length:5}, (_, i) => <i key={i} className={i < p.intrusion ? 'filled' : ''} />)}</span>
        {p.intrusion}/5
      </span>
    </div>
    <div inert={paused || confirm !== null}>
      {screen}
      {feedback && !game.ending && !lost && <p className="feedback" role="status">{feedback}</p>}
    </div>
    {paused && <div className="overlay">
      <section role="dialog" aria-modal="true" aria-label="Pausa y ajustes" className="modal">
        <p className="eyebrow">SESIÓN EN PAUSA</p><h2>Pausa y ajustes</h2>
        <label className="setting">Volumen <input type="range" min="0" max="100" value={volume} onChange={event => setVolume(Number(event.target.value))}/></label>
        <label className="setting"><input type="checkbox" checked={effects} onChange={event => setEffects(event.target.checked)} /> Efectos visuales de intrusión</label>
        <div className="actions">
          <button autoFocus className="primary" onClick={() => setPaused(false)}>Reanudar partida</button>
          <button onClick={() => { setPaused(false); setConfirm('reset'); }}>Nueva partida</button>
        </div>
      </section>
    </div>}
    {confirm && !paused && <div className="overlay">
      <section role="dialog" aria-modal="true" aria-label="Confirmar decisión" className="modal">
        <p className="eyebrow">{confirm === 'transfer' ? 'SOLICITUD REMOTA' : 'REINICIAR SESIÓN'}</p>
        <h2>{confirm === 'transfer' ? '¿Ceder el acceso de administrador?' : '¿Empezar otra partida?'}</h2>
        <p>{confirm === 'transfer'
          ? 'UNKNOWN recibiría acceso al servidor y a la cerradura. Podés cancelar para revisar los registros o validar el protocolo local.'
          : 'Se reemplazarán el progreso actual y sus puntos de control.'}</p>
        <div className="actions">
          <button autoFocus onClick={() => setConfirm(null)}>Cancelar</button>
          <button className="danger" onClick={() => {
            if (confirm === 'transfer') finish('UNKNOWN WINS');
            else { retry(0); dispatch({type:'reset'}); }
          }}>{confirm === 'transfer' ? 'Transferir control' : 'Reiniciar partida'}</button>
        </div>
      </section>
    </div>}
    <footer><span>PUNTO SEGURO / {checkpointNames[checkpoint]}</span><span>ESC · PAUSA</span></footer>
  </main>;
}

createRoot(document.getElementById('root')!).render(<App />);



