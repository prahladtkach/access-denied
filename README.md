# ACCESS DENIED

Escape room en español para navegador de escritorio. Estás atrapado de noche en el laboratorio de NEXUS SYSTEMS. Explorá la habitación, repará los sistemas y decidí qué hacer con las pruebas.

[Jugar en GitHub Pages](https://prahladtkach.github.io/access-denied/) · [Código fuente](https://github.com/prahladtkach/access-denied) · [Créditos y licencias](CREDITS.md)

## Jugar

Con Node.js 22.18+ o 24, abrí PowerShell en esta carpeta:

```powershell
npm.cmd ci
npm.cmd run dev
```

Abrí [http://127.0.0.1:5173](http://127.0.0.1:5173) o la dirección que muestre Vite. Activá el monitor con clic o con **Tab** y **Enter** para acercarte al menú. Usá **Pantalla completa** para ampliar el juego y **Esc** o **Pausa y ajustes** para pausar. El avance y los puntos de control del MVP siguen disponibles en el mismo navegador y dirección.

El laboratorio tiene tres vistas conectadas: salida, puesto de trabajo y área de servicio. En la introducción, probá la puerta y seguí el tono hasta la computadora. Pasá el cursor sobre los objetos o usá **Tab** para descubrirlos y **Enter** para activarlos.

En NEXUS OS, abrí aplicaciones desde los iconos o el botón **Inicio**. Arrastrá una barra de título o enfócala y usá las flechas para mover la ventana. Para cambiar su tamaño, arrastrá un borde o una esquina. Las aplicaciones minimizadas se recuperan desde la barra de tareas.

La música del menú intenta arrancar al cargar. Si el navegador la bloquea, se habilita con el primer gesto permitido. En **Opciones** o **Configuración** podés ajustar o desactivar por separado música, ambiente y efectos, o silenciar todo. Las preferencias se guardan en el navegador. Los archivos de audio y el avatar ya están incluidos. Consultá [CREDITS.md](CREDITS.md) para ver las fuentes y licencias.

Las vistas del laboratorio tienen una proporción fija. Las bandas oscuras aparecen cuando sobra espacio y el panel narrativo mantiene su altura al cambiar de objeto. Los retos usan C básico y la terminal valida las respuestas sin ejecutar código escrito por el jugador.

Los fragmentos son de C. La terminal simula los resultados y compara las respuestas con soluciones predefinidas. Las defensas empiezan a contar cuando pulsás **Iniciar defensa**.

## Verificar

```powershell
npm.cmd test
npm.cmd run test:e2e
```

El segundo comando comprueba TypeScript, genera la compilación de producción y ejecuta las pruebas de navegador con Microsoft Edge. Si tenés Chrome, podés seleccionar ese navegador con `$env:ACCESS_DENIED_BROWSER = 'chrome'`. También podés compilar por separado con `npm.cmd run build`.

Para probar la entrega de producción, ejecutá `npm.cmd run build` y después `npm.cmd run preview`. Abrí la dirección que indique Vite, con la ruta `/access-denied/`. La carpeta `dist` contiene la compilación estática para esa ruta.

## Publicar en GitHub Pages

En el repositorio, seleccioná **Settings → Pages → Source → GitHub Actions**. El workflow **Publicar ACCESS DENIED** compila y publica cada cambio de `main`. También podés iniciarlo desde **Actions → Publicar ACCESS DENIED → Run workflow**.

## Alcance

El juego incluye seis retos principales en C, nueve defensas, tres finales, guardado local, diagnóstico de recuperación y cuatro puntos de control. La entrega incluye el menú CRT, las tres vistas del laboratorio, NEXUS OS, el avatar oficial y el audio de UNKNOWN. Sigue pendiente medir con jugadores nuevos si la primera partida dura los 20–30 minutos previstos.

