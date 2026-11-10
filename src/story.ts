import type { Ending, FileId, ObjectId } from './game.ts';

export const objects: Record<ObjectId, {name: string; text: string}> = {
  desk: {name:'Computadora',text:'El monitor todavía recibe corriente. Una nota doblada sobresale del teclado.'},
  note: {name:'Nota del escritorio',text:'Consola de mantenimiento: ingresá el valor que imprima el programa de arranque. La prioridad de operaciones sigue siendo la de C.'},
  cabinet: {name:'Armario',text:'Encontrás la tarjeta del servidor. Dice que la consola muestra la clave letra por letra con printf.'},
  rack: {name:'Rack de servidores',text:'El manual fija cuatro módulos, del 0 al 3. Hay tinta en el reverso.'},
  door: {name:'Puerta electrónica',text:'La cerradura se activa desde el sistema de mantenimiento. El lector indica: CONTROL REMOTO.'},
  clock: {name:'Reloj de pared',text:'23:41. El segundero tiembla sin avanzar. Se quedó en la hora en que sonó la cerradura.'},
};

export const files: Record<FileId, {name: string; source: string; text: string}> = {
  mail: {name:'correo_interno.txt',source:'Dirección de NEXUS · 18:02',text:'«Suspendan la auditoría del módulo de cerraduras. El fallo permite operar el edificio de forma remota. Retiren el informe de Vega antes de la inspección.»'},
  access: {name:'acceso_nocturno.log',source:'Control de acceso · 23:40',text:'VEGA, ADRIÁN (credencial revocada): sesión remota activa. Desactivó las alarmas y forzó el cierre del laboratorio con personal adentro.'},
  report: {name:'informe_original.txt',source:'A. Vega · Informe técnico',text:'«Una sesión remota puede secuestrar los controles de emergencia. Entregué el informe antes de mi despido. La bitácora de acceso y el correo de Dirección documentan lo que hicieron con él.»'},
};

export const endings: Record<Ending, {label: string; text: string; line: string}> = {
  ESCAPE: {label:'Escapaste',line:'SALIDA LOCAL HABILITADA',text:'La puerta cede y cruzás el pasillo vacío. Cortaste el acceso de UNKNOWN. Tras vos queda un edificio que todavía guarda demasiados secretos.'},
  'THE TRUTH': {label:'La verdad',line:'PRUEBAS SELLADAS · SALIDA LOCAL HABILITADA',text:'Salís con una copia íntegra para la auditoría. El correo y el informe exponen a NEXUS. La bitácora demuestra lo que Adrián hizo esa noche.'},
  'UNKNOWN WINS': {label:'UNKNOWN gana',line:'ADMINISTRADOR TRANSFERIDO · SALIDA REVOCADA',text:'Adrián se queda con los archivos y el control del edificio. La puerta se traba. «Te dije que solo necesitaba una cosa. Tendrías que haber revisado qué me estabas entregando.»'},
};