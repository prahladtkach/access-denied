import type { ReactNode } from 'react';
import type { ObjectId } from './game';
import { objects } from './story';
import './laboratory.css';

export const directions = ['salida', 'puesto', 'servicio'] as const;
export type Direction = typeof directions[number];

export const directionNames: Record<Direction, string> = {
  salida: 'Salida',
  puesto: 'Puesto de trabajo',
  servicio: 'Área de servicio',
};

const zones: Record<Direction, { id: ObjectId; box: [number, number, number, number] }[]> = {
  salida: [
    { id: 'door', box: [410, 150, 246, 300] },
    { id: 'clock', box: [695, 121, 99, 99] },
  ],
  puesto: [
    { id: 'desk', box: [246, 146, 521, 328] },
    { id: 'note', box: [611, 377, 81, 38] },
  ],
  servicio: [
    { id: 'cabinet', box: [230, 171, 222, 259] },
    { id: 'rack', box: [559, 111, 219, 322] },
  ],
};

function LabArt({ direction, locked }: { direction: Direction; locked: boolean }) {
  return <svg className="lab-art" viewBox="0 0 1024 560" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs>
      <linearGradient id="lab-wall" x2="0" y2="1"><stop stopColor="#253434" /><stop offset="1" stopColor="#111b20" /></linearGradient>
      <linearGradient id="lab-tile" x2="0" y2="1"><stop stopColor="#304341" /><stop offset="1" stopColor="#10191d" /></linearGradient>
      <radialGradient id="lab-spill"><stop stopColor="#a4d7a2" stopOpacity=".36" /><stop offset="1" stopColor="#8bc498" stopOpacity="0" /></radialGradient>
      <radialGradient id="lab-shadow"><stop stopColor="#03060a" stopOpacity=".9" /><stop offset="1" stopColor="#03060a" stopOpacity="0" /></radialGradient>
      <linearGradient id="lab-bezel" x1=".12" y1="0" x2=".8" y2="1"><stop stopColor="#6f8175" /><stop offset="1" stopColor="#25332d" /></linearGradient>
      <linearGradient id="lab-glass" x2="0" y2="1"><stop stopColor="#83bb91" /><stop offset="1" stopColor="#294d40" /></linearGradient>
      <pattern id="lab-keys" width="15" height="11" patternUnits="userSpaceOnUse">
        <path d="M1 1h12v8H1z" fill="#a3a799" /><path d="M1 8h12v2H1z" fill="#58655d" />
      </pattern>
      <pattern id="lab-rack" width="156" height="37" patternUnits="userSpaceOnUse">
        <path d="M0 0h156v31H0z" fill="#273b40" /><path d="M9 9h82v3H9zm0 6h65v3H9z" fill="#121d23" />
        <path d="M121 9h6v4h-6z" fill="#efad6f" /><path d="M132 9h6v4h-6z" fill="#8acc9b" />
      </pattern>
    </defs>
    <path d="M0 0h1024v560H0z" fill="#0b1318" />
    <path d="M145 72h734v340H145z" fill="url(#lab-wall)" />
    <path d="M0 0l145 72v340L0 520z" fill="#142126" />
    <path d="M1024 0L879 72v340l145 108z" fill="#19292c" />
    <path d="M0 0h1024L879 72H145z" fill="#111b1f" />
    <path d="M145 412h734l145 108v40H0v-40z" fill="url(#lab-tile)" />
    <path d="M145 412h734M106 440h812M56 476h912M0 523h1024M252 412L164 560m202-148-44 148m190-148v148m146-148 44 148m70-148 88 148"
      fill="none" stroke="#0e1b21" strokeWidth="4" />
    <path d="M145 72v340m734-340v340M0 137l145 51h734l145-51M0 246l145 30h734l145-30M0 374l145 5h734l145-5"
      fill="none" stroke="#111b20" strokeWidth="5" />
    <path d="M0 318l145 16h734l145-16" fill="none" stroke="#60726a" strokeOpacity=".19" strokeWidth="4" />
    <ellipse className="lab-ceiling-glow" cx="515" cy="130" rx="389" ry="143" fill="url(#lab-spill)" />
    <path d="M389 42h238l-12 12H402z" fill="#091313" />
    <path className="lab-light" d="M405 46h206v4H405z" fill="#b4c6a4" />
    {direction === 'salida' && <>
      <ellipse cx="530" cy="451" rx="239" ry="45" fill="url(#lab-shadow)" />
      <path d="M368 126h302v287H368z" fill="#0b1318" />
      <path d="M392 137h257v287H392z" fill="#35474a" />
      <path d="M406 149h225v274H406z" fill="#17242b" />
      <path d="M421 152h199v268H421z" fill="#465958" />
      <path d="M432 162h177v254H432z" fill="#2d4041" />
      <path d="M450 195h140v75H450z" fill="#18252a" stroke="#657570" strokeWidth="6" />
      <path d="M452 251l131-55v17L452 264z" fill="#8baf9f" opacity=".09" />
      <path d="M578 312h24v8h-24zM418 397h205v9H418z" fill="#71817b" />
      <path d="M653 266h27v46h-27z" fill="#152023" stroke="#546762" strokeWidth="3" />
      <path d="M659 276h15v7h-15z" fill={locked ? '#eaa075' : '#8bd3a4'} />
      <path d="M201 204h108v154H201z" fill="#131e20" stroke="#354845" strokeWidth="4" />
      <path d="M223 229h62v6h-62zm0 16h44v4h-44zm0 12h55v4h-55z" fill="#5e7268" />
      <path d="M237 312l26-27 23 27z" fill="#706945" />
      <circle cx="745" cy="169" r="45" fill="#111a1d" stroke="#435751" strokeWidth="8" />
      <circle cx="745" cy="169" r="33" fill="#929a85" />
      <path d="M745 140v7m0 44v7m-29-29h7m44 0h7m-29 0-12 15m12-15-10-20" fill="none" stroke="#233233" strokeWidth="3" />
      <path d="M745 169l19 6" stroke="#a35f49" strokeWidth="2" />
      <text x="420" y="116" fill="#9da998" fontSize="15" letterSpacing="5">SALIDA / 07</text>
    </>}
    {direction === 'puesto' && <>
      <ellipse cx="516" cy="380" rx="337" ry="139" fill="url(#lab-spill)" />
      <ellipse cx="521" cy="481" rx="377" ry="62" fill="url(#lab-shadow)" />
      <path d="M238 345h481l103 76H164z" fill="#49574e" stroke="#172524" strokeWidth="5" />
      <path d="M254 351h454l75 55H195z" fill="#53645a" />
      <path d="M165 419h658v26H165z" fill="#263632" />
      <path d="M171 421h640v6H171z" fill="#6b7460" />
      <path d="M203 446h40v65h-22l-11-58m548-7h40l-9 65h-23z" fill="#172522" />
      <path d="M276 381h152l-20 29H242z" fill="#1c302c" />
      <path d="M303 375c7-25 23-30 40-33l56-12" fill="none" stroke="#16201f" strokeWidth="4" />
      <path d="M295 375h21l4 16-10 11h-22l-4-12z" fill="#9b9c8d" stroke="#35443d" strokeWidth="2" />
      <path d="M304 376l-2 10m-14 3h30" stroke="#53665b" strokeWidth="2" />
      <ellipse cx="529" cy="357" rx="105" ry="18" fill="url(#lab-shadow)" opacity=".65" />
      <path d="M477 341h111l22 14v7H455v-7z" fill="#26362f" stroke="#18231f" strokeWidth="4" />
      <path d="M458 354h149" stroke="#65776a" strokeWidth="3" opacity=".65" />
      <path d="M494 315h73l9 31-12 5h-68l-9-5z" fill="#43564b" stroke="#1b2a24" strokeWidth="4" />
      <path d="M503 323h54v18h-54z" fill="#65776a" opacity=".5" />
      <path d="M414 171l32-22 194-9 40 25-32 28-26-22z" fill="#758677" stroke="#1b2823" strokeWidth="5" />
      <path d="M648 193l32-28 2 124-13 18-40 28 19-22z" fill="#40554a" stroke="#1a2823" strokeWidth="4" />
      <path d="M658 207l13-10m-13 21 13-10m-13 21 13-10m-13 21 13-10" fill="none" stroke="#1a2923" strokeWidth="3" />
      <path d="M414 171h208l26 22v120l-19 22H407l-19-20V193z" fill="url(#lab-bezel)" stroke="#18241f" strokeWidth="6" />
      <path d="M423 188h194l15 13v99l-13 15H421l-15-16v-97z" fill="#15251f" />
      <path className="lab-monitor" d="M430 197h177l13 10v86l-10 12H431l-13-12v-85z" fill="url(#lab-glass)" />
      <path d="M436 218h68v4h-68zm0 9h31v4h-31zm0 54h107v3H436z" fill="#d1efd0" opacity=".57" />
      <path d="M426 323h56m124 0h9" stroke="#a6b9a5" strokeWidth="3" />
      <circle cx="622" cy="323" r="3" fill="#b8f1b0" />
      <path d="M450 369h140l30 32H422z" fill="#24312b" stroke="#283630" strokeWidth="3" />
      <path d="M454 372h132l23 23H433z" fill="url(#lab-keys)" />
      <path d="M472 392h94v4h-94z" fill="#aeb1a0" />
      <path d="M625 379h54l21 26h-61z" fill="#c3b184" stroke="#756f55" strokeWidth="2" />
      <path d="M635 385h36m-30 6h34m-29 6h27" stroke="#867a5f" strokeWidth="2" />
    </>}
    {direction === 'servicio' && <>
      <ellipse cx="506" cy="438" rx="390" ry="66" fill="url(#lab-shadow)" />
      <path d="M227 178l41-27h176l29 18-26 23H244z" fill="#53655e" />
      <path d="M442 174l31-9v242l-31 28z" fill="#202e2e" />
      <path d="M230 174h214v253H230z" fill="#374c46" stroke="#162522" strokeWidth="7" />
      {[197, 255, 313, 371].map(y => <g key={y}>
        <path d={`M246 ${y}h179v42H246z`} fill="#4d6257" stroke="#23342e" strokeWidth="3" />
        <path d={`M310 ${y + 12}h49v7h-49z`} fill="#182420" />
      </g>)}
      <path d="M559 117l38-22h172l37 30-28 20H582z" fill="#435956" />
      <path d="M771 121l35 4v269l-35 36z" fill="#162528" />
      <path d="M561 121h213v309H561z" fill="#17272d" stroke="#0a151a" strokeWidth="8" />
      <path d="M578 141h178v261H578z" fill="url(#lab-rack)" />
      <path d="M574 141v262m185-262v262" stroke="#536764" strokeWidth="4" />
      <path d="M600 430c-8 25 30 30 54 16s82-13 118 11" fill="none" stroke="#111c20" strokeWidth="6" />
      <path d="M652 441c41 0 39-10 82-11" fill="none" stroke="#354945" strokeWidth="3" />
      <text x="255" y="142" fill="#859d8f" fontSize="13" letterSpacing="5">MANTENIMIENTO</text>
    </>}
  </svg>;
}

