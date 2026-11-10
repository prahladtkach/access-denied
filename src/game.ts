import { attacks, isCorrect, main, recovery, seal } from './puzzles.ts';

export type ObjectId = 'desk' | 'note' | 'cabinet' | 'rack' | 'door' | 'clock';
export type Opening = 'shift' | 'locked' | 'contact' | 'done';
export type FileId = 'mail' | 'access' | 'report';
export type Ending = 'ESCAPE' | 'THE TRUTH' | 'UNKNOWN WINS';

export interface Progress {
  stage: number;
  clues: ObjectId[];
  files: FileId[];
  log: 'pending' | 'kept' | 'deleted';
  intrusion: number;
  wave: number;
  sealed: boolean;
  reportRoute?: boolean;
  opening?: Opening;
}

type Challenge = 'main' | 'recovery' | 'seal';
export interface Game {
  progress: Progress;
  checkpoints: Progress[];
  attack: { index: number; remaining: number | null } | null;
  lastAttack: number;
  finalErrors: number;
  ending: Ending | null;
}

export type Action =
  | { type: 'inspect'; id: ObjectId }
  | { type: 'advanceOpening' }
  | { type: 'findReport' }
  | { type: 'read'; id: FileId }
  | { type: 'log'; keep: boolean }
  | { type: 'challenge'; challenge: Challenge; input: string }
  | { type: 'attack'; at: number; scripted?: boolean }
  | { type: 'start' }
  | { type: 'tick'; at: number; seconds: number }
  | { type: 'defend'; input: string; at: number }
  | { type: 'finish'; ending: Ending }
  | { type: 'retry'; checkpoint: number }
  | { type: 'reset' };

const initial: Progress = {
  stage: 0, clues: [], files: [], log: 'pending', intrusion: 0, wave: 0, sealed: false, opening: 'shift',
};

export function newGame(): Game {
  return { progress: initial, checkpoints: [initial], attack: null, lastAttack: 0, finalErrors: 0, ending: null };
}

export const checkpointNames: Record<number, string> = {
  0: 'Inicio', 2: 'Terminal recuperada', 4: 'Servidor desbloqueado', 5: 'Antes del protocolo final',
};

export function mainLock(p: Progress) {
  if (p.stage === 0 && p.opening && p.opening !== 'done') return 'Atendé la conexión entrante antes de usar la terminal.';
  if (p.stage === 0 && !p.clues.includes('note')) return 'Buscá una nota en el escritorio de la habitación.';
  if (p.stage === 3 && !p.clues.includes('cabinet')) return 'El cerrojo se abrió. Revisá el armario en la habitación.';
  if (p.stage === 4 && !p.clues.includes('rack')) return 'Revisá el rack para identificar los módulos de la cerradura.';
  return '';
}

export function canSeal(p: Progress) {
  return p.stage === 6 && p.files.length === 3 && p.log === 'kept';
}

const scheduledWaves: Record<number, number> = { 2: 1, 4: 2, 5: 3 };

export function scriptedAttack(p: Progress) {
  return (scheduledWaves[p.stage] ?? 0) > p.wave;
}

function resolveAttack(state: Game, won: boolean, at: number): Game {
  const p = state.progress;
  return {
    ...state, attack: null, lastAttack: at,
    progress: { ...p, wave: p.wave + 1, intrusion: Math.min(5, p.intrusion + (won ? 0 : 1)) },
  };
}

