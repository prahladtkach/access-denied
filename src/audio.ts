import { useCallback, useEffect, useRef, useState } from 'react';

type Channel = 'music' | 'ambience' | 'sfx';
export type SoundScene = 'menu' | 'room' | 'pc' | 'silent';

export interface AudioPreferences {
  music: number;
  ambience: number;
  sfx: number;
  muted: boolean;
  effects: boolean;
}

const key = 'access-denied:preferences:v1';
const defaults: AudioPreferences = { music: 24, ambience: 25, sfx: 25, muted: false, effects: true };

function level(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : fallback;
}

function loadPreferences(): AudioPreferences {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null') as (Partial<AudioPreferences> & { volume?: number }) | null;
    return {
      music: level(saved?.music, defaults.music),
      ambience: level(saved?.ambience, defaults.ambience),
      sfx: level(saved?.sfx ?? saved?.volume, defaults.sfx),
      muted: saved?.muted === true,
      effects: saved?.effects !== false,
    };
  } catch {
    return defaults;
  }
}

const loops = {
  menu: { file: 'musica/menu.mp3', channel: 'music', gain: .39, overlap: .65 },
  room: { file: 'ambiente/fluorescent.mp3', channel: 'ambience', gain: .23, overlap: .12 },
  pc: { file: 'ambiente/fan.wav', channel: 'ambience', gain: .16, overlap: .15 },
} as const;

interface Clip {
  file: string;
  gain: number;
  channel?: Channel;
  duration?: number;
  cooldown?: number;
}

const clips = {
  lock: { file: 'interfaz/lock.ogg', gain: .6 },
  mouse: { file: 'interfaz/mouse.wav', gain: .34 },
  key: { file: 'interfaz/key.mp3', gain: .27, cooldown: .11 },
  open: { file: 'interfaz/window-open.mp3', gain: .45 },
  close: { file: 'interfaz/window-close.mp3', gain: .43 },
  clock: { file: 'ambiente/clock.ogg', gain: .32, channel: 'ambience' },
  crt: { file: 'terror/crt.mp3', gain: .18, duration: .32 },
  alert: { file: 'terror/alarm.ogg', gain: .34, duration: .95 },
  unknown: { file: 'terror/unknown.mp3', gain: .49, duration: 4.8, cooldown: 8 },
} satisfies Record<string, Clip>;

const tones = {
  link: [[410, 0, .08], [280, .1, .19]],
  boot: [[160, 0, .12], [240, .14, .18]],
} as const;
export type Sound = keyof typeof clips | keyof typeof tones;

function setGain(param: AudioParam, level: number, now: number, seconds: number) {
  if (typeof param.cancelAndHoldAtTime === 'function') param.cancelAndHoldAtTime(now);
  else {
    const current = param.value;
    param.cancelScheduledValues(now);
    param.setValueAtTime(current, now);
  }
  param.linearRampToValueAtTime(level, now + seconds);
}

// The tail blends into the head at the wrap. The resulting buffer loops without a pause.
function crossfadeLoop(context: AudioContext, input: AudioBuffer, seconds: number) {
  const overlap = Math.min(Math.floor(input.sampleRate * seconds), Math.floor(input.length / 4));
  if (overlap < 2) return input;
  const length = input.length - overlap;
  const output = context.createBuffer(input.numberOfChannels, length, input.sampleRate);
  for (let channel = 0; channel < input.numberOfChannels; channel++) {
    const samples = input.getChannelData(channel);
    const blended = output.getChannelData(channel);
    for (let i = 0; i < overlap; i++) {
      const mix = i / (overlap - 1);
      blended[i] = samples[length + i] * (1 - mix) + samples[i] * mix;
    }
    blended.set(samples.subarray(overlap, length), overlap);
  }
  return output;
}

class Mixer {
  private master: GainNode;
  private buses: Record<Channel, GainNode>;
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private pending = new Set<Sound>();
  private last = new Map<Sound, number>();
  private scene: SoundScene = 'silent';
  private loop: { source: AudioBufferSourceNode; gain: GainNode } | null = null;
  private sceneVersion = 0;
  private preferences = defaults;

  constructor(private context: AudioContext) {
    this.master = context.createGain();
    this.master.gain.value = 0;
    this.master.connect(context.destination);
    this.buses = { music: context.createGain(), ambience: context.createGain(), sfx: context.createGain() };
    for (const bus of Object.values(this.buses)) {
      bus.gain.value = 0;
      bus.connect(this.master);
    }
  }

  resume() {
    if (this.context.state !== 'running') void this.context.resume().catch(() => {});
  }

  update(preferences: AudioPreferences) {
    if (this.preferences === preferences && this.master.gain.value > 0) return;
    this.preferences = preferences;
    const now = this.context.currentTime;
    setGain(this.master.gain, preferences.muted ? 0 : .8, now, .035);
    for (const channel of ['music', 'ambience', 'sfx'] as const) {
      setGain(this.buses[channel].gain, preferences[channel] / 100, now, .06);
    }
  }

