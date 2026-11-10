import { useEffect, useRef, useState } from 'react';

const clockKey = 'access-denied:clock:v1';
const start = Date.UTC(2004, 10, 10, 23, 41);

function readElapsed() {
  try {
    const seconds = Number(localStorage.getItem(clockKey));
    return Number.isSafeInteger(seconds) && seconds >= 0 && seconds < 10 ** 8 ? seconds : 0;
  } catch { return 0; }
}

function saveElapsed(seconds: number) {
  try { localStorage.setItem(clockKey, String(seconds)); } catch { /* Jugable sin persistencia. */ }
}

export function useGameClock(running: boolean) {
  const [elapsed, setElapsed] = useState(readElapsed);
  const latest = useRef(elapsed);
  useEffect(() => {
    if (!running) return;
    const origin = performance.now();
    const base = latest.current;
    const timer = window.setInterval(() => {
      const seconds = base + Math.floor((performance.now() - origin) / 1000);
      if (seconds === latest.current) return;
      latest.current = seconds;
      setElapsed(seconds);
      saveElapsed(seconds);
    }, 250);
    return () => window.clearInterval(timer);
  }, [running]);

  function reset() {
    latest.current = 0;
    setElapsed(0);
    saveElapsed(0);
  }

  const stamp = new Date(start + elapsed * 1000).toISOString();
  const [year, month, day] = stamp.slice(0, 10).split('-');
  return { time: stamp.slice(11, 19), date: day + '/' + month + '/' + year.slice(-2), stamp: stamp.slice(0, 19), reset };
}