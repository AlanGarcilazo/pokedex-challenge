# Guía para defender la Pokédex

## Cómo encaré el proyecto

Organicé el trabajo alrededor de los requisitos del challenge. Primero preparé el entorno y la estructura básica. Después resolví las consultas y la persistencia, porque las pantallas iban a depender de esa base.

Con los datos funcionando, avancé sobre catálogo, búsqueda, filtros y detalle. Luego incorporé el equipo y el comparador. Dejé una selección pequeña de pruebas y la documentación para el cierre.

Integré los estados de carga y error dentro de cada funcionalidad. No consideré terminada una pantalla solamente porque mostrara una respuesta exitosa.

El stack estaba definido por el challenge. Dentro de ese marco elegí CSS Modules, una organización por funcionalidades y una separación explícita de los distintos tipos de estado.

## Cómo organicé las responsabilidades

Separé el proyecto en tres partes principales:

- `app`: store y persistencia.
- `services`: acceso a PokeAPI y actualización de consultas.
- `features`: componentes y reglas de cada funcionalidad.

Dentro de `features` agrupé catálogo, equipo, comparación, notificaciones e indicadores.

No guardé todo en Redux:

- Los datos del servidor están en RTK Query.
- El equipo está en un slice propio.
- Los filtros del catálogo están en la URL.
- La imagen seleccionada y los textos temporales están en estado local.
- Formik administra los valores y errores del formulario.

Usé CSS Modules para mantener los estilos de los componentes separados. Los estilos generales permanecen en `index.css`.

## Cómo circulan los datos

El recorrido de una consulta de detalle es:

```text
Componente
    ↓
Hook generado por RTK Query
    ↓
Caché del endpoint y sus argumentos
    ↓ si hace falta consultar
fetchBaseQuery → PokeAPI
    ↓
transformResponse
    ↓
Caché en Redux → actualización de la interfaz
    ↓
Persistencia de los datos conservables en localStorage
```

El componente obtiene datos y estados de la consulta. RTK Query administra la solicitud, la caché y las suscripciones.

Uso `transformResponse` para convertir la respuesta de PokeAPI en una estructura más cómoda para las vistas: tipos, habilidades, estadísticas e imágenes.

Las imágenes se muestran mediante sus URLs. El navegador descarga esos recursos; no guardo sus archivos dentro de Redux.

## Cómo resolví el catálogo

PokeAPI entrega un listado de nombres y URLs, mientras que los detalles contienen imágenes, tipos y estadísticas.

Separé esas necesidades. Primero construyo un índice completo de referencias mediante páginas de 200 elementos. Después filtro ese índice y muestro las tarjetas de a 20.

Cada tarjeta pide su detalle al montarse. Esto permite buscar sobre todo el catálogo sin cargar todos los detalles desde el inicio.

El scroll utiliza `IntersectionObserver` para detectar cuando se aproxima el final. También mantuve un botón para cargar más resultados.

La cantidad visible vuelve a 20 cuando cambian los filtros. Además, bloqueo nuevas ampliaciones mientras se preparan los datos necesarios.

Una limitación es que las tarjetas ya mostradas permanecen en el DOM. Si el rendimiento lo necesitara, evaluaría virtualización.

## Cómo funcionan la búsqueda y los filtros

La búsqueda del catálogo trabaja por coincidencia parcial del nombre. Normalizo el texto con espacios recortados y minúsculas.

El debounce espera 300 ms desde la última escritura antes de actualizar la búsqueda en la URL. Esto evita procesar cada pulsación como una búsqueda definitiva.

Dentro de un grupo de filtros uso una unión:

- Fuego o agua.
- Generación 1 o generación 2.

Entre grupos uso una intersección: el Pokémon debe cumplir el nombre, alguno de los tipos seleccionados y alguna de las generaciones seleccionadas.

La URL guarda `q`, `type` y `generation`. Así puedo compartir una búsqueda y recuperarla al recargar.

Para las generaciones uso el origen de la especie e incluyo sus variantes. No uso rangos fijos de IDs. La contrapartida es que la primera consulta necesita obtener las especies y sus variedades, por eso las proceso en lotes de cuatro.

## Qué significa la caché en mi aplicación

RTK Query identifica una consulta por su endpoint y sus argumentos. Si varios componentes utilizan la misma consulta, comparten sus datos.

Por eso uso el ID convertido a string de forma consistente. Así el catálogo, el equipo y el comparador pueden reutilizar el mismo detalle.

Configuré cinco minutos de retención para detalles y una hora como valor general. Ese tiempo empieza cuando desaparece el último suscriptor.

No significa que el dato se actualice automáticamente cada cinco minutos. La retención determina cuánto tiempo conservo una entrada sin uso; la frescura es una decisión diferente.

En esta implementación la renovación es explícita. No fuerzo actualizaciones automáticas por foco o reconexión.

