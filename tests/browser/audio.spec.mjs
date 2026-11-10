import { expect, test } from '@playwright/test';
import { readdir } from 'node:fs/promises';

const audioRoot = new URL('../../public/audio/', import.meta.url);
const audioFiles = (await readdir(audioRoot, { recursive: true }))
  .filter(file => /\.(mp3|wav|ogg)$/.test(file))
  .map(file => file.replaceAll('\\', '/'));

const click = (page, name) => page.getByRole('button', { name, exact: true }).click();

test('producción sirve y decodifica todas las pistas de audio', async ({ page }) => {
  await page.goto('/');
  expect(audioFiles).toHaveLength(13);
  const decoded = await page.evaluate(async files => {
    const context = new OfflineAudioContext(1, 44100, 44100);
    return await Promise.all(files.map(async file => {
      const response = await fetch('/audio/' + file);
      if (!response.ok) throw new Error(file + ': HTTP ' + response.status);
      const audio = await context.decodeAudioData(await response.arrayBuffer());
      return { file, seconds: audio.duration };
    }));
  }, audioFiles);
  for (const { file, seconds } of decoded) expect(seconds, file).toBeGreaterThan(.02);
  expect(decoded.find(track => track.file === 'musica/menu.mp3').seconds).toBeGreaterThan(60);
  expect(decoded.find(track => track.file === 'terror/unknown.mp3').seconds).toBeGreaterThan(4.8);
});

test('intento de reproducción inicial, fundido al salir, avatar y transmisión sin duplicados', async ({ page }) => {
  await page.addInitScript(() => {
    window.audioStarts = [];
    window.loopStops = [];
    const NativeContext = window.AudioContext;
    window.AudioContext = class extends NativeContext {
      constructor() {
        super();
        window.menuAudio = this;
        window.createdBeforeGesture = !navigator.userActivation.hasBeenActive;
      }
    };
    const start = AudioBufferSourceNode.prototype.start;
    const stop = AudioBufferSourceNode.prototype.stop;
    AudioBufferSourceNode.prototype.start = function (...args) {
      window.audioStarts.push({ loop: this.loop, duration: this.buffer?.duration, clip: args[2] });
      return start.apply(this, args);
    };
    AudioBufferSourceNode.prototype.stop = function (...args) {
      if (this.loop) window.loopStops.push(args[0] - this.context.currentTime);
      return stop.apply(this, args);
    };
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Acercarse al monitor' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.createdBeforeGesture)).toBe(true);
  await page.locator('.menu-scene').click({ position: { x: 10, y: 10 } });
  await expect.poll(() => page.evaluate(() => window.menuAudio.state)).toBe('running');
  await click(page, 'Acercarse al monitor');
  await expect.poll(() => page.evaluate(() => window.audioStarts.some(item => item.loop && item.duration > 60))).toBe(true);
  await click(page, 'Nueva partida');
  await expect.poll(() => page.evaluate(() => window.loopStops.some(delay => delay >= .5))).toBe(true);
  await click(page, 'Entrar al laboratorio');
  const tick = page.waitForResponse(response => response.url().endsWith('/ambiente/clock-tick.wav') && response.ok());
  await click(page, 'Reloj de pared');
  await tick;
  await click(page, 'Mirar hacia Área de servicio');
  await expect(page.getByRole('button', { name: 'Rack de servidores' })).toBeVisible();
  await click(page, 'Mirar hacia Salida');
  const latch = page.waitForResponse(response => response.url().endsWith('/interfaz/door-jiggle.ogg') && response.ok());
  await click(page, 'Puerta electrónica');
  await latch;
  await click(page, 'Probar la puerta');
  await click(page, 'Mirar hacia Puesto de trabajo');
  await click(page, 'Computadora');
  await click(page, 'Usar computadora');
  const remote = page.getByRole('region', { name: 'Ventana de UNKNOWN' });
  const avatar = remote.locator('img');
  await expect(avatar).toBeVisible();
  await expect(avatar).toHaveCSS('image-rendering', 'pixelated');
  await expect.poll(() => avatar.evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
  const transmissions = () => page.evaluate(() => window.audioStarts.filter(item => item.clip === 4.8).length);
  await expect.poll(transmissions).toBe(1);
  await click(page, '← Habitación');
  await click(page, 'Computadora');
  await click(page, 'Usar computadora');
  await expect(avatar).toBeVisible();
  await click(page, 'Silenciar el canal');
  expect(await transmissions()).toBe(1);
});

test('los tres niveles y el silencio se guardan de forma independiente', async ({ page }) => {
  await page.addInitScript(() => {
    const key = 'access-denied:preferences:v1';
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ volume: 41, muted: false }));
  });
  await page.goto('/');
  await click(page, 'Acercarse al monitor');
  await click(page, 'Opciones');
  const music = page.getByRole('slider', { name: /^Música/ });
  const ambience = page.getByRole('slider', { name: /^Ambiente/ });
  const effects = page.getByRole('slider', { name: /^Efectos de sonido/ });
  await expect(effects).toHaveValue('41');
  await music.press('Home');
  await ambience.press('End');
  await expect(effects).toHaveValue('41');
  await page.getByRole('checkbox', { name: 'Desactivar ambiente' }).check();
  await page.getByRole('checkbox', { name: 'Desactivar música' }).check();
  await expect(page.getByRole('checkbox', { name: 'Desactivar efectos de sonido' })).not.toBeChecked();
  await page.getByRole('checkbox', { name: 'Silenciar sonidos' }).check();
  await page.reload();
  await click(page, 'Acercarse al monitor');
  await click(page, 'Opciones');
  await expect(music).toHaveValue('0');
  await expect(ambience).toHaveValue('100');
  await expect(effects).toHaveValue('41');
  await expect(page.getByRole('checkbox', { name: 'Desactivar ambiente' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Desactivar música' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Desactivar efectos de sonido' })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Silenciar sonidos' })).toBeChecked();
});
