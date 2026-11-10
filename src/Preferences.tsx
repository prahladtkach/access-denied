import type { AudioPreferences } from './audio';

export function Preferences({ value, update }: { value: AudioPreferences; update: (value: AudioPreferences) => void }) {
  return <>
    <label className="setting">Volumen <input type="range" min="0" max="100" value={value.volume}
      onChange={event => update({ ...value, volume: Number(event.target.value) })} /></label>
    <label className="setting"><input type="checkbox" checked={value.muted}
      onChange={event => update({ ...value, muted: event.target.checked })} /> Silenciar sonidos</label>
    <label className="setting"><input type="checkbox" checked={value.effects}
      onChange={event => update({ ...value, effects: event.target.checked })} /> Efectos visuales y animaciones</label>
  </>;
}