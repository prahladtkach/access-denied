import { useState } from 'react';
import type { Puzzle } from './puzzles';

export function PuzzleForm({ puzzle, onSubmit }: { puzzle: Puzzle; onSubmit: (answer: string) => void }) {
  const [order, setOrder] = useState<number[]>([]);
  const [answer, setAnswer] = useState('');
  const [hint, setHint] = useState(false);
  const lines = puzzle.lines;

  function move(index: number, offset: number) {
    setOrder(previous => {
      const next = [...previous];
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
      return next;
    });
  }

  return <form className="puzzle" onSubmit={event => {
    event.preventDefault();
    onSubmit(lines ? order.join(',') : answer);
  }}>
    <p className="eyebrow">{puzzle.id} / LENGUAJE C</p>
    <h2>{puzzle.title}</h2>
    <p>{puzzle.prompt}</p>
    {puzzle.code && <pre><code>{puzzle.code}</code></pre>}
    {lines ? <>
      <p className="muted">Elegí cada línea para agregarla. Podés moverla o quitarla después.</p>
      <div className="line-bank">
        {lines.map((line, index) => <button key={index} type="button" autoFocus={index === 0} disabled={order.includes(index)}
          onClick={() => setOrder([...order, index])}>＋ <code>{line}</code></button>)}
      </div>
      <ol className="line-order" aria-label="Secuencia armada">
        {order.map((line, index) => <li key={line}>
          <code>{lines[line]}</code>
          <span>
            <button type="button" aria-label={'Subir línea ' + (index + 1)} disabled={!index} onClick={() => move(index, -1)}>↑</button>
            <button type="button" aria-label={'Bajar línea ' + (index + 1)} disabled={index === order.length - 1} onClick={() => move(index, 1)}>↓</button>
            <button type="button" aria-label={'Quitar línea ' + (index + 1)} onClick={() => setOrder(order.filter(id => id !== line))}>×</button>
          </span>
        </li>)}
      </ol>
    </> : <label className="answer">
      {puzzle.kind === 'debug' ? 'Condición en C' : 'Respuesta'}
      <input autoFocus autoComplete="off" spellCheck={false} value={answer} onChange={event => setAnswer(event.target.value)} />
    </label>}
    <div className="actions">
      <button className="primary" disabled={lines ? order.length !== lines.length : !answer.trim()}>Validar</button>
      <button type="button" aria-expanded={hint} onClick={() => setHint(!hint)}>{hint ? 'Ocultar pista' : 'Ver pista'}</button>
    </div>
    {hint && <p className="hint">{puzzle.hint}</p>}
  </form>;
}

