# Usuarios y publicaciones · React + TypeScript

Pequeña aplicación que consume la API pública [JSONPlaceholder](https://jsonplaceholder.typicode.com):

- **Lista de usuarios con búsqueda por nombre**: insensible a mayúsculas y tildes (`jose` encuentra «José»).
- **Publicaciones del usuario elegido** y **formulario validado para crear una nueva**: título y texto obligatorios. El formulario está plegado tras un botón **«Añadir publicación»**. La API no guarda los datos, así que la publicación creada se añade en local al principio de la lista, marcada como «Nueva».
- **En móvil, las publicaciones se abren en una hoja flotante** (un `<dialog>` modal) con un botón **«← Usuarios»** para volver a la lista. En escritorio se muestran en una segunda columna.
- **Estados de carga, error y vacío** visibles en cada petición, con botón **Reintentar**.
- **43 tests** con Vitest y Testing Library (99 % de líneas cubiertas).
- Accesible con teclado y lector de pantalla, con **modo oscuro** automático y diseño responsive.

---

## Cómo ejecutarlo

Requisitos: **Node.js 22** o superior (Vite 8 necesita `^20.19 || >=22.12`) y npm.

```bash
npm install
npm run dev          # http://localhost:5173
```

| Script                  | Qué hace                                                        |
| ----------------------- | --------------------------------------------------------------- |
| `npm run dev`           | Servidor de desarrollo con recarga en caliente                  |
| `npm test`              | Ejecuta los tests una vez                                       |
| `npm run test:watch`    | Tests en modo observación                                       |
| `npm run test:coverage` | Tests con informe de cobertura (terminal y `coverage/index.html`) |
| `npm run lint`          | Linter ([oxlint](https://oxc.rs))                               |
| `npm run typecheck`     | Comprobación de tipos de TypeScript                             |
| `npm run build`         | Comprueba los tipos y genera la versión de producción en `dist/` |
| `npm run preview`       | Sirve la versión de producción generada                         |

---

## Estructura

```
src/
├── api/client.ts            Cliente HTTP: getUsers, getPostsByUser, createPost, ApiError
├── hooks/
│   ├── useFetch.ts          Petición con estados loading/success/error, reintento y cancelación
│   ├── useDebouncedValue.ts Retrasa un valor (anuncio del nº de resultados)
│   └── useMediaQuery.ts     ¿Pantalla estrecha? (mismo punto de corte que el CSS)
├── utils/
│   ├── search.ts            Normalización y filtrado por nombre
│   └── validatePost.ts      Reglas de validación del formulario
├── components/
│   ├── UserList.tsx         Lista + buscador + estados
│   ├── UserSearch.tsx       Campo de búsqueda (<search> + <form>)
│   ├── UserPosts.tsx        Publicaciones del usuario + formulario
│   ├── PostsDialog.tsx      Hoja flotante (<dialog> modal) con las publicaciones en móvil
│   ├── PostForm.tsx         Formulario plegable de nueva publicación con validación accesible
│   ├── Loading.tsx          Indicador de carga (<progress> indeterminado)
│   └── ErrorMessage.tsx     Error con role="alert" y botón Reintentar
├── App.tsx                  Composición y usuario seleccionado
├── index.css                Tokens de diseño, temas claro/oscuro y estilos
└── types.ts                 User, Post, NewPost
```

Cada archivo `*.test.ts(x)` está junto al código que prueba.

---

## Decisiones técnicas

### Stack
- **Vite + React 19 + TypeScript**, partiendo de la plantilla oficial de Vite. Mantuve **oxlint** porque es lo que trae la plantilla, y es más rápido que ESLint.
- **Sin librerías extra en ejecución**: solo `react` y `react-dom`. Para cuatro llamadas a la API, una librería de datos (TanStack Query, SWR) o de formularios (React Hook Form) añadiría más peso que valor. Tampoco uso un framework de CSS.

### Datos
- **Un cliente de API único** ([client.ts](src/api/client.ts)):
  - Cada petición tiene un *timeout* de 10 s, que se combina con la señal de cancelación del componente (`AbortSignal.any([signal, AbortSignal.timeout(ms)])`).
  - Todos los fallos se convierten en un `ApiError` con un mensaje en español listo para mostrar: error HTTP, sin conexión, *timeout* o JSON no válido. El error original se conserva en `cause`.
  - Las cancelaciones voluntarias no se muestran como error.
- **Hook propio `useFetch`** ([useFetch.ts](src/hooks/useFetch.ts)):
  - El estado se modela como un tipo discriminado (`loading | success | error`), así TypeScript impide leer `data` mientras se carga.
  - El estado `loading` se **calcula durante el render** en lugar de guardarse en el efecto. Así se evita un render extra; lo detectó oxlint con la regla `set-state-in-effect`.
  - Las peticiones obsoletas se abortan. Si cambias rápido de usuario, una respuesta lenta nunca sustituye a la más reciente.
  - Ofrece `reload()` para reintentar y `setData()` para añadir la publicación creada.
- **Búsqueda en el cliente**: JSONPlaceholder solo filtra por coincidencia exacta y son 10 usuarios. Normalizo con `NFD` y quito los diacríticos para que no importen las tildes.
- **Publicación creada**: se hace el `POST` real, pero la API responde siempre `id: 101`. Le asigno un **id local negativo y único** para no repetir claves de React si se crean varias, y para distinguirla con la etiqueta «Nueva».

### Formulario
- **Plegado por defecto** tras un botón «Añadir publicación», para que lo primero que se vea sean las publicaciones:
  - Es un patrón *disclosure* con `aria-expanded` y `aria-controls`. No usé `<details>` porque el formulario tiene su propio encabezado, y no se recomienda poner encabezados dentro de `<summary>`.
  - Al desplegarlo, el foco va al campo Título.
  - «Cancelar» lo pliega y descarta el borrador; plegarlo con el propio botón conserva el borrador.
  - Tras publicar se pliega solo, y el aviso de éxito queda visible porque está fuera del formulario.
  - Al plegarse, el foco vuelve a «Añadir publicación», porque el control que lo tenía desaparece.
- La validación es propia (`noValidate`), pero sigue el comportamiento recomendado para la validación nativa:
  - Los errores **solo aparecen después de interactuar**: al salir de un campo que se ha editado, o al enviar. Nunca al cargar.
  - Un error **desaparece en cuanto se corrige** el campo.
  - Tras un envío fallido, **el foco va al primer campo inválido**.
- No usé `required` y `:user-invalid` solos porque `required` da por válido un texto hecho **solo de espacios**, y jsdom no soporta `:user-invalid`, así que no se podría probar.
- `aria-invalid` vale `false` desde el inicio, y el mensaje de error se vincula con `aria-describedby` **solo mientras se muestra**.
- El botón no se desactiva con `disabled`: mientras se envía usa `aria-disabled`, que evita el doble envío y **conserva el foco**.

### Móvil: hoja flotante con `<dialog>`
- En pantallas estrechas, al elegir un usuario sus publicaciones se abren en una **hoja que sube desde abajo**. Es un `<dialog>` abierto con `showModal()`, con el botón **«← Usuarios»** para volver. Su nombre accesible es «Volver a Usuarios».
- Usé el `<dialog>` nativo porque el navegador aporta casi todo sin código propio:
  - La página de fondo queda **inerte** y el foco se mantiene dentro de la hoja.
  - Se cierra con **Esc** y con el **gesto o botón «atrás» de Android**.
  - Al cerrarse, **devuelve el foco** al usuario que la abrió.
- Para que la página de fondo no se desplace usé `overscroll-behavior: contain` en el diálogo y en `::backdrop`, sin `overflow: hidden` en `body`. La entrada se anima con `@starting-style`, y el desplazamiento solo si el usuario no pidió reducir el movimiento.
- **Alternativa descartada:** el patrón *stack drill-down* (vistas apiladas con scroll-snap, deslizar para volver e historial del navegador). Es más «nativo», pero exige sincronizar el historial, `inert` y los eventos de *snap* a mano. Para una sola vista de detalle no compensaba.
- **Mismo punto de corte en CSS y JS:** el layout usa `@media (width >= 50rem)` y el hook `useMediaQuery` evalúa `(width < 50rem)` para decidir entre panel y diálogo. Por eso es una media query y no `@container`: JS tiene que evaluar exactamente la misma condición. El hook usa `useSyncExternalStore` y escucha el evento `change` (al girar el móvil o redimensionar).

### Accesibilidad y UX
- **Selección de usuario**: el foco pasa al encabezado del panel de publicaciones y el título de la pestaña se actualiza (React 19 lleva `<title>` al `<head>`).
- **Reintentar**: el botón desaparece al recargar, así que el foco pasa al encabezado del panel en vez de caer en `<body>`.
- **Carga**: uso un `<progress>` nativo sin región viva, porque los avisos de «Cargando…» solo añaden ruido. Aparece tras 300 ms, para que no parpadee si la respuesta es rápida.
- **Recuento de resultados**: se anuncia en una región `role="status"` con *debounce*, para no saturar el lector de pantalla mientras se escribe.
- **Listas**: llevan `role="list"`, porque Safari les quita la semántica cuando tienen `list-style: none`.
- **Estilos**:
  - Tema claro y oscuro con tokens CSS, y contraste WCAG AA comprobado: texto ≥ 4,5:1 y bordes de controles ≥ 3:1.
  - Los estados no dependen solo del color (iconos ⚠/✓, borde y negrita en la selección), y hay soporte para el modo de colores forzados de Windows.
  - Dos columnas con la lista fija en escritorio. En móvil, una columna con un chevron «›» en cada usuario, que indica que abre otra vista.

### Tests
- Vitest + Testing Library + jsdom. **Se simula `fetch`** con `vi.spyOn(globalThis, 'fetch')` en lugar de simular módulos, así los tests pasan por el cliente de API real y por sus mensajes de error.
- Las consultas se hacen por **rol y nombre accesible** (`getByRole('button', { name: /reintentar/i })`), lo que también comprueba la accesibilidad.
- jsdom no implementa `matchMedia` ni `showModal()`/`close()`. [src/test/setup.ts](src/test/setup.ts) añade versiones mínimas de las tres, y los tests de móvil simulan una pantalla estrecha con `vi.spyOn(window, 'matchMedia')`.

---

## Tests

43 tests en 8 archivos. Cobertura: **99,5 % de líneas y 93,8 % de ramas**. Los más representativos:

| Qué comprueba | Archivo |
| --- | --- |
| La **búsqueda** filtra mientras se escribe, sin distinguir mayúsculas ni tildes, avisa cuando nada coincide y se recupera al borrar | [UserList.test.tsx](src/components/UserList.test.tsx), [search.test.ts](src/utils/search.test.ts) |
| Al **enviar el formulario vacío** (o solo con espacios) se muestran los errores, el foco va al primer campo y **no se llama a la API** | [PostForm.test.tsx](src/components/PostForm.test.tsx) |
| Los errores aparecen **al salir de un campo editado** y se borran al corregir; pasar por un campo sin escribir no marca error | [PostForm.test.tsx](src/components/PostForm.test.tsx) |
| La **publicación creada aparece la primera** de la lista con la etiqueta «Nueva» | [UserPosts.test.tsx](src/components/UserPosts.test.tsx) |
| **Carga → error → Reintentar → datos**, conservando el foco | [UserList.test.tsx](src/components/UserList.test.tsx), [UserPosts.test.tsx](src/components/UserPosts.test.tsx) |
| **Envío doble bloqueado** mientras se publica | [PostForm.test.tsx](src/components/PostForm.test.tsx) |
| **Formulario plegable**: empieza plegado, al desplegar el foco va al título, «Cancelar» descarta y devuelve el foco, y tras publicar se pliega | [PostForm.test.tsx](src/components/PostForm.test.tsx) |
| **Móvil**: el detalle se abre en un diálogo modal nombrado por su encabezado, con el foco en «Volver a Usuarios», y al cerrar vuelve a la lista | [App.test.tsx](src/App.test.tsx) |
| Flujo completo: carga, lista, selección, foco, título de la pestaña y publicaciones | [App.test.tsx](src/App.test.tsx) |
| Cliente de la API: URLs, POST, HTTP 500, red, *timeout*, cancelación y JSON no válido | [client.test.ts](src/api/client.test.ts) |

---

## Qué haría con más tiempo

- **Conservar las publicaciones creadas al cambiar de usuario.** Ahora, si creas una, cambias de usuario y vuelves, desaparece, porque la lista se vuelve a pedir a la API. Lo resolvería con una caché por usuario: o un `Map` en el estado de `App`, o TanStack Query si la app creciera (caché, deduplicación y actualizaciones optimistas).
- **Estado en la URL** (`?user=3&q=leanne`), para poder compartir enlaces y que funcione el botón Atrás del navegador.
- **Hoja flotante en móvil:**
  - Proteger el borrador. Ahora, si hay texto escrito y se pulsa Esc o «atrás», la hoja se cierra y el borrador se pierde. Lo resolvería interceptando el evento `cancel` del diálogo y pidiendo confirmación.
  - Animar también la salida. Ahora solo se anima la entrada, porque el diálogo se desmonta al cerrarse.
  - Cerrar la hoja deslizándola hacia abajo, y sincronizarla con el historial para que el botón Atrás funcione también en iOS.
- **Tests E2E con Playwright** en un navegador real. Los usé para verificar el diseño (capturas en móvil, modo oscuro y colores forzados), pero no están automatizados en el repositorio.
- **Tests automáticos de accesibilidad** con axe-core (`vitest-axe`) y **pruebas manuales con lectores de pantalla** (NVDA, VoiceOver).
- **CI en GitHub Actions** (lint, typecheck, tests y build) y despliegue en GitHub Pages.
- Editar y borrar publicaciones, mostrar más datos del usuario (email, empresa) y un selector manual de tema claro/oscuro.

---

## Cómo usé la IA

Desarrollé el proyecto con **Claude Code** (modelo Claude Opus 5.5) dentro de VS Code. Además le pedí usar la skill **[modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance)** de Google Chrome, que trae guías actualizadas de buenas prácticas web y está incluida en [.claude/skills/](.claude/skills/).

### Qué le pedí
1. **Planificar antes de programar**, con un checklist de 10 pasos (0–9). Al terminar cada paso tenía que avisarme y esperar mi aprobación antes de hacer el commit y seguir. Así revisé cada paso por separado.
2. **Usar la skill `modern-web-guidance`** y consultarla antes de escribir interfaz, CSS, formularios o accesibilidad. Al final de cada paso me indicaba qué guía había aplicado y por qué.
3. **Poder ver la app antes de seguir.** Tras el paso de datos me propuso probar la API desde la consola del navegador. Le pedí en su lugar una interfaz mínima para verlo sin la consola, y adelantamos la lista y las publicaciones.
4. **Dividir los commits por tema** en vez de hacer uno por paso.
5. Trabajar en la rama `dev` e incluir la skill en el repositorio.
6. Dos mejoras visuales al final:
   - Plegar el formulario tras un botón «Añadir publicación».
   - En móvil, mostrar las publicaciones en una ventana flotante con un botón para volver a la lista.

   La IA comparó dos patrones para la ventana flotante (`<dialog>` modal o *stack drill-down*) y propuso el `<dialog>`, por ser más simple y porque el navegador ya aporta el foco, el cierre y el fondo inerte.

### Qué acepté
- El plan, el stack y la estructura de carpetas.
- Dos cambios respecto al plan inicial que la IA justificó: React 19 en vez de 18, y oxlint en vez de ESLint. Ambos vienen en la plantilla oficial de Vite.
- No usar librerías de datos ni de formularios, con un hook `useFetch` propio.
- **Mover el foco** al panel de publicaciones al elegir un usuario. La IA me avisó del inconveniente (con teclado, para volver a la lista hay que pulsar Shift+Tab) y lo acepté.
- La validación propia del formulario en lugar de la nativa, por el caso de los espacios y para poder probarla.
- Planteé el Paso 7 (tests) como un informe de cobertura y unos pocos tests de huecos, porque ya había más de 30 tests.

### Qué se corrigió por el camino
Durante el proceso se detectaron y corrigieron varios fallos de la propuesta inicial. Los encontraron el linter, el compilador, las guías o la verificación visual:

| Problema | Cómo se detectó | Corrección |
| --- | --- | --- |
| `setState` llamado directamente dentro del efecto de `useFetch` | oxlint, regla `set-state-in-effect` | El estado `loading` se calcula durante el render |
| El indicador de carga tenía `role="status"` | Guía `accessibility` | Quitado: `<progress>` ya comunica que está cargando |
| `<section aria-labelledby>` creaba landmarks innecesarios | Guía `accessibility` | Quitado el `aria-labelledby` |
| Las listas perdían su semántica en Safari | Guía `accessibility` | Añadido `role="list"` |
| El recuento de resultados se anunciaba en cada pulsación | Guía `accessibility` | Anuncio con *debounce* |
| Al pulsar «Reintentar» el foco caía en `<body>` | Revisión del Paso 6 | El foco pasa al encabezado del panel |
| Varias refs dentro de un objeto | oxlint, regla `react(refs)` | Dos refs independientes |
| Un test buscaba el spinner justo cuando ya había desaparecido (condición de carrera) | El test fallaba | Quitada la comprobación intermedia |
| `<search>` no tiene rol en Testing Library | El test fallaba | Se comprueba el elemento, sin añadir un `role` redundante |
| Error de tipos en un test | `tsc` | Corregido el tipo del elemento |
| En móvil, al elegir un usuario el encabezado quedaba pegado al borde inferior | Capturas con Playwright a 390 px | Panel con `min-block-size` en `dvh` y desplazamiento controlado. Más tarde lo sustituyó la hoja flotante |
| `.post-form { display: grid }` anulaba el atributo `hidden`, así que el formulario nunca se plegaba | Revisión del CSS | Regla global `[hidden] { display: none !important }` |
| El botón de volver se nombraba «Volver aUsuarios»: el espacio dentro del `<span>` se perdía | El test fallaba | Espacios como nodos de texto fuera de los `<span>` |

### Cómo verifiqué el resultado
- `npm test`, `npm run lint` y `npm run build` en cada paso. Los tests se ejecutaron varias veces seguidas para comprobar que son estables.
- El contraste de los colores se calculó con un script, no a ojo.
- Capturas con Playwright y Edge: escritorio en tema claro, móvil en tema claro y oscuro, y modo de colores forzados. También comprobé en el navegador real lo que jsdom no puede simular: que el diálogo es modal, que el fondo no recibe el foco, y que Esc cierra la hoja y devuelve el foco al usuario.
- Comprobación con la API real (`curl`) de la forma de las respuestas y del `id: 101` del `POST`.
- Revisión de cada paso en el navegador (con `npm run dev` en marcha) antes de aprobarlo y hacer el commit.
