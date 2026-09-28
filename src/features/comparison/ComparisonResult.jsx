import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useGetPokemonByNameQuery } from '../../services/pokeApi';
import {
  PokemonImage,
  QueryStatus,
  TypeBadges,
} from '../pokemon/PokemonUI';
import { STAT_LABELS } from '../pokemon/pokemonOptions';
import styles from './Comparison.module.css';

function PokemonSummary({ id, query }) {
  const {
    currentData: pokemon,
    isFetching,
    isError,
    refetch,
    fulfilledTimeStamp,
  } = query;

  return (
    <article className={styles.summary}>
      <h3>
        {pokemon?.name.replaceAll('-', ' ') ?? `Pokémon #${id}`}
      </h3>

      <QueryStatus
        label={`Pokémon #${id}`}
        fetching={isFetching}
        timestamp={fulfilledTimeStamp}
      />

      {isError && (
        <div className={styles.feedback} role="alert">
          <p>
            {pokemon
              ? 'No pudimos actualizar este Pokémon. Conservamos sus datos guardados.'
              : 'No pudimos cargar este Pokémon. Podés reintentar sin perder el otro.'}
          </p>

          <button
            type="button"
            onClick={refetch}
            disabled={isFetching}
          >
            Reintentar
          </button>
        </div>
      )}

      {!pokemon && !isError && (
        <div role="status">
          <p>Cargando Pokémon #{id}...</p>
          <div className={styles.skeleton} aria-hidden="true" />
        </div>
      )}

      {pokemon && (
        <>
          <div className={styles.image}>
            <PokemonImage
              src={pokemon.images.artwork}
              alt={pokemon.name}
              eager
            />
          </div>

          <TypeBadges types={pokemon.types} />

          <div className={styles.actions}>
            <Link to={`/pokemon/${pokemon.id}`}>
              Ver detalle
            </Link>

            <button
              type="button"
              onClick={refetch}
              disabled={isFetching}
            >
              {isFetching
                ? 'Actualizando...'
                : 'Actualizar Pokémon'}
            </button>
          </div>
        </>
      )}
    </article>
  );
}

PokemonSummary.propTypes = {
  id: PropTypes.string.isRequired,
  query: PropTypes.object.isRequired,
};

export default function ComparisonResult({ firstId, secondId }) {
  const firstQuery = useGetPokemonByNameQuery(firstId);
  const secondQuery = useGetPokemonByNameQuery(secondId);

  const first = firstQuery.currentData;
  const second = secondQuery.currentData;

  const sides = [
    { id: firstId, pokemon: first },
    { id: secondId, pokemon: second },
  ];

  const maxStat = Math.max(
    255,
    ...(first?.stats ?? []).map((stat) => stat.value),
    ...(second?.stats ?? []).map((stat) => stat.value),
  );

  return (
    <section
      className={styles.result}
      aria-labelledby="comparison-result-title"
    >
      <h2 id="comparison-result-title">
        Resultado de la comparación
      </h2>

      <div className={styles.columns}>
        <PokemonSummary id={firstId} query={firstQuery} />
        <PokemonSummary id={secondId} query={secondQuery} />
      </div>

      {(first || second) && (
        <section
          className={styles.stats}
          aria-labelledby="comparison-stats-title"
        >
          <h3 id="comparison-stats-title">
            Estadísticas base
          </h3>

          <p className={styles.hint}>
            Todas las barras usan la misma escala: de 0 a {maxStat}.
          </p>

          {Object.entries(STAT_LABELS).map(([statName, label]) => (
            <div key={statName} className={styles.statRow}>
              <h4>{label}</h4>

              <div className={styles.statValues}>
                {sides.map(({ id, pokemon }) => {
                  const value = pokemon?.stats.find(
                    (stat) => stat.name === statName,
                  )?.value;

                  const name = pokemon?.name ?? `Pokémon #${id}`;

                  return (
                    <div key={id} className={styles.statValue}>
                      <span>{name}</span>

                      {Number.isFinite(value) ? (
                        <>
                          <strong>{value}</strong>

                          <meter
                            min="0"
                            max={maxStat}
                            value={value}
                            aria-label={`${name}, ${label}: ${value}`}
                          />
                        </>
                      ) : (
                        <span>Sin datos</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}
    </section>
  );
}

ComparisonResult.propTypes = {
  firstId: PropTypes.string.isRequired,
  secondId: PropTypes.string.isRequired,
};