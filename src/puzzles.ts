export type Kind = 'salida' | 'debug' | 'secuencia' | 'cifrado';

export interface Puzzle {
  id: string;
  kind: Kind;
  title: string;
  prompt: string;
  code?: string;
  lines?: string[];
  answers: string[];
  hint: string;
  explanation: string;
  seconds?: number;
}

export const main: Puzzle[] = [
  {
    id: 'P1', kind: 'salida', title: 'Energía de mantenimiento',
    prompt: 'La consola de emergencia quedó bloqueada. Ingresá el número que muestra printf para encenderla y revisar la cerradura desde el laboratorio.',
    code: 'int base = 120;\nint extra = 7 * 3;\nint clave = base + extra + 10;\nprintf("%d", clave);',
    answers: ['151'], hint: 'Primero calculá extra: 7 por 3 da 21. Después sumá 120, 21 y 10.',
    explanation: 'La consola imprime 151. Con ese valor se habilita el panel de mantenimiento.',
  },
  {
    id: 'P2', kind: 'debug', title: 'Autenticación defectuosa',
    prompt: 'La terminal deja pasar códigos incorrectos. Escribí solo la condición dentro del if para que conceda acceso cuando los dos códigos sean iguales.',
    code: 'int claveIngresada;\nint claveCorrecta = 1234;\nscanf("%d", &claveIngresada);\nif (claveIngresada = claveCorrecta) {\n    printf("Acceso");\n} else {\n    printf("Denegado");\n}',
    answers: ['claveIngresada == claveCorrecta', 'claveCorrecta == claveIngresada'],
    hint: 'La línea scanf ya lee el número. En el if, usá dos signos igual para comparar. Un solo = cambia el valor.',
    explanation: 'Ahora un código incorrecto llega al else. Ya podés usar la terminal para recuperar el equipo del laboratorio.',
  },
  {
    id: 'P3', kind: 'secuencia', title: 'Pulso para el armario',
    prompt: 'Se mezclaron las instrucciones del armario. Ordenalas para empezar en cero, sumar dos, triplicar el resultado y mostrar el pulso. El cerrojo acepta un pulso de 6.',
    lines: ['printf("%d", pulso);', 'pulso = pulso * 3;', 'int pulso = 0;', 'pulso = pulso + 2;'],
    answers: ['2,3,1,0'], hint: 'Primero creá pulso. Si multiplicás antes de sumar, el resultado sigue siendo cero.',
    explanation: 'El valor pasa de 0 a 2 y luego a 6. El armario se abre y podés buscar la tarjeta del servidor.',
  },
  {
    id: 'P4', kind: 'cifrado', title: 'Clave del servidor',
    prompt: 'La tarjeta del armario permite abrir los archivos del servidor. Recuperá la palabra de cuatro letras leyendo lo que imprime cada printf en orden.',
    code: 'char primera = \'E\';\nchar segunda = \'X\';\nchar tercera = \'I\';\nchar cuarta = \'T\';\nprintf("%c", primera);\nprintf("%c", segunda);\nprintf("%c", tercera);\nprintf("%c", cuarta);',
    answers: ['EXIT'], hint: 'Con %c, printf muestra un carácter. Juntá las cuatro letras sin espacios.',
    explanation: 'Las letras forman EXIT. Ya podés leer los archivos del servidor de NEXUS.',
  },
  {
    id: 'P5', kind: 'debug', title: 'Control de la cerradura',
    prompt: 'El panel intenta encender un módulo que no existe. Reemplazá solo la condición del for para que muestre los números 0, 1, 2 y 3. Así el panel podrá usar los cuatro módulos de la puerta.',
    code: 'for (int i = 0; i <= 4; i++) {\n    printf("%d ", i);\n}',
    answers: ['i < 4', 'i <= 3', '4 > i', '3 >= i'],
    hint: 'El bucle repite mientras la condición sea verdadera. El 3 tiene que entrar y el 4 tiene que quedar afuera.',
    explanation: 'El panel recibe exactamente los cuatro números válidos y recupera los módulos de la cerradura.',
  },
  {
    id: 'P6', kind: 'debug', title: 'Protocolo final',
    prompt: 'La puerta sigue bajo el control de la sesión externa. Escribí la condición del if para que el panel muestre LOCAL únicamente cuando controlLocal sea igual a 1.',
    code: 'int controlLocal = 1;\nif (/* condición */) {\n    printf("LOCAL");\n} else {\n    printf("REMOTO");\n}',
    answers: ['controlLocal == 1', '1 == controlLocal'],
    hint: 'Usá == para comparar controlLocal con 1. Si el resultado es falso, se ejecuta el else.',
    explanation: 'El panel acepta el control local y podés decidir cómo salir del laboratorio.',
  },
];

