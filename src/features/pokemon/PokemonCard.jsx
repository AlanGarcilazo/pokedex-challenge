import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import { useGetPokemonByNameQuery } from '../../services/pokeApi';
import { PokemonImage, TypeBadges } from './PokemonUI';
import styles from './Pokemon.module.css';

export default function PokemonCard({ pokemon }) {
  const location = useLocation();

  
  const {
    currentData: data,
    isFetching,
    isError,
    refetch,
  } = useGetPokemonByNameQuery(String(pokemon.id));

  return (
    <article className={styles.card}>
      <Link
        className={styles.cardLink}
        to={{
          pathname: `/pokemon/${pokemon.id}`,
          search: location.search,
        }}
      >
        {!data && !isError ? (
          <div
            className={`${styles.skeleton} ${styles.skeletonImage}`}
            aria-hidden="true"
          />
        ) : (
          <PokemonImage
            src={data?.images.front}
            alt={pokemon.name}
          />
        )}

        <p className={styles.number}>
          #{String(pokemon.id).padStart(3, '0')}
        </p>

        <h2>{pokemon.name.replaceAll('-', ' ')}</h2>
      </Link>

      {data && <TypeBadges types={data.types} />}

      {!data && !isError && (
        <p className={styles.muted}>Cargando detalles...</p>
      )}

      {data && isFetching && (
        <p className={styles.muted}>Actualizando...</p>
      )}

      {isError && (
        <div className={styles.feedback}>
          <p>
            {data
              ? 'No se pudo actualizar. Mostramos los datos guardados.'
              : 'No pudimos cargar los detalles.'}
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
    </article>
  );
}

PokemonCard.propTypes = {
  pokemon: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
};