import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  pokeApi,
  useGetPokemonByNameQuery,
  useGetPokemonListQuery,
  useGetPokemonIndexQuery,
  useGetPokemonByTypeQuery,
  useGetGenerationQuery,
  useGetPokemonSpeciesQuery,
} from "./services/pokeApi";
import ConnectionStatus from "./features/status/ConnectionStatus";
import styles from "./App.module.css";

export default function App() {
  const dispatch = useDispatch();

  const [inputName, setInputName] = useState("bulbasaur");
  const [pokemonName, setPokemonName] = useState("bulbasaur");
  const [offset, setOffset] = useState(0);

  const indexQuery = useGetPokemonIndexQuery();
  const listQuery = useGetPokemonListQuery({ limit: 20, offset });
  const pokemonQuery = useGetPokemonByNameQuery(pokemonName);
  const typeQuery = useGetPokemonByTypeQuery("fire");
  const generationQuery = useGetGenerationQuery(1);
  const speciesQuery = useGetPokemonSpeciesQuery("bulbasaur");

  function handleSubmit(event) {
    event.preventDefault();

    const normalizedName = inputName.trim().toLowerCase();

    if (normalizedName) {
      setPokemonName(normalizedName);
    }
  }

  function selectPokemon(name) {
    setPokemonName(name);
    setInputName(name);
  }

  const resources = [
    {
      id: "index",
      title: "Índice completo",
      query: indexQuery,
      tag: { type: "PokemonIndex", id: "ALL" },
      summary: (data) =>
        `${data.results.length} de ${data.count} nombres cargados.`,
      preview: (data) => ({
        count: data.count,
        isComplete: data.isComplete,
        results: data.results.slice(0, 3),
      }),
    },
    {
      id: "list",
      title: `Listado paginado · offset ${offset}`,
      query: listQuery,
      tag: { type: "PokemonList", id: `20:${offset}` },
      summary: (data) => `${data.results.length} resultados en esta página.`,
      preview: (data) => ({
        ...data,
        results: data.results.slice(0, 3),
      }),
    },
    {
      id: "pokemon",
      title: `Detalle · ${pokemonName}`,
      query: pokemonQuery,
      tag: { type: "Pokemon", id: pokemonName },
      summary: (data) => `#${data.id} ${data.name} · ${data.types.join(", ")}`,
      preview: (data) => data,
    },
    {
      id: "type",
      title: "Tipo · fire",
      query: typeQuery,
      tag: { type: "PokemonType", id: "fire" },
      summary: (data) =>
        `${data.pokemon.length} Pokémon pertenecen a este tipo.`,
      preview: (data) => ({
        ...data,
        pokemon: data.pokemon.slice(0, 3),
      }),
    },
    {
      id: "generation",
      title: "Generación · 1",
      query: generationQuery,
      tag: { type: "Generation", id: "1" },
      summary: (data) => `${data.species.length} especies en esta generación.`,
      preview: (data) => ({
        ...data,
        species: data.species.slice(0, 3),
      }),
    },
    {
      id: "species",
      title: "Especie · bulbasaur",
      query: speciesQuery,
      tag: { type: "Species", id: "bulbasaur" },
      summary: (data) =>
        `${data.varieties.length} variedades · ${data.generation.name}`,
      preview: (data) => data,
    },
  ];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Pokédex</h1>
        <p>Comprobación de consultas, caché y persistencia.</p>
        <ConnectionStatus />
      </header>

      <form className={styles.controls} onSubmit={handleSubmit}>
        <label htmlFor="pokemon-name">Nombre del Pokémon</label>

        <input
          id="pokemon-name"
          value={inputName}
          onChange={(event) => setInputName(event.target.value)}
          required
        />

        <button type="submit">Consultar</button>
      </form>

      <div className={styles.grid}>
        {resources.map((resource) => {
          const { query } = resource;

          const data = query.currentData;

          return (
            <section
              key={resource.id}
              className={styles.panel}
              aria-busy={query.isFetching}
            >
              <h2>{resource.title}</h2>

              {query.isFetching && !data && (
                <>
                  <p role="status">Cargando datos...</p>
                  <div className={styles.skeleton} aria-hidden="true" />
                </>
              )}

              {query.isFetching && data && (
                <p role="status">Actualizando datos...</p>
              )}

              {query.isError && (
                <div className={styles.error} role="alert">
                  <p>
                    {query.error?.status === 404
                      ? "No encontramos ese recurso."
                      : "No pudimos consultar PokeAPI."}
                  </p>

                  {data && <p>Conservamos los últimos datos disponibles.</p>}

                  <button
                    type="button"
                    onClick={query.refetch}
                    disabled={query.isFetching}
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {data && (
                <>
                  <p>{resource.summary(data)}</p>

                  <p className={styles.muted}>
                    Última consulta exitosa:{" "}
                    {new Date(query.fulfilledTimeStamp).toLocaleString("es-AR")}
                  </p>

                  {resource.id === "index" && (
                    <>
                      {!data.isComplete && (
                        <p className={styles.warning} role="alert">
                          El índice está incompleto. Actualizalo antes de
                          utilizarlo para una búsqueda global.
                        </p>
                      )}

                      {data.results.length === 0 ? (
                        <p>No hay Pokémon disponibles.</p>
                      ) : (
                        <ul className={styles.list}>
                          {data.results.slice(0, 20).map((pokemon) => (
                            <li key={pokemon.id}>
                              <button
                                type="button"
                                onClick={() => selectPokemon(pokemon.name)}
                              >
                                {pokemon.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}

                  <details>
                    <summary>Ver muestra de la respuesta</summary>

                    <pre className={styles.preview}>
                      {JSON.stringify(resource.preview(data), null, 2)}
                    </pre>
                  </details>
                </>
              )}

              {resource.id === "list" && (
                <div className={styles.controls}>
                  <button
                    type="button"
                    disabled={offset === 0}
                    onClick={() =>
                      setOffset((current) => Math.max(0, current - 20))
                    }
                  >
                    Anterior
                  </button>

                  <button
                    type="button"
                    disabled={!data?.next || query.isFetching}
                    onClick={() => setOffset((current) => current + 20)}
                  >
                    Siguiente
                  </button>
                </div>
              )}

              {!data && !query.isFetching && !query.isError && (
                <p>Todavía no hay datos disponibles.</p>
              )}

              <div className={styles.controls}>
                <button
                  type="button"
                  disabled={query.isFetching}
                  onClick={() =>
                    dispatch(pokeApi.util.invalidateTags([resource.tag]))
                  }
                >
                  Actualizar este recurso
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