export const attacks: Puzzle[] = [
  {
    id: 'D1', kind: 'debug', title: 'DEBUG ATTACK · I', seconds: 45,
    prompt: 'Una orden externa intenta aprobarse aunque el permiso vale 0. Reemplazá la condición del if para que solo se apruebe cuando permiso sea igual a 1.',
    code: 'int permiso = 0;\nif (permiso = 1) {\n    printf("APROBADO");\n} else {\n    printf("BLOQUEADO");\n}',
    answers: ['permiso == 1', '1 == permiso'],
    hint: 'El if debe comparar, no guardar un 1 en permiso. Usá ==.',
    explanation: 'Con permiso en 0, el panel muestra BLOQUEADO y rechaza la orden externa.',
  },
  {
    id: 'S1', kind: 'secuencia', title: 'SEQUENCE BREACH · I', seconds: 45,
    prompt: 'El contador de la sesión local quedó desordenado. Creá el contador, sumale un punto y recién entonces mostrá el total para confirmar la sesión.',
    lines: ['printf("%d", sesion);', 'sesion = sesion + 1;', 'int sesion = 0;'],
    answers: ['2,1,0'], hint: 'Antes de cambiar o mostrar sesion, declarala con int.',
    explanation: 'La consola muestra 1 y confirma que hay una sesión local activa.',
  },
  {
    id: 'C1', kind: 'cifrado', title: 'CIPHER INTRUSION · I', seconds: 45,
    prompt: 'El panel de luces te pide su clave. Leé las tres letras que muestra el código para que el control siga en el laboratorio.',
    code: 'char a = \'L\';\nchar b = \'U\';\nchar c = \'Z\';\nprintf("%c%c%c", a, b, c);',
    answers: ['LUZ'], hint: 'Cada %c imprime una letra. Leé a, b y c en ese orden.',
    explanation: 'El panel recibe LUZ y mantiene encendidas las luces del laboratorio.',
  },
  {
    id: 'D2', kind: 'debug', title: 'DEBUG ATTACK · II', seconds: 35,
    prompt: 'El control de alarmas intenta revisar el número 6, que no existe. Reemplazá la condición del while para revisar del 0 al 5.',
    code: 'int i = 0;\nwhile (i <= 6) {\n    printf("%d ", i);\n    i = i + 1;\n}',
    answers: ['i < 6', 'i <= 5', '6 > i', '5 >= i'],
    hint: 'Cuando i llega a 6, la condición debe volverse falsa.',
    explanation: 'El control revisa las seis alarmas reales sin enviar una orden a la entrada inexistente.',
  },
  {
    id: 'S2', kind: 'secuencia', title: 'SEQUENCE BREACH · II', seconds: 35,
    prompt: 'El medidor de la red perdió el orden de su calibración. Empezá en 1.5, sumá 0.5, duplicá el valor y mostralo para que el enlace vuelva a responder.',
    lines: ['voltaje = voltaje * 2;', 'printf("%.1f", voltaje);', 'voltaje = voltaje + 0.5;', 'float voltaje = 1.5;'],
    answers: ['3,2,0,1'], hint: 'float guarda decimales. El valor debe pasar por 1.5, 2.0 y 4.0, en ese orden.',
    explanation: 'El medidor muestra 4.0 y la conexión local vuelve a responder.',
  },
  {
    id: 'C2', kind: 'cifrado', title: 'CIPHER INTRUSION · II', seconds: 35,
    prompt: 'El panel de red cambió una letra de su clave. Seguí el if y escribí la palabra que se imprime para mantener la conexión local.',
    code: 'float voltaje = 2.5;\nchar letra = \'A\';\nif (voltaje < 3.0) {\n    letra = \'E\';\n}\nprintf("R%cD", letra);',
    answers: ['RED'], hint: '2.5 es menor que 3.0. La línea dentro del if cambia la letra a E.',
    explanation: 'printf coloca la E entre R y D. RED conserva la conexión con el panel.',
  },
  {
    id: 'D3', kind: 'debug', title: 'DEBUG ATTACK · III', seconds: 30,
    prompt: 'El lector acepta una firma marcada como inválida. Reemplazá la condición para que solo acepte la firma cuando el indicador firma sea 1.',
    code: 'int firma = 0;\nif (firma == 0) {\n    printf("ACEPTADA");\n} else {\n    printf("RECHAZADA");\n}',
    answers: ['firma == 1', '1 == firma'],
    hint: 'En este panel, 0 significa inválida y 1 significa válida. Compará firma con 1.',
    explanation: 'Con firma en 0 se ejecuta el else y se rechaza la orden externa.',
  },
  {
    id: 'S3', kind: 'secuencia', title: 'SEQUENCE BREACH · III', seconds: 30,
    prompt: 'Quedaron dos intentos externos pendientes. Ordená las instrucciones para crear el contador, reducirlo hasta cero con el while y mostrar el resultado para aislar el panel.',
    lines: ['while (intentos > 0) { intentos = intentos - 1; }', 'printf("%d", intentos);', 'int intentos = 2;'],
    answers: ['2,0,1'], hint: 'Creá la variable primero. El while le resta 1 hasta que llega a cero. Imprimí después del bucle.',
    explanation: 'El panel recibe 0 y queda aislado de los intentos pendientes.',
  },
  {
    id: 'C3', kind: 'cifrado', title: 'CIPHER INTRUSION · III', seconds: 30,
    prompt: 'La consola cambió una letra del código de NEXUS. Seguí el if y escribí la palabra que imprime para recuperar el canal local.',
    code: 'int canal = 2;\nchar letra = \'O\';\nif (canal == 2) {\n    letra = \'U\';\n}\nprintf("NEX%cS", letra);',
    answers: ['NEXUS'], hint: 'El canal vale 2, así que la letra cambia a U antes del printf.',
    explanation: 'La palabra resultante es NEXUS. La consola vuelve a responder al canal local.',
  },
];

