import { expect, test } from '@playwright/test';

const button = (page, name) => page.getByRole('button', { name, exact: typeof name === 'string' });
const click = (page, name) => button(page, name).click();
const terminal = page => click(page, 'Terminal');
const inspect = (page, name) => click(page, name);
const look = (page, place) => click(page, 'Mirar hacia ' + place);
const tryDoor = async page => {
  await inspect(page, 'Puerta electrónica');
  await expect(page.getByText(/El lector rechaza tu credencial/)).toBeVisible();
  await click(page, 'Probar la puerta');
  await expect(page.getByText(/CONTROL REMOTO/)).toBeVisible();
};
const useComputer = async page => {
  if (!await button(page, 'Computadora').isVisible()) await look(page, 'Puesto de trabajo');
  await inspect(page, 'Computadora');
  await click(page, 'Usar computadora');
};

async function answer(page, value) {
  await page.getByRole('textbox').fill(value);
  await click(page, 'Validar');
}

async function order(page, lines) {
  for (const line of lines) {
    await page.locator('.line-bank').getByRole('button', { name: line, exact: false }).click();
  }
  await click(page, 'Validar');
}

async function warn(page) {
  await click(page, 'Abrir alerta de intrusión');
  await expect(page.getByText('EN ESPERA', { exact: true })).toBeVisible();
  await click(page, 'Iniciar defensa');
}

async function terminalRecovered(page) {
  await page.goto('./');
  await click(page, 'Acercarse al monitor');
  await click(page, 'Nueva partida');
  await click(page, 'Entrar al laboratorio');
  await expect(page.getByText(/CLAC/)).toBeVisible();
  await tryDoor(page);
  await look(page, 'Puesto de trabajo');
  await inspect(page, 'Nota del escritorio');
  await expect(page.getByText(/ingresá el valor que imprima/)).toBeVisible();
  await useComputer(page);
  await expect(page.getByRole('region', { name: 'Ventana de UNKNOWN' })).toBeVisible();
  await expect(button(page, 'Abrir reto · P1')).toHaveCount(0);
  await click(page, 'Silenciar el canal');
  await click(page, 'Abrir reto · P1');
  await answer(page, '150');
  await expect(page.getByRole('status')).toContainText('no coincide');
  await answer(page, '151');
  await click(page, 'Abrir reto · P2');
  await answer(page, 'claveIngresada == claveCorrecta');
  await expect(page.locator('footer')).toContainText('Terminal recuperada');
}

async function finalCheckpoint(page, evidence = 'skip') {
  await terminalRecovered(page);
  await warn(page);
  await answer(page, 'permiso == 1');
  await click(page, 'Abrir reto · P3');
  await order(page, ['int pulso = 0;', 'pulso = pulso + 2;', 'pulso = pulso * 3;', 'printf("%d", pulso);']);
  if (evidence === 'keep') {
    await click(page, /UNKNOWN \/ mensaje inyectado/);
    await expect(page.getByRole('region', { name: 'Ventana de UNKNOWN' })).toContainText('tardó tres semanas');
    await click(page, 'Cerrar UNKNOWN');
  }
  await click(page, '← Habitación');
  await look(page, 'Área de servicio');
  await inspect(page, 'Armario');
  await expect(page.getByText(/Encontrás la tarjeta del servidor/)).toBeVisible();
  await useComputer(page);
  await click(page, 'Abrir reto · P4');
  await answer(page, 'EXIT');
  await expect(page.locator('footer')).toContainText('Servidor desbloqueado');
  await warn(page);
  await order(page, ['int sesion = 0;', 'sesion = sesion + 1;', 'printf("%d", sesion);']);
  await click(page, '← Habitación');
  await look(page, 'Área de servicio');
  await inspect(page, 'Rack de servidores');
  if (evidence !== 'skip') await click(page, 'Revisar el reverso del manual');
  await useComputer(page);
  if (evidence !== 'skip') {
    await click(page, 'Archivos');
    await click(page, 'Correo interno');
    await click(page, 'correo_interno.txt');
    await expect(page.getByText(/Suspendan la auditoría/)).toBeVisible();
    await click(page, 'Archivo técnico');
    await click(page, 'informe_original.txt');
    await expect(page.getByText(/Entregué el informe/)).toBeVisible();
    await click(page, 'Registros');
    await click(page, 'acceso_nocturno.log');
    await expect(page.getByRole('region', { name: 'Ventana de UNKNOWN' })).toBeVisible();
    await click(page, 'Cerrar UNKNOWN');
    await click(page, evidence === 'keep' ? 'Conservar registro' : 'Borrar registro');
    await terminal(page);
  }
  await click(page, 'Abrir reto · P5');
  await answer(page, 'i < 4');
  await expect(page.locator('footer')).toContainText('Antes del protocolo final');
}