interface LabProps {
  direction: Direction;
  inspect: (id: ObjectId) => void;
  look: (direction: Direction) => void;
  selected: ObjectId | null;
  dark: boolean;
  locked: boolean;
  children: ReactNode;
}

export function Laboratory({ direction, look, inspect, selected, dark, locked, children }: LabProps) {
  const index = directions.indexOf(direction);
  const left = directions[(index + 2) % 3];
  const right = directions[(index + 1) % 3];

  return <section className="laboratory" aria-label="Laboratorio de programación">
    <div className="lab-frame">
      <div className={'lab-scene' + (dark ? ' lab-dark' : '')} key={direction}>
        <LabArt direction={direction} locked={locked} />
        {zones[direction].map(({ id, box: [x, y, width, height] }) => <button
          key={id} aria-label={objects[id].name}
          className={'lab-target ' + id + (selected === id ? ' lab-selected' : '')}
          style={{ left: x / 1024 * 100 + '%', top: y / 560 * 100 + '%', width: width / 1024 * 100 + '%', height: height / 560 * 100 + '%' }}
          onClick={() => inspect(id)}><span className="tag">{objects[id].name}</span></button>)}
      </div>
    </div>
    <nav className="lab-turn" aria-label="Cambiar vista del laboratorio">
      <button onClick={() => look(left)} aria-label={'Mirar hacia ' + directionNames[left]}><span aria-hidden="true">‹</span> {directionNames[left]}</button>
      <span className="lab-location" aria-live="polite">0{index + 1} / {directionNames[direction]}</span>
      <button onClick={() => look(right)} aria-label={'Mirar hacia ' + directionNames[right]}>{directionNames[right]} <span aria-hidden="true">›</span></button>
    </nav>
    <div className="inspect-panel lab-inspect">{children}</div>
  </section>;
}
