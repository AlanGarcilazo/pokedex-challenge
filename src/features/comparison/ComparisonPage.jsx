import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import { useGetPokemonIndexQuery } from '../../services/pokeApi';
import {
  EmptyState,
  QueryStatus,
} from '../pokemon/PokemonUI';
import { createComparisonSchema } from './comparisonSchema';
import PokemonSelector from './PokemonSelector';
import ComparisonResult from './ComparisonResult';
import styles from './Comparison.module.css';

function ComparisonForm({ pokemon }) {
  const [submittedPair, setSubmittedPair] = useState(null);

  const validationSchema = useMemo(
    () => createComparisonSchema(pokemon),
    [pokemon],
  );

  const formik = useFormik({
    initialValues: {
      first: '',
      second: '',
    },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,

    onSubmit(values, helpers) {
      setSubmittedPair({ ...values });
      helpers.setSubmitting(false);
    },
  });

  function changePokemon(field, value) {
    setSubmittedPair(null);
    formik.setFieldTouched(field, true, false);
    formik.setFieldValue(field, value);
  }

  return (
    <>
      <form
        className={styles.form}
        onSubmit={formik.handleSubmit}
        noValidate
      >
        <div className={styles.columns}>
          <PokemonSelector
            name="first"
            label="Primer Pokémon"
            pokemon={pokemon}
            value={formik.values.first}
            error={
              formik.touched.first
                ? formik.errors.first
                : undefined
            }
            onChange={(value) => changePokemon('first', value)}
            onBlur={formik.handleBlur}
          />

          <PokemonSelector
            name="second"
            label="Segundo Pokémon"
            pokemon={pokemon}
            value={formik.values.second}
            error={
              formik.touched.second
                ? formik.errors.second
                : undefined
            }
            onChange={(value) => changePokemon('second', value)}
            onBlur={formik.handleBlur}
          />
        </div>

        <button
          type="submit"
          disabled={formik.isSubmitting || formik.isValidating}
        >
          Comparar
        </button>
      </form>

      {submittedPair && (
        <ComparisonResult
          key={`${submittedPair.first}:${submittedPair.second}`}
          firstId={submittedPair.first}
          secondId={submittedPair.second}
        />
      )}
    </>
  );
}

ComparisonForm.propTypes = {
  pokemon: PropTypes.array.isRequired,
};

export default function ComparisonPage() {
  const {
    data,
    isFetching,
    isError,
    refetch,
    fulfilledTimeStamp,
  } = useGetPokemonIndexQuery();

  return (
    <section>
      <h1>Comparar Pokémon</h1>

      <p>
        Elegí dos Pokémon diferentes para comparar sus estadísticas base.
      </p>

      <QueryStatus
        label="Opciones disponibles"
        fetching={isFetching}
        timestamp={fulfilledTimeStamp}
      />

      {isError && (
        <div className={styles.feedback} role="alert">
          <p>
            {data
              ? 'No pudimos actualizar las opciones. Podés usar las que ya están guardadas.'
              : 'No pudimos cargar las opciones. Revisá tu conexión.'}
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
        <p role="status">Cargando opciones...</p>
      )}

      {data && !data.isComplete && (
        <div className={styles.feedback} role="status">
          <p>
            La lista está incompleta.
            Podés comparar las opciones disponibles.
          </p>

          <button
            type="button"
            onClick={refetch}
            disabled={isFetching}
          >
            Completar opciones
          </button>
        </div>
      )}

      {data?.results.length === 0 && (
        <EmptyState
          title="No hay Pokémon disponibles"
          message="Intentá cargar las opciones nuevamente."
        >
          <button
            type="button"
            onClick={refetch}
            disabled={isFetching}
          >
            Reintentar
          </button>
        </EmptyState>
      )}

      {data?.results.length > 0 && (
        <ComparisonForm pokemon={data.results} />
      )}
    </section>
  );
}