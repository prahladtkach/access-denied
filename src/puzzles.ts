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
    prompt: 'La nota del escritorio indica que hay que ingresar el número que imprime este fragmento.',
    code: 'int base = 120;\nint clave = base + 7 * 3;\nclave += 10;\nprintf("%d", clave);',
    answers: ['151'], hint: 'Multiplicá 7 por 3 primero. Después sumá 120 y por último 10.',
    explanation: 'La consola imprime 151. El operador += suma al valor ya calculado.',
  },
  {
    id: 'P2', kind: 'debug', title: 'Autenticación defectuosa',
    prompt: 'Reemplazá la condición dentro de if. El acceso debe concederse solo cuando las claves coincidan.',
    code: 'int claveIngresada = 0;\nint claveCorrecta = 1234;\nscanf("%d", &claveIngresada);\nif (claveIngresada = claveCorrecta) {\n    abrirTerminal();\n} else {\n    denegarAcceso();\n}',
    answers: ['claveIngresada == claveCorrecta', 'claveCorrecta == claveIngresada'],
    hint: 'En C, == compara. Un solo = asigna y devuelve el valor asignado.',
    explanation: 'La comparación devuelve verdadero únicamente si las claves coinciden. Antes, cualquier clave correcta distinta de cero habilitaba el acceso.',
  },
  {
    id: 'P3', kind: 'secuencia', title: 'Servicio del armario',
    prompt: 'Ordená la definición completa de abrirArmario y después llamala desde mantenimiento. El pulso debe preceder al desbloqueo.',
    lines: ['    liberarCerrojo();', 'void mantenimiento(void) { abrirArmario(); }', 'void abrirArmario(void) {', '    enviarPulso();', '}'],
    answers: ['2,3,0,4,1'], hint: 'Primero definí abrirArmario: abrí el bloque, enviá el pulso, liberá el cerrojo y cerrá el bloque. Luego viene mantenimiento.',
    explanation: 'La función queda definida antes de su llamada. Al ejecutarse, el pulso prepara el cerrojo.',
  },
  {
    id: 'P4', kind: 'cifrado', title: 'Clave del servidor',
    prompt: 'El arreglo recuperado del armario contiene una palabra en ASCII. Escribila para montar el volumen del rack.',
    code: 'char clave[] = {69, 88, 73, 84, 0};\nprintf("%s", clave);',
    answers: ['EXIT'], hint: 'Tabla de la tarjeta: 69 = E · 73 = I · 84 = T · 88 = X. El cero termina la cadena.',
    explanation: 'En orden, los cuatro bytes útiles forman EXIT. El cero marca el fin de la cadena.',
  },
  {
    id: 'P5', kind: 'debug', title: 'Control de la cerradura',
    prompt: 'Escribí la nueva condición del for. Activá exactamente los cuatro módulos válidos, numerados del 0 al 3.',
    code: 'for (int i = 0; i <= 4; i++) {\n    activarModulo(i);\n}',
    answers: ['i < 4', 'i <= 3', '4 > i', '3 >= i'], hint: 'El cuerpo se ejecuta mientras la condición sea verdadera. Excluí el índice 4.',
    explanation: 'Se activan los módulos 0, 1, 2 y 3. La puerta queda disponible para el protocolo final.',
  },
  {
    id: 'P6', kind: 'debug', title: 'Protocolo final',
    prompt: 'Escribí la condición de seguridad. Ambos permisos deben valer exactamente 1 para recuperar el control local.',
    code: 'int puertaLista = diagnosticarPuerta();\nint sesionLocal = verificarSesion();\nif (/* condición */) {\n    recuperarControlLocal();\n}',
    answers: ['puertaLista == 1 && sesionLocal == 1', 'sesionLocal == 1 && puertaLista == 1'],
    hint: 'Compará cada permiso con 1 usando == y uní las comparaciones con &&.',
    explanation: 'Las dos verificaciones deben pasar. La sesión de UNKNOWN ya no controla la salida.',
  },
];

