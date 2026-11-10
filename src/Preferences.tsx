import type { AudioPreferences } from './audio';

export function Preferences({ value, update }: { value: AudioPreferences; update: (value: AudioPreferences) => void }) {
  const channels = { music: 'Música', ambience: 'Ambiente', sfx: 'Efectos de sonido' } as const;
  return <>
    {(['music', 'ambience', 'sfx'] as const).map(channel => <label className="setting" key={channel}>
      {channels[channel]} <input type="range" min="0" max="100" value={value[channel]}
        onChange={event => update({ ...value, [channel]: Number(event.target.value) })} />
      <output>{value[channel]} %</output>
    </label>)}
    <label className="setting"><input type="checkbox" checked={value.muted}
      onChange={event => update({ ...value, muted: event.target.checked })} /> Silenciar sonidos</label>
    <label className="setting"><input type="checkbox" checked={value.effects}
      onChange={event => update({ ...value, effects: event.target.checked })} /> Efectos visuales y animaciones</label>
  </>;
}