async function lastDefense(page) {
  await warn(page);
  await answer(page, 'LUZ');
}

async function localControl(page) {
  await click(page, 'Abrir reto · P6');
  await answer(page, 'controlLocal == 1');
}

test('ESCAPE: todos los retos principales y salida por la puerta física', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await finalCheckpoint(page);
  await lastDefense(page);
  await localControl(page);
  await click(page, 'Ir a la puerta');
  await click(page, 'Salir del laboratorio');
  await expect(page.getByRole('heading', { name: 'ESCAPE', exact: true })).toBeVisible();
  await expect(page.locator('[data-ending="escape"] .end-closing')).toBeVisible();
  expect(errors).toEqual([]);
});

test('THE TRUTH: persiste la evidencia, se sella y se vuelve al checkpoint', async ({ page }) => {
  await finalCheckpoint(page, 'keep');
  await page.reload();
  await click(page, 'Acercarse al monitor');
  await click(page, 'Continuar partida');
  await useComputer(page);
  await lastDefense(page);
  await localControl(page);
  await click(page, 'Preparar copia de las pruebas');
  await answer(page, '23');
  await click(page, 'Resguardar las pruebas y salir');
  await expect(page.getByRole('heading', { name: 'THE TRUTH', exact: true })).toBeVisible();
  await expect(page.locator('[data-ending="truth"] .end-closing')).toContainText('Copia verificada');
  await click(page, 'Volver al punto de control final');
  await click(page, 'Registros');
  await expect(page.getByText('Registro protegido contra escritura.')).toBeVisible();
});

test('UNKNOWN WINS: transferencia confirmada y segundo fallo del protocolo', async ({ page }) => {
  await finalCheckpoint(page, 'delete');
  await lastDefense(page);
  await click(page, 'Responder a UNKNOWN');
  await click(page, 'Cancelar');
  await click(page, 'Responder a UNKNOWN');
  await click(page, 'Transferir control');
  await expect(page.getByRole('heading', { name: 'UNKNOWN WINS', exact: true })).toBeVisible();
  await expect(page.locator('[data-ending="remote"] .end-closing')).toBeVisible();
  await click(page, 'Volver al punto de control final');
  await lastDefense(page);
  await click(page, 'Abrir reto · P6');
  await answer(page, 'controlLocal = 1');
  await expect(page.getByRole('status')).toContainText('ADVERTENCIA');
  await answer(page, 'sesionLocal = 1');
  await expect(page.getByRole('heading', { name: 'UNKNOWN WINS', exact: true })).toBeVisible();
  await click(page, 'Nueva partida');
  await click(page, 'Reiniciar partida');
  await click(page, 'Entrar al laboratorio');
  await expect(page.locator('footer')).toContainText('Inicio');
  await expect(button(page, 'Puerta electrónica')).toBeVisible();
});

test('el temporizador respeta la pausa y una intrusión 5/5 permite restaurar', async ({ page }) => {
  await page.clock.install();
  await terminalRecovered(page);
  await click(page, 'Abrir alerta de intrusión');
  await page.clock.fastForward(60_000);
  await expect(page.getByText('EN ESPERA', { exact: true })).toBeVisible();
  await click(page, 'Iniciar defensa');
  await click(page, 'Pausa y ajustes');
  await page.clock.fastForward(60_000);
  await click(page, 'Reanudar partida');
  await expect(page.getByText('45 s', { exact: true })).toBeVisible();
  await page.clock.fastForward(46_000);
  await expect(page.getByRole('status')).toContainText('TIEMPO AGOTADO');
  for (let index = 1; index < 5; index++) {
    await page.clock.fastForward(91_000);
    await click(page, 'Iniciar defensa');
    await page.clock.fastForward(46_000);
  }
  await expect(page.getByRole('heading', { name: 'SYSTEM FAILURE', exact: true })).toBeVisible();
  await click(page, 'Reintentar · Terminal recuperada');
  await expect(page.getByLabel('Intrusión 0 de 5')).toBeVisible();
  await expect(button(page, 'Abrir alerta de intrusión')).toBeVisible();
});

