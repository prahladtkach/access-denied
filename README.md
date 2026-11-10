# ACCESS DENIED

Escape room en español para navegador de escritorio. Estás atrapado de noche en el laboratorio de NEXUS SYSTEMS. Explorá la habitación, repará los sistemas y decidí qué hacer con las pruebas.

## Jugar

Con Node.js 22.18+ o 24, abrí PowerShell en esta carpeta:

```powershell
npm.cmd ci
npm.cmd run dev
```

Abrí [http://127.0.0.1:5173](http://127.0.0.1:5173) o la dirección que muestre Vite. Activá el monitor con clic o con **Tab** y **Enter** para acercarte al menú. Usá **Pantalla completa** para ampliar el juego y **Esc** o **Pausa y ajustes** para pausar. El avance y los puntos de control del MVP siguen disponibles en el mismo navegador y dirección.

El laboratorio tiene tres vistas conectadas: salida, puesto de trabajo y área de servicio. En la introducción, probá la puerta y seguí el tono hasta la computadora. Pasá el cursor sobre los objetos o usá **Tab** para descubrirlos y **Enter** para activarlos.

En NEXUS OS, abrí aplicaciones desde los iconos o el botón **Inicio**. Arrastrá una barra de título o enfócala y usá las flechas para mover la ventana. Las aplicaciones minimizadas se recuperan desde la barra de tareas. En **Configuración** podés ajustar volumen, silencio y efectos visuales. Las preferencias se guardan en el navegador.

Los fragmentos son de C. La terminal simula los resultados y compara las respuestas con soluciones predefinidas. Las defensas empiezan a contar cuando pulsás **Iniciar defensa**.

## Verificar

```powershell
npm.cmd test
npm.cmd run test:e2e
```

El segundo comando comprueba TypeScript, genera la compilación de producción y ejecuta las pruebas de navegador con Microsoft Edge. Si tenés Chrome, podés seleccionar ese navegador con `$env:ACCESS_DENIED_BROWSER = 'chrome'`. También podés compilar por separado con `npm.cmd run build`.

## Alcance

El juego incluye seis retos principales, nueve defensas, tres finales, guardado local, diagnóstico de recuperación y cuatro puntos de control. La fase 2 incorpora el menú narrativo, una habitación pixel art a escala de la ventana y NEXUS OS con ventanas, carpetas, reloj y avisos. UNKNOWN reacciona a decisiones y puede abrir un canal privado. Su sprite original y el sistema de audio completo quedan para una fase posterior. Sigue pendiente medir con jugadores nuevos si la primera partida dura los 20–30 minutos previstos.

