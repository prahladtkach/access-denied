import { useEffect, useRef, useState } from 'react';

export interface AudioPreferences {
  volume: number;
  muted: boolean;
  effects: boolean;
}

const key = 'access-denied:preferences:v1';
const defaults: AudioPreferences = { volume: 25, muted: false, effects: true };

function loadPreferences(): AudioPreferences {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null') as Partial<AudioPreferences> | null;
    return {
      volume: typeof saved?.volume === 'number' && Number.isFinite(saved.volume)
        ? Math.min(100, Math.max(0, saved.volume)) : defaults.volume,
      muted: saved?.muted === true,
      effects: saved?.effects !== false,
    };
  } catch {
    return defaults;
  }
}

const signals = {
  lock: [[69, 0, .13], [115, .085, .07], [47, .14, .19]],
  link: [[410, 0, .08], [280, .1, .19]],
  boot: [[160, 0, .12], [240, .14, .18]],
  alert: [[165, 0, .3]],
} as const;

export function useAudio() {
  const [preferences, setPreferences] = useState(loadPreferences);
  const audio = useRef<AudioContext | null>(null);

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(preferences)); } catch { /* Jugable sin persistencia. */ }
  }, [preferences]);

  function play(signal: keyof typeof signals) {
    if (preferences.muted || !preferences.volume || !window.AudioContext) return;
    try {
      const context = audio.current ?? new AudioContext();
      audio.current = context;
      void context.resume().catch(() => {});
      const now = context.currentTime;
      for (const [frequency, delay, duration] of signals[signal]) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = signal === 'lock' ? 'triangle' : 'sine';
        oscillator.frequency.setValueAtTime(frequency, now + delay);
        gain.gain.setValueAtTime(Math.max(.002, preferences.volume / 650), now + delay);
        gain.gain.exponentialRampToValueAtTime(.001, now + delay + duration);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(now + delay);
        oscillator.stop(now + delay + duration);
      }
    } catch { /* El texto de la escena también comunica cada evento. */ }
  }

  return { preferences, setPreferences, play };
}