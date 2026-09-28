import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import styles from './Comparison.module.css';

export default function PokemonSelector({
  name,
  label,
  pokemon,
  value,
  error,
  onChange,
  onBlur,
}) {
  const [search, setSearch] = useState('');

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();

    return pokemon.filter(
      (item) =>
        item.name.includes(term) ||
        String(item.id) === term,
    );
  }, [pokemon, search]);

  const options = matches.slice(0, 20);
  const helpId = `${name}-help`;
  const errorId = `${name}-error`;
  const describedBy = error
    ? `${helpId} ${errorId}`
    : helpId;

  return (
    <fieldset className={styles.selector}>
      <legend>{label}</legend>

      <label htmlFor={`${name}-search`}>
        Buscar por nombre o número
      </label>

      <input
        id={`${name}-search`}
        type="search"
        value={search}
        autoComplete="off"
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        onChange={(event) => {
          setSearch(event.target.value);
          onChange('');
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
          }
        }}
      />

      <label htmlFor={name}>Seleccionar Pokémon</label>

      <select
        id={name}
        name={name}
        value={value}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        onBlur={onBlur}
        onChange={(event) => {
          const nextValue = event.target.value;

          const selected = pokemon.find(
            (item) => String(item.id) === nextValue,
          );

          setSearch(selected?.name ?? '');
          onChange(nextValue);
        }}
      >
        <option value="">Elegí una opción</option>

        {options.map((item) => (
          <option key={item.id} value={String(item.id)}>
            #{item.id} · {item.name}
          </option>
        ))}
      </select>

      <p id={helpId} className={styles.hint} role="status">
        {matches.length === 0
          ? 'No hay coincidencias. Probá con otro nombre.'
          : `${matches.length} coincidencias. Mostramos hasta 20; escribí para acotar la búsqueda y seleccioná una opción.`}
      </p>

      {error && (
        <p
          id={errorId}
          className={styles.error}
          role="alert"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}

PokemonSelector.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  pokemon: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  value: PropTypes.string.isRequired,
  error: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
};