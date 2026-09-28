import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useGetPokemonByNameQuery } from '../../services/pokeApi';
import { toastAdded } from '../notifications/notificationsSlice';
import PokemonCard from '../pokemon/PokemonCard';
import { EmptyState } from '../pokemon/PokemonUI';
import {
  moveMember,
  selectTeamIds,
  TEAM_LIMIT,
} from './teamSlice';
import styles from './Team.module.css';

function TeamMember({ id, index, total }) {
  const dispatch = useDispatch();

  const { currentData: pokemon } =
    useGetPokemonByNameQuery(String(id));

  const name = pokemon?.name ?? `Pokémon #${id}`;
  const label = name.replaceAll('-', ' ');

  function move(direction) {
    dispatch(moveMember({ id, direction }));

    dispatch(
      toastAdded({
        message: `${label} está en la posición ${index + direction + 1}.`,
        tone: 'info',
      }),
    );
  }

  return (
    <li className={styles.member}>
      <div className={styles.order}>
        <span>Posición {index + 1}</span>

        <div className={styles.orderButtons}>
          <button
            type="button"
            onClick={() => move(-1)}
            disabled={index === 0}
            aria-label={`Subir a ${label} una posición`}
          >
            <span aria-hidden="true">↑</span>
          </button>

          <button
            type="button"
            onClick={() => move(1)}
            disabled={index === total - 1}
            aria-label={`Bajar a ${label} una posición`}
          >
            <span aria-hidden="true">↓</span>
          </button>
        </div>
      </div>

      <PokemonCard pokemon={{ id, name }} />
    </li>
  );
}

TeamMember.propTypes = {
  id: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
};

export default function TeamPage() {
  const ids = useSelector(selectTeamIds);

  return (
    <section>
      <div className={styles.heading}>
        <h1>Mi equipo</h1>
        <p>{ids.length} de {TEAM_LIMIT} Pokémon</p>
      </div>

      {ids.length === 0 ? (
        <EmptyState
          title="Tu equipo está vacío"
          message="Elegí hasta seis Pokémon desde el catálogo o su detalle."
        >
          <Link to="/">Explorar Pokémon</Link>
        </EmptyState>
      ) : (
        <>
          <p>
            Usá las flechas para cambiar el orden.
            El equipo se guarda en este navegador.
          </p>

          <ol className={styles.grid}>
            {ids.map((id, index) => (
              <TeamMember
                key={id}
                id={id}
                index={index}
                total={ids.length}
              />
            ))}
          </ol>
        </>
      )}
    </section>
  );
}