Los tags relacionan consultas con recursos que puedo invalidar selectivamente. No son la clave primaria de la caché.

Para actualizar filtros guardados que pueden estar inactivos uso otro recorrido: identifico sus consultas, creo una suscripción temporal, fuerzo el refetch y después la libero.

## Cómo resolví la persistencia

Usé redux-persist sobre localStorage para guardar el equipo y los datos útiles de RTK Query.

No persisto todo el estado tal como está. Conservo el último resultado exitoso, sus argumentos, fecha y tags. Excluyo solicitudes pendientes, errores y suscripciones.

Esto evita recuperar una solicitud como si todavía estuviera ejecutándose después de cerrar y abrir la aplicación.

También permite conservar datos anteriores cuando una actualización falla.

Al iniciar, `PersistGate` espera la lectura del almacenamiento. RTK Query recupera sus entradas con `extractRehydrationInfo`, y el equipo restaura sus IDs con una validación propia.

Las notificaciones no se persisten porque representan acciones temporales.

## Qué puedo afirmar sobre el modo offline

Puedo mostrar los datos que ya fueron consultados y todavía están guardados, siempre que la aplicación pueda cargarse.

No puedo prometer datos de Pokémon nunca consultados ni todas las imágenes offline.

Tampoco implementé un service worker para guardar los archivos de la aplicación. Por eso distingo entre recuperar datos sin acceso a PokeAPI y garantizar el arranque completo sin conexión.

El indicador de conexión usa `navigator.onLine`. Lo presento como conectividad detectada, no como una garantía de disponibilidad del servidor.

## Cómo resolví el equipo

Guardo solamente un array de IDs ordenados. Evito duplicar nombres, imágenes y estadísticas que ya pertenecen a la caché de RTK Query.

El reducer protege las reglas: IDs válidos, ausencia de duplicados y máximo de seis integrantes.

Las acciones que coordinan la interacción muestran notificaciones cuando se agrega, se quita o se rechaza un integrante.

El orden del array determina el orden visible y también se persiste. Elegí botones para reordenar porque cumplen el requisito y funcionan con teclado.

Modificar el equipo no cambia información de PokeAPI, por lo que esas acciones no invalidan su caché.

## Cómo resolví la comparación

Cada selector tiene un texto de búsqueda y un ID confirmado. Los mantengo separados porque escribir un nombre no significa haber seleccionado un Pokémon válido.

Al editar el texto limpio la selección. También retiro el resultado anterior para que no quede una comparación que ya no representa los valores del formulario.

Formik administra el formulario y Yup exige dos IDs conocidos y diferentes.

Una vez validado, hago dos consultas independientes de detalle. Si una falla, mantengo visible la otra y permito reintentar el recurso que falló.

Las estadísticas se relacionan por nombre. Las barras comparten una escala de al menos 255, ampliable si un valor la supera. No trato los valores base como porcentajes de 0 a 100.

## Cómo manejé carga y errores

Diferencié la primera carga de una actualización:

- Sin datos previos, muestro skeletons o un estado de carga.
- Con datos previos, los mantengo visibles mientras actualizo.
- Si la actualización falla, muestro el error y permito reintentar sin descartar el último éxito.

Las imágenes tienen placeholder y una alternativa cuando no están disponibles. Los resultados vacíos y el equipo vacío tienen mensajes y una ilustración.

También incorporé etiquetas, estados accesibles y controles nativos para que las acciones principales puedan utilizarse con teclado.

## Por qué elegí tres tests

Priorizé dos reglas de negocio y un recorrido de recuperación:

1. Rechazar un séptimo integrante.
2. Rechazar una comparación del mismo Pokémon.
3. Recuperar una tarjeta después de una respuesta fallida.

Los dos primeros son unitarios. El tercero es una integración: renderiza el componente con Redux y RTK Query reales, pero controla las respuestas de red.

La prueba de integración comienza con un store nuevo y limpia el estado al terminar. Así no depende de la caché de otra prueba ni de que PokeAPI esté disponible.

El nombre del Pokémon no alcanza para demostrar que llegó el detalle, porque la tarjeta ya lo conoce desde el listado. Por eso verifico los tipos recibidos después del reintento.

El setup ajusta las señales de cancelación de Node y jsdom. Es una configuración del entorno de pruebas, no una modificación del comportamiento de producción.

No presento estos tres casos como cobertura completa. El resto de los recorridos se revisó con comprobaciones manuales.

## Limitaciones y mejoras futuras

- Reducir el costo de la primera consulta por generación.
- Incorporar virtualización si el volumen de tarjetas renderizadas afecta el rendimiento.
- Definir una política de actualización por antigüedad de los datos.
- Ampliar las pruebas de filtros, persistencia y reordenamiento.
- Mantener los filtros al cambiar entre todas las secciones.
- Evaluar soporte PWA si se necesita iniciar la aplicación sin conexión.
- Considerar límites de almacenamiento y estrategias de limpieza de caché.