import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useGetPokemonByNameQuery } from '../../services/pokeApi';
import {
  EmptyState,
  PokemonImage,
  QueryStatus,
  TypeBadges,
} from './PokemonUI';
import { STAT_LABELS } from './pokemonOptions';
import styles from './Pokemon.module.css';

const numberFormatter = new Intl.NumberFormat('es-AR', {
  maximumFractionDigits: 1,
});

function DetailContent({ pokemon }) {
  const [selectedImage, setSelectedImage] = useState('artwork');
  
  const availableImages = [
    { key: 'artwork', label: 'Principal', src: pokemon.images.artwork },
    { key: 'front', label: 'Frente', src: pokemon.images.front },
    { key: 'back', label: 'Espalda', src: pokemon.images.back },
    { key: 'shiny', label: 'Shiny', src: pokemon.images.shiny },
    {
      key: 'backShiny',
      label: 'Shiny de espalda',
      src: pokemon.images.backShiny,
    },
  ].filter((image) => Boolean(image.src));

  const activeImage =
    availableImages.find((image) => image.key === selectedImage) ??
    availableImages[0];

  return (
    <article className={styles.detail}>
      <p className={styles.number}>
        #{String(pokemon.id).padStart(3, '0')}
      </p>

      <h1>{pokemon.name.replaceAll('-', ' ')}</h1>

      <div className={styles.detailGrid}>
        <section aria-label="Imágenes del Pokémon">
          <PokemonImage
            src={activeImage?.src}
            alt={`${pokemon.name}: ${activeImage?.label ?? 'imagen'}`}
            eager
          />

          <div className={styles.imageChoices}>
            {availableImages.map((image) => (
              <button
                key={image.key}
                type="button"
                aria-pressed={activeImage?.key === image.key}
                className={
                  activeImage?.key === image.key
                    ? styles.selectedButton
                    : undefined
                }
                onClick={() => setSelectedImage(image.key)}
              >
                {image.label}
              </button>
            ))}
          </div>
        </section>

        <section aria-label="Información del Pokémon">
          <h2>Tipos</h2>
          <TypeBadges types={pokemon.types} />

          <h2>Medidas</h2>

          <dl className={styles.measurements}>
            <div>
              <dt>Altura</dt>
              <dd>
                {numberFormatter.format(pokemon.height / 10)} m
              </dd>
            </div>

            <div>
              <dt>Peso</dt>
              <dd>
                {numberFormatter.format(pokemon.weight / 10)} kg
              </dd>
            </div>
          </dl>

          <h2>Habilidades</h2>

          <ul>
            {pokemon.abilities.map((ability) => (
              <li key={ability.name}>
                {ability.name.replaceAll('-', ' ')}
                {ability.isHidden && ' (oculta)'}
              </li>
            ))}
          </ul>

          <h2>Estadísticas base</h2>

          <ul className={styles.stats}>
            {pokemon.stats.map((stat) => {
              const label = STAT_LABELS[stat.name] ?? stat.name;

              return (
                <li key={stat.name}>
                  <span>{label}</span>

                  
                  <meter
                    min="0"
                    max="255"
                    value={stat.value}
                    aria-label={`${label}: ${stat.value}`}
                  />

                  <strong>{stat.value}</strong>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </article>
  );
}

DetailContent.propTypes = {
  pokemon: PropTypes.object.isRequired,
};

export default function PokemonDetailPage() {
  const { id } = useParams();
  const location = useLocation();

  const validId =
    /^[1-9]\d*$/.test(id ?? '') &&
    Number.isSafeInteger(Number(id));

  const {
    currentData: data,
    isFetching,
    isError,
    error,
    refetch,
    fulfilledTimeStamp,
  } = useGetPokemonByNameQuery(id ?? '', {
    skip: !validId,
  });

  const backLink = (
    <Link to={{ pathname: '/', search: location.search }}>
      ← Volver al catálogo
    </Link>
  );

  if (!validId) {
    return (
      <>
        {backLink}

        <EmptyState
          title="El identificador no es válido"
          message="Elegí un Pokémon desde el catálogo."
        />
      </>
    );
  }

  
  const status = error?.originalStatus ?? error?.status;

  return (
    <section>
      {backLink}

      <QueryStatus
        label="Detalle"
        timestamp={fulfilledTimeStamp}
        fetching={isFetching}
      />

      {isError && (
        <div className={styles.feedback} role="alert">
          <p>
            {data
              ? 'No pudimos actualizar. Conservamos la información guardada.'
              : status === 404
                ? 'No encontramos ese Pokémon.'
                : 'No pudimos cargar el Pokémon. Revisá la conexión.'}
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

      {!data && !isError && (
        <p role="status">Cargando ficha del Pokémon...</p>
      )}

      {data && (
        <>
          <button
            type="button"
            onClick={refetch}
            disabled={isFetching}
          >
            {isFetching ? 'Actualizando...' : 'Actualizar detalle'}
          </button>

          
          <DetailContent key={data.id} pokemon={data} />
        </>
      )}
    </section>
  );
}