test('NEXUS OS: ventanas simultáneas, movimiento, cierre y borrador con mouse y teclado', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 640 });
  await page.goto('./');
  await button(page, 'Acercarse al monitor').press('Enter');
  await expect(button(page, 'Continuar partida')).toBeDisabled();
  await button(page, 'Opciones').press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await button(page, 'Nueva partida').press('Enter');
  await page.keyboard.press('Enter');
  await button(page, 'Puerta electrónica').press('Enter');
  await button(page, 'Probar la puerta').press('Enter');
  await expect(page.getByText(/CONTROL REMOTO/)).toBeVisible();
  await button(page, 'Mirar hacia Puesto de trabajo').press('Enter');
  await expect(button(page, 'Computadora')).toBeVisible();
  await expect(page.locator('.desk .tag')).toHaveCSS('opacity', '0');
  await button(page, 'Computadora').focus();
  await expect(page.locator('.desk .tag')).toHaveCSS('opacity', '1');
  await button(page, 'Nota del escritorio').press('Enter');
  await button(page, 'Computadora').press('Enter');
  await button(page, 'Usar computadora').press('Enter');
  await expect(page.getByLabel('Arrancando NEXUS OS')).toBeHidden();
  await button(page, 'Silenciar el canal').press('Enter');
  await button(page, 'Abrir reto · P1').press('Enter');
  await page.getByRole('textbox').fill('151');
  await button(page, 'Minimizar Terminal').press('Enter');
  const terminalWindow = page.getByRole('region', { name: 'Ventana de Terminal' });
  await expect(terminalWindow).toBeHidden();
  await button(page, 'Alternar Terminal').press('Enter');
  await expect(page.getByRole('textbox')).toHaveValue('151');

  const title = button(page, 'Mover Terminal con las flechas');
  const position = await terminalWindow.boundingBox();
  await title.press('ArrowRight');
  await expect.poll(async () => (await terminalWindow.boundingBox()).x).toBeGreaterThan(position.x);
  const handle = await title.boundingBox();
  await page.mouse.move(handle.x + 65, handle.y + 12);
  await page.mouse.down();
  await page.mouse.move(handle.x + 18, handle.y + 12, { steps: 5 });
  await page.mouse.up();
  await expect.poll(async () => (await terminalWindow.boundingBox()).x).toBeLessThan(position.x);

  await click(page, 'Archivos');
  await expect(page.getByRole('region', { name: 'Ventana de Archivos' })).toBeVisible();
  await expect(terminalWindow).toBeVisible();
  await click(page, 'Cerrar Archivos');
  await button(page, 'Cerrar Terminal').press('Enter');
  await expect(terminalWindow).toBeHidden();
  await expect(button(page, 'Alternar Terminal')).toHaveCount(0);
  await button(page, 'Terminal').press('Enter');
  await expect(page.getByRole('textbox')).toHaveValue('151');
  await page.getByRole('textbox').press('Enter');
  await expect(button(page, 'Abrir reto · P2')).toBeVisible();
  await expect(page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).resolves.toBe(true);
});

test('pantalla completa desde el menú y regreso a la ventana', async ({ page }) => {
  await page.goto('./');
  await click(page, 'Pantalla completa');
  await expect(button(page, 'Salir de pantalla completa')).toBeVisible();
  await click(page, 'Salir de pantalla completa');
  await expect(button(page, 'Pantalla completa')).toBeVisible();
});

test('el CRT abre el menú con teclado y permite regresar a la vista general', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  const monitor = button(page, 'Acercarse al monitor');
  await expect(monitor).toBeVisible();
  await expect(button(page, 'Nueva partida')).toHaveCount(0);
  await monitor.press('Enter');
  await expect(button(page, 'Nueva partida')).toBeFocused();
  await click(page, 'Opciones');
  await expect(page.getByRole('dialog')).toBeVisible();
  await click(page, 'Volver');
  await click(page, 'Alejar vista');
  await expect(monitor).toBeFocused();
  await expect(button(page, 'Nueva partida')).toHaveCount(0);
});