export const recovery: Puzzle = {
  id: 'REC', kind: 'debug', title: 'Diagnóstico de emergencia',
  prompt: 'La cerradura perdió la conexión. Escribí la condición que permita recuperarla únicamente cuando canal sea igual a 2.',
  code: 'int canal = 2;\nif (/* condición */) {\n    printf("RECUPERADA");\n}',
  answers: ['canal == 2', '2 == canal'],
  hint: 'Para preguntar si dos valores son iguales se usa ==.',
  explanation: 'El diagnóstico usa el canal 2 y reduce el nivel de intrusión a 2/5.',
};

export const seal: Puzzle = {
  id: 'SELLO', kind: 'salida', title: 'Sellar el paquete de pruebas',
  prompt: 'El sistema necesita comprobar que las tres pruebas están juntas. Ingresá el número que imprime el código para guardar una copia en el laboratorio.',
  code: 'int informe = 15;\nint correo = 6;\nint registro = 2;\nint sello = informe + correo + registro;\nprintf("%d", sello);',
  answers: ['23'], hint: 'Sumá los tres valores: 15, 6 y 2.',
  explanation: 'El sello 23 valida el paquete. Las pruebas quedan guardadas para la auditoría.',
};

export function isCorrect(puzzle: Puzzle, input: string) {
  let candidate = input.trim();
  if (puzzle.kind === 'debug') {
    const tokenize = (source: string) => source.match(/[a-zA-Z_]\w*|\d+|==|!=|<=|>=|&&|\|\||\S/g)?.join(' ');
    return puzzle.answers.some(answer => tokenize(answer) === tokenize(candidate));
  }
  if (puzzle.kind === 'cifrado') candidate = candidate.toUpperCase();
  return puzzle.answers.includes(candidate);
}