export const attacks: Puzzle[] = [
  {id:'D1',kind:'debug',title:'DEBUG ATTACK · I',seconds:45,prompt:'Reescribí la condición. Solo un permiso igual a 1 debe activar el cierre remoto.',code:'int permiso = 0;\nif (permiso = 1) activarRemoto();',answers:['permiso == 1','1 == permiso'],hint:'Usá == en lugar de =.',explanation:'Una asignación habría convertido el permiso denegado en 1.'},
  {id:'S1',kind:'secuencia',title:'SEQUENCE BREACH · I',seconds:45,prompt:'Ordená el arranque de la sesión local: iniciá, verificá y recién después habilitá.',lines:['habilitarSesion();','verificarSesion();','iniciarSesion();'],answers:['2,1,0'],hint:'No se puede verificar una sesión que todavía no existe.',explanation:'La verificación queda antes de la habilitación.'},
  {id:'C1',kind:'cifrado',title:'CIPHER INTRUSION · I',seconds:45,prompt:'Recuperá la palabra del arreglo ASCII.',code:'char clave[] = {76, 85, 90, 0};',answers:['LUZ'],hint:'76 = L · 85 = U · 90 = Z. Ignorá el cero final.',explanation:'Los bytes imprimibles forman LUZ.'},
  {id:'D2',kind:'debug',title:'DEBUG ATTACK · II',seconds:35,prompt:'Reemplazá la condición del for. Hay seis entradas de alarma, del índice 0 al 5.',code:'for (int i = 0; i <= 6; i++) revisar(i);',answers:['i < 6','i <= 5','6 > i','5 >= i'],hint:'El índice 6 ya está fuera del arreglo.',explanation:'Se recorren los seis índices válidos.'},
  {id:'S2',kind:'secuencia',title:'SEQUENCE BREACH · II',seconds:35,prompt:'Reconstruí el aislamiento: leé el canal, congelalo, guardá su registro y después desconectalo.',lines:['desconectar(canal);','int canal = leerCanal();','guardarRegistro(canal);','congelar(canal);'],answers:['1,3,2,0'],hint:'Declarar canal va primero. Guardar el registro requiere el canal congelado y conectado.',explanation:'La evidencia queda preservada antes de la desconexión.'},
  {id:'C2',kind:'cifrado',title:'CIPHER INTRUSION · II',seconds:35,prompt:'Cada byte fue desplazado tres lugares. Restá 3 a cada número para recuperar la palabra.',code:'int cifrado[] = {85, 72, 71};',answers:['RED'],hint:'ASCII: 68 = D · 69 = E · 82 = R.',explanation:'Restar tres produce 82, 69, 68, es decir RED.'},
  {id:'D3',kind:'debug',title:'DEBUG ATTACK · III',seconds:30,prompt:'Reescribí la condición. El origen y la firma deben valer 1 al mismo tiempo.',code:'if (origen == 1 || firma == 1) autorizar();',answers:['origen == 1 && firma == 1','firma == 1 && origen == 1'],hint:'|| exige al menos una condición. && exige las dos.',explanation:'Una sola credencial válida ya no basta.'},
  {id:'S3',kind:'secuencia',title:'SEQUENCE BREACH · III',seconds:30,prompt:'Definí aislar para bloquear la red antes de sellar los registros. Después ordená la rutina que verifica la firma y solo entonces llama a aislar.',lines:['    if (firmaValida()) aislar();','    sellarRegistros();','void defender(void) {','void aislar(void) {','    bloquearRed();','}'],answers:['3,4,1,5,2,0'],hint:'El último cierre de llave es fijo. El que podés mover debe cerrar aislar antes de definir defender.',explanation:'La rutina de defensa valida la firma. Al aislar, la red se corta antes de sellar.',code:'/* La última llave ya está fijada al final. */'},
  {id:'C3',kind:'cifrado',title:'CIPHER INTRUSION · III',seconds:30,prompt:'Restá el índice de cada byte antes de convertirlo a ASCII. El primer índice vale 0.',code:'int datos[] = {78, 70, 90, 88, 87};\n/* letra[i] = datos[i] - i; */',answers:['NEXUS'],hint:'ASCII: 69 = E · 78 = N · 83 = S · 85 = U · 88 = X.',explanation:'Los bytes corregidos son 78, 69, 88, 85 y 83.'},
];

export const recovery: Puzzle = {
  id:'REC',kind:'debug',title:'Diagnóstico de emergencia',
  prompt:'La cerradura solo se recupera en el canal 2. Escribí la condición que compara canal con 2.',
  code:'if (/* condición */) restaurarCerradura();',answers:['canal == 2','2 == canal'],
  hint:'Una comparación usa dos signos igual.',explanation:'El diagnóstico aisló el canal comprometido. Intrusión reducida a 2/5.',
};

export const seal: Puzzle = {
  id:'SELLO',kind:'salida',title:'Sellar el paquete de pruebas',
  prompt:'El rack verifica que el paquete contenga tres evidencias. Escribí el sello que imprime la rutina.',
  code:'int peso[] = {2, 3, 5};\nint sello = 0;\nfor (int i = 0; i < 3; i++) {\n    sello += peso[i] * (i + 1);\n}\nprintf("%d", sello);',
  answers:['23'],hint:'Sumá 2 × 1, 3 × 2 y 5 × 3.',
  explanation:'El sello 23 valida el paquete. El juego resguarda una copia local ficticia para una auditoría.',
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


