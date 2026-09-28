# Pokédex

Aplicación desarrollada con React y PokeAPI para explorar Pokémon, consultar sus características, armar un equipo y comparar estadísticas.

## Funcionalidades

- Catálogo con scroll infinito en bloques de 20 tarjetas.
- Imágenes con carga diferida, placeholder y alternativa cuando no están disponibles.
- Detalle con imágenes alternativas, tipos, habilidades, estadísticas, altura y peso.
- Búsqueda por nombre con debounce de 300 ms.
- Filtros combinables por tipo y generación, persistidos en la URL.
- Equipo de hasta seis Pokémon, sin duplicados y con orden editable.
- Comparador con dos selectores buscables y validaciones con Formik y Yup.
- Persistencia del equipo y de los datos consultados.
- Indicadores de conexión, procedencia de los datos y actualización.
- Estados de carga, errores con reintento, notificaciones y vistas vacías.
- Diseño responsive.

## Stack

| Herramienta | Versión |
| --- | --- |
| React / React DOM | 18.3.1 |
| Vite | 5.4.21 |
| Redux Toolkit / RTK Query | 2.12.0 |
| React Redux | 9.3.0 |
| redux-persist | 6.0.0 |
| React Router | 6.30.6 |
| Formik | 2.4.9 |
| Yup | 1.7.1 |
| PropTypes | 15.8.1 |
| Vitest | 3.2.7 |
| Testing Library React | 16.3.0 |
| Testing Library DOM | 10.4.1 |
| Testing Library user-event | 14.6.1 |
| jest-dom | 6.9.1 |
| jsdom | 26.1.0 |

El código está escrito en JavaScript. Los componentes utilizan CSS Modules y los estilos generales están definidos en `src/index.css`.

## Requisitos

- Git.
- Node.js 24.x y npm 11.x para reproducir el entorno utilizado.
- Acceso a Internet para instalar dependencias y consultar datos que todavía no estén guardados.

El proyecto se verificó con Node.js 24.18.0 y npm 11.16.0.

## Instalación

Los siguientes comandos están preparados para Windows con PowerShell:

```powershell
git clone https://github.com/AlanGarcilazo/pokedex-challenge.git
cd pokedex-challenge
npm.cmd ci
Copy-Item -LiteralPath ".env.example" -Destination ".env"
npm.cmd run dev
```

`npm.cmd ci` instala las versiones registradas en `package-lock.json`.