test('exploración, reloj, arranque, inicio de NEXUS y sonido persistente', async ({ page }) => {
  await page.goto('./');
  await click(page, 'Acercarse al monitor');
  await click(page, 'Nueva partida');
  await click(page, 'Entrar al laboratorio');
  await inspect(page, 'Reloj de pared');
  await expect(page.getByText(/El segundero tiembla/)).toBeVisible();
  await look(page, 'Área de servicio');
  await expect(button(page, 'Armario')).toBeVisible();
  await look(page, 'Salida');
  await tryDoor(page);
  await useComputer(page);
  await expect(page.getByLabel('Arrancando NEXUS OS')).toBeVisible();
  await expect(button(page, 'Conexión y avisos')).toHaveClass(/os-incoming/);
  await click(page, 'Silenciar el canal');
  await page.locator('.os-workspace').click({ button: 'right', position: { x: 1080, y: 400 } });
  await expect(page.getByRole('complementary', { name: 'Acciones del escritorio' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('complementary', { name: 'Acciones del escritorio' })).toHaveCount(0);
  await click(page, 'Inicio de NEXUS');
  const start = page.getByRole('navigation', { name: 'Menú de inicio' });
  await expect(start.getByRole('button')).toHaveCount(5);
  await start.getByRole('button', { name: 'Configuración' }).click();
  const config = page.getByRole('region', { name: 'Ventana de Configuración' });
  await expect(config).toBeVisible();
  await click(page, 'Minimizar Configuración');
  await expect(button(page, 'Alternar Configuración')).toHaveAttribute('data-mode', 'minimized');
  await click(page, 'Alternar Configuración');
  await expect(button(page, 'Alternar Configuración')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('time.os-clock')).toHaveAttribute('datetime', /^2004-11-10T/);
  await click(page, 'Silenciar sonido');
  await expect(config.getByRole('checkbox', { name: 'Silenciar sonidos' })).toBeChecked();
  await page.reload();
  await click(page, 'Acercarse al monitor');
  await click(page, 'Opciones');
  await expect(page.getByRole('checkbox', { name: 'Silenciar sonidos' })).toBeChecked();
});

test('el CRT muestra un salvapantallas y vuelve al encuadre anterior', async ({ page }) => {
  await page.clock.install();
  await page.goto('./');
  await click(page, 'Acercarse al monitor');
  await page.clock.fastForward(46_000);
  await expect(button(page, 'Reactivar monitor')).toBeVisible();
  await expect(page.getByText('MODO DE ESPERA')).toHaveCount(0);
  await expect(page.locator('.menu-saver > span')).toHaveCSS('animation-name', 'saver-x, saver-y');
  const gaps = await page.locator('.menu-saver > span').evaluate(logo => {
    const crt = logo.parentElement.getBoundingClientRect();
    const axes = Object.fromEntries(logo.getAnimations().map(animation => [animation.animationName, animation]));
    function set(axis, edge) {
      const animation = axes['saver-' + axis];
      const { duration, delay } = animation.effect.getTiming();
      animation.pause();
      animation.currentTime = delay + duration * edge;
    }
    set('x', 2);
    set('y', 2);
    const start = logo.getBoundingClientRect();
    set('x', 1);
    set('y', 1);
    const end = logo.getBoundingClientRect();
    return [start.left - crt.left, start.top - crt.top, end.right - crt.right, end.bottom - crt.bottom];
  });
  for (const gap of gaps) expect(Math.abs(gap)).toBeLessThan(1);
  await expect(button(page, 'Nueva partida')).toHaveCount(0);
  await button(page, 'Reactivar monitor').press('Enter');
  await expect(button(page, 'Nueva partida')).toBeFocused();
});

test('el póster original carga y el reloj de sesión avanza mientras el de pared sigue detenido', async ({ page }) => {
  await page.clock.install();
  await page.goto('./');
  await click(page, 'Acercarse al monitor');
  await click(page, 'Nueva partida');
  await click(page, 'Entrar al laboratorio');
  const poster = page.locator('[data-prop="cat-poster"]');
  await expect(poster).toBeVisible();
  expect(await poster.evaluate(async element => {
    const image = new Image();
    image.src = element.href.baseVal;
    await image.decode();
    return image.naturalWidth;
  })).toBeGreaterThan(400);
  const room = page.locator('time.lab-system-time');
  await expect(room).toHaveText(/^23:41:/);
  await page.clock.fastForward(62_000);
  await expect(room).toHaveText(/^23:42:/);
  await inspect(page, 'Reloj de pared');
  await expect(page.getByText(/23:41\. El segundero tiembla/)).toBeVisible();
  await tryDoor(page);
  await useComputer(page);
  const os = page.locator('time.os-clock');
  await expect(os.locator('b')).toHaveText(/^23:42:/);
  await page.clock.fastForward(60_000);
  await expect(os.locator('b')).toHaveText(/^23:43:/);
  await click(page, 'Pausa y ajustes');
  const paused = await os.getAttribute('datetime');
  await page.clock.fastForward(60_000);
  await expect(os).toHaveAttribute('datetime', paused);
});

test('las otras seis variantes de ataque aceptan soluciones de C básico', async ({ page }) => {
  const answers = [
    ['D2', 'i <= 5'],
    ['S2', ['float voltaje = 1.5;', 'voltaje = voltaje + 0.5;', 'voltaje = voltaje * 2;', 'printf("%.1f", voltaje);']],
    ['C2', 'RED'],
    ['D3', 'firma == 1'],
    ['S3', ['int intentos = 2;', 'while (intentos > 0)', 'printf("%d", intentos);']],
    ['C3', 'NEXUS'],
  ];
  await page.goto('./');
  for (const [offset, [id, solution]] of answers.entries()) {
    await page.evaluate(index => {
      const initial = { stage: 0, clues: [], files: [], log: 'pending', intrusion: 0, wave: 0, sealed: false };
      const progress = { ...initial, stage: 2, wave: index };
      localStorage.setItem('access-denied:v1', JSON.stringify({
        progress, checkpoints: [initial, progress], attack: { index, remaining: null },
        lastAttack: 0, finalErrors: 0, ending: null,
      }));
    }, offset + 3);
    await page.reload();
    await click(page, 'Acercarse al monitor');
    await click(page, 'Continuar partida');
    await click(page, 'Iniciar defensa');
    await expect(page.getByText(id + ' / LENGUAJE C', { exact: true })).toBeVisible();
    if (typeof solution === 'string') await answer(page, solution);
    else await order(page, solution);
    await expect(page.getByRole('status')).toContainText('ATAQUE BLOQUEADO');
  }
});

test('redimensionar por borde y esquina conserva el borrador y respeta el escritorio', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await terminalRecovered(page);
  await warn(page);
  await answer(page, 'permiso == 1');
  await click(page, 'Abrir reto · P3');
  await page.locator('.line-bank').getByRole('button', { name: /int pulso = 0/ }).click();
  const terminal = page.getByRole('region', { name: 'Ventana de Terminal' });
  const area = await page.locator('.os-workspace').boundingBox();
  const initial = await terminal.boundingBox();
  async function drag(edge, x, y) {
    const grip = await terminal.locator('[data-edge="' + edge + '"]').boundingBox();
    await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
    await page.mouse.down();
    await page.mouse.move(x, y, { steps: 5 });
    await page.mouse.up();
  }
  await drag('se', area.x + area.width + 30, area.y + area.height + 30);
  const enlarged = await terminal.boundingBox();
  expect(enlarged.width).toBeGreaterThan(initial.width);
  expect(enlarged.x + enlarged.width).toBeLessThanOrEqual(area.x + area.width);
  expect(enlarged.y + enlarged.height).toBeLessThanOrEqual(area.y + area.height);

  await drag('e', enlarged.x + 70, enlarged.y + enlarged.height / 2);
  const shrunk = await terminal.boundingBox();
  expect(shrunk.width).toBeCloseTo(340, 0);
  expect(shrunk.height).toBeCloseTo(enlarged.height, 0);
  await click(page, 'Minimizar Terminal');
  await click(page, 'Alternar Terminal');
  await expect(terminal.getByRole('list', { name: 'Secuencia armada' })).toContainText('int pulso = 0;');
  await expect.poll(async () => (await terminal.boundingBox()).width).toBeCloseTo(shrunk.width, 0);
});

for (const [width, height] of [[1920, 1080], [1366, 768], [1280, 720]]) {
  test('las vistas conservan geometría y el panel no cambia su escala a ' + width + '×' + height, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('./');
    await click(page, 'Acercarse al monitor');
    await click(page, 'Nueva partida');
    await click(page, 'Entrar al laboratorio');
    const scene = page.locator('.lab-scene');
    const check = async object => {
      const before = await scene.boundingBox();
      expect(before.width / before.height).toBeCloseTo(1024 / 560, 3);
      await inspect(page, object);
      const after = await scene.boundingBox();
      expect(after).toEqual(before);
      expect(after.x).toBeGreaterThan(0);
      expect(after.x + after.width).toBeLessThan(width);
      expect(await page.evaluate(() => ({
        width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight,
      }))).toEqual({ width, height });
    };
    await check('Puerta electrónica');
    await click(page, 'Probar la puerta');
    await look(page, 'Puesto de trabajo');
    await check('Computadora');
    await check('Nota del escritorio');
    await look(page, 'Área de servicio');
    await check('Rack de servidores');
    await check('Armario');
  });
}
