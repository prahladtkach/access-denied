import { expect, test } from '@playwright/test';

const button = (page, name) => page.getByRole('button', { name, exact: typeof name === 'string' });
const click = (page, name) => button(page, name).click();
const terminal = page => click(page, 'Terminal');
const inspect = (page, name) => click(page, name);
const useComputer = async page => {
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
  await page.goto('/');
  await inspect(page, 'Nota del escritorio');
  await useComputer(page);
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
  await order(page, ['void abrirArmario(void)', 'enviarPulso', 'liberarCerrojo', /^＋ \}$/, 'void mantenimiento']);
  await click(page, '← Habitación');
  await inspect(page, 'Armario');
  await expect(page.getByText(/referencia ASCII/)).toBeVisible();
  await useComputer(page);
  await click(page, 'Abrir reto · P4');
  await answer(page, 'EXIT');
  await expect(page.locator('footer')).toContainText('Servidor desbloqueado');
  await warn(page);
  await order(page, ['iniciarSesion', 'verificarSesion', 'habilitarSesion']);
  await click(page, '← Habitación');
  await inspect(page, 'Rack de servidores');
  if (evidence !== 'skip') await click(page, 'Revisar el reverso del manual');
  await useComputer(page);
  if (evidence !== 'skip') {
    await click(page, 'Archivos');
    await click(page, 'correo_interno.txt');
    await expect(page.getByText(/Suspendan la auditoría/)).toBeVisible();
    await click(page, 'informe_original.txt');
    await click(page, 'Registros');
    await click(page, 'acceso_nocturno.log');
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
  await answer(page, 'puertaLista == 1 && sesionLocal == 1');
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
  expect(errors).toEqual([]);
});

test('THE TRUTH: persiste la evidencia, se sella y se vuelve al checkpoint', async ({ page }) => {
  await finalCheckpoint(page, 'keep');
  await page.reload();
  await useComputer(page);
  await lastDefense(page);
  await localControl(page);
  await click(page, 'Preparar copia de las pruebas');
  await answer(page, '23');
  await click(page, 'Resguardar las pruebas y salir');
  await expect(page.getByRole('heading', { name: 'THE TRUTH', exact: true })).toBeVisible();
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
  await click(page, 'Volver al punto de control final');
  await lastDefense(page);
  await click(page, 'Abrir reto · P6');
  await answer(page, 'puertaLista = 1');
  await expect(page.getByRole('status')).toContainText('ADVERTENCIA');
  await answer(page, 'sesionLocal = 1');
  await expect(page.getByRole('heading', { name: 'UNKNOWN WINS', exact: true })).toBeVisible();
  await click(page, 'Nueva partida');
  await click(page, 'Reiniciar partida');
  await expect(page.locator('footer')).toContainText('Inicio');
  await expect(button(page, 'Nota del escritorio')).toBeVisible();
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



