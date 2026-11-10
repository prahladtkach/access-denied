import { useEffect, useReducer, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { attacks, isCorrect, main, recovery, seal } from './puzzles';
import { canSeal, checkpointNames, loadGame, mainLock, reducer, saveGame, scriptedAttack } from './game';
import type { Ending, FileId, ObjectId } from './game';
import { endings, files, objects } from './story';
import { PuzzleForm } from './PuzzleForm';
import { Desktop, useDesktop } from './Desktop';
import type { AppId, Notice } from './Desktop';
import { FileExplorer } from './FileExplorer';
import { MainMenu } from './MainMenu';
import { Laboratory } from './Laboratory';
import type { Direction } from './Laboratory';
import { useAudio } from './audio';
import { Preferences } from './Preferences';
import './style.css';

type View = 'menu' | 'intro' | 'room' | 'pc';
type Challenge = 'main' | 'recovery' | 'seal';
const sessionKey = 'access-denied:started';

function App() {
  const [game, dispatch] = useReducer(reducer, undefined, () => loadGame(localStorage));
  const [view, setView] = useState<View>('menu');
  const desktop = useDesktop();
  const [desktopSession, setDesktopSession] = useState(0);
  const [bootTime, setBootTime] = useState(() => Date.now());
  const [started, setStarted] = useState(() => {
    try { return localStorage.getItem(sessionKey) === '1'; } catch { return false; }
  });
  const [fullscreen, setFullscreen] = useState(false);
  const [displayError, setDisplayError] = useState('');
  const shell = useRef<HTMLElement>(null);
  const [inspected, setInspected] = useState<ObjectId | null>(null);
  const [direction, setDirection] = useState<Direction>('salida');
  const [osReady, setOsReady] = useState(false);
  const [readingLog, setReadingLog] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [feedback, setFeedback] = useState('');
  const [paused, setPaused] = useState(false);
  const [confirm, setConfirm] = useState<'transfer' | 'reset' | null>(null);
  const [backupLight, setBackupLight] = useState(false);
  const { preferences, setPreferences, play } = useAudio();
  const { effects } = preferences;
  const p = game.progress;
  const due = scriptedAttack(p);
  const lost = p.intrusion === 5;
  const dark = p.intrusion >= 3 && !backupLight;
  const timing = game.attack?.remaining != null;
  const playing = view === 'pc' || view === 'room';
  const canContinue = started || p.stage > 0 || p.clues.length > 0 || lost || Boolean(game.ending);
  const canInterrupt = osReady && !paused && !confirm && !challenge && !game.attack &&
    !due && !lost && !game.ending && view === 'pc' && desktop.active === 'terminal' && p.stage >= 2 && p.stage <= 4;

  useEffect(() => saveGame(localStorage, game), [game]);
  useEffect(() => {
    if (view !== 'pc' || osReady) return;
    const timer = window.setTimeout(() => setOsReady(true), 560);
    return () => window.clearTimeout(timer);
  }, [view, osReady]);
  useEffect(() => {
    if (paused || !playing || !timing) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const seconds = Math.floor((now - last) / 1000);
      if (!seconds) return;
      last += seconds * 1000;
      dispatch({type:'tick', at:Date.now(), seconds});
    }, 200);
    return () => window.clearInterval(timer);
  }, [paused, playing, timing]);

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
      if (event.key === 'Escape' && !event.repeat) {
        if (confirm) setConfirm(null);
        else if (playing || paused) setPaused(value => !value);
      }
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [playing, paused, confirm]);

  useEffect(() => {
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => document.removeEventListener('fullscreenchange', onFullscreen);
  }, []);

  async function toggleFullscreen() {
    setDisplayError('');
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (shell.current?.requestFullscreen) await shell.current.requestFullscreen();
      else setDisplayError('El navegador no permite activar pantalla completa desde esta vista.');
    } catch {
      setDisplayError('El navegador no pudo cambiar a pantalla completa.');
    }
  }

  function beginNewSession() {
    retry(0);
    dispatch({type:'reset'});
    setStarted(true);
    setBootTime(Date.now());
    try { localStorage.setItem(sessionKey, '1'); } catch { /* La sesión puede jugarse sin guardado. */ }
    setView('intro');
  }

  function startShift() {
    play('lock');
    dispatch({type:'advanceOpening'});
    look('salida');
    setView('room');
  }

  function tryDoor() {
    play('link');
    dispatch({type:'advanceOpening'});
  }

  function useComputer() {
    if (!osReady) play('boot');
    if (p.opening === 'contact') {
      desktop.setMode('unknown', 'open');
      play('link');
    }
    changeView('pc');
  }

  function acknowledgeContact() {
    dispatch({type:'advanceOpening'});
    desktop.setMode('unknown', 'closed');
    desktop.setMode('terminal', 'open');
  }

  function look(target: Direction) {
    setDirection(target);
    setInspected(null);
  }

  function changeView(target: 'room' | 'pc') {
    setView(target);
    setChallenge(null);
    setReadingLog(false);
    setFeedback('');
  }

  function inspect(id: ObjectId) {
    setInspected(id);
    if (id !== 'rack' || !dark || p.clues.includes('rack')) dispatch({type:'inspect', id});
  }

  function retry(stage: number) {
    dispatch({type:'retry', checkpoint:stage});
    look(stage ? 'puesto' : 'salida');
    setOsReady(false);
    setBackupLight(false);
    desktop.reset();
    setDesktopSession(value => value + 1);
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
    dispatch({type:'read', id});
    if (id === 'access') {
      setReadingLog(true);
      if (p.log === 'pending' && !p.files.includes('access')) desktop.setMode('unknown', 'open');
    }
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

  const unknownMessage = p.opening === 'contact'
    ? 'Escuché el tirón de la puerta. No te gastes. Tengo el cierre en remoto. NEXUS dejó el mantenimiento abierto por algo. Averiguá qué, antes de que vuelva seguridad.'
    : p.log === 'kept'
    ? 'Protegiste el registro. Bien. Ahora preguntate quién te encerró primero.'
    : p.log === 'deleted' ? 'Borraste mi rastro. Todavía falta que me abras la puerta.'
    : p.files.includes('access') ? 'Borrá esa bitácora. Si vas a leer sobre mí, por lo menos leé lo que NEXUS ocultó.'
    : p.stage >= 4 ? 'Enterraron mi informe. Mirá el correo antes de decidir a quién le creés.'
    : p.clues.includes('rack') ? 'Ese rack tiene un micrófono viejo. Puedo oír cuándo te alejás.'
    : p.clues.includes('clock') ? 'El reloj no se atrasó. Alguien cortó ese circuito a las 23:41.'
    : 'Montá el servidor. Podemos discutir después quién le debe un favor a quién.';

  const notices: Notice[] = [];
  if (p.opening === 'contact') notices.push({
    id: 'first-contact', title: 'Conexión remota entrante', text: 'El usuario externo abrió un canal de voz local.', app: 'unknown', remote: true,
  });
  if (p.stage >= 2 && p.clues.includes('clock')) notices.push({
    id: 'clock-observation', title: 'UNKNOWN / 23:41', text: 'Veo que el reloj también te llamó la atención.', app: 'unknown', remote: true,
  });
  if (p.stage >= 4 && p.clues.includes('rack')) notices.push({
    id: 'rack-observation', title: 'UNKNOWN / canal abierto', text: 'Te escuché junto al rack. El interruptor de red sigue donde lo dejaron.', app: 'unknown', remote: true,
  });
  if (p.stage >= 2) notices.push({
    id: 'external', title: 'UNKNOWN / canal externo', text: 'Se estableció una conexión entrante.', app: 'unknown', remote: true,
  });
  if (p.stage >= 4) notices.push({
    id: 'volume', title: 'Volumen conectado', text: 'Ya podés explorar los archivos de NEXUS.', app: 'archivos',
  });
  if (p.reportRoute) notices.push({
    id: 'report', title: 'Ruta recuperada', text: 'El informe está en la carpeta Archivo técnico.', app: 'archivos',
  });
  if (p.files.includes('access')) notices.push({
    id: 'log', title: 'UNKNOWN / mensaje privado', text: unknownMessage, app: 'unknown', remote: true,
  });
  if (p.intrusion === 4) notices.push({
    id: 'lock-' + p.wave, title: 'Cerradura comprometida', text: 'Ejecutá el diagnóstico de recuperación.', app: 'diagnóstico',
  });
  if (due) notices.push({
    id: 'threat-' + p.stage, title: 'Alerta de seguridad', text: 'La terminal detectó una solicitud de intrusión.', app: 'terminal',
  });

  function renderEditor() {
    if (!challenge) return null;
    return <><button onClick={() => setChallenge(null)}>← Cerrar editor</button>
      {challenge === 'main' && p.stage === 5 && game.finalErrors > 0 &&
        <p className="unknown">Último intento. Otro error le cederá el control a UNKNOWN.</p>}
      {challenge === 'main' && <p className="case-purpose">{[
        'La consola de mantenimiento está aislada del control remoto. Encenderla te da una forma de responder.',
        'La autenticación está aceptando credenciales incorrectas. Si no la reparás, el canal externo sigue entrando.',
        'El armario guarda las credenciales de servicio. El cerrojo todavía responde a pulsos locales.',
        'La tarjeta te permite montar el volumen donde NEXUS guardó lo que pasó esta noche.',
        'El rack alimenta los módulos de la puerta. Necesitás recuperarlos antes de cortar la sesión externa.',
        'UNKNOWN espera que le entregues el acceso. La puerta todavía puede volver a responder solo desde acá.',
      ][p.stage]}</p>}
      <PuzzleForm key={challenge + p.stage} puzzle={challenge === 'main' ? main[p.stage] : challenge === 'seal' ? seal : recovery} onSubmit={submitChallenge} />
    </>;
  }

  function renderFile(id: FileId) {
    return <article className="file">
      <p className="eyebrow">{files[id].source}</p><p>{files[id].text}</p>
      {id === 'access' && p.log === 'pending' && <>
        <p className="unknown"><strong>UNKNOWN</strong> · Borrá ese registro. No tiene nada que ver con el informe.</p>
        <div className="actions">
          <button onClick={() => dispatch({type:'log', keep:true})}>Conservar registro</button>
          <button onClick={() => dispatch({type:'log', keep:false})}>Borrar registro</button>
        </div>
      </>}
    </article>;
  }

  const interrupt = game.attack && attackPuzzle ? <section className="terminal-panel attack">
      <div className="terminal-bar"><span>⚠ INTRUSIÓN EN CURSO</span><span>{timing ? game.attack.remaining + ' s' : 'EN ESPERA'}</span></div>
      {!timing ? <div className="pane">
        <p className="eyebrow">MENSAJE / UNKNOWN</p><h2>{attackPuzzle.title}</h2>
        <p>«Si querés mantener el control, vas a tener que defenderlo.»</p>
        <p>{attackPuzzle.kind === 'debug' ? 'Escribí la condición corregida en C.' :
          attackPuzzle.kind === 'secuencia' ? 'Armá una rutina de C ordenando las líneas.' : 'Interpretá los datos del fragmento de C y escribí la clave.'}
          {' '}Tenés {attackPuzzle.seconds} segundos desde que iniciás la defensa. Un error o agotar el tiempo aumenta la intrusión.</p>
        <button autoFocus className="primary" onClick={() => { play('alert'); dispatch({type:'start'}); }}>Iniciar defensa</button>
      </div> : <div className="pane">
        <PuzzleForm key={attackPuzzle.id} puzzle={attackPuzzle} onSubmit={input => {
          setFeedback(isCorrect(attackPuzzle, input) ? 'ATAQUE BLOQUEADO · ' + attackPuzzle.explanation :
            'DEFENSA FALLIDA · Intrusión +1. ' + attackPuzzle.explanation);
          dispatch({type:'defend', input, at:Date.now()});
        }} />
      </div>}
    </section> : undefined;

  let screen;
  if (view === 'menu') {
    screen = <MainMenu canContinue={canContinue} active={!paused && !confirm}
      newGame={() => canContinue ? setConfirm('reset') : beginNewSession()}
      continueGame={() => setView(game.attack ? 'pc' : p.opening === 'shift' ? 'intro' : 'room')}
      openOptions={() => setPaused(true)} />;
  } else if (view === 'intro') {
    screen = <section className="intro-screen">
      <div>
        <p className="eyebrow">23:41 / LABORATORIO DE PROGRAMACIÓN</p>
        <h1>Último turno</h1>
        <p>Guardaste el último informe. Del otro lado de la pared, seguridad acaba de apagar las luces del pasillo.</p>
        <p>Ya podés irte a casa.</p>
        <button autoFocus className="primary" onClick={startShift}>Entrar al laboratorio</button>
      </div>
    </section>;
  } else if (game.ending) {
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
  } else if (view === 'room' && !game.attack) {
    screen = <Laboratory direction={direction} look={look} inspect={inspect} selected={inspected}
      dark={dark} locked={p.stage < 6}>
        {inspected ? <>
          <p className="eyebrow">OBJETO / {objects[inspected].name}</p>
          <p aria-live="polite">{inspected === 'door' && p.opening === 'locked'
            ? 'El lector rechaza tu credencial. La manija sigue inmóvil.' :
            inspected === 'door' && p.opening === 'contact'
            ? 'CONTROL REMOTO. La cerradura hizo otro clic sin que la tocaras.' :
            inspected === 'cabinet' && p.stage < 3 ? 'Un cerrojo magnético bloquea el armario.' :
            inspected === 'rack' && p.stage < 4 ? 'El rack está activo. El manual permanece detrás del panel bloqueado.' :
            inspected === 'rack' && dark && !p.clues.includes('rack') ? 'El panel quedó a oscuras. Encendé la luz auxiliar para leer el manual.' :
            inspected === 'door' && p.stage === 6 ? 'CONTROL LOCAL. La puerta ya responde.' : objects[inspected].text}</p>
          {inspected === 'rack' && p.stage >= 4 && dark && !p.clues.includes('rack') &&
            <button onClick={() => { setBackupLight(true); dispatch({type:'inspect', id:'rack'}); }}>Encender luz auxiliar</button>}
          {inspected === 'rack' && p.clues.includes('rack') && (p.reportRoute
            ? <p className="hint">Ruta recuperada: /archivo/informe_original.txt. Ya aparece en Archivos.</p>
            : <button onClick={() => dispatch({type:'findReport'})}>Revisar el reverso del manual</button>)}
          {inspected === 'rack' && p.intrusion >= 2 &&
            <p className="lab-observation">El altavoz del rack cruje. «Te vi acercarte.»</p>}
          {inspected === 'clock' && p.opening !== 'locked' && p.opening !== 'shift' &&
            <p className="lab-observation">Desde el puesto llega un zumbido. El segundero se queda quieto.</p>}
          {inspected === 'door' && p.opening === 'locked' &&
            <button className="primary" onClick={tryDoor}>Probar la puerta</button>}
          {inspected === 'door' && p.opening === 'contact' &&
            <p className="lab-event" role="status">Un tono agudo llega desde el puesto. El CRT acaba de encenderse.</p>}
          {inspected === 'desk' && p.opening === 'locked' &&
            <p className="lab-event">Algo golpeó dentro de la cerradura. Revisá la salida.</p>}
          {inspected === 'desk' && p.opening !== 'locked' &&
            <button className="primary" onClick={useComputer}>Usar computadora</button>}
          {inspected === 'door' && p.stage === 6 && <button className="primary" onClick={() => finish('ESCAPE')}>Salir del laboratorio</button>}
        </> : <>
          <p className="eyebrow">23:41 / NEXUS SYSTEMS</p>
          {p.opening === 'locked' ? <p className="lab-event" role="status">CLAC. La cerradura electrónica acaba de activarse.</p>
            : p.opening === 'contact' ? <p className="lab-event">El tono viene del puesto de trabajo. Alguien está esperando del otro lado.</p>
            : <p>El pasillo sigue a oscuras. El zumbido del laboratorio es lo único que se escucha.</p>}
        </>}
    </Laboratory>;
  } else {
    function renderApp(id: AppId) {
      if (id === 'unknown') return <div className="remote-message">
        <p className="eyebrow">ENLACE ENTRANTE / REMITENTE DESCONOCIDO</p>
        <h2>UNKNOWN</h2><p>«{unknownMessage}»</p>
        {p.opening === 'contact' && <button className="primary" onClick={acknowledgeContact}>Silenciar el canal</button>}
      </div>;
      if (id === 'configuración') return <>
        <p className="eyebrow">NEXUS / PREFERENCIAS LOCALES</p>
        <h2>Configuración</h2><Preferences value={preferences} update={setPreferences} />
      </>;
      if (id === 'archivos') return <FileExplorer mounted={p.stage >= 4} archive={Boolean(p.reportRoute)}
        onRead={read} renderFile={renderFile} />;
      if (id === 'registros') return <>
        <p className="eyebrow">NEXUS / CONTROL DE ACCESO</p>
        <h2>Registro de seguridad</h2>
        {p.stage < 4 ? <p>Volumen bloqueado. Montá el servidor para leer su contenido.</p> : <>
          <button disabled={p.log === 'deleted'} onClick={() => read('access')}>{files.access.name}</button>
          {readingLog && p.log !== 'deleted' && renderFile('access')}
          {p.log !== 'pending' && <p className="hint">{p.log === 'kept' ? 'Registro protegido contra escritura.' : 'Registro eliminado por orden local.'}</p>}
        </>}
      </>;
      if (id === 'diagnóstico') return challenge === 'recovery' ? renderEditor() : <>
        <p className="eyebrow">NEXUS / SEGURIDAD LOCAL</p>
        <h2>Diagnóstico del sistema</h2>
        <p>Intrusión {p.intrusion}/5 · {intrusions[p.intrusion]}.</p>
        <p>Pruebas leídas: {p.files.length}/3 · Punto seguro: {checkpointNames[checkpoint]}.</p>
        {p.intrusion === 4 && <button className="primary" onClick={() => openChallenge('recovery')}>Recuperar cerradura</button>}
        <ul>{p.clues.map(id => <li key={id}>{objects[id].name}</li>)}</ul>
      </>;
      if (p.opening === 'contact') return <>
        <p className="eyebrow">TERMINAL 07 / CANAL OCUPADO</p>
        <p>Una sesión remota reclama el control de la cerradura.</p>
        <button onClick={() => desktop.setMode('unknown', 'open')}>Abrir canal entrante</button>
      </>;
      if (challenge && challenge !== 'recovery') return renderEditor();
      return <>
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
              <button onClick={() => { changeView('room'); setDirection('salida'); inspect('door'); }}>Ir a la puerta</button>
              {canSeal(p) && !p.sealed && <button className="primary" onClick={() => openChallenge('seal')}>Preparar copia de las pruebas</button>}
              {p.sealed && <button className="primary" onClick={() => finish('THE TRUTH')}>Resguardar las pruebas y salir</button>}
            </div>
          </>}
      </>;
    }

    screen = <Desktop key={desktopSession} state={desktop} leave={() => { look('puesto'); changeView('room'); }}
      renderApp={renderApp} notices={notices} bootTime={bootTime} interrupt={interrupt}
      booting={!osReady && !interrupt} muted={preferences.muted} security={p.intrusion}
      toggleMute={() => setPreferences({ ...preferences, muted: !preferences.muted })} />;
  }

  const previousAttack = useRef<number | null>(null);
  useEffect(() => {
    const wave = previousAttack.current;
    if (wave !== null && !game.attack && p.wave === wave + 1 && !feedback && !lost) {
      setFeedback('TIEMPO AGOTADO · Intrusión +1. Revisá el diagnóstico antes de seguir.');
    }
    previousAttack.current = game.attack ? p.wave : null;
  }, [game.attack, p.wave, feedback, lost]);

  return <main ref={shell} className={['game-shell', 'view-' + view, effects && 'fx-on', effects && p.intrusion > 0 && 'effects'].filter(Boolean).join(' ')}>
    <header className="top" inert={paused || confirm !== null}>
      {!playing && <span className="logo"><span aria-hidden="true">◇</span> NEXUS SYSTEMS</span>}
      <div className="top-actions">
        <button onClick={toggleFullscreen} aria-label={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}>{playing ? '⛶' : fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}</button>
        {playing && <button aria-label="Pausa y ajustes" title="Pausa y ajustes (Esc)" onClick={() => setPaused(true)}>Ⅱ</button>}
      </div>
    </header>
    {playing && <div className="hud">
      <span className="sr-only">{act}</span>
      <span className="intrusion" aria-label={'Intrusión ' + p.intrusion + ' de 5'} title="Nivel de intrusión">
        <span className="meter" aria-hidden="true">{Array.from({length:5}, (_, i) => <i key={i} className={i < p.intrusion ? 'filled' : ''} />)}</span>
        {p.intrusion}/5
      </span>
    </div>}
    <div className="game-screen" inert={paused || confirm !== null}>
      {screen}
      {displayError && <p className="display-error" role="alert">{displayError}</p>}
      {playing && feedback && !game.ending && !lost && <p className="feedback" role="status">{feedback}
        <button aria-label="Cerrar mensaje de estado" onClick={() => setFeedback('')}>×</button>
      </p>}
    </div>
    {paused && <div className="overlay">
      <section role="dialog" aria-modal="true" aria-label="Pausa y ajustes" className="modal">
        <p className="eyebrow">PREFERENCIAS LOCALES</p><h2>{playing ? 'Pausa y ajustes' : 'Opciones'}</h2>
        <Preferences value={preferences} update={setPreferences} />
        {playing && <p className="muted">Punto seguro · {checkpointNames[checkpoint]}</p>}
        <div className="actions">
          <button autoFocus className="primary" onClick={() => setPaused(false)}>{playing ? 'Reanudar partida' : 'Volver'}</button>
          {playing && <>
            <button onClick={() => { setPaused(false); setView('menu'); }}>Menú principal</button>
            <button onClick={() => { setPaused(false); setConfirm('reset'); }}>Nueva partida</button>
          </>}
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
            else beginNewSession();
          }}>{confirm === 'transfer' ? 'Transferir control' : 'Reiniciar partida'}</button>
        </div>
      </section>
    </div>}
    {playing && <footer className="sr-only">Punto seguro · {checkpointNames[checkpoint]}</footer>}
  </main>;
}

createRoot(document.getElementById('root')!).render(<App />);
