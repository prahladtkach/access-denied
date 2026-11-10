# ACCESS DENIED

Escape room en español para navegador de escritorio. Estás atrapado de noche en el laboratorio de NEXUS SYSTEMS. Explorá la habitación, repará los sistemas y decidí qué hacer con las pruebas.

## Jugar

Con Node.js 22.18+ o 24, abrí PowerShell en esta carpeta:

```powershell
npm.cmd ci
npm.cmd run dev
```

Abrí [http://127.0.0.1:5173](http://127.0.0.1:5173) o la dirección que muestre Vite. Hacé clic en los objetos de la habitación. Usá **Esc** o **Pausa y ajustes** para pausar. El juego guarda el avance y los puntos de control en el navegador.

Los fragmentos son de C. La terminal simula los resultados y compara las respuestas con soluciones predefinidas. Las defensas empiezan a contar cuando pulsás **Iniciar defensa**.

## Verificar

```powershell
npm.cmd test
npm.cmd run test:e2e
```

El segundo comando comprueba TypeScript, genera la compilación de producción y ejecuta las pruebas de navegador con Microsoft Edge. Si tenés Chrome, podés seleccionar ese navegador con `$env:ACCESS_DENIED_BROWSER = 'chrome'`. También podés compilar por separado con `npm.cmd run build`.

## Alcance

El MVP incluye seis retos principales, nueve defensas, tres finales, guardado local, diagnóstico de recuperación y cuatro puntos de control. La habitación usa ilustración CSS sencilla y la alerta tiene una señal sonora ajustable. Quedan pendientes el arte y audio finales y medir con jugadores nuevos si la primera partida dura los 20–30 minutos previstos.