export function reducer(state: Game, action: Action): Game {
  const p = state.progress;
  if (action.type === 'reset') return newGame();
  if (action.type === 'retry') {
    const index = state.checkpoints.findIndex(cp => cp.stage === action.checkpoint);
    if (index < 0) return state;
    return { ...newGame(), progress: state.checkpoints[index], checkpoints: state.checkpoints.slice(0, index + 1) };
  }
  if (state.ending || p.intrusion === 5) return state;
  if (state.attack) {
    const puzzle = attacks[state.attack.index];
    if (action.type === 'start' && state.attack.remaining === null) {
      return { ...state, attack: { ...state.attack, remaining: puzzle.seconds! } };
    }
    if (state.attack.remaining === null) return state;
    if (action.type === 'defend') return resolveAttack(state, isCorrect(puzzle, action.input), action.at);
    if (action.type === 'tick') {
      const remaining = state.attack.remaining - action.seconds;
      return remaining <= 0 ? resolveAttack(state, false, action.at) : { ...state, attack: { ...state.attack, remaining } };
    }
    return state;
  }

  switch (action.type) {
    case 'advanceOpening': {
      if (p.stage !== 0) return state;
      const next = { shift: 'locked', locked: 'contact', contact: 'done' } as const;
      if (!p.opening || p.opening === 'done') return state;
      return { ...state, progress: { ...p, opening: next[p.opening] } };
    }
    case 'inspect':
      if (action.id === 'cabinet' && p.stage < 3 || action.id === 'rack' && p.stage < 4) return state;
      if (p.clues.includes(action.id)) return state;
      return { ...state, progress: { ...p, clues: [...p.clues, action.id] } };
    case 'findReport':
      if (!p.clues.includes('rack') || p.reportRoute) return state;
      return { ...state, progress: { ...p, reportRoute: true } };
    case 'read':
      if (p.stage < 4 || p.files.includes(action.id) || action.id === 'report' && !p.reportRoute) return state;
      return { ...state, progress: { ...p, files: [...p.files, action.id] } };
    case 'log':
      if (!p.files.includes('access') || p.log !== 'pending') return state;
      return { ...state, progress: { ...p, log: action.keep ? 'kept' : 'deleted' } };
    case 'attack': {
      const due = scriptedAttack(p);
      const dynamic = p.stage >= 2 && p.stage <= 4 && action.at - state.lastAttack >= 90_000;
      if (action.scripted ? !due : !dynamic) return state;
      return { ...state, attack: { index: p.wave % attacks.length, remaining: null } };
    }
    case 'challenge': {
      if (action.challenge === 'recovery') {
        if (p.intrusion !== 4 || !isCorrect(recovery, action.input)) return state;
        return { ...state, progress: { ...p, intrusion: 2 }, finalErrors: 0 };
      }
      if (action.challenge === 'seal') {
        if (!canSeal(p) || !isCorrect(seal, action.input)) return state;
        return { ...state, progress: { ...p, sealed: true } };
      }
      const puzzle = main[p.stage];
      if (!puzzle || mainLock(p) || scriptedAttack(p) || p.intrusion === 4) return state;
      if (!isCorrect(puzzle, action.input)) {
        if (p.stage !== 5) return state;
        if (state.finalErrors === 0) return { ...state, finalErrors: 1 };
        return { ...state, ending: 'UNKNOWN WINS' };
      }
      const progress = { ...p, stage: p.stage + 1 };
      const checkpoints = checkpointNames[progress.stage] ? [...state.checkpoints, progress] : state.checkpoints;
      return { ...state, progress, checkpoints, finalErrors: 0 };
    }
    case 'finish':
      if (action.ending === 'UNKNOWN WINS') {
        return p.stage === 5 && !scriptedAttack(p) ? { ...state, ending: action.ending } : state;
      }
      if (p.stage !== 6 || action.ending === 'THE TRUTH' && !p.sealed) return state;
      return { ...state, ending: action.ending };
    default:
      return state;
  }
}

export const saveKey = 'access-denied:v1';

export function loadGame(storage: Pick<Storage, 'getItem'>): Game {
  try {
    const value = JSON.parse(storage.getItem(saveKey) ?? 'null') as Game | null;
    if (value && Number.isInteger(value.progress.stage) && value.checkpoints[0]?.stage === 0) return value;
  } catch { /* Una partida inaccesible o dañada vuelve al inicio. */ }
  return newGame();
}

export function saveGame(storage: Pick<Storage, 'setItem'>, game: Game) {
  try {
    storage.setItem(saveKey, JSON.stringify(game));
  } catch { /* El juego sigue disponible sin persistencia. */ }
}


