import type { Ending } from './game';
import { endings } from './story';
import './ending.css';

const closing = {
  ESCAPE: 'Se abre la puerta. Del otro lado no se oye ningún paso.',
  'THE TRUTH': 'Copia verificada. Por primera vez en toda la noche, el archivo está fuera de su alcance.',
  'UNKNOWN WINS': 'Sesión local cerrada. La última orden de la cerradura no vino de este lado.',
} satisfies Record<Ending, string>;

export function EndingScreen({ ending, retry, restart }: {
  ending: Ending; retry?: () => void; restart: () => void;
}) {
  const result = endings[ending];
  const tone = ending === 'UNKNOWN WINS' ? 'remote' : ending === 'THE TRUTH' ? 'truth' : 'escape';
  return <section className="end-panel end-cinematic" data-ending={tone} aria-label="Cierre de sesión">
    <div className="end-cinematic-inner">
      <p className="eyebrow">NEXUS SYSTEMS / REGISTRO FINAL</p>
      <p className="status-line">{result.line}</p>
      <h1>{ending}</h1>
      <div className="end-resolution">
        <h2>{result.label}</h2>
        <p className="end-closing">{closing[ending]}</p>
        <p>{result.text}</p>
        <div className="actions">
          {retry && <button className="primary" onClick={retry}>Volver al punto de control final</button>}
          <button onClick={restart}>Nueva partida</button>
        </div>
      </div>
    </div>
  </section>;
}