  private load(file: string, overlap = 0) {
    let buffer = this.buffers.get(file);
    if (!buffer) {
      buffer = fetch(new URL('audio/' + file, document.baseURI))
        .then(response => {
          if (!response.ok) throw new Error('Audio no disponible');
          return response.arrayBuffer();
        })
        .then(bytes => this.context.decodeAudioData(bytes))
        .then(decoded => overlap ? crossfadeLoop(this.context, decoded, overlap) : decoded)
        .catch(() => null);
      this.buffers.set(file, buffer);
    }
    return buffer;
  }

  private voice(buffer: AudioBuffer, channel: Channel) {
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    source.connect(gain).connect(this.buses[channel]);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };
    return { source, gain };
  }

  async select(scene: SoundScene) {
    if (scene === this.scene) return;
    const version = ++this.sceneVersion;
    this.scene = scene;
    if (this.loop) {
      const { source, gain } = this.loop;
      const now = this.context.currentTime;
      setGain(gain.gain, 0, now, .65);
      source.stop(now + .67);
      this.loop = null;
    }
    if (scene === 'silent') return;
    const track = loops[scene];
    const buffer = await this.load(track.file, track.overlap);
    if (!buffer || version !== this.sceneVersion) return;
    this.loop = this.voice(buffer, track.channel);
    const { source, gain } = this.loop;
    const now = this.context.currentTime;
    source.loop = true;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(track.gain, now + (scene === 'menu' ? 1.2 : .75));
    source.start(now);
  }

  async play(sound: Sound) {
    const clip: Clip | undefined = sound in clips ? clips[sound as keyof typeof clips] : undefined;
    const channel = clip?.channel ?? 'sfx';
    if (this.preferences.muted || !this.preferences[channel] || this.pending.has(sound)) return;
    const now = this.context.currentTime;
    const cooldown = clip?.cooldown ?? .13;
    if (now - (this.last.get(sound) ?? -Infinity) < cooldown) return;
    this.last.set(sound, now);
    if (!clip) {
      this.tone(sound as keyof typeof tones);
      return;
    }
    this.pending.add(sound);
    const buffer = await this.load(clip.file);
    if (!buffer || this.preferences.muted || !this.preferences[channel] || this.context.state === 'closed') {
      this.pending.delete(sound);
      return;
    }
    const { source, gain } = this.voice(buffer, channel);
    const length = Math.min(buffer.duration, clip.duration ?? buffer.duration);
    const at = this.context.currentTime;
    this.last.set(sound, at);
    const fade = Math.min(sound === 'unknown' ? .7 : .04, length / 4);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(clip.gain, at + Math.min(.02, length / 4));
    gain.gain.setValueAtTime(clip.gain, at + length - fade);
    gain.gain.linearRampToValueAtTime(0, at + length);
    source.addEventListener('ended', () => this.pending.delete(sound), { once: true });
    source.start(at, 0, length);
  }

  private tone(sound: keyof typeof tones) {
    const now = this.context.currentTime;
    for (const [frequency, delay, duration] of tones[sound]) {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.frequency.setValueAtTime(frequency, now + delay);
      gain.gain.setValueAtTime(.16, now + delay);
      gain.gain.exponentialRampToValueAtTime(.001, now + delay + duration);
      oscillator.connect(gain).connect(this.buses.sfx);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(now + delay);
      oscillator.stop(now + delay + duration);
    }
  }

  close() {
    ++this.sceneVersion;
    void this.context.close().catch(() => {});
  }
}

export function useAudio(scene: SoundScene) {
  const [preferences, setPreferences] = useState(loadPreferences);
  const mixer = useRef<Mixer | null>(null);
  const desired = useRef({ scene, preferences });
  desired.current = { scene, preferences };

  useEffect(() => {
    function unlock() {
      if (!window.AudioContext) return;
      try {
        const audio = mixer.current ?? new Mixer(new AudioContext());
        mixer.current = audio;
        audio.resume();
        audio.update(desired.current.preferences);
        void audio.select(desired.current.scene);
      } catch { /* El navegador permite jugar aunque el audio no esté disponible. */ }
    }
    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('keydown', unlock, true);
    return () => {
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
      mixer.current?.close();
      mixer.current = null;
    };
  }, []);

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(preferences)); } catch { /* Jugable sin persistencia. */ }
    mixer.current?.update(preferences);
  }, [preferences]);

  useEffect(() => { void mixer.current?.select(scene); }, [scene]);

  const play = useCallback((sound: Sound) => { void mixer.current?.play(sound); }, []);
  return { preferences, setPreferences, play };
}
