import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { TYPE_OPTIONS } from './pokemonOptions';
import styles from './Pokemon.module.css';

const SESSION_STARTED_AT = Date.now();

function ImageContent({ src, alt, eager = false }) {
  const imageRef = useRef(null);
  const [status, setStatus] = useState(src ? 'loading' : 'error');

  useEffect(() => {
    
    const image = imageRef.current;

    if (image?.complete) {
      setStatus(image.naturalWidth > 0 ? 'loaded' : 'error');
    }
  }, []);

  return (
    <div className={styles.imageFrame}>
      {status === 'loading' && (
        <span className={styles.imagePlaceholder} aria-hidden="true" />
      )}

      {status === 'error' && (
        <span
          className={styles.imageFallback}
          role="img"
          aria-label={`${alt}. Imagen no disponible.`}
        >
          <span className={styles.ball} aria-hidden="true" />
          <span aria-hidden="true">Imagen no disponible</span>
        </span>
      )}

      {src && status !== 'error' && (
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          width="240"
          height="240"
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className={[
            styles.image,
            status === 'loaded' ? styles.imageLoaded : '',
          ].join(' ')}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      )}
    </div>
  );
}

ImageContent.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string.isRequired,
  eager: PropTypes.bool,
};

export function PokemonImage(props) {
  
  return <ImageContent key={props.src ?? 'missing'} {...props} />;
}

PokemonImage.propTypes = ImageContent.propTypes;

export function TypeBadges({ types }) {
  return (
    <div className={styles.badges}>
      {types.map((type) => {
        const option = TYPE_OPTIONS.find((item) => item.value === type);

        return (
          <span
            key={type}
            className={styles.badge}
            style={{ '--type-color': option?.color }}
          >
            {option?.label ?? type}
          </span>
        );
      })}
    </div>
  );
}

TypeBadges.propTypes = {
  types: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export function EmptyState({ title, message, children }) {
  return (
    <section className={styles.empty}>
      <span className={styles.ball} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{message}</p>
      {children}
    </section>
  );
}

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  children: PropTypes.node,
};

export function LoadingCards() {
  return (
    <div role="status">
      <span className={styles.visuallyHidden}>
        Cargando Pokémon...
      </span>

      <ul className={styles.grid} aria-hidden="true">
        {Array.from({ length: 20 }, (_, index) => (
          <li key={`skeleton-${index}`} className={styles.card}>
            <div
              className={`${styles.skeleton} ${styles.skeletonImage}`}
            />
            <div
              className={`${styles.skeleton} ${styles.skeletonLine}`}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function QueryStatus({ timestamp, fetching, label }) {
  if (!Number.isFinite(timestamp)) {
    return (
      <p className={styles.muted} role="status">
        {label}: {fetching ? 'consultando...' : 'sin datos todavía.'}
      </p>
    );
  }

  const date = new Date(timestamp);
  const source = timestamp < SESSION_STARTED_AT
    ? 'datos recuperados de la caché'
    : 'datos consultados en esta sesión';

  return (
    <p className={styles.muted} role="status">
      {label}: {source}. Última respuesta:{' '}
      <time dateTime={date.toISOString()}>
        {date.toLocaleString('es-AR')}
      </time>
      {fetching && ' · Actualizando...'}
    </p>
  );
}

QueryStatus.propTypes = {
  timestamp: PropTypes.number,
  fetching: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
};