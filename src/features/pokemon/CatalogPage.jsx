import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { pokeApi, useGetPokemonIndexQuery } from "../../services/pokeApi";
import PokemonCard from "./PokemonCard";
import { EmptyState, LoadingCards, QueryStatus } from "./PokemonUI";
import { GENERATIONS, TYPE_OPTIONS } from "./pokemonOptions";
import useCatalogFilters from "./useCatalogFilters";
import useFilterData from "./useFilterData";
import styles from "./Pokemon.module.css";
import { refreshCachedQueries } from "../../services/refreshCachedQueries";

const PAGE_SIZE = 20;

export default function CatalogPage() {
  const dispatch = useDispatch();
  const indexQuery = useGetPokemonIndexQuery();
  const [refreshingSavedFilters, setRefreshingSavedFilters] = useState(false);
  const [savedFiltersFeedback, setSavedFiltersFeedback] = useState(null);

  const hasPendingQueries = useSelector((state) =>
    Object.values(state[pokeApi.reducerPath].queries).some(
      (query) => query.status === "pending",
    ),
  );

  const hasSavedFilters = useSelector((state) =>
    pokeApi.util
      .selectInvalidatedBy(state, ["PokemonType", "GenerationPokemon"])
      .some(
        ({ queryCacheKey }) =>
          state[pokeApi.reducerPath].queries[queryCacheKey]?.data !== undefined,
      ),
  );

  const {
    filters,
    filterKey,
    searchText,
    searchPending,
    changeSearch,
    toggleType,
    toggleGeneration,
    clearFilters,
  } = useCatalogFilters();

  const filterData = useFilterData(filters.types, filters.generations);

  const [visibleWindow, setVisibleWindow] = useState({
    key: filterKey,
    count: PAGE_SIZE,
  });

  const sentinelRef = useRef(null);
  const loadingMoreRef = useRef(false);

  const index = indexQuery.data;
  const indexComplete = index?.isComplete === true;
  const ready = indexComplete && filterData.ready;

  const filteredPokemon = useMemo(() => {
    if (!index?.isComplete || !filterData.ready) {
      return [];
    }

    return index.results.filter((pokemon) => {
      const matchesName = pokemon.name.includes(filters.q);

      const matchesType =
        filters.types.length === 0 || filterData.typeNames.has(pokemon.name);

      const matchesGeneration =
        filters.generations.length === 0 ||
        filterData.generationNames.has(pokemon.name);

      return matchesName && matchesType && matchesGeneration;
    });
  }, [
    index,
    filters,
    filterData.ready,
    filterData.typeNames,
    filterData.generationNames,
  ]);

  const visibleCount =
    visibleWindow.key === filterKey ? visibleWindow.count : PAGE_SIZE;

  useEffect(() => {
    setVisibleWindow((current) =>
      current.key === filterKey
        ? current
        : { key: filterKey, count: PAGE_SIZE },
    );
  }, [filterKey]);

  const visiblePokemon = useMemo(
    () => filteredPokemon.slice(0, visibleCount),
    [filteredPokemon, visibleCount],
  );

  const detailSelectors = useMemo(
    () =>
      visiblePokemon.map((pokemon) =>
        pokeApi.endpoints.getPokemonByName.select(String(pokemon.id)),
      ),
    [visiblePokemon],
  );

  const detailsPending = useSelector((state) =>
    detailSelectors.some((selectDetail) => {
      const query = selectDetail(state);
      return query.isUninitialized || query.isLoading;
    }),
  );

  const hasMore = ready && visibleCount < filteredPokemon.length;

  const canLoadMore =
    hasMore &&
    !searchPending &&
    !indexQuery.isFetching &&
    !filterData.isFetching &&
    !detailsPending;

  useEffect(() => {
    loadingMoreRef.current = false;
  }, [filterKey, visibleCount]);

  const loadMore = useCallback(() => {
    if (!canLoadMore || loadingMoreRef.current) {
      return;
    }

    loadingMoreRef.current = true;

    setVisibleWindow((current) => ({
      key: filterKey,
      count: Math.min(
        filteredPokemon.length,
        (current.key === filterKey ? current.count : PAGE_SIZE) + PAGE_SIZE,
      ),
    }));
  }, [canLoadMore, filterKey, filteredPokemon.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !canLoadMore || !("IntersectionObserver" in window)) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [canLoadMore, loadMore]);

  function refreshSearchData() {
    dispatch(
      pokeApi.util.invalidateTags([
        { type: "PokemonIndex", id: "ALL" },
        ...filterData.tags,
      ]),
    );
  }

  async function refreshSavedFilters() {
    if (refreshingSavedFilters || hasPendingQueries || !hasSavedFilters) {
      return;
    }

    setRefreshingSavedFilters(true);
    setSavedFiltersFeedback(null);

    try {
      const results = await dispatch(
        refreshCachedQueries(["PokemonType", "GenerationPokemon"]),
      );

      const hasError = results.some((result) => result.error);

      let message = "Los filtros guardados se actualizaron.";

      if (results.length === 0) {
        message = "No hay filtros guardados para actualizar.";
      } else if (hasError) {
        message =
          "No pudimos actualizar algunos filtros. Conservamos los datos guardados. Podés reintentar.";
      }

      setSavedFiltersFeedback({ hasError, message });
    } catch {
      setSavedFiltersFeedback({
        hasError: true,
        message: "No pudimos completar la actualización. Volvé a intentarlo.",
      });
    } finally {
      setRefreshingSavedFilters(false);
    }
  }

  const preparing = indexQuery.isFetching || filterData.isFetching;

  return (
    <section>
      <div className={styles.toolbar}>
        <h1>Explorar Pokémon</h1>

        <div className={styles.filterActions}>
          <button
            type="button"
            onClick={refreshSearchData}
            disabled={preparing || refreshingSavedFilters}
          >
            {preparing ? "Consultando..." : "Actualizar búsqueda"}
          </button>

          <button
            type="button"
            onClick={refreshSavedFilters}
            disabled={
              !hasSavedFilters || hasPendingQueries || refreshingSavedFilters
            }
          >
            {refreshingSavedFilters
              ? "Actualizando filtros..."
              : "Actualizar filtros guardados"}
          </button>
        </div>
      </div>

      {savedFiltersFeedback && (
        <p
          role={savedFiltersFeedback.hasError ? "alert" : "status"}
          className={
            savedFiltersFeedback.hasError ? styles.feedback : styles.muted
          }
        >
          {savedFiltersFeedback.message}
        </p>
      )}

      <div className={styles.filters}>
        <label className={styles.search} htmlFor="pokemon-search">
          Buscar por nombre
          <input
            id="pokemon-search"
            type="search"
            value={searchText}
            onChange={(event) => changeSearch(event.target.value)}
            placeholder="Por ejemplo: pikachu"
            autoComplete="off"
            aria-describedby="filter-help"
          />
        </label>

        <p id="filter-help" className={styles.muted}>
          Podés elegir varios tipos y generaciones. Los filtros se guardan en la
          dirección de esta página.
        </p>

        <div className={styles.filterGroups}>
          <fieldset>
            <legend>Tipos</legend>

            <div className={styles.options}>
              {TYPE_OPTIONS.map((type) => (
                <label key={type.value} className={styles.option}>
                  <input
                    type="checkbox"
                    checked={filters.types.includes(type.value)}
                    onChange={() => toggleType(type.value)}
                  />

                  {type.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Generaciones</legend>

            <div className={styles.options}>
              {GENERATIONS.map((generation) => (
                <label key={generation} className={styles.option}>
                  <input
                    type="checkbox"
                    checked={filters.generations.includes(generation)}
                    onChange={() => toggleGeneration(generation)}
                  />
                  Generación {generation}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className={styles.filterActions}>
          <button type="button" onClick={clearFilters}>
            Limpiar filtros
          </button>

          {searchPending && (
            <span className={styles.muted} role="status">
              Esperando búsqueda...
            </span>
          )}
        </div>
      </div>

      <QueryStatus
        label="Índice"
        timestamp={indexQuery.fulfilledTimeStamp}
        fetching={indexQuery.isFetching}
      />

      {indexQuery.isError && (
        <div className={styles.feedback} role="alert">
          <p>
            {indexComplete
              ? "No pudimos actualizar el índice. Usamos la copia guardada."
              : "No pudimos cargar el índice completo de Pokémon."}
          </p>

          <button
            type="button"
            onClick={indexQuery.refetch}
            disabled={indexQuery.isFetching}
          >
            Reintentar índice
          </button>
        </div>
      )}

      {index && !indexComplete && (
        <div className={styles.feedback} role="alert">
          <p>
            El índice está incompleto. Necesitamos volver a cargarlo para buscar
            en todos los Pokémon.
          </p>

          <button
            type="button"
            onClick={indexQuery.refetch}
            disabled={indexQuery.isFetching}
          >
            Volver a cargar
          </button>
        </div>
      )}

      {filterData.hasError && (
        <div className={styles.feedback} role="alert">
          <p>
            {filterData.ready
              ? "No pudimos actualizar algunos filtros. Usamos sus datos guardados."
              : "No pudimos completar los datos de los filtros seleccionados."}
          </p>

          <button
            type="button"
            onClick={filterData.retry}
            disabled={filterData.isFetching}
          >
            Reintentar filtros
          </button>
        </div>
      )}

      {!ready && preparing && (
        <>
          <p role="status">
            {filters.generations.length > 0
              ? "Preparando generaciones y variantes. La primera carga puede demorar."
              : "Preparando el catálogo..."}
          </p>

          <LoadingCards />
        </>
      )}

      {!ready && !preparing && (
        <EmptyState
          title="Todavía no podemos mostrar el catálogo"
          message="Reintentá la carga o quitá los filtros que no pudimos consultar."
        />
      )}

      {ready && filteredPokemon.length === 0 && (
        <EmptyState
          title="No encontramos coincidencias"
          message="Probá otro nombre o cambiá los filtros."
        >
          <button type="button" onClick={clearFilters}>
            Limpiar filtros
          </button>
        </EmptyState>
      )}

      {ready && filteredPokemon.length > 0 && (
        <>
          <p role="status">
            Mostrando {visiblePokemon.length} de {filteredPokemon.length}{" "}
            coincidencias
          </p>

          <ul className={styles.grid}>
            {visiblePokemon.map((pokemon) => (
              <li key={pokemon.id}>
                <PokemonCard pokemon={pokemon} />
              </li>
            ))}
          </ul>

          <div
            ref={sentinelRef}
            className={styles.sentinel}
            aria-hidden="true"
          />

          <div className={styles.pagination}>
            {hasMore ? (
              <button type="button" onClick={loadMore} disabled={!canLoadMore}>
                {detailsPending ? "Cargando detalles..." : "Cargar 20 más"}
              </button>
            ) : (
              <p>Llegaste al final de los resultados.</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