Abrir la dirección indicada por Vite en la terminal. Normalmente es [localhost:5173](http://localhost:5173).

### Variables de entorno

El archivo `.env` debe estar en la raíz del proyecto:

```dotenv
VITE_POKEAPI_URL=https://pokeapi.co/api/v2/
```

La aplicación consulta la API pública de PokeAPI y no requiere una clave.

Después de modificar `.env`, reiniciar el servidor de desarrollo. El archivo local está ignorado por Git; `.env.example` contiene la configuración necesaria para un clon nuevo.

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm.cmd run dev` | Inicia el servidor de desarrollo. |
| `npm.cmd test` | Ejecuta los tres tests y termina. |
| `npm.cmd run lint` | Analiza el código con ESLint. |
| `npm.cmd run build` | Genera la compilación en `dist`. |
| `npm.cmd run preview` | Sirve localmente la compilación generada. |

Para verificar el proyecto:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Para revisar la compilación localmente:

```powershell
npm.cmd run build
npm.cmd run preview
```

## Estructura principal

```text
src/
  app/
    store.js
    persistence.js
  services/
    pokeApi.js
    refreshCachedQueries.js
  features/
    pokemon/
    team/
    comparison/
    notifications/
    status/
  test/
    setup.js
  App.jsx
  main.jsx
  index.css
```

- `app`: configuración del store y persistencia.
- `services`: consultas a PokeAPI y actualización de recursos guardados.
- `pokemon`: catálogo, filtros, tarjetas, imágenes y detalle.
- `team`: reglas del equipo, controles y pantalla.
- `comparison`: selectores, formulario, validación y resultados.
- `notifications`: mensajes temporales de las acciones.
- `status`: indicadores de conexión y datos.
- `test`: configuración compartida de las pruebas.

Las rutas principales son `/`, `/pokemon/:id`, `/equipo` y `/comparar`.

## Decisiones técnicas

### Separación del estado

Los datos remotos pertenecen a RTK Query. El equipo utiliza un slice independiente que guarda solamente IDs ordenados.

Los filtros del catálogo se guardan en la URL. Las interacciones temporales, como la imagen seleccionada o el texto de un selector, utilizan estado local. Formik administra el formulario de comparación.

Las notificaciones tienen su propio slice y no se persisten.

### Catálogo y filtros

La aplicación obtiene un índice completo de referencias a Pokémon mediante consultas paginadas de 200 elementos. Ese índice permite buscar sobre todo el catálogo.

El scroll aumenta de a 20 la cantidad de tarjetas mostradas. Cada tarjeta consulta sus detalles mediante RTK Query, por lo que cargar el índice no implica descargar todos los detalles e imágenes.

La búsqueda normaliza espacios y mayúsculas, y espera 300 ms desde la última escritura.

Los filtros se combinan así:

- Dentro de los tipos seleccionados se acepta cualquiera de ellos.
- Dentro de las generaciones seleccionadas se acepta cualquiera de ellas.
- El nombre, los tipos y las generaciones se intersectan.

Por ejemplo:

```text
/?q=char&type=fire&generation=1
```

Los filtros se conservan al recargar y al navegar entre el catálogo y el detalle.

La generación representa el origen de la especie e incluye sus variantes. Para resolverla se consultan sus especies en lotes de cuatro. Esta primera carga puede demorar; el resultado agregado queda en caché.

### Consultas y caché

Todas las consultas de datos a PokeAPI pasan por RTK Query. El servicio incluye endpoints de listado, detalle, tipo, generación y especie, además de consultas que construyen el índice y los resultados por generación.

`transformResponse` adapta los datos utilizados por las pantallas.

Las consultas con el mismo endpoint y argumentos comparten caché. Las vistas utilizan IDs convertidos a string para reutilizar los detalles entre tarjetas, equipo y comparación.

La retención configurada con `keepUnusedDataFor` es:

- Cinco minutos para los detalles.
- Una hora como valor general y para los resultados por generación.

Estos tiempos comienzan cuando una consulta queda sin suscriptores. No representan una actualización periódica ni garantizan la vigencia de los datos.

La actualización es explícita mediante los controles de la interfaz. Los tags permiten invalidar el índice y los filtros seleccionados. Los detalles pueden renovarse de forma individual.

Para renovar filtros guardados, incluso inactivos, se identifican las consultas correspondientes y se fuerza su actualización con una suscripción temporal. Al terminar se libera esa suscripción.

Agregar, quitar o reordenar integrantes del equipo no invalida datos de PokeAPI.

### Persistencia y rehidratación

redux-persist guarda `pokeApi` y `team` en localStorage.

La transformación de persistencia conserva los datos del último éxito, sus argumentos, fecha de respuesta y tags. Excluye estados pendientes, errores, suscripciones y configuración transitoria.

Si una actualización falla, los datos anteriores pueden seguir mostrándose y guardándose.

`PersistGate` espera la recuperación del almacenamiento antes de mostrar la aplicación. RTK Query restaura sus datos mediante `extractRehydrationInfo`; el slice del equipo recupera y valida sus IDs durante `REHYDRATE`.

El equipo conserva el orden, elimina valores inválidos o duplicados al restaurarse y mantiene el límite de seis integrantes.

### Equipo y comparación

Las reglas del equipo se aplican en el reducer, además de los avisos de la interfaz. El reordenamiento utiliza botones accesibles.

Cada selector del comparador busca por nombre o número sobre el índice completo. El texto escrito está separado del ID seleccionado: escribir un nombre no equivale a confirmar una opción.

Yup exige dos IDs válidos y diferentes. La comparación obtiene ambos detalles de forma independiente y muestra las seis estadísticas con una escala común de al menos 255.

Un error en uno de los Pokémon no impide mostrar los datos del otro.

## Funcionamiento offline

La aplicación puede reutilizar datos previamente consultados que permanezcan en su caché persistente.

Esto no implica precargar todos los detalles ni todas las combinaciones de filtros. Los recursos nunca consultados necesitan conexión.

No se implementó un service worker. Por lo tanto, no se garantiza iniciar la aplicación desde cero sin conexión ni disponer de todas las imágenes offline.

El indicador de conexión utiliza `navigator.onLine`. Los mensajes de caché y sesión describen cuándo se obtuvieron los datos; no garantizan que PokeAPI esté disponible o que su contenido no haya cambiado.

## Pruebas

Se incluyeron tres pruebas:

1. `TeamSlice.test.js`: un equipo con seis integrantes rechaza un séptimo y conserva los originales.
2. `comparisonSchema.test.js`: Yup rechaza comparar el mismo Pokémon en ambos campos.
3. `PokemonCard.test.jsx`: una consulta falla, aparece el reintento y una segunda respuesta exitosa permite mostrar los datos.

La integración utiliza el componente, Redux y RTK Query reales, con un store nuevo y respuestas controladas en `fetch`. No depende de la disponibilidad de PokeAPI.

El setup alinea las señales de cancelación con las solicitudes nativas de Node para el entorno jsdom. Este ajuste se utiliza únicamente en las pruebas.

La suite no cubre automáticamente toda la aplicación. Persistencia, filtros, navegación, reordenamiento y responsive también se revisaron mediante comprobaciones manuales.

El equipo se guarda por navegador y origen; no existe sincronización entre dispositivos.

## Publicación en Netlify

La configuración de compilación y navegación está definida en `netlify.toml`.

- Directorio base: raíz del repositorio.
- Rama de producción: `master`.
- Comando de compilación: `npm run build`.
- Directorio de publicación: `dist`.
- Node: `24.18.0`.
- npm: `11.16.0`.

Antes de compilar, configurar en Netlify la variable:

`VITE_POKEAPI_URL=https://pokeapi.co/api/v2/`

La variable se incorpora durante la compilación. Cambiar su valor requiere
generar y publicar un nuevo build.

Las rutas de React Router utilizan una reescritura hacia `index.html`,
para permitir navegación directa y recargas.

La persistencia pertenece al navegador y al origen del sitio. Los datos
guardados en localhost no se transfieren al dominio publicado.