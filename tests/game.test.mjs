import assert from 'node:assert/strict';
import test from 'node:test';
import { attacks, isCorrect, main } from '../src/puzzles.ts';
import { loadGame, newGame, reducer, saveGame } from '../src/game.ts';

test('seis retos y nueve ataques con validaciones de los tres tipos', () => {
  assert.equal(main.length, 6);
  assert.equal(attacks.length, 9);
  for (const kind of ['debug', 'secuencia', 'cifrado']) {
    assert.equal(attacks.filter(puzzle => puzzle.kind === kind).length, 3);
  }
  for (const puzzle of [...main, ...attacks]) {
    assert.equal(isCorrect(puzzle, puzzle.answers[0]), true, puzzle.id);
    assert.equal(isCorrect(puzzle, puzzle.answers[0] + '; ejecutar();'), false, puzzle.id);
  }
  assert.equal(isCorrect(main[1], 'claveIngresada = = claveCorrecta'), false);
  assert.equal(isCorrect(main[1], 'claveIngresada == claveCorrecta'), true);
});

test('recuperación de cerradura reduce el nivel y guarda la partida versionada', () => {
  const state = newGame();
  const blocked = { ...state, progress: { ...state.progress, stage: 4, intrusion: 4, wave: 2, clues: ['rack'] } };
  assert.equal(reducer(blocked, { type:'challenge', challenge:'main', input:'i < 4' }), blocked);
  const recovered = reducer(blocked, { type:'challenge', challenge:'recovery', input:'canal == 2' });
  assert.equal(recovered.progress.intrusion, 2);
  const disk = new Map();
  const storage = { getItem: key => disk.get(key), setItem: (key, data) => disk.set(key, data) };
  saveGame(storage, recovered);
  assert.deepEqual(loadGame(storage), recovered);
  assert.deepEqual(loadGame({ getItem: () => '[' }), newGame());
});

test('la bitácora eliminada impide sellar incluso con el sello correcto', () => {
  const state = newGame();
  const deleted = { ...state, progress: { ...state.progress, stage: 6, files: ['mail','report','access'], log: 'deleted' } };
  assert.equal(reducer(deleted, { type:'challenge', challenge:'seal', input:'23' }), deleted);
  assert.equal(reducer(deleted, { type:'finish', ending:'THE TRUTH' }), deleted);
});

test('la introducción precede al primer reto y los guardados anteriores pueden continuarlo', () => {
  const state = reducer(newGame(), { type:'inspect', id:'note' });
  const solve = { type:'challenge', challenge:'main', input:'151' };
  assert.equal(reducer(state, solve), state);
  const { opening, ...legacyProgress } = state.progress;
  const legacy = loadGame({ getItem: () => JSON.stringify({ ...state, progress: legacyProgress }) });
  assert.equal(reducer(legacy, solve).progress.stage, 1);
  let session = state;
  for (const step of ['locked', 'contact', 'done']) {
    session = reducer(session, { type:'advanceOpening' });
    assert.equal(session.progress.opening, step);
  }
  assert.equal(reducer(session, solve).progress.stage, 1);
});

